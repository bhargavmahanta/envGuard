import fs from 'node:fs/promises';
import path from 'node:path';

const mode = process.argv[2];
if (mode !== '--stable' && mode !== '--prerelease') {
  throw new Error('Usage: node scripts/assert-release-channel.mjs --stable|--prerelease');
}

const workspaceRoot = process.cwd();
const manifest = JSON.parse(
  await fs.readFile(path.join(workspaceRoot, 'packages', 'envguard', 'package.json'), 'utf8')
);
const prePath = path.join(workspaceRoot, '.changeset', 'pre.json');
const hasPreState = await fs.access(prePath).then(() => true, () => false);
const isPrerelease = manifest.version.includes('-');

if (mode === '--stable' && (isPrerelease || hasPreState)) {
  throw new Error('Stable publishing is blocked while EnvGuard is in prerelease mode.');
}

if (mode === '--prerelease') {
  if (!/^2\.0\.0-rc\.\d+$/.test(manifest.version)) {
    throw new Error(`Expected an EnvGuard 2.0.0 release candidate, received ${manifest.version}.`);
  }
  if (!hasPreState) {
    throw new Error('Prerelease publishing requires .changeset/pre.json.');
  }
  const preState = JSON.parse(await fs.readFile(prePath, 'utf8'));
  if (preState.mode !== 'pre' || preState.tag !== 'rc') {
    throw new Error('Changesets must be in prerelease mode with the rc tag.');
  }
}

process.stdout.write(`release channel verified: ${mode.slice(2)} (${manifest.version})\n`);
