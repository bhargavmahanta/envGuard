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

Add a reviewed changeset for every user-visible package change:

```bash
npm run changeset
```

The release workflow creates a version pull request and independently updates changed package
versions, internal dependency ranges, and changelogs. Merging that pull request publishes all new
workspace versions through npm trusted publishing.

For a local release preview:

```bash
npm run release:version
npm run release:dry
```

## Publishing

The GitHub release workflow publishes changed workspaces after the Changesets version pull request is merged. Configure npm trusted publishing for every public workspace with:

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
