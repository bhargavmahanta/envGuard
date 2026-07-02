import { describe, expect, it } from 'vitest';
import { maskDatabaseUrl, maskSecret, maskSensitivePreview } from '../src/masking.js';

describe('masking', () => {
  it('does not expose full secret values', () => {
    const secret = 'ghp_1234567890abcdefghijklmnopqrstuvwxyzAB';
    const masked = maskSensitivePreview(`GITHUB_TOKEN=${secret}`, secret);

    expect(masked).not.toContain(secret);
    expect(masked).toContain('GITHUB_TOKEN=');
  });

  it('masks database URL passwords', () => {
    const raw = 'DATABASE_URL=postgres://admin:supersecret@localhost:5432/app';

    expect(maskDatabaseUrl(raw)).toBe('DATABASE_URL=postgres://admin:********@localhost:5432/app');
  });

  it('keeps a short preview without returning the original', () => {
    expect(maskSecret('supersecretvalue')).toBe('supe********alue');
  });
});
