import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { z } from 'zod';
import { CONFIG_FILENAMES, DEFAULT_CONFIG } from './defaults.js';
import type { EnvGuardConfig, LoadedConfig } from './types.js';

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
  const raw = await fs.readFile(filePath, 'utf8');
  if (filePath.endsWith('.json')) {
    return JSON.parse(raw) as unknown;
  }

  return yaml.load(raw);
}

export async function loadConfig(cwd: string): Promise<LoadedConfig> {
  for (const filename of CONFIG_FILENAMES) {
    const candidate = path.join(cwd, filename);
    if (!(await fileExists(candidate))) {
      continue;
    }

    const parsed = ConfigSchema.safeParse(await readConfigFile(candidate));
    if (!parsed.success) {
      const details = parsed.error.issues
        .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
        .join('; ');
      throw new Error(`Invalid EnvGuard config at ${candidate}: ${details}`);
    }

    return {
      config: mergeConfig(parsed.data),
      configPath: candidate
    };
  }

  return {
    config: structuredClone(DEFAULT_CONFIG)
  };
}

export function mergeConfig(overrides: z.infer<typeof ConfigSchema>): EnvGuardConfig {
  return {
    severity: {
      ...DEFAULT_CONFIG.severity,
      ...overrides.severity
    },
    entropy: {
      ...DEFAULT_CONFIG.entropy,
      ...overrides.entropy
    },
    output: {
      ...DEFAULT_CONFIG.output,
      ...overrides.output
    },
    rules: {
      ...DEFAULT_CONFIG.rules,
      ...overrides.rules,
      disabled: overrides.rules?.disabled ?? DEFAULT_CONFIG.rules.disabled,
      packs: overrides.rules?.packs ?? DEFAULT_CONFIG.rules.packs,
      custom: overrides.rules?.custom ?? DEFAULT_CONFIG.rules.custom
    },
    allow: overrides.allow ?? DEFAULT_CONFIG.allow,
    scan: {
      ...DEFAULT_CONFIG.scan,
      ...overrides.scan
    },
    include: overrides.include ?? DEFAULT_CONFIG.include,
    exclude: overrides.exclude ?? DEFAULT_CONFIG.exclude
  };
}
