import { describe, expect, it } from 'vitest';
import { EXIT_CODES, exitCodeForError } from '../src/cli/exitCodes.js';
import { ConfigError, TargetNotFoundError } from '../src/errors.js';

describe('CLI exit-code mapping', () => {
  it('classifies input, target, filesystem, and unexpected failures', () => {
    expect(exitCodeForError(new ConfigError('invalid'))).toBe(EXIT_CODES.input);
    expect(exitCodeForError(new TargetNotFoundError('missing'))).toBe(EXIT_CODES.operational);
    expect(exitCodeForError(Object.assign(new Error('denied'), { code: 'EACCES' }))).toBe(
      EXIT_CODES.operational
    );
    expect(exitCodeForError(new Error('unexpected'))).toBe(EXIT_CODES.internal);
  });
});
