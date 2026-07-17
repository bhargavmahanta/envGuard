import { Command, CommanderError } from 'commander';
import { VERSION } from '../defaults.js';
import { registerBaselineCommand } from './commands/baseline.js';
import { registerDoctorCommand } from './commands/doctor.js';
import { registerInitCommand } from './commands/init.js';
import { registerRulesCommand } from './commands/rules.js';
import { registerScanCommand } from './commands/scan.js';
import { reportCommandError, type CliContext } from './context.js';
import { EXIT_CODES, exitCodeForError, type ExitCode } from './exitCodes.js';
import { processIO, type CliIO } from './output.js';

export async function runCli(argv = process.argv, io: CliIO = processIO): Promise<ExitCode> {
  const context: CliContext = {
    io,
    exitCode: EXIT_CODES.success,
    setExitCode(code) {
      this.exitCode = code;
    }
  };
  const program = new Command();
  program
    .name('envguard')
    .description('Developer-first scanner for unsafe env, Docker, config, and CI/CD settings.')
    .version(VERSION)
    .configureOutput({ writeOut: (content) => io.stdout(content), writeErr: (content) => io.stderr(content) })
    .exitOverride();

  registerScanCommand(program, context);
  registerInitCommand(program, context);
  registerBaselineCommand(program, context);
  registerRulesCommand(program, context);
  registerDoctorCommand(program, context);

  try {
    await program.parseAsync(argv);
  } catch (error) {
    if (error instanceof CommanderError) {
      context.setExitCode(exitCodeForError(error));
    } else {
      reportCommandError(context, error);
    }
  }

  return context.exitCode;
}
