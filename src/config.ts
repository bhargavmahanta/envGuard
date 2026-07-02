import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { z } from 'zod';
import { CONFIG_FILENAMES, DEFAULT_CONFIG } from './defaults.js';
import type { EnvGuardConfig, LoadedConfig } from './types.js';

const SeveritySchema = z.enum(['info', 'low', 'medium', 'high', 'critical']);

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
        disabled: z.array(z.string()).optional()
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
      ...overrides.rules
    },
    include: overrides.include ?? DEFAULT_CONFIG.include,
    exclude: overrides.exclude ?? DEFAULT_CONFIG.exclude
  };
}
