import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ActionIO } from '../src/github.js';

const inputs = new Map<string, string>();
const outputs = new Map<string, string>();
const failures: string[] = [];
const annotations: string[] = [];
import { run } from '../src/main.js';

let root: string;
let summary = '';
const io: ActionIO = {
  getInput: (name) => inputs.get(name) ?? '',
  async setOutput(name, value) { outputs.set(name, value); },
  annotate(_level, message) { annotations.push(message); },
  async writeSummary(markdown) { summary = markdown; },
  setFailed(message) { failures.push(message); }
};

beforeEach(async () => {
  inputs.clear();
  outputs.clear();
  failures.length = 0;
  annotations.length = 0;
  summary = '';
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'envguard-action-'));
  process.env.GITHUB_WORKSPACE = root;
  inputs.set('target', '.');
  inputs.set('fail-on', 'high');
});

afterEach(async () => {
  delete process.env.GITHUB_WORKSPACE;
  await fs.rm(root, { recursive: true, force: true });
});

describe('EnvGuard Action', () => {
  it('reports a passing scan', async () => {
    await fs.writeFile(path.join(root, '.env'), 'PUBLIC_URL=https://example.com\n');

    await run(io);

    expect(outputs.get('passed')).toBe('true');
    expect(failures).toEqual([]);
    expect(summary).toContain('Policy passed.');
  });

  it('fails policy, emits annotations, and masks SARIF', async () => {
    const secret = 'AKIA1234567890ABCDEF';
    await fs.writeFile(path.join(root, '.env'), `AWS_ACCESS_KEY_ID=${secret}\n`);
    inputs.set('sarif-path', 'reports/envguard.sarif');

    await run(io);

    expect(outputs.get('passed')).toBe('false');
    expect(failures).toHaveLength(1);
    expect(annotations.length).toBeGreaterThan(0);
    const sarif = await fs.readFile(path.join(root, 'reports/envguard.sarif'), 'utf8');
    expect(sarif).not.toContain(secret);
  });

  it('maps fatal input errors to action failure', async () => {
    inputs.set('fail-on', 'urgent');

    await run(io);

    expect(failures[0]).toContain('fail-on must be one of');
  });

  it('rejects targets outside the checked-out workspace', async () => {
    inputs.set('target', '..');

    await run(io);

    expect(failures[0]).toContain('target must remain inside GITHUB_WORKSPACE');
  });
});
