import type { Finding, ScanResult } from '@bhargavmahanta/envguard-core';
import { prepareResult, type ReporterOptions } from './shared.js';

function sarifLevel(severity: Finding['severity']): 'error' | 'warning' | 'note' {
  if (severity === 'critical' || severity === 'high') return 'error';
  if (severity === 'medium' || severity === 'low') return 'warning';
  return 'note';
}

export function formatSarifReport(result: ScanResult, options: ReporterOptions = {}): string {
  const prepared = prepareResult(result, options);
  const rules = new Map<string, Finding>();
  for (const finding of prepared.findings) {
    if (!rules.has(finding.ruleId)) rules.set(finding.ruleId, finding);
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
            version: prepared.version,
            rules: [...rules.values()].map((finding) => ({
              id: finding.ruleId,
              name: finding.title,
              shortDescription: { text: finding.title },
              fullDescription: { text: finding.message },
              help: { text: finding.fix },
              defaultConfiguration: { level: sarifLevel(finding.severity) }
            }))
          }
        },
        results: prepared.findings.map((finding) => ({
          ruleId: finding.ruleId,
          level: sarifLevel(finding.severity),
          message: { text: `${finding.title}: ${finding.fix}` },
          partialFingerprints: { envguardFingerprint: finding.fingerprint },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: finding.filePath },
                region: { startLine: finding.line }
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
