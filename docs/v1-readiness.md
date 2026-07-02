# V1.0 Readiness Checklist

Use this checklist before publishing `1.0.0` or `1.0.0-rc.1`.

## Required Checks

- `npm run release:dry`
- `npm view @bhargavmahanta/envguard version`
- `npm pack --dry-run`
- `npx @bhargavmahanta/envguard scan .`
- `npx --package @bhargavmahanta/envguard envguard.cmd scan .` on Windows PowerShell

## Manual Validation

- GitHub repository is public when the project is ready for public launch.
- README badges render.
- npm package page renders README and metadata.
- GitHub Actions CI passes on Ubuntu, Windows, and macOS.
- SARIF upload works in a GitHub Actions test project.
- False-positive tuning has been run across at least 10 representative repositories.

## Limitations To Keep Public

- EnvGuard uses pattern-based and heuristic detection.
- EnvGuard may produce false positives.
- EnvGuard may miss some secrets.
- EnvGuard does not validate, transmit, or use detected credentials.
- EnvGuard does not scan git history in V1.0.
- EnvGuard does not revoke or rotate secrets.
