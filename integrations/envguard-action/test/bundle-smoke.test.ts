import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true }))
  );
});

describe('bundled GitHub Action', () => {
  it('resolves an installed preset package from GITHUB_WORKSPACE', async () => {
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'envguard-action-'));
    temporaryDirectories.push(workspace);

    const repositoryRoot = path.resolve(__dirname, '../../..');
    const presetSource = path.join(repositoryRoot, 'packages/envguard-config-node');
    const presetTarget = path.join(
      workspace,
      'node_modules/@bhargavmahanta/envguard-config-node'
    );
    const outputPath = path.join(workspace, 'github-output.txt');
    const summaryPath = path.join(workspace, 'github-summary.md');

    await fs.mkdir(path.dirname(presetTarget), { recursive: true });
    await fs.cp(presetSource, presetTarget, { recursive: true });
    await fs.writeFile(
      path.join(workspace, 'envguard.config.yml'),
      'extends:\n  - "@bhargavmahanta/envguard-config-node"\n',
      'utf8'
    );
    await fs.writeFile(path.join(workspace, '.env.example'), 'NODE_ENV=production\n', 'utf8');
    await fs.writeFile(outputPath, '', 'utf8');
    await fs.writeFile(summaryPath, '', 'utf8');

    const bundlePath = path.join(repositoryRoot, 'integrations/envguard-action/dist/index.js');
    const result = await execFileAsync(process.execPath, [bundlePath], {
      cwd: workspace,
      env: {
        ...process.env,
        GITHUB_WORKSPACE: workspace,
        GITHUB_OUTPUT: outputPath,
        GITHUB_STEP_SUMMARY: summaryPath,
        'INPUT_FAIL-ON': 'high',
        'INPUT_CONFIG-PATH': 'envguard.config.yml'
      }
    });

    expect(result.stderr).toBe('');
    expect(await fs.readFile(outputPath, 'utf8')).toContain('passed=true');
    expect(await fs.readFile(summaryPath, 'utf8')).toContain('Policy passed.');
  });
});
