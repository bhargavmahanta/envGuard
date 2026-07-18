import { afterEach, describe, expect, it } from 'vitest';
import { githubIO } from '../src/github.js';

const inputKeys = ['INPUT_FAIL-ON', 'INPUT_FAIL_ON', 'INPUT_CONFIG-PATH'];

afterEach(() => {
  for (const key of inputKeys) delete process.env[key];
});

describe('githubIO input handling', () => {
  it('reads hyphenated input names using the GitHub Actions environment format', () => {
    process.env['INPUT_FAIL-ON'] = 'high';
    process.env['INPUT_CONFIG-PATH'] = 'envguard.config.yml';

    expect(githubIO.getInput('fail-on')).toBe('high');
    expect(githubIO.getInput('config-path')).toBe('envguard.config.yml');
  });

  it('retains the legacy underscore lookup as a compatibility fallback', () => {
    process.env.INPUT_FAIL_ON = 'critical';

    expect(githubIO.getInput('fail-on')).toBe('critical');
  });
});
