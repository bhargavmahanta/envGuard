export { createScanner } from './core/createScanner.js';
export {
  ConfigError,
  EnvGuardError,
  InvalidScanOptionsError,
  ScanAbortedError,
  TargetAccessError,
  TargetNotFoundError
} from './errors.js';
export { loadConfig } from './config.js';
export { scan, shouldFail } from './scanner.js';

export type {
  Confidence,
  DetectionCategory,
  EnvGuardConfig,
  Finding,
  LoadedConfig,
  LoadConfigOptions,
  PartialEnvGuardConfig,
  ScanError,
  Scanner,
  ScanOptions,
  ScanResult,
  ScanSummary,
  Severity
} from './types.js';
