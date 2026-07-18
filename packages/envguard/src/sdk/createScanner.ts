import {
  createScanner as createCoreScanner,
  type Scanner,
  type ScanOptions,
  type ScanResult
} from '@bhargavmahanta/envguard-core';
import { withFacadeVersion } from './scan.js';

export function createScanner(defaults: ScanOptions = {}): Scanner {
  const scanner = createCoreScanner(defaults);
  return {
    async scan(target?: string, overrides?: ScanOptions): Promise<ScanResult> {
      return withFacadeVersion(await scanner.scan(target, overrides));
    }
  };
}
