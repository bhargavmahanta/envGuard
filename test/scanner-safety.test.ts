import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ConfigError,
  InvalidScanOptionsError,
  ScanAbortedError,
  TargetNotFoundError,
  scan
} from '../src/index.js';

describe('scanner filesystem safety', () => {
  let tmpDir: string;
  let outsideDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'envguard-safe-'));
    outsideDir = await fs.mkdtemp(path.join(os.tmpdir(), 'envguard-outside-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.rm(outsideDir, { recursive: true, force: true });
  });

  it('uses typed errors for missing targets and explicit ignore paths', async () => {
    await expect(scan({ target: 'missing', cwd: tmpDir })).rejects.toBeInstanceOf(TargetNotFoundError);
    await expect(
      scan({ target: '.', cwd: tmpDir, ignorePath: 'missing.ignore' })
    ).rejects.toBeInstanceOf(ConfigError);
  });

  it('rejects target files outside the selected scan root', async () => {
    const outsideFile = path.join(outsideDir, '.env');
    await fs.writeFile(outsideFile, 'API_KEY=outside-secret-value', 'utf8');

    await expect(
      scan({ target: '.', cwd: tmpDir, targetFiles: [outsideFile] })
    ).rejects.toBeInstanceOf(InvalidScanOptionsError);
  });

  it('records missing, oversized, malformed, and unsupported files as recoverable', async () => {
    await fs.writeFile(path.join(tmpDir, '.env.large'), `API_KEY=${'x'.repeat(100)}`, 'utf8');
    await fs.writeFile(path.join(tmpDir, 'config.yml'), 'services:\n  bad: [unterminated', 'utf8');
    await fs.writeFile(path.join(tmpDir, '.env.binary'), Buffer.from([0xff, 0xfe, 0xfd]));

    const result = await scan({
      target: '.',
      cwd: tmpDir,
      targetFiles: ['.env.missing', '.env.large', 'config.yml', '.env.binary'],
      maximumFileSizeBytes: 64,
      useBaseline: false
    });
    const codes = new Set(result.errors?.map((error) => error.code));

    expect(codes).toContain('FILE_NOT_FOUND');
    expect(codes).toContain('FILE_TOO_LARGE');
    expect(codes).toContain('MALFORMED_YAML');
    expect(codes).toContain('UNSUPPORTED_ENCODING');
    expect(result.errors?.every((error) => error.recoverable)).toBe(true);
    expect(result.summary.skippedFiles).toBe(3);
  });

  it('prevents directory-link escapes', async () => {
    await fs.writeFile(path.join(outsideDir, '.env'), 'API_KEY=outside-secret-value', 'utf8');
    const linkPath = path.join(tmpDir, 'linked');
    await fs.symlink(outsideDir, linkPath, process.platform === 'win32' ? 'junction' : 'dir');

    const result = await scan({
      target: '.',
      cwd: tmpDir,
      targetFiles: ['linked/.env'],
      useBaseline: false
    });

    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'SYMLINK_ESCAPE', recoverable: true })
    );
    expect(JSON.stringify(result)).not.toContain('outside-secret-value');
  });

  it('applies ignore files to explicitly selected target files', async () => {
    await fs.writeFile(path.join(tmpDir, '.env.ignored'), 'API_KEY=ignored-secret-value', 'utf8');
    await fs.writeFile(path.join(tmpDir, '.envguardignore'), '.env.ignored\n', 'utf8');

    const result = await scan({
      target: '.',
      cwd: tmpDir,
      targetFiles: ['.env.ignored'],
      useBaseline: false
    });

    expect(result.metadata?.filesDiscovered).toBe(0);
    expect(result.findings).toHaveLength(0);
  });

  it('cancels predictably with AbortSignal', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      scan({ target: '.', cwd: tmpDir, signal: controller.signal })
    ).rejects.toBeInstanceOf(ScanAbortedError);
  });

  it('retains explicit unsafe unmasked SDK output', async () => {
    await fs.writeFile(path.join(tmpDir, '.env'), 'API_KEY=explicit-unsafe-secret', 'utf8');

    const result = await scan({
      target: '.',
      cwd: tmpDir,
      maskSecrets: false,
      useBaseline: false
    });

    expect(JSON.stringify(result)).toContain('explicit-unsafe-secret');
  });
});
