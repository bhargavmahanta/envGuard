import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getChangedFiles, getStagedFiles } from '../src/git.js';

const execFileAsync = promisify(execFile);

async function git(cwd: string, ...args: string[]): Promise<void> {
  await execFileAsync('git', args, { cwd, windowsHide: true });
}

describe('git file selection', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'envguard-git-'));
    await git(tmpDir, 'init');
    await git(tmpDir, 'config', 'user.name', 'EnvGuard Test');
    await git(tmpDir, 'config', 'user.email', 'envguard-test@example.invalid');
    await fs.writeFile(path.join(tmpDir, '.env'), 'APP_ENV=development', 'utf8');
    await fs.writeFile(path.join(tmpDir, '.env.delete'), 'DELETE_ME=true', 'utf8');
    await git(tmpDir, 'add', '.');
    await git(tmpDir, 'commit', '-m', 'fixture');
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('returns rename targets and ignores staged deletions', async () => {
    await fs.rename(path.join(tmpDir, '.env'), path.join(tmpDir, '.env.renamed'));
    await fs.rm(path.join(tmpDir, '.env.delete'));
    await git(tmpDir, 'add', '-A');

    const files = await getStagedFiles(tmpDir);

    expect(files).toContain('.env.renamed');
    expect(files).not.toContain('.env');
    expect(files).not.toContain('.env.delete');
  });

  it('includes tracked changes and untracked files without duplicates', async () => {
    await fs.writeFile(path.join(tmpDir, '.env'), 'APP_ENV=production', 'utf8');
    await fs.writeFile(path.join(tmpDir, '.env.untracked'), 'NEW_VALUE=true', 'utf8');

    const files = await getChangedFiles(tmpDir);

    expect(files).toContain('.env');
    expect(files).toContain('.env.untracked');
    expect(new Set(files).size).toBe(files.length);
  });
});
