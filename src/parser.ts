import path from 'node:path';
import yaml from 'js-yaml';
import type { EnvEntry, FileKind, ScanError, ScannedFile } from './types.js';
import {
  isCircleCiPath,
  isDockerfilePath,
  isGithubWorkflowPath,
  isGitlabCiPath,
  normalizePath,
  relativeNormalized
} from './utils/path.js';

export function parseEnvContent(content: string): EnvEntry[] {
  const lines = content.split(/\r?\n/);
  const entries: EnvEntry[] = [];

  lines.forEach((raw, index) => {
    const trimmed = raw.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      return;
    }

    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/);
    if (!match) {
      return;
    }

    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries.push({
      key: match[1],
      value,
      line: index + 1,
      raw
    });
  });

  return entries;
}

export function detectFileKind(relativePath: string): FileKind {
  const normalized = normalizePath(relativePath);
  const lower = normalized.toLowerCase();
  const base = path.posix.basename(normalized);

  if (isGithubWorkflowPath(normalized)) {
    return 'github-actions';
  }

  if (isGitlabCiPath(normalized)) {
    return 'gitlab-ci';
  }

  if (isCircleCiPath(normalized)) {
    return 'circleci';
  }

  if (isDockerfilePath(normalized)) {
    return 'dockerfile';
  }

  if (base === '.env' || base.startsWith('.env.')) {
    return 'env';
  }

  if (/\.(ya?ml)$/.test(lower)) {
    return 'yaml';
  }

  return 'text';
}

export function parseScannedFile(root: string, absolutePath: string, content: string): ScannedFile {
  const relativePath = relativeNormalized(root, absolutePath);
  const kind = detectFileKind(relativePath);
  let parsedYaml: unknown;
  const errors: ScanError[] = [];

  if (kind === 'yaml' || kind === 'github-actions' || kind === 'gitlab-ci' || kind === 'circleci') {
    try {
      parsedYaml = yaml.load(content);
    } catch {
      parsedYaml = undefined;
      errors.push({
        code: 'MALFORMED_YAML',
        message: `Could not parse YAML in ${relativePath}.`,
        filePath: relativePath,
        recoverable: true
      });
    }
  }

  return {
    absolutePath,
    relativePath,
    kind,
    content,
    lines: content.split(/\r?\n/),
    env: parseEnvContent(content),
    yaml: parsedYaml,
    errors: errors.length > 0 ? errors : undefined
  };
}
