import fs from 'node:fs/promises';
import { applyBaseline, defaultBaselinePath, findingFingerprint, loadBaseline } from './baseline.js';
import { DEFAULT_CONFIG, REPORT_SCHEMA_VERSION, VERSION } from './defaults.js';
import { loadConfig } from './config.js';
import { dedupeFindings } from './dedupe.js';
import { detectFindings } from './detector.js';
import { parseScannedFile } from './parser.js';
import {
  SEVERITIES,
  SEVERITY_RANK,
  type Finding,
  type ScanOptions,
  type ScanResult,
  type Severity
} from './types.js';
import { discoverFiles } from './walk.js';

function sortFindings(a: Finding, b: Finding): number {
  const severityDiff = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
  if (severityDiff !== 0) {
    return severityDiff;
  }

  const riskDiff = b.riskScore - a.riskScore;
  if (riskDiff !== 0) {
    return riskDiff;
  }

  const pathDiff = a.filePath.localeCompare(b.filePath);
  if (pathDiff !== 0) {
    return pathDiff;
  }

  return a.line - b.line;
}

function summarize(findings: Finding[], filesScanned: number): ScanResult['summary'] {
  const bySeverity = Object.fromEntries(SEVERITIES.map((severity) => [severity, 0])) as Record<
    Severity,
    number
  >;

  for (const finding of findings) {
    bySeverity[finding.severity] += 1;
  }

  const highestSeverity = [...SEVERITIES].reverse().find((severity) => bySeverity[severity] > 0);

  return {
    filesScanned,
    findings: findings.length,
    bySeverity,
    highestSeverity
  };
}

export async function scan(targetPath: string, options: ScanOptions = {}): Promise<ScanResult> {
  const cwd = options.cwd ?? process.cwd();
  const loaded = await loadConfig(cwd);
  const config = loaded.config ?? DEFAULT_CONFIG;
  const { root, files } = await discoverFiles(targetPath, cwd, config);
  const disabledRules = new Set(config.rules.disabled);

  const findings: Finding[] = [];

  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf8');
    const scannedFile = parseScannedFile(root, filePath, content);
    findings.push(
      ...detectFindings(scannedFile, {
        root,
        entropyEnabled: config.entropy.enabled,
        entropyThreshold: config.entropy.threshold,
        maskOutput: config.output.mask,
        disabledRules
      })
    );
  }

  const sortedFindings = dedupeFindings(findings)
    .sort(sortFindings)
    .map((finding, index) => ({
      ...finding,
      fingerprint: findingFingerprint(finding),
      id: `ENV-${String(index + 1).padStart(3, '0')}`
    }));

  const baselinePath = options.baselinePath ?? defaultBaselinePath(cwd);
  const baselineFingerprints =
    options.useBaseline === false ? new Set<string>() : await loadBaseline(baselinePath);
  const visibleFindings = applyBaseline(sortedFindings, baselineFingerprints).map(
    (finding, index) => ({
      ...finding,
      id: `ENV-${String(index + 1).padStart(3, '0')}`
    })
  );

  return {
    tool: 'envguard',
    version: VERSION,
    schemaVersion: REPORT_SCHEMA_VERSION,
    targetPath,
    generatedAt: new Date().toISOString(),
    configPath: loaded.configPath,
    summary: summarize(visibleFindings, files.length),
    findings: visibleFindings
  };
}

export function shouldFail(result: ScanResult, failOn: Severity): boolean {
  return result.findings.some(
    (finding) => SEVERITY_RANK[finding.severity] >= SEVERITY_RANK[failOn]
  );
}
