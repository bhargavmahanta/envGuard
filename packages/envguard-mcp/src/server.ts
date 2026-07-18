import fs from 'node:fs/promises';
import path from 'node:path';
import {
  EnvGuardError,
  RULES,
  SEVERITIES,
  VERSION as CORE_VERSION,
  loadConfig,
  scan,
  type ScanOptions,
  type Severity
} from '@bhargavmahanta/envguard-core';
import { formatJsonReport } from '@bhargavmahanta/envguard-reporters';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export interface EnvGuardMcpOptions {
  roots?: string[];
}

export interface ScanToolInput {
  target?: string;
  failOn?: Severity;
  minimumSeverity?: Severity;
}

function isPathInside(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function errorResult(error: unknown): { isError: true; content: Array<{ type: 'text'; text: string }> } {
  const code = error instanceof EnvGuardError ? error.code : 'MCP_TOOL_ERROR';
  const message = error instanceof EnvGuardError ? error.message : 'EnvGuard could not complete the request.';
  return {
    isError: true,
    content: [{ type: 'text', text: JSON.stringify({ error: { code, message } }) }]
  };
}

function jsonResult(value: unknown): { content: Array<{ type: 'text'; text: string }> } {
  return { content: [{ type: 'text', text: JSON.stringify(value) }] };
}

export async function resolveAllowedRoots(roots: string[] = [process.cwd()]): Promise<string[]> {
  if (roots.length === 0) throw new Error('At least one allowed root is required.');
  const canonical = await Promise.all(roots.map((root) => fs.realpath(path.resolve(root))));
  return [...new Set(canonical.map((root) => path.normalize(root)))];
}

export async function resolveAllowedTarget(target: string | undefined, roots: string[]): Promise<{
  root: string;
  target: string;
}> {
  const requested = path.resolve(roots[0]!, target ?? '.');
  const canonical = path.normalize(await fs.realpath(requested));
  const root = roots.find((allowedRoot) => isPathInside(allowedRoot, canonical));
  if (!root) {
    throw new EnvGuardError('The requested target is outside the configured roots.', 'TARGET_OUTSIDE_ROOT');
  }
  return { root, target: canonical };
}

export async function createEnvGuardTools(options: EnvGuardMcpOptions = {}) {
  const roots = await resolveAllowedRoots(options.roots);

  return {
    roots,
    async scan(input: ScanToolInput = {}) {
      try {
        const resolved = await resolveAllowedTarget(input.target, roots);
        const scanOptions: ScanOptions = {
          cwd: resolved.root,
          failOn: input.failOn,
          minimumSeverity: input.minimumSeverity,
          maskSecrets: true,
          config: { output: { mask: true }, scan: { include_gitignored: false } },
          followSymbolicLinks: false
        };
        const result = await scan(resolved.target, scanOptions);
        return jsonResult(JSON.parse(formatJsonReport(result, { maskSecrets: true })));
      } catch (error) {
        return errorResult(error);
      }
    },
    async rules() {
      return jsonResult({ rules: RULES });
    },
    async doctor() {
      const checks = await Promise.all(
        roots.map(async (root) => {
          try {
            const loaded = await loadConfig({ cwd: root });
            return { root, ok: true, configPath: loaded.configPath ?? null };
          } catch (error) {
            return {
              root,
              ok: false,
              error: error instanceof EnvGuardError
                ? { code: error.code, message: error.message }
                : { code: 'CONFIG_CHECK_FAILED', message: 'Configuration could not be loaded.' }
            };
          }
        })
      );
      return jsonResult({
        tool: 'envguard',
        coreVersion: CORE_VERSION,
        node: process.version,
        ok: Number(process.versions.node.split('.')[0]) >= 22 && checks.every((check) => check.ok),
        checks
      });
    }
  };
}

export async function createEnvGuardMcpServer(options: EnvGuardMcpOptions = {}): Promise<McpServer> {
  const tools = await createEnvGuardTools(options);
  const server = new McpServer({ name: 'envguard', version: '1.0.0' });
  const severity = z.enum(SEVERITIES);

  server.registerTool(
    'scan',
    {
      description: 'Scan an allowed project root for configuration security findings. Output is always masked.',
      inputSchema: {
        target: z.string().optional().describe('Path relative to an allowed root, or an absolute contained path.'),
        failOn: severity.optional(),
        minimumSeverity: severity.optional()
      }
    },
    (input) => tools.scan(input)
  );
  server.registerTool(
    'rules',
    { description: 'List built-in EnvGuard rules.' },
    () => tools.rules()
  );
  server.registerTool(
    'doctor',
    { description: 'Check EnvGuard runtime and configuration for every allowed root.' },
    () => tools.doctor()
  );

  return server;
}
