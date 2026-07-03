# Rule Catalog

EnvGuard rules are grouped by practical configuration risk.

| Category | Rules |
| --- | --- |
| Secrets | `aws-access-key`, `aws-secret-key`, `github-token`, `stripe-secret-key`, `slack-token`, `google-api-key`, `private-key`, `jwt-token`, `database-url-password`, `bearer-token`, `webhook-url`, `generic-api-key` |
| Weak secrets | `weak-jwt-secret`, `weak-session-secret`, `placeholder-secret`, `dummy-api-key`, `weak-password` |
| Runtime | `debug-enabled`, `node-dev-production`, `flask-dev-env`, `django-debug`, `ssl-disabled`, `tls-disabled`, `debug-logging` |
| CORS | `cors-wildcard`, `cors-credentials-wildcard`, `allowed-origins-wildcard` |
| Env hygiene and schema | `env-duplicate-key`, `env-empty-value`, `env-invalid-key`, `env-malformed-line`, `env-inconsistent-quotes`, `env-schema-missing-key`, `env-schema-extra-key`, `env-schema-unsafe-default` |
| Docker and Compose | `docker-copy-dotenv`, `docker-copy-all`, `docker-latest-tag`, `docker-root-user`, `docker-missing-dockerignore`, `docker-add-remote-url`, `compose-privileged`, `compose-db-public-port`, `compose-inline-secret`, `compose-host-network`, `compose-unsafe-volume`, `compose-latest-tag` |
| GitHub Actions | `actions-echo-secret`, `actions-pull-request-target`, `actions-unpinned`, `actions-hardcoded-token`, `actions-broad-permissions`, `actions-missing-permissions` |
| GitLab CI and CircleCI | `gitlab-echo-secret`, `gitlab-unpinned-image`, `circleci-echo-secret`, `circleci-broad-context` |

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

## Built-In Rules

| Rule ID | Severity | Confidence | Notes |
| --- | --- | --- | --- |
| `aws-access-key` | High | High | AWS access key ID format. Rotate exposed keys. |
| `aws-secret-key` | Critical | High | AWS secret key in strong variable context. Rotate immediately. |
| `github-token` | High | High | GitHub token format. Revoke and use GitHub Secrets. |
| `stripe-secret-key` | High | High | Stripe secret key format. Rotate in Stripe. |
| `slack-token` | High | High | Slack token format. Revoke in Slack. |
| `google-api-key` | High | High | Google API key format. Restrict and rotate. |
| `private-key` | Critical | High | Private key block. Remove and rotate keypair. |
| `jwt-token` | High | Medium | JWT-like token. Revoke affected sessions if real. |
| `database-url-password` | Critical | High | Connection URL with embedded password. Use secret storage. |
| `bearer-token` | High | Medium | Inline bearer token. Move out of tracked files. |
| `webhook-url` | Medium | Medium | Slack or Discord webhook URL. Rotate if exposed. |
| `generic-api-key` | Medium | Medium | Suspicious key name with long/random value. Review for false positives. |
| `high-entropy-value` | Medium | Medium | High-randomness value in secret-like context. Review for false positives. |
| `weak-jwt-secret` | Medium | High | Guessable JWT signing secret. Generate a strong random value. |
| `weak-session-secret` | Medium | High | Guessable session secret. Generate a strong random value. |
| `placeholder-secret` | Low | Medium | Placeholder secret value. Keep examples empty or documented. |
| `dummy-api-key` | Low | Medium | Dummy token/API key. Avoid production-like placeholders. |
| `weak-password` | Medium | High | Trivial password value. Use managed generated credentials. |
| `debug-enabled` | Medium | High | Debug mode enabled. Disable in production. |
| `node-dev-production` | Medium | High | Node environment set to development. Use production runtime mode. |
| `flask-dev-env` | Medium | High | Flask development mode. Use production settings. |
| `django-debug` | Medium | High | Django debug enabled. Disable in production. |
| `ssl-disabled` | High | High | SSL verification disabled. Re-enable verification. |
| `tls-disabled` | High | High | Node TLS verification disabled. Remove the setting. |
| `debug-logging` | Low | Medium | Debug logging can leak sensitive data. Use info or warn. |
| `cors-wildcard` | Medium | High | Wildcard CORS origin. Use trusted origins. |
| `cors-credentials-wildcard` | High | High | Credentials with wildcard CORS. Never combine them. |
| `allowed-origins-wildcard` | Medium | High | Wildcard origin allowlist. Use explicit domains. |
| `docker-copy-dotenv` | High | High | Dockerfile copies `.env`. Add `.env` to `.dockerignore`. |
| `docker-copy-all` | Medium | Medium | Dockerfile uses `COPY . .` without strict ignore. Copy only needed files. |
| `docker-latest-tag` | Low | High | Mutable base image tag. Pin version or digest. |
| `docker-root-user` | Medium | Medium | Container defaults to root. Add a non-root `USER`. |
| `compose-privileged` | High | High | Compose service uses privileged mode. Remove or minimize capabilities. |
| `compose-db-public-port` | Medium | Medium | Database port exposed publicly. Bind localhost or internal network. |
| `compose-inline-secret` | High | Medium | Inline Compose secret. Use Compose/CI secrets or env file. |
| `actions-echo-secret` | High | High | Workflow prints GitHub secrets. Never echo secrets. |
| `actions-pull-request-target` | High | Medium | `pull_request_target` can expose secrets. Avoid for untrusted code. |
| `actions-unpinned` | Medium | High | Floating action reference. Pin version or SHA. |
| `actions-hardcoded-token` | High | Medium | Literal token in workflow. Use GitHub Secrets. |
| `actions-broad-permissions` | High | High | `permissions: write-all`. Use least privilege. |
| `actions-missing-permissions` | Low | Medium | Missing explicit permissions block. Add least-privilege permissions. |
| `env-duplicate-key` | Low | High | Duplicate env key. Keep one source of truth. |
| `env-empty-value` | Low | High | Empty env value. Set or document intentional empties. |
| `env-invalid-key` | Low | High | Non-portable env key. Prefer uppercase keys with underscores. |
| `env-malformed-line` | Low | Medium | Invalid dotenv assignment. Use `KEY=value`. |
| `env-inconsistent-quotes` | Low | Medium | Mismatched quotes. Close quotes consistently. |
| `env-schema-missing-key` | Low | Medium | Runtime key missing from example/schema. Document it safely. |
| `env-schema-extra-key` | Info | Medium | Example/schema key not used by runtime env. Remove stale entries. |
| `env-schema-unsafe-default` | Medium | Medium | Example/schema includes unsafe defaults. Use safe placeholders. |
| `gitlab-echo-secret` | High | Medium | GitLab CI echoes a secret-like variable. Do not print secrets. |
| `gitlab-unpinned-image` | Low | Medium | GitLab CI image floats. Pin image versions. |
| `circleci-echo-secret` | High | Medium | CircleCI echoes a secret-like variable. Do not print secrets. |
| `circleci-broad-context` | Medium | Medium | Broad CircleCI context. Use narrower contexts. |
| `docker-missing-dockerignore` | Medium | High | Missing `.dockerignore`. Exclude secrets and build noise. |
| `docker-add-remote-url` | Medium | High | Remote `ADD`. Download with pinned checksums. |
| `compose-host-network` | High | High | Host networking. Use scoped Docker networks. |
| `compose-unsafe-volume` | High | Medium | Sensitive host mount. Avoid Docker socket/root/SSH mounts. |
| `compose-latest-tag` | Low | High | Mutable Compose image tag. Pin images. |
