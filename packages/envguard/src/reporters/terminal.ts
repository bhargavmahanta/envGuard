import type { Finding, ScanResult, Severity } from '../types.js';
import { prepareResult, type ReporterOptions } from './shared.js';

const ANSI = {
  reset: '\u001B[0m',
  bold: '\u001B[1m',
  gray: '\u001B[90m',
  red: '\u001B[31m',
  redBright: '\u001B[91m',
  yellow: '\u001B[33m',
  blue: '\u001B[34m',
  green: '\u001B[32m'
};

function style(value: string, code: string, color: boolean): string {
  return color ? `${code}${value}${ANSI.reset}` : value;
}

function severityCode(severity: Severity): string {
  if (severity === 'critical') return `${ANSI.redBright}${ANSI.bold}`;
  if (severity === 'high') return `${ANSI.red}${ANSI.bold}`;
  if (severity === 'medium') return `${ANSI.yellow}${ANSI.bold}`;
  if (severity === 'low') return `${ANSI.blue}${ANSI.bold}`;
  return ANSI.gray;
}

function formatFinding(finding: Finding, color: boolean): string {
  const label = style(`[${finding.severity.toUpperCase()}]`, severityCode(finding.severity), color);
  return [
    `${label} ${style(finding.title, ANSI.bold, color)} ${style(`(${finding.ruleId})`, ANSI.gray, color)}`,
    `  File: ${finding.filePath}:${finding.line}`,
    `  Preview: ${finding.preview}`,
    `  Risk: ${finding.riskScore}/100 | Confidence: ${finding.confidence}`,
    `  Fix: ${finding.fix}`
  ].join('\n');
}

export function formatTerminalReport(result: ScanResult, options: ReporterOptions = {}): string {
  const prepared = prepareResult(result, options);
  const color = options.color === true;
  const counts = prepared.summary.bySeverity;
  const lines = [
    style('EnvGuard scan report', ANSI.bold, color),
    `Target: ${prepared.targetPath}`,
    `Files scanned: ${prepared.summary.filesScanned}`,
    `Findings: ${prepared.summary.findings}`,
    `Severity: critical ${counts.critical}, high ${counts.high}, medium ${counts.medium}, low ${counts.low}, info ${counts.info}`
  ];

  if (prepared.configPath) lines.push(`Config: ${prepared.configPath}`);
  if (prepared.findings.length === 0) {
    lines.push('', style('No findings detected.', ANSI.green, color));
    return lines.join('\n');
  }

  lines.push('', ...prepared.findings.map((finding) => formatFinding(finding, color)));
  return lines.join('\n\n');
}
