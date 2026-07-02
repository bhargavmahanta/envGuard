import chalk from 'chalk';
import type { Finding, OutputFormat, ScanResult, Severity } from './types.js';

function severityColor(severity: Severity): (value: string) => string {
  switch (severity) {
    case 'critical':
      return chalk.redBright.bold;
    case 'high':
      return chalk.red.bold;
    case 'medium':
      return chalk.yellow.bold;
    case 'low':
      return chalk.blue.bold;
    case 'info':
      return chalk.gray;
  }
}

function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function renderFindingTerminal(finding: Finding): string {
  const label = severityColor(finding.severity)(`[${finding.severity.toUpperCase()}]`);
  return [
    `${label} ${chalk.bold(finding.title)} ${chalk.gray(`(${finding.ruleId})`)}`,
    `  File: ${finding.filePath}:${finding.line}`,
    `  Preview: ${finding.preview}`,
    `  Risk: ${finding.riskScore}/100 | Confidence: ${finding.confidence}`,
    `  Fix: ${finding.fix}`
  ].join('\n');
}

export function renderTerminalReport(result: ScanResult): string {
  const counts = result.summary.bySeverity;
  const lines = [
    chalk.bold('EnvGuard scan report'),
    `Target: ${result.targetPath}`,
    `Files scanned: ${result.summary.filesScanned}`,
    `Findings: ${result.summary.findings}`,
    `Severity: critical ${counts.critical}, high ${counts.high}, medium ${counts.medium}, low ${counts.low}, info ${counts.info}`
  ];

  if (result.configPath) {
    lines.push(`Config: ${result.configPath}`);
  }

  if (result.findings.length === 0) {
    lines.push('', chalk.green('No findings detected.'));
    return lines.join('\n');
  }

  lines.push('', ...result.findings.map(renderFindingTerminal));
  return lines.join('\n\n');
}

export function renderJsonReport(result: ScanResult): string {
  return `${JSON.stringify(result, null, 2)}\n`;
}

function sarifLevel(severity: Finding['severity']): 'error' | 'warning' | 'note' {
  if (severity === 'critical' || severity === 'high') {
    return 'error';
  }

  if (severity === 'medium' || severity === 'low') {
    return 'warning';
  }

  return 'note';
}

export function renderSarifReport(result: ScanResult): string {
  const rules = new Map<string, Finding>();
  for (const finding of result.findings) {
    if (!rules.has(finding.ruleId)) {
      rules.set(finding.ruleId, finding);
    }
  }

  const sarif = {
    version: '2.1.0',
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    runs: [
      {
        tool: {
          driver: {
            name: 'EnvGuard',
            informationUri: 'https://github.com/bhargavmahanta/envGuard',
            version: result.version,
            rules: [...rules.values()].map((finding) => ({
              id: finding.ruleId,
              name: finding.title,
              shortDescription: {
                text: finding.title
              },
              fullDescription: {
                text: finding.message
              },
              help: {
                text: finding.fix
              },
              defaultConfiguration: {
                level: sarifLevel(finding.severity)
              }
            }))
          }
        },
        results: result.findings.map((finding) => ({
          ruleId: finding.ruleId,
          level: sarifLevel(finding.severity),
          message: {
            text: `${finding.title}: ${finding.fix}`
          },
          partialFingerprints: {
            envguardFingerprint: finding.fingerprint
          },
          locations: [
            {
              physicalLocation: {
                artifactLocation: {
                  uri: finding.filePath
                },
                region: {
                  startLine: finding.line
                }
              }
            }
          ],
          properties: {
            severity: finding.severity,
            confidence: finding.confidence,
            riskScore: finding.riskScore,
            preview: finding.preview
          }
        }))
      }
    ]
  };

  return `${JSON.stringify(sarif, null, 2)}\n`;
}

export function renderMarkdownReport(result: ScanResult): string {
  const lines = [
    '# EnvGuard Report',
    '',
    `- Target: \`${result.targetPath}\``,
    `- Generated: \`${result.generatedAt}\``,
    `- Files scanned: \`${result.summary.filesScanned}\``,
    `- Findings: \`${result.summary.findings}\``,
    ''
  ];

  if (result.findings.length === 0) {
    lines.push('No findings detected.', '');
    return lines.join('\n');
  }

  lines.push('| Severity | Rule | File | Risk | Confidence |');
  lines.push('| --- | --- | --- | ---: | --- |');

  for (const finding of result.findings) {
    lines.push(
      `| ${finding.severity} | ${finding.ruleId} | \`${escapeMarkdown(finding.filePath)}:${finding.line}\` | ${finding.riskScore} | ${finding.confidence} |`
    );
  }

  lines.push('', '## Details', '');

  for (const finding of result.findings) {
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

export function renderReport(result: ScanResult, format: OutputFormat): string {
  if (format === 'json') {
    return renderJsonReport(result);
  }

  if (format === 'markdown') {
    return renderMarkdownReport(result);
  }

  if (format === 'sarif') {
    return renderSarifReport(result);
  }

  return renderTerminalReport(result);
}
