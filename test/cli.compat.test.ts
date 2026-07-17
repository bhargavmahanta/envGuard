import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const cliPath = path.join(projectRoot, 'src', 'cli.ts');
const tsxImport = import.meta.resolve('tsx');

interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function runCli(args: string[], cwd: string): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--import', tsxImport, cliPath, ...args], {
      cwd,
      env: { ...process.env, NO_COLOR: '1' },
      windowsHide: true
    });
    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (exitCode) => resolve({ exitCode: exitCode ?? 1, stdout, stderr }));
  });
}

describe('CLI compatibility', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'envguard-cli-'));
    await fs.writeFile(
      path.join(tmpDir, '.env'),
      ['DATABASE_URL=postgres://admin:compat-secret@localhost:5432/app', 'DEBUG=true'].join('\n'),
      'utf8'
    );
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('keeps the stable commands available', async () => {
    const help = await runCli(['--help'], tmpDir);

    expect(help.exitCode).toBe(0);
    expect(help.stdout).toContain('scan [options] [target]');
    expect(help.stdout).toContain('init');
    expect(help.stdout).toContain('baseline');
    expect(help.stdout).toContain('rules');
    expect(help.stdout).toContain('doctor');
  });

  it('keeps JSON report fields and default masking compatible', async () => {
    const scan = await runCli(['scan', '.', '--format', 'json'], tmpDir);
    const report = JSON.parse(scan.stdout) as Record<string, unknown> & {
      findings: Array<{ preview: string }>;
    };

    expect(scan.exitCode).toBe(0);
    expect(report).toMatchObject({
      tool: 'envguard',
      schemaVersion: '1.0.0',
      targetPath: '.'
    });
    expect(report).toHaveProperty('version');
    expect(report).toHaveProperty('generatedAt');
    expect(report).toHaveProperty('summary');
    expect(report.findings.length).toBeGreaterThan(0);
    expect(JSON.stringify(report)).not.toContain('compat-secret');
  });

  it('keeps CI threshold behavior compatible', async () => {
    const failed = await runCli(['scan', '.', '--format', 'json', '--ci', '--fail-on', 'high'], tmpDir);
    await fs.rm(path.join(tmpDir, '.env'));
    const passed = await runCli(['scan', '.', '--format', 'json', '--ci', '--fail-on', 'critical'], tmpDir);

    expect(failed.exitCode).toBe(1);
    expect(passed.exitCode).toBe(0);
  });

  it('keeps baseline suppression compatible', async () => {
    const baselinePath = path.join(tmpDir, '.envguard-baseline.json');
    const update = await runCli(
      ['scan', '.', '--update-baseline', '--baseline', baselinePath, '--quiet'],
      tmpDir
    );
    const scan = await runCli(
      ['scan', '.', '--format', 'json', '--baseline', baselinePath],
      tmpDir
    );
    const report = JSON.parse(scan.stdout) as { findings: unknown[] };

    expect(update.exitCode).toBe(0);
    expect(report.findings).toHaveLength(0);
  });

  it('keeps init, rules, doctor, and baseline audit functional', async () => {
    const init = await runCli(['init'], tmpDir);
    const rules = await runCli(['rules', '--json'], tmpDir);
    const doctor = await runCli(['doctor', '--json'], tmpDir);
    const audit = await runCli(['baseline', 'audit', '.', '--json'], tmpDir);

    expect(init.exitCode).toBe(0);
    expect(JSON.parse(rules.stdout)).toBeInstanceOf(Array);
    expect(JSON.parse(doctor.stdout)).toMatchObject({ tool: 'envguard', ok: true });
    expect(JSON.parse(audit.stdout)).toHaveProperty('stale');
  });
});
