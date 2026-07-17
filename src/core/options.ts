import { InvalidScanOptionsError, ScanAbortedError } from '../errors.js';
import { SEVERITY_RANK, type PartialEnvGuardConfig, type ScanOptions, type Severity } from '../types.js';

function mergePartialConfig(
  base?: PartialEnvGuardConfig,
  overrides?: PartialEnvGuardConfig
): PartialEnvGuardConfig | undefined {
  if (!base && !overrides) return undefined;

  return {
    ...base,
    ...overrides,
    severity: base?.severity || overrides?.severity ? { ...base?.severity, ...overrides?.severity } : undefined,
    entropy: base?.entropy || overrides?.entropy ? { ...base?.entropy, ...overrides?.entropy } : undefined,
    output: base?.output || overrides?.output ? { ...base?.output, ...overrides?.output } : undefined,
    rules: base?.rules || overrides?.rules ? { ...base?.rules, ...overrides?.rules } : undefined,
    scan: base?.scan || overrides?.scan ? { ...base?.scan, ...overrides?.scan } : undefined,
    include:
      overrides?.include || base?.include
        ? [...(overrides?.include ?? base?.include ?? [])]
        : undefined,
    exclude:
      overrides?.exclude || base?.exclude
        ? [...(overrides?.exclude ?? base?.exclude ?? [])]
        : undefined,
    allow: (overrides?.allow ?? base?.allow)?.map((entry) => ({ ...entry }))
  };
}

export function cloneScanOptions(options: ScanOptions = {}): ScanOptions {
  return mergeScanOptions({}, options);
}

export function mergeScanOptions(base: ScanOptions, overrides: ScanOptions): ScanOptions {
  const merged: ScanOptions = {
    ...base,
    ...overrides,
    config: mergePartialConfig(base.config, overrides.config),
    entropy:
      base.entropy || overrides.entropy ? { ...base.entropy, ...overrides.entropy } : undefined,
    targetFiles: overrides.targetFiles
      ? [...overrides.targetFiles]
      : base.targetFiles
        ? [...base.targetFiles]
        : undefined,
    include: overrides.include ? [...overrides.include] : base.include ? [...base.include] : undefined,
    exclude: overrides.exclude ? [...overrides.exclude] : base.exclude ? [...base.exclude] : undefined
  };

  return merged;
}

export function normalizeScanInvocation(
  targetOrOptions?: string | ScanOptions,
  legacyOptions: ScanOptions = {}
): ScanOptions {
  if (typeof targetOrOptions === 'string') {
    return mergeScanOptions(legacyOptions, { target: targetOrOptions });
  }

  return cloneScanOptions(targetOrOptions ?? {});
}

export function assertScanOptions(options: ScanOptions, failOn: Severity): void {
  if (options.signal?.aborted) {
    throw new ScanAbortedError();
  }

  if (options.followSymbolicLinks === true) {
    throw new InvalidScanOptionsError('followSymbolicLinks=true is not supported safely.');
  }

  if (options.maximumFileSizeBytes !== undefined && options.maximumFileSizeBytes <= 0) {
    throw new InvalidScanOptionsError('maximumFileSizeBytes must be greater than zero.');
  }

  if (options.timeoutMs !== undefined && options.timeoutMs < 0) {
    throw new InvalidScanOptionsError('timeoutMs must be zero or greater.');
  }

  if (
    options.entropy?.threshold !== undefined &&
    (options.entropy.threshold < 0 || options.entropy.threshold > 8)
  ) {
    throw new InvalidScanOptionsError('entropy.threshold must be between 0 and 8.');
  }

  if (
    options.minimumSeverity &&
    SEVERITY_RANK[options.minimumSeverity] > SEVERITY_RANK[failOn]
  ) {
    throw new InvalidScanOptionsError('minimumSeverity cannot be higher than failOn.');
  }
}
