import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { createEnvGuardTools, resolveAllowedRoots, resolveAllowedTarget } from '../src/index.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      fs.rm(directory, { recursive: true, force: true })
    )
  );
});

async function temporaryRoot(): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'envguard-mcp-'));
  temporaryDirectories.push(directory);
  return directory;
}

describe('EnvGuard MCP tools', () => {
  it('rejects targets outside configured roots', async () => {
    const root = await temporaryRoot();
    const outside = await temporaryRoot();
    const roots = await resolveAllowedRoots([root]);

    await expect(resolveAllowedTarget(outside, roots)).rejects.toMatchObject({
      code: 'TARGET_OUTSIDE_ROOT'
    });
  });

  it('always masks scan output', async () => {
    const root = await temporaryRoot();
    await fs.writeFile(path.join(root, '.env'), 'API_KEY=super-secret-value-123456789\n');
    const tools = await createEnvGuardTools({ roots: [root] });

    const response = await tools.scan();
    const text = response.content[0]?.text ?? '';

    expect(text).not.toContain('super-secret-value-123456789');
    expect(JSON.parse(text)).toMatchObject({ tool: 'envguard', schemaVersion: '1.0.0' });
  });

  it('serves scan, rules, and doctor over a clean stdio protocol', async () => {
    const root = await temporaryRoot();
    await fs.writeFile(path.join(root, '.env'), 'PUBLIC_URL=https://example.com\n');
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ['--import', 'tsx', path.resolve('src/cli-entry.ts'), '--root', root],
      cwd: path.resolve('.'),
      stderr: 'pipe'
    });
    let stderr = '';
    transport.stderr?.on('data', (chunk) => { stderr += String(chunk); });
    const client = new Client({ name: 'envguard-mcp-test', version: '1.0.0' });

    try {
      await client.connect(transport);
      const listed = await client.listTools();
      const response = CallToolResultSchema.parse(
        await client.callTool({ name: 'scan', arguments: {} })
      );
      const first = response.content[0];

      expect(listed.tools.map((tool) => tool.name).sort()).toEqual(['doctor', 'rules', 'scan']);
      expect(first?.type).toBe('text');
      if (first?.type === 'text') {
        expect(JSON.parse(first.text)).toMatchObject({ tool: 'envguard', schemaVersion: '1.0.0' });
      }
      expect(stderr).toBe('');
    } finally {
      await client.close();
    }
  }, 15_000);
});
