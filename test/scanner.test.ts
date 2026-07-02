import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { writeBaseline } from '../src/baseline.js';
import { renderReport } from '../src/reporter.js';
import { scan, shouldFail } from '../src/scanner.js';

let tmpDir: string;

async function writeFixture(relativePath: string, content: string): Promise<void> {
  const filePath = path.join(tmpDir, relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');
}

describe('scanner', () => {
  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'envguard-'));

    await writeFixture(
      '.env',
      [
        'AWS_ACCESS_KEY_ID=AKIA1234567890ABCDEF',
        'DATABASE_URL=postgres://admin:supersecret@localhost:5432/app',
        'JWT_SECRET=secret',
        'DEBUG=true',
        'CORS_ORIGIN=*',
        'CORS_CREDENTIALS=true',
        'VERIFY_SSL=false'
      ].join('\n')
    );

    await writeFixture(
      'Dockerfile',
      ['FROM node:latest', 'WORKDIR /app', 'COPY . .', 'CMD ["node", "server.js"]'].join('\n')
    );

    await writeFixture(
      'docker-compose.yml',
      [
        'services:',
        '  db:',
        '    privileged: true',
        '    ports:',
        '      - "5432:5432"',
        '    environment:',
        '      DB_PASSWORD: composePassword123456789'
      ].join('\n')
    );

    await writeFixture(
      '.github/workflows/test.yml',
      [
        'name: Test',
        'on: pull_request_target',
        'jobs:',
        '  test:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@main',
        '      - run: echo "${{ secrets.API_KEY }}"'
      ].join('\n')
    );
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('detects key rule categories and masks output', async () => {
    const result = await scan('.', { cwd: tmpDir });
    const ruleIds = new Set(result.findings.map((finding) => finding.ruleId));
    const serialized = JSON.stringify(result.findings);

    expect(ruleIds).toContain('aws-access-key');
    expect(ruleIds).toContain('database-url-password');
    expect(ruleIds).toContain('weak-jwt-secret');
    expect(ruleIds).toContain('debug-enabled');
    expect(ruleIds).toContain('ssl-disabled');
    expect(ruleIds).toContain('cors-credentials-wildcard');
    expect(ruleIds).toContain('docker-copy-all');
    expect(ruleIds).toContain('docker-root-user');
    expect(ruleIds).toContain('compose-privileged');
    expect(ruleIds).toContain('compose-db-public-port');
    expect(ruleIds).toContain('actions-echo-secret');
    expect(ruleIds).toContain('actions-pull-request-target');
    expect(ruleIds).toContain('actions-unpinned');
    expect(ruleIds).toContain('actions-missing-permissions');
    expect(serialized).not.toContain('supersecret');
    expect(shouldFail(result, 'high')).toBe(true);
    expect(result.schemaVersion).toBe('1.0.0');
    expect(result.findings.every((finding) => finding.fingerprint.length > 0)).toBe(true);
  });

  it('respects inline suppression comments', async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'envguard-'));
    await writeFixture(
      '.env',
      [
        '# envguard-disable-next-line weak-jwt-secret',
        'JWT_SECRET=secret',
        'SESSION_SECRET=password # envguard-disable-line weak-session-secret'
      ].join('\n')
    );

    const result = await scan('.', { cwd: tmpDir });
    const ruleIds = new Set(result.findings.map((finding) => finding.ruleId));

    expect(ruleIds).not.toContain('weak-jwt-secret');
    expect(ruleIds).not.toContain('weak-session-secret');
  });

  it('suppresses findings present in a baseline', async () => {
    const firstScan = await scan('.', { cwd: tmpDir, useBaseline: false });
    const baselinePath = path.join(tmpDir, '.envguard-baseline.json');
    await writeBaseline(baselinePath, firstScan.findings);

    const secondScan = await scan('.', { cwd: tmpDir });

    expect(firstScan.findings.length).toBeGreaterThan(0);
    expect(secondScan.findings).toHaveLength(0);
  });

  it('renders SARIF with masked previews', async () => {
    const result = await scan('.', { cwd: tmpDir, useBaseline: false });
    const sarif = JSON.parse(renderReport(result, 'sarif')) as {
      version: string;
      runs: Array<{ results: Array<{ properties: { preview: string } }> }>;
    };
    const serialized = JSON.stringify(sarif);

    expect(sarif.version).toBe('2.1.0');
    expect(sarif.runs[0].results.length).toBeGreaterThan(0);
    expect(serialized).not.toContain('supersecret');
  });
});
