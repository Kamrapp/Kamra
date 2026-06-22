# Home Health Navigation Fix Plan

## Objective

Make the first Kamra screen feel like a real home page, move health diagnostics into a routed component behind a collapsible right-side menu, and ensure hosted Vercel functions do not attempt file logging.

## Context Read

- `AGENTS.md`
- `src/AGENTS.md`
- `packages/kamra-api-server/AGENTS.md`
- `.agents/coding-guidelines.md`
- `.agents/plans/2026-06-22-stage-2-serverless-foundation-plan.md`
- `src/app/app.component.ts`
- `src/app/app.config.ts`
- `src/styles.css`
- `packages/kamra-api-server/src/config/app-config.ts`
- `packages/kamra-api-server/src/http/app-handler.ts`
- `packages/kamra-api-server/src/logging/kamra-logger.ts`
- `packages/kamra-api-server/src/logging/kamra-logger.test.ts`
- `docs/tech-ops.md`
- `docs/logging.md`

## Research Gate

Not needed. This is a focused app-structure, UI, and serverless logging correction using existing Angular and package patterns.

## User Requests

- Fix the home page presentation.
- Move the health check out of the main app component into a separate component.
- Navigate to health check instead of showing it on the home page.
- Keep the current icon/text feel but make it a home header instead of a giant block.
- Add placeholder home content with some animated/shadowed loading-splash feel.
- Add a simple future-proof collapsible side menu opened from the header, with the side menu on the right.
- Investigate why hosted MongoDB still fails from Vercel when local works.
- Stop trying to write files in hosted/serverless runtime.

## Current Reality

- `AppComponent` owns the full home UI and health-check fetch logic.
- Angular routing is not configured yet.
- Health check appears in the home page layout, and the menu button directly runs the check.
- File logging is skipped on Vercel only when `VERCEL` is set and `LOG_FILE_DIR` is not set.
- Docs say `LOG_FILE_DIR` can enable file logging on Vercel, which conflicts with the serverless-first posture.
- MongoDB configuration reads `MONGODB_URI` and `MONGODB_DB_NAME` from `process.env`; deployed failure is most likely platform env/network configuration, not missing code support, but the health page should make configured/degraded state easier to inspect.

## Intended Direction

- Keep `AppComponent` as application shell, routing, and navigation state only.
- Keep health-check behavior in its own routed component under `src/app/health-check.component.ts`.
- Keep home content in its own component under `src/app/home.component.ts`.
- Use Angular router for future navigation expansion.
- Keep hosted serverless logs console-only; file logs remain local developer convenience.

## Scope

- Add Angular routes for `/` and `/health`.
- Add home and health-check components.
- Restyle the app shell with a right-side collapsible menu.
- Tighten file logging to never write files on Vercel.
- Update logging docs/tests for hosted console-only behavior.
- Run lint/typecheck/test/build.

## Non-Goals

- Admin login UI changes.
- New MongoDB credentials, Atlas network changes, or Vercel dashboard edits.
- New persistent navigation sections beyond placeholders for future routes.
- Replacing Angular or introducing a design system dependency.

## Assumptions

- The user's request is approval for this narrow follow-up plan.
- Vercel provides `process.env` to Node function code when environment variables are configured in the Vercel project and deployment environment.
- If local MongoDB works but Vercel does not, the remaining issue is likely one of: missing production/preview env vars, Atlas network access, wrong database name for that Vercel environment, or DNS/SRV resolution.

## Implementation Steps

### Step 1

- Goal: split Angular shell/home/health routing and improve the visible layout.
- Files likely affected:
  - `src/app/app.component.ts`
  - `src/app/app.config.ts`
  - `src/app/home.component.ts`
  - `src/app/health-check.component.ts`
- Validation:
  - home no longer renders health diagnostics
  - `/health` renders and can call `/api/health`
  - menu opens from the header and collapses on navigation

### Step 2

- Goal: make hosted logging serverless-safe and align tests/docs.
- Files likely affected:
  - `packages/kamra-api-server/src/logging/kamra-logger.ts`
  - `packages/kamra-api-server/src/logging/kamra-logger.test.ts`
  - `docs/logging.md`
  - `docs/tech-ops.md`
- Validation:
  - tests prove Vercel never attempts file writes, even with `LOG_FILE_DIR`
  - docs describe Vercel runtime logs as hosted source of truth

## Validation Plan

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- Local browser sanity check if dev server starts cleanly.

## Risks

- The CSS could still look awkward at some viewport widths.
  - Mitigation: use stable responsive dimensions and inspect generated build or browser screenshot.
- MongoDB failure may persist after code changes if Vercel or Atlas settings are wrong.
  - Mitigation: report exact env/network checks without exposing secret values.

## Approval Checkpoint

The user's explicit request approves this narrow corrective plan for immediate implementation.
