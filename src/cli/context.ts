import chalk from 'chalk';
import { exitCodeForError, type ExitCode } from './exitCodes.js';
import type { CliIO } from './output.js';

export interface CliContext {
  io: CliIO;
  exitCode: ExitCode;
  setExitCode(code: ExitCode): void;
}

export function reportCommandError(context: CliContext, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  context.io.stderr(chalk.red(message));
  context.setExitCode(exitCodeForError(error));
}
