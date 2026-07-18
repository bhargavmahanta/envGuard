import fs from 'node:fs/promises';
import * as nodeModule from 'node:module';
import path from 'node:path';
import yaml from 'js-yaml';
import { z } from 'zod';
import {
  PresetCycleError,
  PresetResolutionError,
  PresetValidationError
} from './errors.js';
import type {
  CustomRuleConfig,
  EnvGuardPreset,
  PartialEnvGuardConfig
} from './types.js';
import { isPathInside } from './utils/path.js';

const MAX_PRESET_DEPTH = 10;
const SeveritySchema = z.enum(['info', 'low', 'medium', 'high', 'critical']);
const ConfidenceSchema = z.enum(['low', 'medium', 'high']);

const CustomRuleSchema = z
  .object({
    id: z.string().min(1).regex(/^[A-Za-z0-9_.-]+$/),
    severity: SeveritySchema,
    confidence: ConfidenceSchema,
    file_globs: z.array(z.string().min(1)).min(1),
    pattern: z.string().min(1),
    message: z.string().min(1),
    fix: z.string().min(1)
  })
  .strict();

const PresetSchema = z
  .object({
    extends: z.array(z.string().min(1)).optional(),
    rules: z
      .object({
        packs: z.array(z.string().min(1)).optional(),
        custom: z.array(CustomRuleSchema).optional()
      })
      .strict()
      .optional(),
    include: z.array(z.string().min(1)).optional(),
    exclude: z.array(z.string().min(1)).optional()
  })
  .strict();

function cloneRule(rule: CustomRuleConfig): CustomRuleConfig {
  return { ...rule, file_globs: [...rule.file_globs] };
}

function clonePreset(preset: EnvGuardPreset): EnvGuardPreset {
  return {
    extends: preset.extends ? [...preset.extends] : undefined,
    rules: preset.rules
      ? {
          packs: preset.rules.packs ? [...preset.rules.packs] : undefined,
          custom: preset.rules.custom?.map(cloneRule)
        }
      : undefined,
    include: preset.include ? [...preset.include] : undefined,
    exclude: preset.exclude ? [...preset.exclude] : undefined
  };
}

export function defineRule(rule: CustomRuleConfig): CustomRuleConfig {
  const parsed = CustomRuleSchema.safeParse(rule);
  if (!parsed.success) {
    throw new PresetValidationError(`Invalid custom rule: ${parsed.error.issues.map((issue) => issue.message).join('; ')}.`);
  }
  return cloneRule(parsed.data);
}

export function definePreset(preset: EnvGuardPreset): EnvGuardPreset {
  const parsed = PresetSchema.safeParse(preset);
  if (!parsed.success) {
    throw new PresetValidationError(`Invalid EnvGuard preset: ${parsed.error.issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ')}.`);
  }
  return clonePreset(parsed.data);
}

async function readPreset(filePath: string): Promise<EnvGuardPreset> {
  const extension = path.extname(filePath).toLowerCase();
  if (!['.json', '.yaml', '.yml'].includes(extension)) {
    throw new PresetResolutionError(`EnvGuard presets must be JSON or YAML: ${filePath}.`, 'PRESET_UNSUPPORTED_FORMAT');
  }

  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const value = extension === '.json' ? JSON.parse(raw) : yaml.load(raw);
    return definePreset(value as EnvGuardPreset);
  } catch (error) {
    if (error instanceof PresetResolutionError) throw error;
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    throw new PresetResolutionError(
      code === 'ENOENT' ? `EnvGuard preset not found: ${filePath}.` : `Failed to read EnvGuard preset: ${filePath}.`,
      code === 'ENOENT' ? 'PRESET_NOT_FOUND' : 'PRESET_READ_FAILED',
      error
    );
  }
}

function isPackageSpecifier(specifier: string): boolean {
  if (specifier.startsWith('@')) return /^@[^/]+\/[^/]+$/.test(specifier);
  return /^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(specifier);
}

