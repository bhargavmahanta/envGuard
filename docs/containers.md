# Container Image

Release tags publish `ghcr.io/bhargavmahanta/envguard` for Linux AMD64 and ARM64.

```bash
docker run --rm -v "${PWD}:/work" -w /work ghcr.io/bhargavmahanta/envguard:1 scan . --ci --fail-on high
```

Exact semantic-version image tags are immutable. The release workflow also maintains minor, major,
and `latest` tags, emits provenance and SBOM attestations, and blocks on fixable high or critical
image vulnerabilities.

The runtime image uses Node 24 Alpine and runs as the unprivileged `node` user.
