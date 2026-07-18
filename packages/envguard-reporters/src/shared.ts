import { maskSensitivePreview, type Finding, type ScanResult } from '@bhargavmahanta/envguard-core';

export interface ReporterOptions {
  color?: boolean;
  maskSecrets?: boolean;
}

function safePreview(finding: Finding): string {
  if (/\*{4,}/.test(finding.preview) || finding.preview.includes('[redacted]')) {
    return finding.preview;
  }
  const masked = maskSensitivePreview(finding.preview);
  if (masked !== finding.preview) return masked;
  if (
    finding.category === 'secret' ||
    finding.category === 'weak-secret' ||
    finding.category === 'entropy' ||
    finding.category === 'custom'
  ) {
    return '[redacted]';
  }
  return finding.preview;
}

export function prepareResult(result: ScanResult, options: ReporterOptions = {}): ScanResult {
  const prepared = structuredClone(result);
  if (options.maskSecrets === false) return prepared;
  prepared.findings = prepared.findings.map((finding) => ({
    ...finding,
    preview: safePreview(finding)
  }));
  return prepared;
}

export function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

export function escapeAnnotation(value: string): string {
  return value
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A')
    .replace(/:/g, '%3A')
    .replace(/,/g, '%2C');
}
