import { CommanderError, InvalidArgumentError } from 'commander';
import {
  ConfigError,
  InvalidScanOptionsError,
  ScanAbortedError,
  TargetAccessError,
  TargetNotFoundError
} from '../errors.js';

export const EXIT_CODES = {
  success: 0,
  policy: 1,
  input: 2,
  operational: 3,
  internal: 4
} as const;

export type ExitCode = (typeof EXIT_CODES)[keyof typeof EXIT_CODES];

const FILESYSTEM_ERROR_CODES = new Set([
  'EACCES',
  'EBUSY',
  'EISDIR',
  'EMFILE',
  'ENFILE',
  'ENOENT',
  'ENOSPC',
  'ENOTDIR',
  'EPERM',
  'EROFS'
]);

export function exitCodeForError(error: unknown): ExitCode {
  if (
    error instanceof InvalidArgumentError ||
    error instanceof InvalidScanOptionsError ||
    error instanceof ConfigError
  ) {
    return EXIT_CODES.input;
  }
  if (
    error instanceof TargetNotFoundError ||
    error instanceof TargetAccessError ||
    error instanceof ScanAbortedError
  ) {
    return EXIT_CODES.operational;
  }
  const systemCode =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code
      : undefined;
  if (systemCode && FILESYSTEM_ERROR_CODES.has(systemCode)) {
    return EXIT_CODES.operational;
  }
  if (error instanceof CommanderError) {
    return error.code === 'commander.helpDisplayed' || error.code === 'commander.version'
      ? EXIT_CODES.success
      : EXIT_CODES.input;
  }
  return EXIT_CODES.internal;
}
