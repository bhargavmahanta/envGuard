import type { ScanResult } from '@bhargavmahanta/envguard-core';
import { prepareResult, type ReporterOptions } from './shared.js';

export function formatJsonReport(result: ScanResult, options: ReporterOptions = {}): string {
  return `${JSON.stringify(prepareResult(result, options), null, 2)}\n`;
}
