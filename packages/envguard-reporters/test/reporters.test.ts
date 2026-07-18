import { describe, expect, it } from 'vitest';
import type { ScanResult } from '@bhargavmahanta/envguard-core';
import { formatJsonReport } from '../src/index.js';

describe('reporter package', () => {
  it('masks previews without mutating the scan result', () => {
    const result: ScanResult = {
      tool: 'envguard',
      version: '1.0.0',
      schemaVersion: '1.0.0',
      targetPath: '.',
      generatedAt: new Date(0).toISOString(),
      summary: {
        filesScanned: 1,
        findings: 1,
        bySeverity: { info: 0, low: 0, medium: 0, high: 1, critical: 0 },
        highestSeverity: 'high',
        skippedFiles: 0
      },
      findings: [{
        id: 'finding-1',
        fingerprint: 'fingerprint-1',
        ruleId: 'hardcoded-secret',
        title: 'Hardcoded secret',
        category: 'secret',
        severity: 'high',
        confidence: 'high',
        riskScore: 90,
        filePath: '.env',
        line: 1,
        preview: 'API_KEY=super-secret-value',
        message: 'Secret-like value detected.',
        fix: 'Move the value to a secret store.'
      }]
    };

    const output = formatJsonReport(result);

    expect(output).not.toContain('super-secret-value');
    expect(result.findings[0]?.preview).toContain('super-secret-value');
  });
});
