# EnvGuard Action

Run EnvGuard directly through its SDK with safe masking, annotations, a job summary, policy failure, and optional SARIF output.

```yaml
- uses: bhargavmahanta/envGuard@v2.0.0-rc.0
  with:
    target: .
    fail-on: high

- uses: github/codeql-action/upload-sarif@v4
  if: always()
  with:
    sarif_file: envguard.sarif
```

Set `sarif-path: envguard.sarif` on the EnvGuard step before using the optional upload step. The committed `dist/index.js` bundle must always match the TypeScript source.
