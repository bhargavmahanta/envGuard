# Security Policy

EnvGuard is a defensive security tool. Please do not submit real credentials in issues, pull requests, fixtures, or screenshots.

## Reporting a Vulnerability

If you find a security issue in EnvGuard, please report it privately to the maintainers. Include:

- A concise description
- Reproduction steps
- Impact
- Suggested remediation if known

## Handling Detected Secrets

If EnvGuard reports a real credential:

1. Rotate or revoke the credential.
2. Remove it from tracked files.
3. Move future values into a protected secret store.
4. Audit for suspicious use.
