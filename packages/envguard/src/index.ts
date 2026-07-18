export { createScanner } from './sdk/createScanner.js';
export { loadConfig } from './sdk/loadConfig.js';
export { scan } from './sdk/scan.js';
export { VERSION } from './version.js';

export {
  ConfigError,
  EnvGuardError,
  InvalidScanOptionsError,
  PresetCycleError,
  PresetResolutionError,
  PresetValidationError,
  ScanAbortedError,
  TargetAccessError,
  TargetNotFoundError,
  defineConfig,
  definePreset,
  defineRule,
  shouldFail
} from '@bhargavmahanta/envguard-core';

export type {
  Confidence,
  DetectionCategory,
  EnvGuardConfig,
  EnvGuardPreset,
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
} from '@bhargavmahanta/envguard-core';
