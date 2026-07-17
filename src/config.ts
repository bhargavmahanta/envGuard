import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { z } from 'zod';
import { CONFIG_FILENAMES, DEFAULT_CONFIG } from './defaults.js';
import { ConfigError } from './errors.js';
import type {
  EnvGuardConfig,
  LoadedConfig,
  LoadConfigOptions,
  PartialEnvGuardConfig
} from './types.js';

const SeveritySchema = z.enum(['info', 'low', 'medium', 'high', 'critical']);
const ConfidenceSchema = z.enum(['low', 'medium', 'high']);

const CustomRuleSchema = z.object({
  id: z.string().min(1).regex(/^[A-Za-z0-9_.-]+$/),
  severity: SeveritySchema,
  confidence: ConfidenceSchema,
  file_globs: z.array(z.string().min(1)).min(1),
  pattern: z.string().min(1),
  message: z.string().min(1),
  fix: z.string().min(1)
});

const AllowSchema = z.object({
  ruleId: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
  key: z.string().min(1).optional(),
  fingerprint: z.string().min(1).optional(),
  reason: z.string().min(1),
  owner: z.string().min(1),
  expires: z.string().min(1).optional()
});

const ConfigSchema = z
  .object({
    severity: z
      .object({
        fail_on: SeveritySchema.optional()
      })
      .optional(),
    entropy: z
      .object({
        enabled: z.boolean().optional(),
        threshold: z.number().min(0).max(8).optional()
      })
      .optional(),
    output: z
      .object({
        mask: z.boolean().optional()
      })
      .optional(),
    rules: z
      .object({
        disabled: z.array(z.string()).optional(),
        packs: z.array(z.string()).optional(),
        custom: z.array(CustomRuleSchema).optional()
      })
      .optional(),
    allow: z.array(AllowSchema).optional(),
    scan: z
      .object({
        max_file_mb: z.number().positive().optional(),
        timeout_seconds: z.number().min(0).optional(),
        include_gitignored: z.boolean().optional()
      })
      .optional(),
    include: z.array(z.string()).optional(),
    exclude: z.array(z.string()).optional()
  })
  .passthrough();

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readConfigFile(filePath: string): Promise<unknown> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    if (filePath.endsWith('.json')) {
      return JSON.parse(raw) as unknown;
    }

    return yaml.load(raw);
  } catch (error) {
    throw new ConfigError(`Failed to read EnvGuard config at ${filePath}.`, 'CONFIG_READ_FAILED', error);
  }
}

function validateConfig(value: unknown, filePath?: string): PartialEnvGuardConfig {
  const parsed = ConfigSchema.safeParse(value ?? {});
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ');
    const location = filePath ? ` at ${filePath}` : '';
    throw new ConfigError(`Invalid EnvGuard config${location}: ${details}`);
  }

  return parsed.data;
}

function cloneRules(config: EnvGuardConfig['rules']): EnvGuardConfig['rules'] {
  return {
    disabled: [...config.disabled],
    packs: [...config.packs],
    custom: config.custom.map((rule) => ({ ...rule, file_globs: [...rule.file_globs] }))
  };
}

export function mergeConfig(...overrides: PartialEnvGuardConfig[]): EnvGuardConfig {
  let result: EnvGuardConfig = {
    severity: { ...DEFAULT_CONFIG.severity },
    entropy: { ...DEFAULT_CONFIG.entropy },
    output: { ...DEFAULT_CONFIG.output },
    rules: cloneRules(DEFAULT_CONFIG.rules),
    allow: DEFAULT_CONFIG.allow.map((entry) => ({ ...entry })),
    scan: { ...DEFAULT_CONFIG.scan },
    include: [...DEFAULT_CONFIG.include],
    exclude: [...DEFAULT_CONFIG.exclude]
  };

  for (const override of overrides) {
    result = {
      severity: { ...result.severity, ...override.severity },
      entropy: { ...result.entropy, ...override.entropy },
      output: { ...result.output, ...override.output },
      rules: {
        ...result.rules,
        ...override.rules,
        disabled: [...(override.rules?.disabled ?? result.rules.disabled)],
        packs: [...(override.rules?.packs ?? result.rules.packs)],
        custom: (override.rules?.custom ?? result.rules.custom).map((rule) => ({
          ...rule,
          file_globs: [...rule.file_globs]
        }))
      },
      allow: (override.allow ?? result.allow).map((entry) => ({ ...entry })),
      scan: { ...result.scan, ...override.scan },
      include: [...(override.include ?? result.include)],
      exclude: [...(override.exclude ?? result.exclude)]
    };
  }

  return result;
}

export async function loadConfig(cwd: string): Promise<LoadedConfig>;
export async function loadConfig(options?: LoadConfigOptions): Promise<LoadedConfig>;
export async function loadConfig(cwdOrOptions: string | LoadConfigOptions = {}): Promise<LoadedConfig> {
  const options = typeof cwdOrOptions === 'string' ? { cwd: cwdOrOptions } : cwdOrOptions;
  const cwd = path.resolve(options.cwd ?? process.cwd());
  let configPath: string | undefined;
  let fileConfig: PartialEnvGuardConfig = {};

  if (options.configPath) {
    const explicitPath = path.resolve(cwd, options.configPath);
    if (!(await fileExists(explicitPath))) {
      throw new ConfigError(`EnvGuard config not found at ${explicitPath}.`, 'CONFIG_NOT_FOUND');
    }
    configPath = explicitPath;
    fileConfig = validateConfig(await readConfigFile(explicitPath), explicitPath);
  } else {
    for (const filename of CONFIG_FILENAMES) {
      const candidate = path.join(cwd, filename);
      if (!(await fileExists(candidate))) {
        continue;
      }

      configPath = candidate;
      fileConfig = validateConfig(await readConfigFile(candidate), candidate);
      break;
    }
  }

  const programmaticConfig = validateConfig(options.config ?? {});
  return {
    config: mergeConfig(fileConfig, programmaticConfig),
    configPath
  };
}
