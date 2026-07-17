import fs from 'node:fs/promises';
import path from 'node:path';
import { Command } from 'commander';
import { InvalidScanOptionsError } from '../../errors.js';
import { reportCommandError, type CliContext } from '../context.js';

const PRESETS = ['node', 'next', 'python', 'docker'] as const;

function configTemplate(preset?: string): string {
  const presetConfig = preset
    ? `extends:\n  - "@bhargavmahanta/envguard-config-${preset}"\n\n`
    : '';
  return `${presetConfig}severity:
  fail_on: high

entropy:
  enabled: true
  threshold: 4.2

output:
  mask: true

rules:
  disabled: []
  packs:
    - node
    - python
    - docker
    - github-actions
    - ci
  custom: []

allow: []

scan:
  max_file_mb: 2
  timeout_seconds: 0
  include_gitignored: false

exclude:
  - docs/fixtures/
`;
}

const defaultIgnore = `node_modules/
dist/
build/
coverage/
.git/
`;

async function writeIfMissing(filePath: string, content: string): Promise<'created' | 'exists'> {
  try {
    await fs.access(filePath);
    return 'exists';
  } catch {
    await fs.writeFile(filePath, content, 'utf8');
    return 'created';
  }
}

export function registerInitCommand(program: Command, context: CliContext): void {
  program
    .command('init')
    .description('Create envguard.config.yml and .envguardignore templates.')
    .option('--preset <name>', 'use an official node, next, python, or docker preset')
    .action(async (options: { preset?: string }) => {
      try {
        if (options.preset && !PRESETS.includes(options.preset as (typeof PRESETS)[number])) {
          throw new InvalidScanOptionsError(`Unknown preset ${options.preset}. Choose node, next, python, or docker.`);
        }
        const cwd = process.cwd();
        const configStatus = await writeIfMissing(
          path.join(cwd, 'envguard.config.yml'),
          configTemplate(options.preset)
        );
        const ignoreStatus = await writeIfMissing(path.join(cwd, '.envguardignore'), defaultIgnore);
        context.io.stdout(`envguard.config.yml: ${configStatus}`);
        context.io.stdout(`.envguardignore: ${ignoreStatus}`);
      } catch (error) {
        reportCommandError(context, error);
      }
    });
}
