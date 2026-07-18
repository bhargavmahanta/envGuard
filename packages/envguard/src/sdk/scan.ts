import {
  scan as coreScan,
  type ScanOptions,
  type ScanResult
} from '@bhargavmahanta/envguard-core';
import { VERSION } from '../version.js';

export function withFacadeVersion(result: ScanResult): ScanResult {
  return { ...result, version: VERSION };
}

export async function scan(target?: string, options?: ScanOptions): Promise<ScanResult>;
export async function scan(options?: ScanOptions): Promise<ScanResult>;
export async function scan(
  targetOrOptions?: string | ScanOptions,
  options?: ScanOptions
): Promise<ScanResult> {
  const result = typeof targetOrOptions === 'string'
    ? await coreScan(targetOrOptions, options)
    : await coreScan(targetOrOptions);
  return withFacadeVersion(result);
}
