# EnvGuard V2.0

EnvGuard V2 expands the project from a single package into a security-tooling family while keeping
the existing CLI and SDK entry point backward compatible.

## Highlights

- Split the scanner into a presentation-free core, pure reporters, and a compatibility facade.
- Added official presets for Node.js, Next.js, Python, and Docker projects.
- Added conservative Kubernetes and Helm security checks.
- Added a root-restricted, always-masked stdio MCP server for agent integrations.
- Added a bundled GitHub Action validated on Node.js 24.
- Added deterministic agent output, stable report schemas, packed-package consumer tests, and
  fixture plus pinned-public-repository benchmarks.
- Raised the minimum supported Node.js version to 22.

## Packages

| Package | Stable version | Purpose |
| --- | ---: | --- |
| `@bhargavmahanta/envguard` | `2.0.0` | Backward-compatible CLI and SDK facade |
| `@bhargavmahanta/envguard-core` | `1.0.0` | Scanner engine, rules, configuration, and result model |
| `@bhargavmahanta/envguard-reporters` | `1.0.0` | Terminal, JSON, Markdown, SARIF, and GitHub reporters |
| `@bhargavmahanta/envguard-mcp` | `1.0.0` | Restricted stdio MCP server |
| `@bhargavmahanta/envguard-config-node` | `1.0.0` | Node.js preset |
| `@bhargavmahanta/envguard-config-next` | `1.0.0` | Next.js preset |
| `@bhargavmahanta/envguard-config-python` | `1.0.0` | Python preset |
| `@bhargavmahanta/envguard-config-docker` | `1.0.0` | Docker preset |

## Upgrade

```bash
npm install --save-dev @bhargavmahanta/envguard@^2.0.0
```

Existing `envguard` CLI commands and the facade SDK remain available. Projects must run Node.js 22
or newer. Consumers that want lower-level composition can import the new core and reporter packages
directly.

Use the stable GitHub Action release:

```yaml
- uses: bhargavmahanta/envGuard@v2
```

## Supply-chain verification

All npm packages are published through GitHub Actions trusted publishing with provenance. Verify an
installed dependency graph with:

```bash
npm audit signatures
```

The immutable Action tag is `v2.0.0`; the supported major tag is `v2`.
