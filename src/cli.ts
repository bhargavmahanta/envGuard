#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { Command, InvalidArgumentError } from 'commander';
import ora from 'ora';
import { defaultBaselinePath, loadBaselineFile, writeBaseline } from './baseline.js';
import { VERSION } from './defaults.js';
import { loadConfig } from './config.js';
import { getChangedFiles, getStagedFiles } from './git.js';
import { RULES } from './rules/catalog.js';
import { renderReport } from './reporter.js';
import { scan, shouldFail } from './scanner.js';
import { SEVERITIES, type OutputFormat, type Severity } from './types.js';

function parseFormat(value: string): OutputFormat {
  if (value === 'terminal' || value === 'json' || value === 'markdown' || value === 'sarif' || value === 'github') {
    return value;
  }

  throw new InvalidArgumentError('format must be one of terminal, json, markdown, sarif, github');
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
  .option('-f, --format <format>', 'report format: terminal, json, markdown, sarif, github', parseFormat, 'terminal')
  .option('-o, --output <path>', 'write the report to a file')
  .option('--ci', 'enable CI mode with non-zero exit on configured severity')
  .option('--fail-on <severity>', 'CI failure threshold', parseSeverity)
  .option('--baseline <path>', 'path to baseline file', '.envguard-baseline.json')
  .option('--update-baseline', 'write the current findings to the baseline file')
  .option('--staged', 'scan only staged git files')
  .option('--changed [base-ref]', 'scan changed git files, optionally against a base ref')
  .option('--no-color', 'disable colored terminal output')
  .option('--quiet', 'suppress non-error output')
  .option('--verbose', 'print extra diagnostic details')
  .action(
    async (
      target: string,
      options: {
        format: OutputFormat;
        output?: string;
        ci?: boolean;
        failOn?: Severity;
        updateBaseline?: boolean;
        baseline?: string;
        staged?: boolean;
        changed?: boolean | string;
        color?: boolean;
        quiet?: boolean;
        verbose?: boolean;
      }
    ) => {
      if (options.color === false) {
        process.env.NO_COLOR = '1';
      }

      const useSpinner =
        !options.quiet &&
        options.format === 'terminal' &&
        !options.output &&
        process.stdout.isTTY;
      const spinner = useSpinner ? ora('Scanning project configuration...').start() : undefined;

      try {
        const loaded = await loadConfig(process.cwd());
        const baselinePath = path.resolve(options.baseline ?? defaultBaselinePath(process.cwd()));
        if (options.staged && options.changed) {
          throw new InvalidArgumentError('Use either --staged or --changed, not both');
        }

        const targetFiles = options.staged
          ? await getStagedFiles(process.cwd())
          : options.changed
            ? await getChangedFiles(
                process.cwd(),
                typeof options.changed === 'string' ? options.changed : undefined
              )
            : undefined;
        const result = await scan(target, {
          baselinePath,
          useBaseline: !options.updateBaseline,
          targetFiles
        });
        const output = renderReport(result, options.format);

        spinner?.succeed('Scan complete');

        if (options.updateBaseline) {
          await writeBaseline(baselinePath, result.findings);
          if (!options.quiet) {
            console.log(chalk.green(`Baseline written to ${baselinePath}`));
          }
        } else if (options.output) {
          await writeOutput(options.output, output);
          if (!options.quiet) {
            console.log(chalk.green(`Report written to ${options.output}`));
          }
        } else if (!options.quiet) {
          console.log(output);
        }

        if (options.verbose && !options.quiet) {
          console.error(chalk.gray(`Baseline: ${baselinePath}`));
          console.error(chalk.gray(`Findings after baseline: ${result.summary.findings}`));
          console.error(chalk.gray(`Skipped files: ${result.summary.skippedFiles}`));
          if (targetFiles) {
            console.error(chalk.gray(`Git-selected files: ${targetFiles.length}`));
          }
        }

        const failOn = options.failOn ?? loaded.config.severity.fail_on;
        if (options.ci && shouldFail(result, failOn)) {
          process.exitCode = 1;
        }
      } catch (error) {
        spinner?.fail('Scan failed');
        const message = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(message));
        process.exitCode =
          error instanceof InvalidArgumentError || message.startsWith('Invalid EnvGuard config') ? 2 : 1;
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

const baseline = program.command('baseline').description('Manage EnvGuard baseline files.');

baseline
  .command('audit')
  .description('Show suppressed and stale entries in an EnvGuard baseline.')
  .argument('[target]', 'file or directory to scan', '.')
  .option('--baseline <path>', 'path to baseline file', '.envguard-baseline.json')
  .option('--json', 'print audit as JSON')
  .action(async (target: string, options: { baseline?: string; json?: boolean }) => {
    try {
      const baselinePath = path.resolve(options.baseline ?? defaultBaselinePath(process.cwd()));
      const baselineFile = await loadBaselineFile(baselinePath);
      const result = await scan(target, {
        baselinePath,
        useBaseline: false
      });
      const currentFingerprints = new Set(result.findings.map((finding) => finding.fingerprint));
      const entries = baselineFile?.findings ?? [];
      const suppressed = entries.filter((entry) => currentFingerprints.has(entry.fingerprint));
      const stale = entries.filter((entry) => !currentFingerprints.has(entry.fingerprint));
      const audit = {
        baselinePath,
        generatedAt: new Date().toISOString(),
        entries: entries.length,
        suppressed: suppressed.length,
        stale: stale.length,
        suppressedFindings: suppressed,
        staleFindings: stale
      };

      if (options.json) {
        console.log(JSON.stringify(audit, null, 2));
        return;
      }

      console.log(chalk.bold('EnvGuard baseline audit'));
      console.log(`Baseline: ${baselinePath}`);
      console.log(`Entries: ${audit.entries}`);
      console.log(`Suppressed current findings: ${audit.suppressed}`);
      console.log(`Stale entries: ${audit.stale}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(message));
      process.exitCode = 1;
    }
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
  .option('--json', 'print doctor output as JSON')
  .action(async (options: { json?: boolean }) => {
    const major = Number(process.versions.node.split('.')[0]);
    const nodeOk = major >= 20;
    const checks: Array<{ name: string; ok: boolean; message: string }> = [
      {
        name: 'node',
        ok: nodeOk,
        message: `${process.version}${nodeOk ? '' : ' requires >=20'}`
      }
    ];

    try {
      const loaded = await loadConfig(process.cwd());
      checks.push({
        name: 'config',
        ok: true,
        message: loaded.configPath ?? 'default config'
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      checks.push({
        name: 'config',
        ok: false,
        message
      });
      process.exitCode = 1;
    }

    if (options.json) {
      console.log(JSON.stringify({ tool: 'envguard', version: VERSION, ok: checks.every((check) => check.ok), checks }, null, 2));
      return;
    }

    for (const check of checks) {
      console.log(`${check.name}: ${check.message} ${check.ok ? chalk.green('ok') : chalk.red('failed')}`);
    }
  });

await program.parseAsync();
