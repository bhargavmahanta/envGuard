import type { ScanResult } from '../types.js';
import { prepareResult, type ReporterOptions } from './shared.js';

export function formatJsonReport(result: ScanResult, options: ReporterOptions = {}): string {
  return `${JSON.stringify(prepareResult(result, options), null, 2)}\n`;
}
