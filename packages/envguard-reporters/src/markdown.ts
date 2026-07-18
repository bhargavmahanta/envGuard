import type { ScanResult } from '@bhargavmahanta/envguard-core';
import { escapeMarkdown, prepareResult, type ReporterOptions } from './shared.js';

export function formatMarkdownReport(result: ScanResult, options: ReporterOptions = {}): string {
  const prepared = prepareResult(result, options);
  const lines = [
    '# EnvGuard Report',
    '',
    `- Target: \`${prepared.targetPath}\``,
    `- Generated: \`${prepared.generatedAt}\``,
    `- Files scanned: \`${prepared.summary.filesScanned}\``,
    `- Findings: \`${prepared.summary.findings}\``,
    ''
  ];

  if (prepared.findings.length === 0) {
    lines.push('No findings detected.', '');
    return lines.join('\n');
  }

  lines.push('| Severity | Rule | File | Risk | Confidence |');
  lines.push('| --- | --- | --- | ---: | --- |');
  for (const finding of prepared.findings) {
    lines.push(
      `| ${finding.severity} | ${finding.ruleId} | \`${escapeMarkdown(finding.filePath)}:${finding.line}\` | ${finding.riskScore} | ${finding.confidence} |`
    );
  }

  lines.push('', '## Details', '');
  for (const finding of prepared.findings) {
    lines.push(`### ${finding.id} - ${finding.title}`);
    lines.push('');
    lines.push(`- Rule: \`${finding.ruleId}\``);
    lines.push(`- Severity: \`${finding.severity}\``);
    lines.push(`- Confidence: \`${finding.confidence}\``);
    lines.push(`- Risk score: \`${finding.riskScore}/100\``);
    lines.push(`- File: \`${finding.filePath}:${finding.line}\``);
    lines.push(`- Preview: \`${escapeMarkdown(finding.preview)}\``);
    lines.push(`- Why it matters: ${finding.message}`);
    lines.push(`- Fix: ${finding.fix}`);
    lines.push('');
  }
  return lines.join('\n');
}
