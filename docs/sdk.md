# EnvGuard SDK

Install EnvGuard as a development dependency:

```bash
npm install --save-dev @bhargavmahanta/envguard
```

## Scan

```ts
import { scan } from '@bhargavmahanta/envguard';

const result = await scan({
  target: '.',
  cwd: process.cwd(),
  failOn: 'high',
  maskSecrets: true
});
```

The positional form remains supported:

```ts
await scan('.', { cwd: process.cwd() });
```

`scan()` defaults to the current directory. When `cwd` is supplied, target, config, ignore, and baseline paths resolve from it.

Configuration precedence is built-in defaults, discovered or explicit config file, `config` overrides, then top-level scan options. Arrays supplied programmatically replace configured arrays.

Important options include `configPath`, `ignorePath`, `baselinePath`, `targetFiles`, `include`, `exclude`, `minimumSeverity`, `failOn`, `maskSecrets`, `entropy`, `maximumFileSizeBytes`, `timeoutMs`, and `signal`. Symbolic-link traversal is disabled; `followSymbolicLinks: true` is rejected.

## Reusable Scanner

```ts
import { createScanner } from '@bhargavmahanta/envguard';

const scanner = createScanner({ cwd: process.cwd(), failOn: 'high' });
const [app, worker] = await Promise.all([
  scanner.scan('packages/app'),
  scanner.scan('packages/worker')
]);
```

Defaults and per-scan overrides are cloned. A scanner can be reused concurrently without shared mutable state.

## Results and Errors

`ScanResult` retains the V1 report fields and adds optional scan metadata, `passed`, `recommendedExitCode`, and recoverable `errors`. Report schema version `1.0.0` is independent from the npm package version.

Fatal failures throw typed errors:

```ts
import { ConfigError, TargetNotFoundError, scan } from '@bhargavmahanta/envguard';

try {
  await scan({ target: '.', configPath: 'envguard.config.yml' });
} catch (error) {
  if (error instanceof ConfigError || error instanceof TargetNotFoundError) {
    console.error(error.code, error.message);
  }
}
```

Unreadable, malformed, missing, oversized, or unsupported individual files appear in `result.errors` when the rest of the scan can continue. Error messages never include file contents or detected values.

## Reporters

```ts
import { formatJsonReport, formatSarifReport } from '@bhargavmahanta/envguard/reporters';

const json = formatJsonReport(result);
const sarif = formatSarifReport(result);
```

Reporter functions are pure, return strings, clone their input, and mask by default. `{ maskSecrets: false }` is an explicit unsafe opt-out and must not be used with untrusted logs or CI artifacts.

## CommonJS

```js
const { scan } = require('@bhargavmahanta/envguard');
const { formatMarkdownReport } = require('@bhargavmahanta/envguard/reporters');
```

## Build Scripts and Monorepos

Use one scanner per shared policy and scan package roots independently. Pass an explicit repository `cwd` and package-relative targets so config, ignore, baseline, and containment behavior remain deterministic.

The root package and `/reporters` subpath are the supported import paths. Internal scanner, parser, walker, detector, and masking modules are not public API. Stable APIs follow semantic versioning; optional report fields may be added within V1, while removals or renames require a major release.
