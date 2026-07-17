import type { ScanResult } from '../types.js';
import { escapeAnnotation, prepareResult, type ReporterOptions } from './shared.js';

export function formatGitHubReport(result: ScanResult, options: ReporterOptions = {}): string {
  const prepared = prepareResult(result, options);
  if (prepared.findings.length === 0) return 'EnvGuard: no findings detected.\n';

  return `${prepared.findings
    .map((finding) => {
      const command =
        finding.severity === 'critical' || finding.severity === 'high' ? 'error' : 'warning';
      const title = `${finding.title} (${finding.ruleId})`;
      const message = `${finding.message} Fix: ${finding.fix}`;
      return `::${command} file=${escapeAnnotation(finding.filePath)},line=${finding.line},title=${escapeAnnotation(title)}::${escapeAnnotation(message)}`;
    })
    .join('\n')}\n`;
}
