import fs from 'node:fs/promises';

export interface AnnotationProperties {
  title: string;
  file: string;
  startLine: number;
}

export interface ActionIO {
  getInput(name: string): string;
  setOutput(name: string, value: string): Promise<void>;
  annotate(level: 'error' | 'warning' | 'notice', message: string, properties: AnnotationProperties): void;
  writeSummary(markdown: string): Promise<void>;
  setFailed(message: string): void;
}

function escapeData(value: string): string {
  return value.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}

function escapeProperty(value: string): string {
  return escapeData(value).replace(/:/g, '%3A').replace(/,/g, '%2C');
}

export const githubIO: ActionIO = {
  getInput(name) {
    return process.env[`INPUT_${name.replace(/ /g, '_').replace(/-/g, '_').toUpperCase()}`] ?? '';
  },
  async setOutput(name, value) {
    const outputFile = process.env.GITHUB_OUTPUT;
    if (outputFile) {
      await fs.appendFile(outputFile, `${name}=${value}\n`, 'utf8');
      return;
    }
    process.stdout.write(`::set-output name=${escapeProperty(name)}::${escapeData(value)}\n`);
  },
  annotate(level, message, properties) {
    const metadata = [
      `title=${escapeProperty(properties.title)}`,
      `file=${escapeProperty(properties.file)}`,
      `line=${properties.startLine}`
    ].join(',');
    process.stdout.write(`::${level} ${metadata}::${escapeData(message)}\n`);
  },
  async writeSummary(markdown) {
    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (summaryFile) await fs.appendFile(summaryFile, `${markdown}\n`, 'utf8');
  },
  setFailed(message) {
    process.stdout.write(`::error::${escapeData(message)}\n`);
    process.exitCode = 1;
  }
};
