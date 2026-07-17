import type { OutputFormat, ScanResult } from '../types.js';
import { formatGitHubReport } from './github.js';
import { formatJsonReport } from './json.js';
import { formatMarkdownReport } from './markdown.js';
import { formatSarifReport } from './sarif.js';
import type { ReporterOptions } from './shared.js';
import { formatTerminalReport } from './terminal.js';

export { formatGitHubReport } from './github.js';
export { formatJsonReport } from './json.js';
export { formatMarkdownReport } from './markdown.js';
export { formatSarifReport } from './sarif.js';
export type { ReporterOptions } from './shared.js';
export { formatTerminalReport } from './terminal.js';
export type { OutputFormat } from '../types.js';

export function renderReport(
  result: ScanResult,
  format: OutputFormat,
  options: ReporterOptions = {}
): string {
  if (format === 'json') return formatJsonReport(result, options);
  if (format === 'markdown') return formatMarkdownReport(result, options);
  if (format === 'sarif') return formatSarifReport(result, options);
  if (format === 'github') return formatGitHubReport(result, options);
  return formatTerminalReport(result, options);
}
