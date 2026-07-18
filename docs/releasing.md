# Releasing

EnvGuard publishes independently versioned scoped packages from the npm workspace.

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

### Prerelease candidates

V2 prereleases used the `adoption-roadmap` branch in Changesets `rc` mode. The protected
`release-candidate.yml` workflow accepts an exact ref, runs the complete release gate, and publishes
only the eight allowlisted public workspaces under the npm `next` tag. Configure its `npm-release`
environment with required reviewers before use. Never advance `latest` during the candidate cycle.

The first candidate versions were `@bhargavmahanta/envguard@2.0.0-rc.0` and `1.0.0-rc.0` for the
new core, reporter, MCP, and preset packages. All eight packages trust `release-candidate.yml` with
the `npm-release` environment and permission to run `npm publish`. Candidate publication uses only
GitHub OIDC; no npm automation token or bootstrap secret is retained.

To promote stable, run `changeset pre exit`, run the version command, review the resulting `2.0.0`
and `1.0.0` versions, and merge the stable release PR. Because npm permits one trusted publisher per
package, change each package from `release-candidate.yml` to `release.yml` before stable publication.

### GitHub Action

The root `action.yml` is the canonical Action metadata. Use the protected `release-action.yml`
workflow to validate the committed bundle and create immutable tags. Candidate releases create only
`v2.0.0-rc.0`; the stable release creates `v2.0.0` and intentionally advances the mutable `v2` tag.
Configure required reviewers on the `action-release` environment.

### Stable npm packages

The GitHub release workflow publishes changed workspaces after the Changesets version pull request is merged. Configure npm trusted publishing for every public workspace with:

- package: `@bhargavmahanta/envguard`
- owner: `bhargavmahanta`
- repository: `envGuard`
- workflow: `release.yml`
- permission: allow npm publish

Repeat the trusted-publisher setup for `envguard-core`, `envguard-reporters`, `envguard-mcp`, and
each preset package.

The public repository release workflow publishes with npm provenance using GitHub Actions trusted publishing.

Do not retain a long-lived npm automation token. If trusted publishing is unavailable, stop the
release and repair the package's trusted-publisher configuration.

Emergency manual fallback for a single already-versioned workspace:

```bash
npm publish --workspace @bhargavmahanta/envguard --access public --provenance
```

If npm requires two-factor authentication, provide the current OTP when prompted.
