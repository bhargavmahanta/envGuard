# Agent Guidance

- Run `envguard scan . --agent` for deterministic output.
- Never request or print full secrets.
- Never validate detected credentials.
- Do not scan outside the repository root.
- Prefer scanning only files modified by the agent.
- Propose remediation before modifying security-sensitive configuration.
- Treat stdout as the JSON protocol and stderr as diagnostics.
- Preserve rule IDs, masking, baselines, and configuration compatibility when changing EnvGuard.
