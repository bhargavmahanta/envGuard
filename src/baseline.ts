import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_BASELINE_FILENAME, REPORT_SCHEMA_VERSION } from './defaults.js';
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
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<BaselineFile>;
    return new Set((parsed.findings ?? []).map((finding) => finding.fingerprint).filter(Boolean));
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    if (code === 'ENOENT') {
      return new Set();
    }

    throw new Error(`Failed to read baseline file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
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
