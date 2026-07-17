# Future MCP Architecture

EnvGuard does not currently ship an MCP server. A future `@envguard/mcp` package should be developed only after the public SDK contract has proven stable.

The MCP package must depend on `@bhargavmahanta/envguard` and its public reporter APIs. It must not import scanner, parser, detector, walker, masking, baseline, or rule-engine internals.

Candidate read-only tools are:

- `envguard_scan_repository`
- `envguard_scan_files`
- `envguard_explain_finding`
- `envguard_list_rules`
- `envguard_get_remediation`
- `envguard_validate_config`

The server should preserve SDK masking and path-containment defaults, make no credential-validation requests, expose no full secrets, and avoid write or autofix tools in its initial release.
