import fs from 'node:fs/promises';
import path from 'node:path';
import {
  scan,
  type ScanResult,
  type Severity
} from '@bhargavmahanta/envguard';
import { formatSarifReport } from '@bhargavmahanta/envguard/reporters';
import { githubIO, type ActionIO } from './github.js';

const severities = new Set<Severity>(['info', 'low', 'medium', 'high', 'critical']);

async function containedTarget(workspace: string, target: string): Promise<string> {
  const canonicalWorkspace = await fs.realpath(workspace);
  const canonicalTarget = await fs.realpath(path.resolve(canonicalWorkspace, target));
  const relative = path.relative(canonicalWorkspace, canonicalTarget);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error('target must remain inside GITHUB_WORKSPACE.');
  }
  return canonicalTarget;
}

function containedOutput(workspace: string, output: string): string {
  const resolved = path.resolve(workspace, output);
  const relative = path.relative(workspace, resolved);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error('sarif-path must remain inside GITHUB_WORKSPACE.');
  }
  return resolved;
}

function severityInput(io: ActionIO, name: string, required: boolean): Severity | undefined {
  const value = io.getInput(name).trim().toLowerCase();
  if (!value && !required) return undefined;
  if (!severities.has(value as Severity)) {
    throw new Error(`${name} must be one of: info, low, medium, high, critical.`);
  }
  return value as Severity;
}

function annotate(io: ActionIO, result: ScanResult): void {
  for (const finding of result.findings) {
    const properties = {
      title: `${finding.ruleId}: ${finding.title}`,
      file: finding.filePath,
      startLine: finding.line
    };
    const message = `${finding.message} ${finding.fix}`;
    if (finding.severity === 'critical' || finding.severity === 'high') {
      io.annotate('error', message, properties);
    } else if (finding.severity === 'medium') {
      io.annotate('warning', message, properties);
    } else {
      io.annotate('notice', message, properties);
    }
  }
}

async function writeSummary(io: ActionIO, result: ScanResult): Promise<void> {
  const rows = (['critical', 'high', 'medium', 'low', 'info'] as Severity[])
    .map((severity) => `| ${severity} | ${result.summary.bySeverity[severity]} |`)
    .join('\n');
  await io.writeSummary([
    '# EnvGuard scan',
    '',
    result.passed ? 'Policy passed.' : 'Policy failed.',
    '',
    `Scanned ${result.summary.filesScanned} files and found ${result.summary.findings} findings.`,
    '',
    '| Severity | Count |',
    '| --- | ---: |',
    rows
  ].join('\n'));
}

export async function run(io: ActionIO = githubIO): Promise<void> {
  try {
    const workspace = path.resolve(process.env.GITHUB_WORKSPACE ?? process.cwd());
    const target = await containedTarget(workspace, io.getInput('target') || '.');
    const configPath = io.getInput('config-path') || undefined;
    const baselinePath = io.getInput('baseline-path') || undefined;
    const sarifPath = io.getInput('sarif-path') || undefined;
    const result = await scan(target, {
      cwd: workspace,
      failOn: severityInput(io, 'fail-on', true) ?? 'high',
      minimumSeverity: severityInput(io, 'minimum-severity', false),
      configPath,
      baselinePath,
      maskSecrets: true,
      config: { output: { mask: true } },
      followSymbolicLinks: false
    });

    annotate(io, result);
    await writeSummary(io, result);
    await io.setOutput('passed', String(result.passed ?? true));
    await io.setOutput('findings-count', String(result.summary.findings));
    await io.setOutput('highest-severity', result.summary.highestSeverity ?? '');

    if (sarifPath) {
      const resolved = containedOutput(workspace, sarifPath);
      await fs.mkdir(path.dirname(resolved), { recursive: true });
      await fs.writeFile(resolved, `${formatSarifReport(result, { maskSecrets: true })}\n`, 'utf8');
      await io.setOutput('sarif-path', sarifPath);
    } else {
      await io.setOutput('sarif-path', '');
    }

    if (result.passed === false) {
      io.setFailed('EnvGuard findings reached the configured failure threshold.');
    }
  } catch (error) {
    io.setFailed(error instanceof Error ? error.message : 'EnvGuard action failed unexpectedly.');
  }
}
