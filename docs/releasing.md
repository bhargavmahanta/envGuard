# Releasing

EnvGuard publishes the scoped npm package `@bhargavmahanta/envguard`.

## Before Release

Run:

```bash
npm run release:dry
```

This verifies typecheck, lint, tests, audit, build, package contents, and npm publish dry-run.

After installing a published release, verify registry signatures and provenance metadata:

```bash
npm audit signatures
```

## Versioning

Use semantic versioning:

```bash
npm version patch
npm version minor
npm version major
```

For release candidates:

```bash
npm version prerelease --preid rc
```

## Publishing

The GitHub release workflow publishes to npm when a GitHub release is published. Prefer npm trusted publishing with:

- package: `@bhargavmahanta/envguard`
- owner: `bhargavmahanta`
- repository: `envGuard`
- workflow: `release.yml`
- permission: allow npm publish

The public repository release workflow publishes with npm provenance using GitHub Actions trusted publishing.

Do not configure a long-lived npm automation token. If trusted publishing is unavailable, stop the
release and repair the package's trusted-publisher configuration.

Manual fallback:

```bash
npm publish --access public
```

If npm requires two-factor authentication, provide the current OTP when prompted.
