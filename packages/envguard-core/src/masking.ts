function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function maskSecret(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) {
    return '****';
  }

  if (trimmed.length <= 12) {
    return `${trimmed.slice(0, 1)}****${trimmed.slice(-1)}`;
  }

  return `${trimmed.slice(0, 4)}********${trimmed.slice(-4)}`;
}

export function maskDatabaseUrl(value: string): string {
  return value.replace(
    /(\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^:\s/@]+:)([^@\s]+)(@)/gi,
    '$1********$3'
  );
}

export function maskSensitivePreview(preview: string, secret?: string): string {
  let masked = maskDatabaseUrl(preview);

  masked = masked.replace(
    /(Bearer\s+)([A-Za-z0-9._-]{8,})/gi,
    (_match, prefix: string, token: string) => `${prefix}${maskSecret(token)}`
  );

  masked = masked.replace(
    /(gh[pousr]_[A-Za-z0-9_]{8,})/g,
    (token: string) => maskSecret(token)
  );
  masked = masked.replace(
    /(sk_(?:live|test)_[A-Za-z0-9]{8,})/g,
    (token: string) => maskSecret(token)
  );
  masked = masked.replace(/(AKIA[0-9A-Z]{12,})/g, (token: string) => maskSecret(token));
  masked = masked.replace(/(AIza[0-9A-Za-z_-]{20,})/g, (token: string) => maskSecret(token));
  masked = masked.replace(/(xox[baprs]-[A-Za-z0-9-]{8,})/g, (token: string) =>
    maskSecret(token)
  );

  if (secret && secret.trim().length > 0) {
    masked = masked.replace(new RegExp(escapeRegExp(secret), 'g'), maskSecret(secret));
  }

  return masked;
}
