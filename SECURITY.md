# Security Policy

## Supported Versions

Security fixes are provided for the latest stable EnvGuard V2 release. Upgrade to the newest stable version before reporting a problem that may already be fixed.

## Reporting a Vulnerability

Use GitHub's private vulnerability reporting for this repository: open the **Security** tab, choose **Advisories**, and select **Report a vulnerability**.

Do not open a public issue for an unpatched vulnerability. Never include live credentials, tokens, private keys, or other real secrets in a report. Use synthetic, masked examples that reproduce the behavior without validating or exposing a credential.

Include the affected EnvGuard version, operating system, Node.js version, minimal reproduction steps, expected impact, and any proposed remediation. Maintainers will coordinate disclosure and a release through the private advisory.

For ordinary false positives, rule requests, and non-sensitive bugs, use the repository's public issue templates.

## Handling a Suspected Exposure

EnvGuard does not validate credentials. If your own incident-response process confirms that a real credential was exposed, revoke or rotate it through the issuing provider, remove it from tracked files and history as appropriate, move future values into a protected secret store, and audit for suspicious use.
