import { cloneScanOptions, mergeScanOptions } from './options.js';
import { scan } from '../scanner.js';
import type { Scanner, ScanOptions } from '../types.js';

export function createScanner(defaults: ScanOptions = {}): Scanner {
  const storedDefaults = cloneScanOptions(defaults);

  return {
    scan(target?: string, overrides: ScanOptions = {}) {
      const options = mergeScanOptions(storedDefaults, overrides);
      if (target !== undefined) {
        options.target = target;
      }
      return scan(options);
    }
  };
}
