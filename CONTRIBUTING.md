# Contributing

Thanks for helping improve EnvGuard.

## Local Setup

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Development

- Keep secret examples fake and clearly non-production.
- Add tests for new rules.
- Ensure reports do not expose full secret values.
- Prefer small, focused rule changes over broad rewrites.

## Useful Commands

```bash
npm run dev -- scan examples/vulnerable-project
npm test
npm run lint
npm run typecheck
npm run build
```
