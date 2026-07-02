import type { Finding } from './types.js';

export function dedupeFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  const deduped: Finding[] = [];

  for (const finding of findings) {
    const key = [
      finding.ruleId,
      finding.filePath,
      finding.line,
      finding.preview.replace(/\s+/g, ' ').trim()
    ].join('|');

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(finding);
  }

  return deduped;
}
