#!/usr/bin/env node
import path from 'node:path';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createEnvGuardMcpServer } from './server.js';

function parseRoots(argv: string[]): string[] {
  const roots: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!;
    if (argument === '--root') {
      const root = argv[index + 1];
      if (!root) throw new Error('--root requires a path.');
      roots.push(root);
      index += 1;
      continue;
    }
    if (argument.startsWith('--root=')) {
      roots.push(argument.slice('--root='.length));
      continue;
    }
    throw new Error(`Unknown option: ${argument}`);
  }

  if (roots.length > 0) return roots;
  const configured = process.env.ENVGUARD_MCP_ROOTS;
  return configured ? configured.split(path.delimiter).filter(Boolean) : [process.cwd()];
}

async function main(): Promise<void> {
  const server = await createEnvGuardMcpServer({ roots: parseRoots(process.argv.slice(2)) });
  await server.connect(new StdioServerTransport());
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'EnvGuard MCP failed to start.';
  process.stderr.write(`${message}\n`);
  process.exitCode = 2;
});
