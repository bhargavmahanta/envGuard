import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { VERSION, scan } from '../src/index.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      fs.rm(directory, { recursive: true, force: true })
    )
  );
});

describe('core package', () => {
  it('scans without presentation dependencies and reports its package version', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'envguard-core-'));
    temporaryDirectories.push(directory);
    await fs.writeFile(path.join(directory, '.env'), 'PUBLIC_URL=https://example.com\n');

    const result = await scan(directory);

    expect(result.tool).toBe('envguard');
    expect(result.version).toBe(VERSION);
    expect(result.schemaVersion).toBe('1.0.0');
  });
});
