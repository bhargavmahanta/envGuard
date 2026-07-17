export class EnvGuardError extends Error {
  readonly code: string;
  override readonly cause?: unknown;

  constructor(message: string, code = 'ENVGUARD_ERROR', cause?: unknown) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.cause = cause;
  }
}

export class ConfigError extends EnvGuardError {
  constructor(message: string, code = 'CONFIG_INVALID', cause?: unknown) {
    super(message, code, cause);
  }
}

export class TargetNotFoundError extends EnvGuardError {
  constructor(message: string, cause?: unknown) {
    super(message, 'TARGET_NOT_FOUND', cause);
  }
}

export class TargetAccessError extends EnvGuardError {
  constructor(message: string, code = 'TARGET_ACCESS_ERROR', cause?: unknown) {
    super(message, code, cause);
  }
}

export class InvalidScanOptionsError extends EnvGuardError {
  constructor(message: string, cause?: unknown) {
    super(message, 'INVALID_SCAN_OPTIONS', cause);
  }
}

export class ScanAbortedError extends EnvGuardError {
  constructor(message = 'The EnvGuard scan was aborted.', cause?: unknown) {
    super(message, 'SCAN_ABORTED', cause);
  }
}
