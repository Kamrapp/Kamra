## Session

- Date: 2026-07-13
- Plan: `.agents/plans/2026-07-13-stage-11-vertical-slice-locality-plan.md`
- Branch: `dev/bg/stage-9-10`
- Current objective: Finish the bounded vertical-slice reorganization and hand the complete Stage 8–11 MVP verification to one operator runbook.

## Completed

- Inventory confirmed that backend domain directories already provide a useful base; the most obvious locality gaps are the mixed HTTP route directory, cross-domain Stage 9 ownership under household/v2, and key-specific developer-admin feature-flag bindings.
- Completed the reusable Step 11.2 integration harness: named fake databases, explicit authenticated user/household fixtures, a focused `test:integration` command, and representative admin/household/membership-boundary tests through the shared app handler.
- Added the first Step 11.3 seam test: an admin feature-flag PATCH is observed by the household workspace response through the same persisted fake database.
- Added the Product Group → Product → Batch seam test through the transaction-backed composer and grouped workspace read model; the harness now supplies only a no-op transaction lifecycle and documents that real transaction behavior remains a configured-smoke concern.
- Added the shopping-trip completion seam: a partial trip creates one Product-owned Batch and one pending Ingestion Submission, and repeating the same completion operation remains idempotent.
- Added the raw-ingestion → review-candidate seam using a sanitized snapshot fixture; the admin prepare/list routes now have a deterministic cross-layer contract check.
- Centralized feature-flag keys, schema enum values, and safe admin display metadata in the checked-in server registry; GET/PATCH admin responses now expose the registry-derived control/group/translation metadata.
- Reworked the developer-admin feature-flag controls to iterate ordinary boolean flags from API metadata, while keeping the alpha-user workflow specialized and loading its flag row from the same registry metadata.
- Added capability-local HTTP route bundle indexes for access, admin, catalogue, household, ingestion, and observability; the dispatcher now consumes those bundles while preserving the existing first-match route order and public URLs.
- Added explicit frontend capability barrels and owner notes for developer-admin feature flags and the Stage 9 pricing/review surface; the app routes and dashboard now import through those boundaries without physically moving already-coherent components.
- Captured the first capability ownership map in `docs/vertical-slice-map.md`.
- Defined the registry-driven feature-flag decision: code owns definitions/defaults/metadata; MongoDB stores overrides and audit history.
- Defined deterministic local integration tests plus narrowly triggered configured MongoDB integration smoke; neither replaces browser/manual evidence.
- Folded remaining Stage 8–10 manual evidence and likely UI/data-integrity probes into Stage 11 ownership.
- Added the live replacement runbook `scripts/stage11-mvp-manual-test.md`; the older Stage 8 script and Stage 8–10 checklist now point to it as historical input.
- Completed Step 11.8 documentation and CI closeout: normal app checks identify the combined unit/deterministic-integration run, focused integration reruns are documented, and the existing catalog/transaction Smoke workflows now cover the relevant catalog/schema and household transaction/persistence/maintenance paths without adding a duplicate configured workflow.

## Changed Files

- `.agents/plans/2026-07-13-stage-11-vertical-slice-locality-plan.md`
- `.agents/plans/README.md`
- `.agents/plans/initial-mvp-roadmap.md`
- `docs/architecture.md`
- `docs/vertical-slice-map.md`
- `.agents/sessions/2026-07-13-stage-11-architecture-reorganization.md`
- `vitest.integration.config.ts`
- `packages/kamra-api-server/src/test-support/integration/`
- `packages/kamra-api-server/src/test-support/fake-mongo.ts`
- `package.json`
- `packages/kamra-api-server/src/feature-toggles/`
- `packages/kamra-api-server/src/household/v1/contracts.ts`
- `packages/kamra-api-server/src/household/v1/schemas.ts`
- `packages/kamra-api-server/src/http/routes/admin-dashboard-route.ts`
- `packages/kamra-api-server/src/http/app-handler.test.ts`
- `src/app/i18n/en.json`
- `src/app/i18n/hu.json`
- `src/app/dev-admin/admin-feature-flags-card.component.ts`
- `src/app/dev-admin/admin-alpha-access-card.component.ts`
- `src/app/dev-admin/admin-dashboard.component.ts`
- `src/app/dev-admin/admin-dashboard.component.html`
- `packages/kamra-api-server/src/http/routes/`
- `packages/kamra-api-server/src/http/app-handler.ts`
- `src/app/dev-admin/feature-flags/`
- `src/app/site-admin/stage9-pricing/`
- `src/app/app.routes.ts`
- `src/app/dev-admin/admin-dashboard.component.ts`
- `scripts/stage11-mvp-manual-test.md`
- `.github/workflows/app-checks.yml`
- `.github/workflows/transaction-smoke.yml`
- `scripts/README.md`

## Validation

- Ran before this closeout: `npm run test:integration`, `npm test`, `npm run lint -- --no-warn-ignored`, `npm run typecheck`, `npm run format:check`, `npm run build:api`, and `git diff --check`.
- Result: 7 focused integration tests, 65 test files/239 tests, lint, typecheck, formatting, API build, and diff checks passed.
- Note: an initial full-test attempt included the unsupported Vitest flag `--runInBand`; the corrected `npm test` run passed.
- Closeout validation is pending after the documentation/workflow edits; it must include the focused integration suite, full tests, formatting, lint, typecheck, API build, and diff checks.

## Decisions

- Decision: use an explicit checked-in feature-flag registry with metadata rather than loading executable flag definitions from MongoDB.
- Reason: database overrides need safe defaults, ownership, authorization, and lifecycle behavior that data alone must not invent.
- Decision: reorganize incrementally by route/UI clusters and keep already-coherent domain directories intact.
- Reason: the goal is locality and integration signal, not broad file churn or a framework rewrite.
- Decision: reuse the existing configured catalog and transaction Smoke workflows instead of adding a third configured integration workflow.
- Reason: those workflows already exercise real MongoDB validator/index and transaction behavior; a duplicate fake-backed CI job would add cost without a new signal.

## Open Issues

- Steps 11.1–11.9 are implementation-complete. The integrated manual pass and any narrow findings remain.
- Stage 10 configured/browser release evidence remains open and is not waived by this plan.
- The operator must edit the live runbook with actual findings during the final pass; those edits become input to the final fixer session.

## Next Step

Run the closeout validation for Step 11.8, commit it separately, then pause for the operator to execute `scripts/stage11-mvp-manual-test.md`. Treat the operator-edited runbook as the only source for Step 11.10 fixes; do not restart separate Stage 8–10 acceptance sessions.
