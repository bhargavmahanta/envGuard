import { describe, expect, it } from 'vitest';
import { detectFileKind, parseEnvContent } from '../src/parser.js';

describe('parser', () => {
  it('parses env files with comments, quotes, and exports', () => {
    const entries = parseEnvContent(`
# comment
export API_KEY="abc123"
EMPTY=
PLAIN=value
`);

    expect(entries).toEqual([
      { key: 'API_KEY', value: 'abc123', line: 3, raw: 'export API_KEY="abc123"' },
      { key: 'EMPTY', value: '', line: 4, raw: 'EMPTY=' },
      { key: 'PLAIN', value: 'value', line: 5, raw: 'PLAIN=value' }
    ]);
  });

  it('detects specialized file kinds', () => {
    expect(detectFileKind('.env.production')).toBe('env');
    expect(detectFileKind('Dockerfile')).toBe('dockerfile');
    expect(detectFileKind('.github/workflows/test.yml')).toBe('github-actions');
    expect(detectFileKind('docker-compose.yml')).toBe('yaml');
  });
});
