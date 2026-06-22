# Database Environments

This document is the source of truth for Kamra's MongoDB environment layout during Stage 2.

The cluster is shared, but the databases and credentials are separated by purpose so production, preview, dev, and smoke work stay isolated.

## Current Layout

| Purpose | Database | Primary Users | Typical Platform Binding |
| --- | --- | --- | --- |
| Production app data | `kamra_prod` | `github`, `vercel` | Vercel production, GitHub production workflows |
| Preview / test data | `kamra_test` | `github_test`, `vercel_test` | Vercel preview deployments and preview-oriented checks |
| Dev / release-testing data | `kamra_dev` | `vercel_dev` | Dev testing and `master_dev` style release validation |
| Smoke / proofbuild data | `kamra_smoke` | `github_smoke` | GitHub smoke and proofbuild validation |

## Secret Handling

- Store the full `MONGODB_URI` and `MONGODB_DB_NAME` in platform secrets or local developer secrets.
- Do not commit database passwords or seed credentials to this repository.
- Maintain a separate private secrets inventory repository for generated passwords and recovery notes so credentials do not need to be regenerated every time a secret is re-entered.
- Keep any password inventory private and out of public source exports.

## Operational Notes

- `kamra_prod` is the main Stage 2 production database name.
- `kamra_test` is the preview/test target for lower-risk platform checks.
- `kamra_smoke` is intentionally separate so smoke or proofbuild validation can use a smaller, more disposable data shape.
- `kamra_dev` exists for developer-facing release testing that should stay separate from production.
- If a future branch or platform needs another isolated MongoDB target, add a new row here before wiring the environment.

## Network Access

- Stage 2 currently uses a temporary Atlas IP allowlist compromise to keep Vercel, GitHub, and local development moving.
- That posture must be revisited before the deployment is treated as stable.
- Any future network tightening should be documented here and in `docs/tech-ops.md`.
