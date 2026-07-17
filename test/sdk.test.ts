import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ConfigError,
  InvalidScanOptionsError,
  createScanner,
  loadConfig,
  scan
} from '../src/index.js';
import type { ScanOptions } from '../src/index.js';

describe('public SDK', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'envguard-sdk-'));
    await fs.writeFile(
      path.join(tmpDir, '.env'),
      ['DATABASE_URL=postgres://admin:sdk-secret@localhost:5432/app', 'DEBUG=true'].join('\n'),
      'utf8'
    );
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('supports positional, object, and default-target scan forms', async () => {
    const positional = await scan('.', { cwd: tmpDir, useBaseline: false });
    const object = await scan({ target: '.', cwd: tmpDir, useBaseline: false });
    const previousCwd = process.cwd();

    process.chdir(tmpDir);
    try {
      const defaultTarget = await scan({ useBaseline: false });
      expect(defaultTarget.targetPath).toBe('.');
    } finally {
      process.chdir(previousCwd);
    }

    expect(object.findings.map((finding) => finding.ruleId)).toEqual(
      positional.findings.map((finding) => finding.ruleId)
    );
  });

  it('applies file, programmatic, and top-level option precedence', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'envguard.config.yml'),
      ['output:', '  mask: false', 'severity:', '  fail_on: critical'].join('\n'),
      'utf8'
    );

    const result = await scan({
      target: '.',
      cwd: tmpDir,
      config: { severity: { fail_on: 'medium' } },
      failOn: 'high',
      maskSecrets: true,
      useBaseline: false
    });

    expect(JSON.stringify(result)).not.toContain('sdk-secret');
    expect(result.passed).toBe(false);
    expect(result.recommendedExitCode).toBe(1);
  });

  it('loads an explicit config path instead of auto-discovery', async () => {
    await fs.writeFile(path.join(tmpDir, 'envguard.config.yml'), 'severity:\n  fail_on: low\n', 'utf8');
    await fs.writeFile(path.join(tmpDir, 'custom.yml'), 'severity:\n  fail_on: critical\n', 'utf8');

    const loaded = await loadConfig({ cwd: tmpDir, configPath: 'custom.yml' });

    expect(loaded.config.severity.fail_on).toBe('critical');
    expect(loaded.configPath).toBe(path.join(tmpDir, 'custom.yml'));
  });

  it('reuses immutable scanner defaults safely and concurrently', async () => {
    const defaults: ScanOptions = {
      cwd: tmpDir,
      useBaseline: false,
      entropy: { enabled: true, threshold: 4.2 },
      config: { rules: { disabled: [], packs: ['node'], custom: [] } }
    };
    const before = JSON.stringify(defaults);
    const scanner = createScanner(defaults);

    const [first, second] = await Promise.all([
      scanner.scan('.'),
      scanner.scan('.', { minimumSeverity: 'high' })
    ]);

    expect(first.findings.length).toBeGreaterThan(0);
    expect(second.findings.every((finding) => finding.severity === 'high' || finding.severity === 'critical')).toBe(true);
    expect(JSON.stringify(defaults)).toBe(before);
  });

  it('is silent and does not modify parent process termination state', async () => {
    const stdout = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    const previousExitCode = process.exitCode;

    await scan({ target: '.', cwd: tmpDir, useBaseline: false });

    expect(stdout).not.toHaveBeenCalled();
    expect(stderr).not.toHaveBeenCalled();
    expect(exit).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(previousExitCode);
  });

  it('returns backward-compatible metadata and policy fields', async () => {
    await fs.rm(path.join(tmpDir, '.env'));
    const result = await scan({ target: '.', cwd: tmpDir, failOn: 'critical', useBaseline: false });

    expect(result.schemaVersion).toBe('1.0.0');
    expect(result.metadata).toMatchObject({ filesDiscovered: expect.any(Number) });
    expect(result.metadata?.filesScanned).toBe(result.summary.filesScanned);
    expect(result.passed).toBe(true);
    expect(result.recommendedExitCode).toBe(0);
  });

  it('uses typed, sanitized configuration and option errors', async () => {
    await fs.writeFile(path.join(tmpDir, 'invalid.yml'), 'entropy:\n  threshold: 99\n', 'utf8');

    await expect(loadConfig({ cwd: tmpDir, configPath: 'missing.yml' })).rejects.toMatchObject({
      name: 'ConfigError',
      code: 'CONFIG_NOT_FOUND'
    });
    await expect(loadConfig({ cwd: tmpDir, configPath: 'invalid.yml' })).rejects.toBeInstanceOf(ConfigError);
    await expect(
      scan({ target: '.', cwd: tmpDir, minimumSeverity: 'critical', failOn: 'high' })
    ).rejects.toBeInstanceOf(InvalidScanOptionsError);
  });
});
