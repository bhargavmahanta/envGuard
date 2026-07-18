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

### V2 release candidate

V2 prereleases remain on the `adoption-roadmap` branch in Changesets `rc` mode. The protected
`release-candidate.yml` workflow accepts an exact ref, runs the complete release gate, and publishes
only the eight allowlisted public workspaces under the npm `next` tag. Configure its `npm-release`
environment with required reviewers before use. Never advance `latest` during the candidate cycle.

The first candidate versions are `@bhargavmahanta/envguard@2.0.0-rc.0` and `1.0.0-rc.0` for the
new core, reporter, MCP, and preset packages. npm trusted publishing can only be configured after a
package name exists, so the first release has a one-time bootstrap procedure:

1. Configure `@bhargavmahanta/envguard` to trust `release-candidate.yml` with the `npm-release`
   environment and permission to run `npm publish`.
2. Create a short-lived granular npm token for the initial package-name creation and store it only as
   the `NPM_BOOTSTRAP_TOKEN` secret on the protected `npm-release` environment.
3. Dispatch `release-candidate.yml` for an exact commit SHA with `bootstrap-new-packages` enabled.
4. Configure the same trusted publisher for the seven newly created packages.
5. Delete `NPM_BOOTSTRAP_TOKEN` immediately. Leave `bootstrap-new-packages` disabled for every
   subsequent candidate.

The bootstrap token is an explicit one-release exception, not an automation credential. The
workflow passes it only to the publish step and still generates npm provenance through GitHub OIDC.

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
each preset package after the one-time bootstrap creates those package names.

The public repository release workflow publishes with npm provenance using GitHub Actions trusted publishing.

Do not retain a long-lived npm automation token. Outside the documented first-release bootstrap, if
trusted publishing is unavailable, stop the release and repair the package's trusted-publisher
configuration.

Emergency manual fallback for a single already-versioned workspace:

```bash
npm publish --workspace @bhargavmahanta/envguard --access public --provenance
```

If npm requires two-factor authentication, provide the current OTP when prompted.
