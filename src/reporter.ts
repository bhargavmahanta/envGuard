import type { OutputFormat, ScanResult } from './types.js';
import {
  formatGitHubReport,
  formatJsonReport,
  formatMarkdownReport,
  formatSarifReport,
  formatTerminalReport,
  renderReport as render,
  type ReporterOptions
} from './reporters/index.js';

export const renderTerminalReport = formatTerminalReport;
export const renderJsonReport = formatJsonReport;
export const renderMarkdownReport = formatMarkdownReport;
export const renderSarifReport = formatSarifReport;
export const renderGithubReport = formatGitHubReport;

export function renderReport(
  result: ScanResult,
  format: OutputFormat,
  options: ReporterOptions = {}
): string {
  return render(result, format, options);
}
