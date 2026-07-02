#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { Command, InvalidArgumentError } from 'commander';
import ora from 'ora';
import { VERSION } from './defaults.js';
import { loadConfig } from './config.js';
import { RULES } from './rules/catalog.js';
import { renderReport } from './reporter.js';
import { scan, shouldFail } from './scanner.js';
import { SEVERITIES, type OutputFormat, type Severity } from './types.js';

function parseFormat(value: string): OutputFormat {
  if (value === 'terminal' || value === 'json' || value === 'markdown') {
    return value;
  }

  throw new InvalidArgumentError('format must be one of terminal, json, markdown');
}

function parseSeverity(value: string): Severity {
  const normalized = value.toLowerCase();
  if (SEVERITIES.includes(normalized as Severity)) {
    return normalized as Severity;
  }

  throw new InvalidArgumentError('severity must be one of info, low, medium, high, critical');
}

async function writeOutput(outputPath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(path.resolve(outputPath)), { recursive: true });
  await fs.writeFile(outputPath, content, 'utf8');
}

async function writeIfMissing(filePath: string, content: string): Promise<'created' | 'exists'> {
  try {
    await fs.access(filePath);
    return 'exists';
  } catch {
    await fs.writeFile(filePath, content, 'utf8');
    return 'created';
  }
}

const defaultConfig = `severity:
  fail_on: high

entropy:
  enabled: true
  threshold: 4.2

output:
  mask: true

rules:
  disabled: []

exclude:
  - docs/fixtures/
`;

const defaultIgnore = `node_modules/
dist/
build/
coverage/
.git/
`;

const program = new Command();

program
  .name('envguard')
  .description('Developer-first scanner for unsafe env, Docker, config, and CI/CD settings.')
  .version(VERSION);

program
  .command('scan')
  .description('Scan a project for unsafe environment and configuration issues.')
  .argument('[target]', 'file or directory to scan', '.')
  .option('-f, --format <format>', 'report format: terminal, json, markdown', parseFormat, 'terminal')
  .option('-o, --output <path>', 'write the report to a file')
  .option('--ci', 'enable CI mode with non-zero exit on configured severity')
  .option('--fail-on <severity>', 'CI failure threshold', parseSeverity)
  .action(
    async (
      target: string,
      options: {
        format: OutputFormat;
        output?: string;
        ci?: boolean;
        failOn?: Severity;
      }
    ) => {
      const useSpinner = options.format === 'terminal' && !options.output && process.stdout.isTTY;
      const spinner = useSpinner ? ora('Scanning project configuration...').start() : undefined;

      try {
        const loaded = await loadConfig(process.cwd());
        const result = await scan(target);
        const output = renderReport(result, options.format);

        spinner?.succeed('Scan complete');

        if (options.output) {
          await writeOutput(options.output, output);
          console.log(chalk.green(`Report written to ${options.output}`));
        } else {
          console.log(output);
        }

        const failOn = options.failOn ?? loaded.config.severity.fail_on;
        if (options.ci && shouldFail(result, failOn)) {
          process.exitCode = 1;
        }
      } catch (error) {
        spinner?.fail('Scan failed');
        const message = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(message));
        process.exitCode = 1;
      }
    }
  );

program
  .command('init')
  .description('Create envguard.config.yml and .envguardignore templates.')
  .action(async () => {
    const cwd = process.cwd();
    const configStatus = await writeIfMissing(path.join(cwd, 'envguard.config.yml'), defaultConfig);
    const ignoreStatus = await writeIfMissing(path.join(cwd, '.envguardignore'), defaultIgnore);

    console.log(`envguard.config.yml: ${configStatus}`);
    console.log(`.envguardignore: ${ignoreStatus}`);
  });

program
  .command('rules')
  .description('List built-in EnvGuard rules.')
  .option('--json', 'print rules as JSON')
  .action((options: { json?: boolean }) => {
    if (options.json) {
      console.log(JSON.stringify(RULES, null, 2));
      return;
    }

    for (const rule of RULES) {
      console.log(`${rule.id.padEnd(32)} ${rule.severity.padEnd(8)} ${rule.title}`);
    }
  });

program
  .command('doctor')
  .description('Check local EnvGuard setup.')
  .action(async () => {
    const major = Number(process.versions.node.split('.')[0]);
    const nodeOk = major >= 20;
    console.log(`Node.js: ${process.version} ${nodeOk ? chalk.green('ok') : chalk.red('requires >=20')}`);

    try {
      const loaded = await loadConfig(process.cwd());
      console.log(`Config: ${loaded.configPath ?? 'default config'} ${chalk.green('ok')}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`Config: ${chalk.red(message)}`);
      process.exitCode = 1;
    }
  });

await program.parseAsync();
