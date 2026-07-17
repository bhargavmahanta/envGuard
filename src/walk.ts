import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import { DEFAULT_EXCLUDE_PATTERNS } from './defaults.js';
import { ConfigError, TargetAccessError, TargetNotFoundError } from './errors.js';
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

async function loadEnvGuardIgnore(root: string, ignorePath?: string): Promise<string[]> {
  try {
    const raw = await fs.readFile(ignorePath ?? path.join(root, '.envguardignore'), 'utf8');
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
      .map(normalizeIgnorePattern)
      .filter(Boolean);
  } catch (error) {
    if (ignorePath) {
      const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
      throw new ConfigError(
        code === 'ENOENT'
          ? `EnvGuard ignore file not found at ${ignorePath}.`
          : `Failed to read EnvGuard ignore file at ${ignorePath}.`,
        code === 'ENOENT' ? 'IGNORE_NOT_FOUND' : 'IGNORE_READ_FAILED',
        error
      );
    }
    return [];
  }
}

async function loadGitIgnore(root: string): Promise<string[]> {
  try {
    const raw = await fs.readFile(path.join(root, '.gitignore'), 'utf8');
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#') && !line.startsWith('!'))
      .map(normalizeIgnorePattern)
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function resolveScanRoot(targetPath: string, cwd: string): Promise<string> {
  const absoluteTarget = path.resolve(cwd, targetPath);
  try {
    const stat = await fs.lstat(absoluteTarget);
    if (stat.isSymbolicLink()) {
      throw new TargetAccessError(
        `Symbolic-link scan targets are not supported: ${absoluteTarget}.`,
        'TARGET_SYMLINK_UNSUPPORTED'
      );
    }

    const root = stat.isDirectory() ? absoluteTarget : path.dirname(absoluteTarget);
    return await fs.realpath(root);
  } catch (error) {
    if (error instanceof TargetAccessError) throw error;
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    if (code === 'ENOENT') {
      throw new TargetNotFoundError(`Scan target not found: ${absoluteTarget}.`, error);
    }
    throw new TargetAccessError(`Unable to access scan target: ${absoluteTarget}.`, 'TARGET_ACCESS_ERROR', error);
  }
}

export async function resolveIgnorePatterns(
  root: string,
  config: EnvGuardConfig,
  ignorePath?: string
): Promise<string[]> {
  const envguardIgnore = await loadEnvGuardIgnore(root, ignorePath);
  const gitIgnore = config.scan.include_gitignored ? [] : await loadGitIgnore(root);
  return [
    ...DEFAULT_EXCLUDE_PATTERNS,
    ...config.exclude.map(normalizeIgnorePattern),
    ...envguardIgnore,
    ...gitIgnore
  ].filter(Boolean);
}

export async function discoverFiles(
  targetPath: string,
  cwd: string,
  config: EnvGuardConfig,
  ignorePath?: string
): Promise<{ root: string; files: string[] }> {
  const absoluteTarget = path.resolve(cwd, targetPath);
  const root = await resolveScanRoot(targetPath, cwd);
  const stat = await fs.lstat(absoluteTarget);
  const ignore = await resolveIgnorePatterns(root, config, ignorePath);

  if (stat.isFile()) {
    return {
      root,
      files: [await fs.realpath(absoluteTarget)]
    };
  }

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
