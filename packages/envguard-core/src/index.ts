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
export { defineConfig, loadConfig, mergeConfig } from './config.js';
export { definePreset, defineRule, resolvePresetConfig } from './presets.js';
export { scan, shouldFail } from './scanner.js';
export {
  DEFAULT_BASELINE_FILENAME,
  DEFAULT_CONFIG,
  DEFAULT_EXCLUDE_PATTERNS,
  DEFAULT_INCLUDE_PATTERNS,
  REPORT_SCHEMA_VERSION,
  VERSION
} from './defaults.js';
export {
  defaultBaselinePath,
  findingFingerprint,
  loadBaseline,
  loadBaselineFile,
  writeBaseline
} from './baseline.js';
export { getChangedFiles, getStagedFiles } from './git.js';
export { detectFileKind, parseEnvContent, parseScannedFile } from './parser.js';
export { maskDatabaseUrl, maskSecret, maskSensitivePreview } from './masking.js';
export { getRule, RULES } from './rules/catalog.js';

export {
  CONFIDENCES,
  CONFIDENCE_RANK,
  SEVERITIES,
  SEVERITY_RANK
} from './types.js';
export type {
  AllowConfig,
  BaselineFile,
  Confidence,
  CustomRuleConfig,
  DetectionCategory,
  EnvEntry,
  EnvGuardConfig,
  EnvGuardPreset,
  FileKind,
  Finding,
  LoadedConfig,
  LoadConfigOptions,
  OutputFormat,
  PartialEnvGuardConfig,
  RuleMeta,
  ScanError,
  ScannedFile,
  Scanner,
  ScanOptions,
  ScanResult,
  ScanSummary,
  Severity
} from './types.js';
