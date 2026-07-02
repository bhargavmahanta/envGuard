import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import { DEFAULT_EXCLUDE_PATTERNS } from './defaults.js';
import type { EnvGuardConfig } from './types.js';
import { normalizePath } from './utils/path.js';

function normalizeIgnorePattern(pattern: string): string {
  const normalized = normalizePath(pattern.trim()).replace(/^\.\//, '');
  if (normalized.length === 0) {
    return normalized;
  }

  if (normalized.endsWith('/')) {
    return `${normalized}**`;
  }

  return normalized;
}

async function loadEnvGuardIgnore(root: string): Promise<string[]> {
  try {
    const raw = await fs.readFile(path.join(root, '.envguardignore'), 'utf8');
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
      .map(normalizeIgnorePattern)
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function resolveScanRoot(targetPath: string, cwd: string): Promise<string> {
  const absoluteTarget = path.resolve(cwd, targetPath);
  const stat = await fs.stat(absoluteTarget);
  return stat.isDirectory() ? absoluteTarget : path.dirname(absoluteTarget);
}

export async function discoverFiles(
  targetPath: string,
  cwd: string,
  config: EnvGuardConfig
): Promise<{ root: string; files: string[] }> {
  const absoluteTarget = path.resolve(cwd, targetPath);
  const stat = await fs.stat(absoluteTarget);
  const root = stat.isDirectory() ? absoluteTarget : path.dirname(absoluteTarget);

  if (stat.isFile()) {
    return {
      root,
      files: [absoluteTarget]
    };
  }

  const envguardIgnore = await loadEnvGuardIgnore(root);
  const ignore = [
    ...DEFAULT_EXCLUDE_PATTERNS,
    ...config.exclude.map(normalizeIgnorePattern),
    ...envguardIgnore
  ].filter(Boolean);

  const files = await fg(config.include, {
    cwd: root,
    absolute: true,
    dot: true,
    onlyFiles: true,
    followSymbolicLinks: false,
    ignore
  });

  return {
    root,
    files: files.map((file) => path.resolve(file)).sort((a, b) => a.localeCompare(b))
  };
}
