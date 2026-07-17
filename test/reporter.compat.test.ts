import type { ScanResult } from '../src/types.js';
import { describe, expect, it } from 'vitest';
import {
  renderGithubReport,
  renderJsonReport,
  renderMarkdownReport,
  renderSarifReport,
  renderTerminalReport
} from '../src/reporter.js';

const result: ScanResult = {
  tool: 'envguard',
  version: '1.1.0',
  schemaVersion: '1.0.0',
  targetPath: '.',
  generatedAt: '2026-07-17T00:00:00.000Z',
  summary: {
    filesScanned: 1,
    findings: 1,
    bySeverity: { info: 0, low: 0, medium: 0, high: 1, critical: 0 },
    highestSeverity: 'high',
    skippedFiles: 0
  },
  findings: [
    {
      id: 'ENV-001',
      fingerprint: 'compat-fingerprint',
      ruleId: 'database-url-password',
      title: 'Database URL contains a password',
      category: 'secret',
      severity: 'high',
      confidence: 'high',
      riskScore: 100,
      filePath: '.env',
      line: 1,
      preview: 'DATABASE_URL=postgres://admin:********@localhost:5432/app',
      message: 'A database URL contains an embedded password.',
      fix: 'Move the password to a secret manager.'
    }
  ]
};

describe('reporter compatibility', () => {
  it('keeps all current report formats structurally compatible', () => {
    expect(renderTerminalReport(result)).toContain('EnvGuard scan report');
    expect(JSON.parse(renderJsonReport(result))).toMatchObject({ tool: 'envguard' });
    expect(renderMarkdownReport(result)).toContain('# EnvGuard Report');
    expect(JSON.parse(renderSarifReport(result))).toMatchObject({ version: '2.1.0' });
    expect(renderGithubReport(result)).toContain('::error file=.env,line=1');
  });
});
