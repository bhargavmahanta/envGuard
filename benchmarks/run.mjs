import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await fs.readFile(path.join(import.meta.dirname, 'manifest.json'), 'utf8'));
const cli = path.join(root, 'packages', 'envguard', 'dist', 'cli.js');
const publicMode = process.argv.includes('--public');

function run(command, args, cwd, expected = [0]) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (!expected.includes(code)) {
        reject(new Error(`${command} failed with ${code}: ${stderr}`));
      } else {
        resolve({ stdout, stderr, code });
      }
    });
  });
}

async function scanTarget(name, target) {
  const started = Date.now();
  const result = await run(process.execPath, [cli, 'scan', target, '--agent'], root, [0, 1]);
  const report = JSON.parse(result.stdout);
  return {
    name,
    filesScanned: report.summary.filesScanned,
    findings: report.summary.findings,
    ruleIds: [...new Set(report.findings.map((finding) => finding.ruleId))].sort(),
    durationMs: Date.now() - started
  };
}

const results = [];
if (!publicMode) {
  for (const fixture of manifest.fixtures) {
    const result = await scanTarget(fixture.name, path.join(root, fixture.path));
    for (const ruleId of fixture.requiredRuleIds) {
      if (!result.ruleIds.includes(ruleId)) throw new Error(`${fixture.name} did not report ${ruleId}.`);
    }
    for (const ruleId of fixture.forbiddenRuleIds) {
      if (result.ruleIds.includes(ruleId)) throw new Error(`${fixture.name} unexpectedly reported ${ruleId}.`);
    }
    if (result.durationMs > fixture.maximumDurationMs) {
      throw new Error(`${fixture.name} exceeded ${fixture.maximumDurationMs}ms.`);
    }
    results.push(result);
  }
} else {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'envguard-public-benchmark-'));
  try {
    for (const repository of manifest.publicRepositories) {
      const target = path.join(tempRoot, repository.name);
      await fs.mkdir(target, { recursive: true });
      await run('git', ['init', '--quiet'], target);
      await run('git', ['remote', 'add', 'origin', repository.url], target);
      await run('git', ['fetch', '--quiet', '--depth', '1', 'origin', repository.commit], target);
      await run('git', ['checkout', '--quiet', '--detach', 'FETCH_HEAD'], target);
      const result = await scanTarget(repository.name, target);
      if (result.findings > repository.maximumFindings) {
        throw new Error(`${repository.name} exceeded its masked finding-count ceiling.`);
      }
      if (result.durationMs > repository.maximumDurationMs) {
        throw new Error(`${repository.name} exceeded its ${repository.maximumDurationMs}ms runtime ceiling.`);
      }
      results.push(result);
    }
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
}

const output = { schemaVersion: 1, mode: publicMode ? 'public' : 'fixtures', results };
if (publicMode) {
  await fs.writeFile(path.join(import.meta.dirname, 'results.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
}
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
