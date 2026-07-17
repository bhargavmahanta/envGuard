import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const cliPath = path.join(projectRoot, 'src', 'cli.ts');
const tsxImport = import.meta.resolve('tsx');

function runAgent(args: string[], cwd: string): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--import', tsxImport, cliPath, 'scan', ...args], {
      cwd,
      env: { ...process.env, FORCE_COLOR: '1' },
      windowsHide: true
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => (stdout += chunk));
    child.stderr.on('data', (chunk: string) => (stderr += chunk));
    child.on('error', reject);
    child.on('close', (exitCode) => resolve({ exitCode: exitCode ?? 4, stdout, stderr }));
  });
}

describe('agent mode', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'envguard-agent-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('writes only masked parseable JSON to stdout and applies policy exit code', async () => {
    await fs.writeFile(
      path.join(tmpDir, '.env'),
      'DATABASE_URL=postgres://admin:agent-secret@localhost:5432/app',
      'utf8'
    );

    const result = await runAgent(['.', '--agent', '--format', 'markdown', '--quiet'], tmpDir);
    const report = JSON.parse(result.stdout) as { tool: string; findings: unknown[] };

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe('');
    expect(result.stdout).not.toContain(String.fromCharCode(27));
    expect(result.stdout).not.toContain('agent-secret');
    expect(report.tool).toBe('envguard');
    expect(report.findings.length).toBeGreaterThan(0);
  });

  it('returns zero for a passing scan', async () => {
    const result = await runAgent(['.', '--agent'], tmpDir);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ passed: true, recommendedExitCode: 0 });
    expect(result.stderr).toBe('');
  });

  it('uses exit code 2 for invalid options or configuration', async () => {
    const conflict = await runAgent(['.', '--agent', '--output', 'report.json'], tmpDir);
    await fs.writeFile(path.join(tmpDir, 'envguard.config.yml'), 'entropy:\n  threshold: 99\n', 'utf8');
    const invalidConfig = await runAgent(['.', '--agent'], tmpDir);

    expect(conflict.exitCode).toBe(2);
    expect(conflict.stdout).toBe('');
    expect(invalidConfig.exitCode).toBe(2);
    expect(invalidConfig.stdout).toBe('');
  });

  it('uses exit code 3 for target and filesystem failures', async () => {
    const result = await runAgent(['missing', '--agent'], tmpDir);

    expect(result.exitCode).toBe(3);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('Scan target not found');
  });

  it('uses exit code 4 for unexpected internal failures', async () => {
    const result = await runAgent(['.', '--agent', '--staged'], tmpDir);

    expect(result.exitCode).toBe(4);
    expect(result.stdout).toBe('');
    expect(result.stderr.length).toBeGreaterThan(0);
  });
});
