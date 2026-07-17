import { Command } from 'commander';
import { RULES } from '../../rules/catalog.js';
import type { CliContext } from '../context.js';

export function registerRulesCommand(program: Command, context: CliContext): void {
  program
    .command('rules')
    .description('List built-in EnvGuard rules.')
    .option('--json', 'print rules as JSON')
    .action((options: { json?: boolean }) => {
      if (options.json) {
        context.io.stdout(JSON.stringify(RULES, null, 2));
        return;
      }
      for (const rule of RULES) {
        context.io.stdout(`${rule.id.padEnd(32)} ${rule.severity.padEnd(8)} ${rule.title}`);
      }
    });
}
