import { Command } from 'commander';
import { ConfigError, getRule } from '@bhargavmahanta/envguard-core';
import { reportCommandError, type CliContext } from '../context.js';

export function registerExplainCommand(program: Command, context: CliContext): void {
  program
    .command('explain <rule-id>')
    .description('Explain an EnvGuard rule and its remediation.')
    .option('--json', 'print rule guidance as JSON')
    .action((ruleId: string, options: { json?: boolean }) => {
      try {
        let rule;
        try {
          rule = getRule(ruleId);
        } catch (error) {
          throw new ConfigError(`Unknown EnvGuard rule: ${ruleId}.`, 'RULE_NOT_FOUND', error);
        }
        const explanation = {
          ...rule,
          examples: {
            unsafe: `Configuration matching rule ${rule.id}.`,
            safe: rule.fix
          },
          suppression: `# envguard-disable-next-line ${rule.id}`,
          documentation: `https://github.com/bhargavmahanta/envGuard/blob/main/docs/rules.md#${rule.id}`
        };

        if (options.json) {
          context.io.stdout(JSON.stringify(explanation, null, 2));
          return;
        }
        context.io.stdout(`${rule.id}: ${rule.title}`);
        context.io.stdout(`Severity: ${rule.severity} | Confidence: ${rule.confidence}`);
        context.io.stdout(rule.description);
        context.io.stdout(`Fix: ${rule.fix}`);
        context.io.stdout(`Suppress: ${explanation.suppression}`);
        context.io.stdout(`Docs: ${explanation.documentation}`);
      } catch (error) {
        reportCommandError(context, error);
      }
    });
}
