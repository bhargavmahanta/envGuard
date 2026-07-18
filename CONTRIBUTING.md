# Contributing to EnvGuard

Thank you for helping improve EnvGuard. Contributions should keep scans deterministic, safe, and compatible for developers and automation.

## Development Setup

EnvGuard requires Node.js 22 or newer and npm.

```bash
npm ci
npm run build
npm test
```

Before opening a pull request, run:

```bash
npm run typecheck
npm run lint
npm test
npm run release:dry
```

## Security and Test Fixtures

- Never commit or request real credentials.
- Use clearly synthetic values in fixtures and keep detected values masked in assertions, reports, and examples.
- Never validate, transmit, revoke, or rotate a detected credential.
- Scan only repositories and files you own or have permission to test.
- Report unpatched security vulnerabilities privately according to [SECURITY.md](SECURITY.md).

## Compatibility Requirements

- Preserve existing rule IDs so baselines, suppressions, and automation continue to work.
- Preserve masking defaults, report schemas, exit codes, configuration keys, and public API behavior unless a documented breaking release explicitly changes them.
- Keep stdout machine-readable when a command defines a JSON protocol; send diagnostics to stderr.
- Add focused tests for every rule or behavior change, including safe synthetic fixtures and false-positive coverage.

## Changesets

Add a Changeset for user-visible package changes:

```bash
npm run changeset
```

Choose only the affected public packages and the smallest appropriate semantic version bump. Documentation-only repository changes that do not alter a published package do not require a Changeset.

## Pull Requests

Keep pull requests focused, explain user impact and compatibility considerations, and update relevant documentation. All required CI, packaging, and security checks must pass before merge.
