# Security Audit Policy

Release readiness uses `npm run audit:release` as the frontend dependency gate.

Policy:

- Critical vulnerabilities anywhere in the installed dependency tree always block release.
- High vulnerabilities anywhere in the installed dependency tree block release unless a separate, explicit accepted-risk record is committed with owner, scope, mitigation, and expiry.
- Moderate and low vulnerabilities do not block this automated gate, but they remain tracked release risk until resolved or explicitly accepted in the release report.
- CI must treat the `Security Audit` job as blocking.

Current implementation:

- `npm audit --audit-level=high` blocks high and critical findings across dependencies.
- The GitHub Actions `Security Audit` job runs `npm run audit:release`.
