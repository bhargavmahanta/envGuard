# Rule Catalog

EnvGuard rules are grouped by practical configuration risk.

| Category | Rules |
| --- | --- |
| Secrets | `aws-access-key`, `aws-secret-key`, `github-token`, `stripe-secret-key`, `slack-token`, `google-api-key`, `private-key`, `jwt-token`, `database-url-password`, `bearer-token`, `webhook-url`, `generic-api-key` |
| Weak secrets | `weak-jwt-secret`, `weak-session-secret`, `placeholder-secret`, `dummy-api-key`, `weak-password` |
| Runtime | `debug-enabled`, `node-dev-production`, `flask-dev-env`, `django-debug`, `ssl-disabled`, `tls-disabled`, `debug-logging` |
| CORS | `cors-wildcard`, `cors-credentials-wildcard`, `allowed-origins-wildcard` |
| Docker and Compose | `docker-copy-dotenv`, `docker-copy-all`, `docker-latest-tag`, `docker-root-user`, `compose-privileged`, `compose-db-public-port`, `compose-inline-secret` |
| GitHub Actions | `actions-echo-secret`, `actions-pull-request-target`, `actions-unpinned`, `actions-hardcoded-token`, `actions-broad-permissions`, `actions-missing-permissions` |

## Severity

| Severity | Meaning |
| --- | --- |
| Critical | Likely real secret or severe exposure |
| High | Dangerous credential or configuration issue |
| Medium | Unsafe setting that could become exploitable |
| Low | Hygiene issue or weak practice |
| Info | Recommendation or best-practice note |

## Confidence

| Confidence | Meaning |
| --- | --- |
| High | Specific pattern or strong context |
| Medium | Suspicious context plus secret-like value |
| Low | Weak signal or likely placeholder |
