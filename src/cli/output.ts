import fs from 'node:fs/promises';
import path from 'node:path';

export interface CliIO {
  stdout(content: string): void;
  stderr(content: string): void;
}

function withNewline(content: string): string {
  return content.endsWith('\n') ? content : `${content}\n`;
}

export const processIO: CliIO = {
  stdout(content) {
    process.stdout.write(withNewline(content));
  },
  stderr(content) {
    process.stderr.write(withNewline(content));
  }
};

export async function writeOutputFile(outputPath: string, content: string): Promise<void> {
  const absolutePath = path.resolve(outputPath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content, 'utf8');
}
