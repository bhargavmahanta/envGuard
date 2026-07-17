export { createScanner } from './core/createScanner.js';
export {
  ConfigError,
  EnvGuardError,
  InvalidScanOptionsError,
  PresetCycleError,
  PresetResolutionError,
  PresetValidationError,
  ScanAbortedError,
  TargetAccessError,
  TargetNotFoundError
} from './errors.js';
export { defineConfig, loadConfig } from './config.js';
export { definePreset, defineRule } from './presets.js';
export { scan, shouldFail } from './scanner.js';

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
} from './types.js';
