import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function gitOutput(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 10
  });
  return stdout;
}

async function existingFiles(cwd: string, output: string): Promise<string[]> {
  const files = output
    .split('\0')
    .map((file) => file.trim())
    .filter(Boolean);
  const existing: string[] = [];

  for (const file of files) {
    try {
      const absolute = path.resolve(cwd, file);
      const stat = await fs.stat(absolute);
      if (stat.isFile()) {
        existing.push(file);
      }
    } catch {
      // Ignore deleted files in diffs.
    }
  }

  return [...new Set(existing)].sort((a, b) => a.localeCompare(b));
}

export async function getStagedFiles(cwd: string): Promise<string[]> {
  const output = await gitOutput(cwd, [
    'diff',
    '--name-only',
    '--cached',
    '--diff-filter=ACMRTUXB',
    '-z'
  ]);
  return existingFiles(cwd, output);
}

export async function getChangedFiles(cwd: string, baseRef?: string): Promise<string[]> {
  const args = ['diff', '--name-only', '--diff-filter=ACMRTUXB', '-z'];
  if (baseRef && baseRef !== 'HEAD') {
    args.push(`${baseRef}...HEAD`);
  } else {
    args.push('HEAD');
  }

  const output = await gitOutput(cwd, args);
  return existingFiles(cwd, output);
}
