import chalk from 'chalk';
import { Command } from 'commander';
import { loadConfig } from '../../sdk/loadConfig.js';
import { VERSION } from '../../version.js';
import type { CliContext } from '../context.js';
import { EXIT_CODES } from '../exitCodes.js';

export function registerDoctorCommand(program: Command, context: CliContext): void {
  program
    .command('doctor')
    .description('Check local EnvGuard setup.')
    .option('--json', 'print doctor output as JSON')
    .action(async (options: { json?: boolean }) => {
      const major = Number(process.versions.node.split('.')[0]);
      const nodeOk = major >= 22;
      const nodeMessage = `${process.version}${nodeOk ? '' : ' requires >=22'}`;
      const checks: Array<{ name: string; ok: boolean; message: string }> = [
        { name: 'node', ok: nodeOk, message: nodeMessage }
      ];

      try {
        const loaded = await loadConfig({ cwd: process.cwd() });
        checks.push({ name: 'config', ok: true, message: loaded.configPath ?? 'default config' });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        checks.push({ name: 'config', ok: false, message });
        context.setExitCode(EXIT_CODES.input);
      }

      if (options.json) {
        context.io.stdout(
          JSON.stringify(
            { tool: 'envguard', version: VERSION, ok: checks.every((check) => check.ok), checks },
            null,
            2
          )
        );
        return;
      }
      for (const check of checks) {
        context.io.stdout(
          `${check.name}: ${check.message} ${check.ok ? chalk.green('ok') : chalk.red('failed')}`
        );
      }

      if (!nodeOk) {
        context.setExitCode(EXIT_CODES.input);
      }
    });
}
