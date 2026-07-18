import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const version = process.argv[2];
const advanceMajor = process.argv[3] === 'true';
if (!/^2\.\d+\.\d+(?:-rc\.\d+)?$/.test(version ?? '')) {
  throw new Error('Action version must be a stable V2 version or V2 release candidate.');
}

const manifest = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'packages', 'envguard', 'package.json'), 'utf8')
);
if (manifest.version !== version) {
  throw new Error(`Action version ${version} does not match EnvGuard ${manifest.version}.`);
}
if (advanceMajor && version.includes('-')) {
  throw new Error('The v2 major tag may only advance to a stable release.');
}

const action = fs.readFileSync(path.join(process.cwd(), 'action.yml'), 'utf8');
if (!/^\s*main:\s+integrations\/envguard-action\/dist\/index\.js\s*$/m.test(action)) {
  throw new Error('Root action.yml must reference the committed integration bundle.');
}
const bundlePath = path.join('integrations', 'envguard-action', 'dist', 'index.js');
if (!fs.existsSync(path.join(process.cwd(), bundlePath))) {
  throw new Error('The committed EnvGuard Action bundle is missing.');
}
const trackedBundle = spawnSync('git', ['ls-files', '--error-unmatch', '--', bundlePath], {
  cwd: process.cwd(),
  encoding: 'utf8'
});
if (trackedBundle.status !== 0) {
  throw new Error('The EnvGuard Action bundle exists locally but is not tracked by git.');
}

process.stdout.write(`action release verified: v${version}\n`);
