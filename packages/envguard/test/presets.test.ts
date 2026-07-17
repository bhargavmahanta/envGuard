import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ConfigError,
  PresetCycleError,
  PresetResolutionError,
  PresetValidationError,
  defineConfig,
  definePreset,
  defineRule,
  loadConfig
} from '../src/index.js';

describe('declarative preset resolution', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'envguard-presets-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('resolves inherited local presets before local and programmatic overrides', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'parent.json'),
      JSON.stringify({ include: ['parent/**'], rules: { packs: ['node'] } }),
      'utf8'
    );
    await fs.writeFile(
      path.join(tmpDir, 'child.yml'),
      ['extends:', '  - ./parent.json', 'exclude:', '  - child/generated/**'].join('\n'),
      'utf8'
    );
    await fs.writeFile(
      path.join(tmpDir, 'envguard.config.yml'),
      ['extends:', '  - ./child.yml', 'include:', '  - local/**'].join('\n'),
      'utf8'
    );

    const loaded = await loadConfig({
      cwd: tmpDir,
      config: { exclude: ['programmatic/**'] }
    });

    expect(loaded.config.include).toEqual(['local/**']);
    expect(loaded.config.exclude).toEqual(['programmatic/**']);
    expect(loaded.config.rules.packs).toEqual(['node']);
  });

  it('resolves an installed package through its envguard.preset manifest field', async () => {
    const packageRoot = path.join(tmpDir, 'node_modules', '@example', 'envguard-preset');
    await fs.mkdir(packageRoot, { recursive: true });
    await fs.writeFile(
      path.join(packageRoot, 'package.json'),
      JSON.stringify({ name: '@example/envguard-preset', exports: { './package.json': './package.json' }, envguard: { preset: './preset.json' } }),
      'utf8'
    );
    await fs.writeFile(path.join(packageRoot, 'preset.json'), JSON.stringify({ include: ['package/**'] }), 'utf8');
    await fs.writeFile(
      path.join(tmpDir, 'envguard.config.yml'),
      ['extends:', '  - "@example/envguard-preset"'].join('\n'),
      'utf8'
    );

    const loaded = await loadConfig({ cwd: tmpDir });
    expect(loaded.config.include).toEqual(['package/**']);
  });

  it('rejects cycles and excessive inheritance', async () => {
    await fs.writeFile(path.join(tmpDir, 'a.yml'), 'extends:\n  - ./b.yml\n', 'utf8');
    await fs.writeFile(path.join(tmpDir, 'b.yml'), 'extends:\n  - ./a.yml\n', 'utf8');
    await fs.writeFile(path.join(tmpDir, 'envguard.config.yml'), 'extends:\n  - ./a.yml\n', 'utf8');

    await expect(loadConfig({ cwd: tmpDir })).rejects.toBeInstanceOf(PresetCycleError);
  });

  it('rejects executable files and protocol presets', async () => {
    await fs.writeFile(path.join(tmpDir, 'preset.js'), 'export default {}', 'utf8');
    await fs.writeFile(path.join(tmpDir, 'envguard.config.yml'), 'extends:\n  - ./preset.js\n', 'utf8');
    await expect(loadConfig({ cwd: tmpDir })).rejects.toMatchObject({ code: 'PRESET_UNSUPPORTED_FORMAT' });

    await fs.writeFile(path.join(tmpDir, 'envguard.config.yml'), 'extends:\n  - https://example.com/preset.json\n', 'utf8');
    await expect(loadConfig({ cwd: tmpDir })).rejects.toMatchObject({ code: 'PRESET_PROTOCOL_UNSUPPORTED' });
  });

  it('rejects package manifest paths that escape the package root', async () => {
    const packageRoot = path.join(tmpDir, 'node_modules', 'unsafe-preset');
    await fs.mkdir(packageRoot, { recursive: true });
    await fs.writeFile(
      path.join(packageRoot, 'package.json'),
      JSON.stringify({ name: 'unsafe-preset', exports: { './package.json': './package.json' }, envguard: { preset: '../outside.json' } }),
      'utf8'
    );
    await fs.writeFile(path.join(tmpDir, 'envguard.config.yml'), 'extends:\n  - unsafe-preset\n', 'utf8');

    await expect(loadConfig({ cwd: tmpDir })).rejects.toMatchObject({ code: 'PRESET_PATH_ESCAPE' });
  });

  it('rejects duplicate custom and built-in rule IDs', async () => {
    const duplicate = {
      id: 'duplicate-rule',
      severity: 'high' as const,
      confidence: 'high' as const,
      file_globs: ['**/*'],
      pattern: 'unsafe',
      message: 'unsafe',
      fix: 'remove it'
    };
    await fs.writeFile(path.join(tmpDir, 'one.json'), JSON.stringify({ rules: { custom: [duplicate] } }), 'utf8');
    await fs.writeFile(path.join(tmpDir, 'two.json'), JSON.stringify({ rules: { custom: [duplicate] } }), 'utf8');
    await fs.writeFile(path.join(tmpDir, 'envguard.config.yml'), 'extends:\n  - ./one.json\n  - ./two.json\n', 'utf8');
    await expect(loadConfig({ cwd: tmpDir })).rejects.toBeInstanceOf(PresetValidationError);

    await fs.writeFile(
      path.join(tmpDir, 'envguard.config.yml'),
      JSON.stringify({ rules: { custom: [{ ...duplicate, id: 'debug-enabled' }] } }),
      'utf8'
    );
    await expect(loadConfig({ cwd: tmpDir })).rejects.toBeInstanceOf(ConfigError);
  });

  it('returns cloned validated values from public definition helpers', () => {
    const input = { include: ['src/**'] };
    const config = defineConfig(input);
    input.include.push('mutated/**');
    expect(config.include).toEqual(['src/**']);

    const rule = defineRule({
      id: 'example-rule',
      severity: 'medium',
      confidence: 'high',
      file_globs: ['**/*.env'],
      pattern: 'unsafe',
      message: 'Unsafe value.',
      fix: 'Replace it.'
    });
    const preset = definePreset({ rules: { custom: [rule] } });
    rule.file_globs.push('mutated/**');
    expect(preset.rules?.custom?.[0].file_globs).toEqual(['**/*.env']);
  });

  it('uses typed sanitized preset errors', async () => {
    await fs.writeFile(path.join(tmpDir, 'envguard.config.yml'), 'extends:\n  - missing-preset-package\n', 'utf8');
    await expect(loadConfig({ cwd: tmpDir })).rejects.toBeInstanceOf(PresetResolutionError);
  });
});
