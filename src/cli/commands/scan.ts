import path from 'node:path';
import chalk from 'chalk';
import { Command, InvalidArgumentError } from 'commander';
import ora from 'ora';
import { defaultBaselinePath, writeBaseline } from '../../baseline.js';
import { getChangedFiles, getStagedFiles } from '../../git.js';
import { loadConfig, scan } from '../../index.js';
import { renderReport } from '../../reporter.js';
import { SEVERITIES, type OutputFormat, type Severity } from '../../types.js';
import { reportCommandError, type CliContext } from '../context.js';
import { EXIT_CODES } from '../exitCodes.js';
import { writeOutputFile } from '../output.js';

function parseFormat(value: string): OutputFormat {
  if (
    value === 'terminal' ||
    value === 'json' ||
    value === 'markdown' ||
    value === 'sarif' ||
    value === 'github'
  ) {
    return value;
  }
  throw new InvalidArgumentError('format must be one of terminal, json, markdown, sarif, github');
}

function parseSeverity(value: string): Severity {
  const normalized = value.toLowerCase();
  if (SEVERITIES.includes(normalized as Severity)) return normalized as Severity;
  throw new InvalidArgumentError('severity must be one of info, low, medium, high, critical');
}

interface ScanCommandOptions {
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
  agent?: boolean;
}

export function registerScanCommand(program: Command, context: CliContext): void {
  program
    .command('scan')
    .description('Scan a project for unsafe environment and configuration issues.')
    .argument('[target]', 'file or directory to scan', '.')
    .option(
      '-f, --format <format>',
      'report format: terminal, json, markdown, sarif, github',
      parseFormat,
      'terminal'
    )
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
    .option('--agent', 'emit deterministic masked JSON for coding agents')
    .action(async (target: string, options: ScanCommandOptions) => {
      if (options.color === false || options.agent) process.env.NO_COLOR = '1';
      const format: OutputFormat = options.agent ? 'json' : options.format;
      const useSpinner =
        !options.agent &&
        !options.quiet &&
        format === 'terminal' &&
        !options.output &&
        process.stdout.isTTY;
      const spinner = useSpinner ? ora('Scanning project configuration...').start() : undefined;

      try {
        if (options.agent && options.output) {
          throw new InvalidArgumentError('--agent cannot be combined with --output');
        }
        if (options.agent && options.updateBaseline) {
          throw new InvalidArgumentError('--agent cannot be combined with --update-baseline');
        }
        if (options.staged && options.changed) {
          throw new InvalidArgumentError('Use either --staged or --changed, not both');
        }

        const cwd = process.cwd();
        const loaded = await loadConfig({ cwd });
        const baselinePath = path.resolve(options.baseline ?? defaultBaselinePath(cwd));
        const targetFiles = options.staged
          ? await getStagedFiles(cwd)
          : options.changed
            ? await getChangedFiles(
                cwd,
                typeof options.changed === 'string' ? options.changed : undefined
              )
            : undefined;
        const result = await scan({
          target,
          cwd,
          baselinePath,
          useBaseline: !options.updateBaseline,
          targetFiles,
          failOn: options.failOn,
          maskSecrets: options.agent ? true : undefined
        });
        const output = renderReport(result, format, {
          color: !options.agent && options.color !== false && process.stdout.isTTY,
          maskSecrets: options.agent ? true : loaded.config.output.mask
        });

        spinner?.succeed('Scan complete');
        if (options.agent) {
          context.io.stdout(output);
        } else if (options.updateBaseline) {
          await writeBaseline(baselinePath, result.findings);
          if (!options.quiet) {
            context.io.stdout(chalk.green(`Baseline written to ${baselinePath}`));
          }
        } else if (options.output) {
          await writeOutputFile(options.output, output);
          if (!options.quiet) {
            context.io.stdout(chalk.green(`Report written to ${options.output}`));
          }
        } else if (!options.quiet) {
          context.io.stdout(output);
        }

        if (options.verbose && (options.agent || !options.quiet)) {
          context.io.stderr(chalk.gray(`Baseline: ${baselinePath}`));
          context.io.stderr(chalk.gray(`Findings after baseline: ${result.summary.findings}`));
          context.io.stderr(chalk.gray(`Skipped files: ${result.summary.skippedFiles}`));
          if (targetFiles) {
            context.io.stderr(chalk.gray(`Git-selected files: ${targetFiles.length}`));
          }
        }

        if ((options.agent || options.ci) && result.recommendedExitCode === 1) {
          context.setExitCode(EXIT_CODES.policy);
        }
      } catch (error) {
        spinner?.fail('Scan failed');
        reportCommandError(context, error);
      }
    });
}