async function resolvePresetPath(specifier: string, baseDir: string): Promise<string> {
  if (/^[A-Za-z][A-Za-z+.-]*:/.test(specifier)) {
    throw new PresetResolutionError(`URL and protocol presets are not supported: ${specifier}.`, 'PRESET_PROTOCOL_UNSUPPORTED');
  }

  if (specifier.startsWith('.') || path.isAbsolute(specifier)) {
    return path.resolve(baseDir, specifier);
  }

  if (!isPackageSpecifier(specifier)) {
    throw new PresetResolutionError(`Invalid EnvGuard preset package name: ${specifier}.`, 'PRESET_PACKAGE_INVALID');
  }

  try {
    const resolver = nodeModule.createRequire(path.join(baseDir, '__envguard_preset_resolver__.cjs'));
    const manifestPath = resolver.resolve(`${specifier}/package.json`);
    const packageRoot = path.dirname(manifestPath);
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')) as {
      envguard?: { preset?: unknown };
    };
    if (typeof manifest.envguard?.preset !== 'string') {
      throw new PresetResolutionError(`Package ${specifier} does not declare envguard.preset.`, 'PRESET_MANIFEST_MISSING');
    }

    const presetPath = path.resolve(packageRoot, manifest.envguard.preset);
    if (!isPathInside(packageRoot, presetPath)) {
      throw new PresetResolutionError(`Package ${specifier} points outside its package root.`, 'PRESET_PATH_ESCAPE');
    }
    return presetPath;
  } catch (error) {
    if (error instanceof PresetResolutionError) throw error;
    throw new PresetResolutionError(`Could not resolve EnvGuard preset package ${specifier}.`, 'PRESET_PACKAGE_NOT_FOUND', error);
  }
}

async function flattenPreset(
  specifier: string,
  baseDir: string,
  stack: string[],
  depth: number
): Promise<EnvGuardPreset[]> {
  if (depth > MAX_PRESET_DEPTH) {
    throw new PresetResolutionError(`EnvGuard preset nesting exceeds ${MAX_PRESET_DEPTH} levels.`, 'PRESET_DEPTH_EXCEEDED');
  }

  const presetPath = await resolvePresetPath(specifier, baseDir);
  let canonicalPath: string;
  try {
    canonicalPath = await fs.realpath(presetPath);
  } catch (error) {
    throw new PresetResolutionError(`EnvGuard preset not found: ${presetPath}.`, 'PRESET_NOT_FOUND', error);
  }

  if (stack.includes(canonicalPath)) {
    throw new PresetCycleError(`EnvGuard preset cycle detected at ${canonicalPath}.`);
  }

  const preset = await readPreset(canonicalPath);
  const nextStack = [...stack, canonicalPath];
  const inherited: EnvGuardPreset[] = [];
  for (const parent of preset.extends ?? []) {
    inherited.push(...(await flattenPreset(parent, path.dirname(canonicalPath), nextStack, depth + 1)));
  }
  return [...inherited, preset];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export async function resolvePresetConfig(specifiers: string[] = [], baseDir: string): Promise<PartialEnvGuardConfig> {
  const flattened: EnvGuardPreset[] = [];
  for (const specifier of specifiers) {
    flattened.push(...(await flattenPreset(specifier, baseDir, [], 1)));
  }

  const packs: string[] = [];
  const custom: CustomRuleConfig[] = [];
  const include: string[] = [];
  const exclude: string[] = [];
  const ruleIds = new Set<string>();

  for (const preset of flattened) {
    packs.push(...(preset.rules?.packs ?? []));
    include.push(...(preset.include ?? []));
    exclude.push(...(preset.exclude ?? []));
    for (const rule of preset.rules?.custom ?? []) {
      if (ruleIds.has(rule.id)) {
        throw new PresetValidationError(`Duplicate custom rule ID in EnvGuard presets: ${rule.id}.`);
      }
      ruleIds.add(rule.id);
      custom.push(cloneRule(rule));
    }
  }

  return {
    rules: packs.length > 0 || custom.length > 0 ? { packs: unique(packs), custom } : undefined,
    include: include.length > 0 ? unique(include) : undefined,
    exclude: exclude.length > 0 ? unique(exclude) : undefined
  };
}
