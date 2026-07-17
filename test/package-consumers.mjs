import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const fixturesRoot = path.join(projectRoot, 'test', 'fixtures', 'consumers');
const npmCliPath = process.env.npm_execpath;
if (!npmCliPath) throw new Error('test:consumers must be run through npm.');
const npxCliPath = path.join(path.dirname(npmCliPath), 'npx-cli.js');

function run(command, args, cwd, expectedExitCodes = [0]) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', reject);
    child.on('close', (exitCode) => {
      if (!expectedExitCodes.includes(exitCode)) {
        reject(
          new Error(
            `${command} ${args.join(' ')} exited ${exitCode}.\nstdout:\n${stdout}\nstderr:\n${stderr}`
          )
        );
        return;
      }
      resolve({ exitCode, stdout, stderr });
    });
  });
}

async function installFixture(name, tarballPath, tempRoot) {
  const target = path.join(tempRoot, name);
  await fs.cp(path.join(fixturesRoot, name), target, { recursive: true });
  await run(
    process.execPath,
    [npmCliPath, 'install', '--ignore-scripts', '--no-audit', '--no-fund', '--no-package-lock', tarballPath],
    target
  );
  return target;
}

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'envguard-consumers-'));
try {
  const packed = await run(
    process.execPath,
    [npmCliPath, 'pack', '--json', '--pack-destination', tempRoot],
    projectRoot
  );
  const packageInfo = JSON.parse(packed.stdout)[0];
  const tarballPath = path.join(tempRoot, packageInfo.filename);
  assert.ok(
    packageInfo.files.every(({ path: filePath }) =>
      filePath === 'LICENSE' ||
      filePath === 'README.md' ||
      filePath === 'package.json' ||
      filePath.startsWith('dist/')
    ),
    'Tarball contains a file outside the package allowlist.'
  );

  const esm = await installFixture('esm', tarballPath, tempRoot);
  await run(process.execPath, ['index.mjs'], esm);
  const blockedImport = await run(
    process.execPath,
    ['--input-type=module', '-e', "await import('@bhargavmahanta/envguard/scanner')"],
    esm,
    [1]
  );
  assert.match(blockedImport.stderr, /ERR_PACKAGE_PATH_NOT_EXPORTED|not defined by "exports"/);

  const commonjs = await installFixture('commonjs', tarballPath, tempRoot);
  await run(process.execPath, ['index.cjs'], commonjs);

  const typescript = await installFixture('typescript', tarballPath, tempRoot);
  const tscPath = path.join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');
  await run(process.execPath, [tscPath, '--project', 'tsconfig.json'], typescript);
  await run(process.execPath, ['dist/index.js'], typescript);

  const cli = await installFixture('cli', tarballPath, tempRoot);
  const shim = path.join(
    cli,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'envguard.cmd' : 'envguard'
  );
  if (process.platform === 'win32') {
    await run(process.env.ComSpec ?? 'cmd.exe', ['/d', '/c', 'call', shim, '--version'], cli);
  } else {
    await run(shim, ['--version'], cli);
  }

  const npxScan = await run(
    process.execPath,
    [npxCliPath, '--no-install', 'envguard', 'scan', 'sample', '--agent'],
    cli,
    [0, 1]
  );
  const report = JSON.parse(npxScan.stdout);
  assert.equal(report.tool, 'envguard');
  assert.ok(!npxScan.stdout.includes('JWT_SECRET=secret'));
} finally {
  await fs.rm(tempRoot, { recursive: true, force: true });
}
