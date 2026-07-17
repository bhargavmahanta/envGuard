import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_BASELINE_FILENAME, REPORT_SCHEMA_VERSION } from './defaults.js';
import { ConfigError } from './errors.js';
import type { BaselineFile, Finding } from './types.js';

export function findingFingerprint(finding: Pick<Finding, 'ruleId' | 'filePath' | 'line' | 'title'>): string {
  return crypto
    .createHash('sha256')
    .update([finding.ruleId, finding.filePath, finding.line, finding.title].join('|'))
    .digest('hex')
    .slice(0, 16);
}

export function defaultBaselinePath(cwd: string): string {
  return path.join(cwd, DEFAULT_BASELINE_FILENAME);
}

export async function loadBaseline(filePath: string): Promise<Set<string>> {
  const parsed = await loadBaselineFile(filePath);
  return new Set((parsed?.findings ?? []).map((finding) => finding.fingerprint).filter(Boolean));
}

export async function loadBaselineFile(filePath: string): Promise<BaselineFile | undefined> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<BaselineFile>;
    return {
      tool: 'envguard',
      schemaVersion: REPORT_SCHEMA_VERSION,
      generatedAt: parsed.generatedAt ?? new Date(0).toISOString(),
      findings: parsed.findings ?? []
    };
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    if (code === 'ENOENT') {
      return undefined;
    }

    throw new ConfigError(`Failed to read EnvGuard baseline at ${filePath}.`, 'BASELINE_READ_FAILED', error);
  }
}

export function applyBaseline(findings: Finding[], fingerprints: Set<string>): Finding[] {
  if (fingerprints.size === 0) {
    return findings;
  }

  return findings.filter((finding) => !fingerprints.has(finding.fingerprint));
}

export async function writeBaseline(filePath: string, findings: Finding[]): Promise<void> {
  const baseline: BaselineFile = {
    tool: 'envguard',
    schemaVersion: REPORT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    findings: findings.map((finding) => ({
      fingerprint: finding.fingerprint,
      ruleId: finding.ruleId,
      filePath: finding.filePath,
      line: finding.line,
      title: finding.title
    }))
  };

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
}
