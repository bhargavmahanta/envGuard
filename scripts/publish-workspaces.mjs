import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PUBLIC_WORKSPACES = [
  '@bhargavmahanta/envguard-core',
  '@bhargavmahanta/envguard-reporters',
  '@bhargavmahanta/envguard',
  '@bhargavmahanta/envguard-config-node',
  '@bhargavmahanta/envguard-config-next',
  '@bhargavmahanta/envguard-config-python',
  '@bhargavmahanta/envguard-config-docker',
  '@bhargavmahanta/envguard-mcp'
];

const tagIndex = process.argv.indexOf('--tag');
const requestedTag = tagIndex >= 0 ? process.argv[tagIndex + 1] : undefined;
const dryRun = process.argv.includes('--dry-run');
if (!requestedTag || !['auto', 'latest', 'next'].includes(requestedTag)) {
  throw new Error('Usage: node scripts/publish-workspaces.mjs --tag auto|latest|next [--dry-run]');
}

const npmCliPath = process.env.npm_execpath;
if (!npmCliPath) throw new Error('Run this script through npm so npm_execpath is available.');

const packagesRoot = path.join(process.cwd(), 'packages');
const workspaceDirectories = fs.readdirSync(packagesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(packagesRoot, entry.name));
const manifests = new Map();
for (const directory of workspaceDirectories) {
  const manifestPath = path.join(directory, 'package.json');
  if (!fs.existsSync(manifestPath)) continue;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifests.set(manifest.name, { directory, manifest });
}

const rootPackage = manifests.get('@bhargavmahanta/envguard');
if (!rootPackage) throw new Error('EnvGuard facade workspace was not found.');
const tag = requestedTag === 'auto'
  ? (rootPackage.manifest.version.includes('-') ? 'next' : 'latest')
  : requestedTag;

if (tag === 'next' && !rootPackage.manifest.version.includes('-')) {
  throw new Error('The next tag is reserved for prerelease package versions.');
}
if (tag === 'latest' && rootPackage.manifest.version.includes('-')) {
  throw new Error('Prerelease package versions must not be published under latest.');
}

function runNpm(args, inherit = false) {
  return spawnSync(process.execPath, [npmCliPath, ...args], {
    cwd: process.cwd(),
    encoding: inherit ? undefined : 'utf8',
    stdio: inherit ? 'inherit' : 'pipe'
  });
}

for (const name of PUBLIC_WORKSPACES) {
  const workspace = manifests.get(name);
  if (!workspace) throw new Error(`Public workspace not found: ${name}`);
  if (workspace.manifest.private) throw new Error(`Refusing to publish private workspace: ${name}`);

  const lookup = runNpm(['view', `${name}@${workspace.manifest.version}`, 'version', '--json']);
  if (lookup.status === 0) {
    process.stdout.write(`already published: ${name}@${workspace.manifest.version}\n`);
    continue;
  }
  const diagnostics = `${lookup.stdout ?? ''}\n${lookup.stderr ?? ''}`;
  if (!/E404|404 Not Found|is not in this registry/i.test(diagnostics)) {
    throw new Error(
      `Could not verify registry state for ${name}@${workspace.manifest.version}:\n${diagnostics}`
    );
  }

  process.stdout.write(
    `${dryRun ? 'dry-run' : 'publishing'}: ${name}@${workspace.manifest.version} (${tag})\n`
  );
  const publish = runNpm([
    'publish',
    '--workspace',
    name,
    '--tag',
    tag,
    '--access',
    'public',
    '--provenance',
    ...(dryRun ? ['--dry-run'] : [])
  ], true);
  if (publish.status !== 0) {
    throw new Error(`npm publish failed for ${name}@${workspace.manifest.version}.`);
  }
}
