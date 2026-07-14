# Health Checklist Errors Plan

## Objective

Extend `/api/health` from a minimal status response into a checklist-style health report that separates API and database checks and includes sanitized database connection error details.

## Context Read

- `AGENTS.md`
- `src/AGENTS.md`
- `packages/kamra-api-server/AGENTS.md`
- `.agents/coding-guidelines.md`
- `packages/kamra-api-server/src/health/get-health-report.ts`
- `packages/kamra-api-server/src/health/get-health-report.test.ts`
- `packages/kamra-api-server/src/http/app-handler.ts`
- `src/app/health-check.component.ts`

## Research Gate

Not needed. This is a local API contract/UI refinement using the existing health endpoint and Angular health component.

## User Requests

- Include connection errors in the health check response.
- Make health check a robust multi-checklist thing.
- Keep the current design direction, but separate the various tests.
- Treat the current MongoDB ping as the database check.
- Add a separate API check.

## Current Reality

- `getHealthResult()` returns `checks.api` and `checks.mongodb`, but the UI displays them as a small flat grid rather than a checklist.
- The API check is implicit and always `ok`.
- The MongoDB check catches connection failures but drops the error details from the response.
- `app-handler.ts` logs MongoDB status from `checks.mongodb`.

## Intended Direction

- Keep `/api/health` as one endpoint.
- Return a checklist array that the UI can render consistently as more checks are added.
- Rename the primary MongoDB check concept to database while preserving a `checks.mongodb` compatibility alias for existing callers in this early stage.
- Include sanitized error details for expected connection failures without exposing stack traces, raw connection strings, or credentials.

## Scope

- Extend the shared health report contract.
- Add backend tests for checklist shape and sanitized connection errors.
- Update the Angular health component to render separate checklist cards.
- Update app-handler logging to use the database check.

## Non-Goals

- Add new external service checks beyond API and database.
- Add automatic remediation.
- Change MongoDB connection configuration or Vercel env handling.
- Redesign the health page beyond separating checklist items.

## Validation Plan

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Approval Checkpoint

The user's explicit request approves this narrow health-check refinement for immediate implementation.
