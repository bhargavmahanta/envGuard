import path from 'node:path';
import chalk from 'chalk';
import { Command } from 'commander';
import { defaultBaselinePath, loadBaselineFile } from '@bhargavmahanta/envguard-core';
import { scan } from '../../sdk/scan.js';
import { reportCommandError, type CliContext } from '../context.js';

export function registerBaselineCommand(program: Command, context: CliContext): void {
  const baseline = program.command('baseline').description('Manage EnvGuard baseline files.');

  baseline
    .command('audit')
    .description('Show suppressed and stale entries in an EnvGuard baseline.')
    .argument('[target]', 'file or directory to scan', '.')
    .option('--baseline <path>', 'path to baseline file', '.envguard-baseline.json')
    .option('--json', 'print audit as JSON')
    .action(async (target: string, options: { baseline?: string; json?: boolean }) => {
      try {
        const cwd = process.cwd();
        const baselinePath = path.resolve(options.baseline ?? defaultBaselinePath(cwd));
        const baselineFile = await loadBaselineFile(baselinePath);
        const result = await scan({ target, cwd, baselinePath, useBaseline: false });
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
          context.io.stdout(JSON.stringify(audit, null, 2));
          return;
        }
        context.io.stdout(chalk.bold('EnvGuard baseline audit'));
        context.io.stdout(`Baseline: ${baselinePath}`);
        context.io.stdout(`Entries: ${audit.entries}`);
        context.io.stdout(`Suppressed current findings: ${audit.suppressed}`);
        context.io.stdout(`Stale entries: ${audit.stale}`);
      } catch (error) {
        reportCommandError(context, error);
      }
    });
}
