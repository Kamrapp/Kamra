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
- Added the live runbook `scripts/stage11-mvp-manual-test.md`; the former Stage 8 script and Stage 8–10 checklist were reviewed, consolidated, and removed as duplicate acceptance sources.
- Completed Step 11.8 documentation and CI closeout: normal app checks identify the combined unit/deterministic-integration run, focused integration reruns are documented, and the existing catalog/transaction Smoke workflows now cover the relevant catalog/schema and household transaction/persistence/maintenance paths without adding a duplicate configured workflow.
- Added a read-only `smoke:demo-household` validator for the seeded V2 fixture. It checks household defaults, required groups/products, target/no-target coverage, expiry permutations, multiple batches, unassigned products, and the no-productless-Batch invariant.
- Added `mvp:preflight`, a Windows-safe local command that runs deterministic integration tests, the full suite, formatting, lint, typecheck, web build, and API build in one pass. The live runbook now treats those as one automated item and leaves only browser/configured evidence manual.
- Added guarded `seed:demo-household` and `teardown:demo-household -- --confirm=demo-household` commands for quick household-only retest cycles without reseeding or deleting shared catalogue/admin data.
- Implemented the remaining Section 1/2 follow-ups in `8d4419e` and `f857b7c`: compact Manual
  terminology, a slightly taller output-only Activity console, Product Batch counts, compact
  household settings/button styling, left-rail back/forward history, and a minimal no-email
  household invitation lifecycle.
- Invitation support includes owner-only pending creation, duplicate/member guards, existing-user
  acceptance, invited-email registration with automatic claiming, a new `household_invitations`
  validator/index maintenance entry, and deterministic repository/route tests.
- Implemented the remaining Section 3 workspace refinement in 6d29a56: Batch action alignment,
  a softened Unassigned Products separator, built-in/custom Group unit editing and normalized
  custom-unit display, source-plus-stocked-at Batch titles, in-place stocked-at editing, and
  compact aligned quantity columns. Added focused pure unit tests for the custom-unit contract.
- Corrected the fixed-clock integration harness token lifetime in c8c7bc4; the five-minute test
  token had expired during later-day runs and caused misleading 401 failures.
- Updated the live runbook in e5a2c52 to retain only the resulting browser retests.
- Fixed the Angular template-reference scope exposed by the production build in ba7155e by
  keeping the edited Batch Stocked at date in component state.
- Improved stale-revision feedback in the shared Household V2 write service: localized UI and
  Activity messages now tell the operator that the item changed elsewhere and that the workspace
  must be refreshed before retrying.
- Applied the next Section 3 refinement: Manual Batch titles are marked as manual, amount columns
  use tighter grid tracks, Group editing opens details automatically, and Product Group assignment
  now lives in Product details so inline Product rows remain single-line. Product identity details
  also give the id less visual weight and the Note field more room.
- Implemented the household-management reset workflow: owner-only, transactional content scopes for
  shopping lists/trips, batches, products plus batches, groups plus products plus batches, and all
  household content. Household identity, memberships, and settings remain intact. Added route,
  service, management UI, confirmation/scope descriptions, and focused repository/route tests.
- Refined light-theme Product Group workspace surfaces through shared theme tokens so row contrast
  is stronger in light mode without changing the accepted dark theme. Increased Manual terminology
  row typography and vertical centering, localized the Admin health empty-state wording, and
  refreshed the most recent Hungarian household labels and stale invitation copy.

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
- `scripts/demo-household-smoke.ts`
- `scripts/mvp-preflight.ts`
- `scripts/seed-demo-household.ts`
- `scripts/teardown-demo-household.ts`
- `packages/kamra-api-server/src/household/current/demo-household-seed.ts`
- `packages/kamra-api-server/src/household/current/demo-household-seed.test.ts`
- `packages/kamra-api-server/src/household/current/mongo-household-invitation-repository.ts`
- `packages/kamra-api-server/src/http/routes/household-invitation-routes.ts`
- `src/app/household/household-invitation.service.ts`
- `src/app/shared/navigation-history.service.ts`
- `packages/kamra-api-server/src/db/mongo-like.ts`
- `packages/kamra-api-server/src/household/current/mongo-household-repository.ts`
- `packages/kamra-api-server/src/household/current/mongo-household-repository.test.ts`
- `packages/kamra-api-server/src/http/routes/household-routes.ts`
- `packages/kamra-api-server/src/http/routes/household/index.ts`
- `packages/kamra-api-server/src/http/routes/household-reset-route.test.ts`
- `src/app/household/household-v2.service.ts`
- `src/app/household/household-management.component.ts`
- `src/app/household/household-v2-workspace.component.css`
- `src/app/manual/manual-page.component.ts`
- `src/styles.css`
- `src/app/i18n/en.json`
- `src/app/i18n/hu.json`

## Validation

- Ran before this closeout: `npm run test:integration`, `npm test`, `npm run lint -- --no-warn-ignored`, `npm run typecheck`, `npm run format:check`, `npm run build:api`, and `git diff --check`.
- Result: 7 focused integration tests, 65 test files/240 tests, lint, typecheck, formatting, API build, and diff checks passed.
- After the focused follow-ups, `npm test` passed with 243 tests across 67 files; the invitation
  repository and route suites pass independently, and the app typecheck/lint pass.
- `npm run mvp:preflight` passed after the follow-ups: 7 integration tests, 243 tests across 67
  files, formatting, lint, typecheck, web build, and API build.
- Note: an initial full-test attempt included the unsupported Vitest flag `--runInBand`; the corrected `npm test` run passed.
- Final validation after the workspace refinement: 7 focused integration tests, 245 tests across 68
  files, formatting, lint, typecheck, web build, and diff checks passed. The fixed-clock
  integration harness now also passes independently.
- After the stale-revision feedback fix, the full test suite, typecheck, lint, web build, and diff
  checks passed again.
- After the latest Section 3 refinement, 245 tests, typecheck, lint, formatting, web build, and diff
  checks passed again.
- The reset implementation's focused repository and route tests pass (7 tests across 2 files),
  and the API/frontend typecheck passes. Full validation after the documentation and visual
  follow-up is still required before commit.
- `npm run mvp:preflight` passed locally with 240 tests/65 files, 7 integration tests, formatting, lint, typecheck, web build, and API build.
- `npm run smoke:demo-household` reached the configured MongoDB database but failed because the current disposable household document lacks `groupTargetShoppingMode`; this is a useful stale-seed/schema signal and was not masked. Reseed/migrate that environment before operator testing.
- A later smoke run found no `household1` in the selected database at all. The validator now reports the selected database and instructs the operator to run `npm run seed:demo-household` before retrying; no automatic database write was performed.
- The focused seed then exposed the underlying schema drift before fixture deletion: `kamra_dev.households` is missing `groupTargetShoppingMode` in its MongoDB validator. The seed now fails early with the exact maintenance entry and distinguishes running the validator action from merely marking it complete.
- The teardown guard was verified without the confirmation argument; it failed closed before any database write.

## Decisions

- Decision: use an explicit checked-in feature-flag registry with metadata rather than loading executable flag definitions from MongoDB.
- Reason: database overrides need safe defaults, ownership, authorization, and lifecycle behavior that data alone must not invent.
- Decision: reorganize incrementally by route/UI clusters and keep already-coherent domain directories intact.
- Reason: the goal is locality and integration signal, not broad file churn or a framework rewrite.
- Decision: reuse the existing configured catalog and transaction Smoke workflows instead of adding a third configured integration workflow.
- Reason: those workflows already exercise real MongoDB validator/index and transaction behavior; a duplicate fake-backed CI job would add cost without a new signal.

## Open Issues

- Steps 11.1–11.9 are implementation-complete in separate commits, with focused follow-ups in
  `8d4419e` and `f857b7c`. The integrated manual pass and any narrow findings remain.
- The new household invitation validator entry must be run against the configured disposable
  database before using the browser invitation flow; the deterministic tests do not update MongoDB.
- The operator accepted the Section 3 workspace structure and first CRUD/derived-data pass. The
  latest workspace refinement is implemented; the live runbook retains only its visual/behavioral
  retests for the Manual title style, compact amount columns, and details-editor layout, plus the
  previously open consistency/accessibility checks. The new light-theme contrast and reset-flow
  checks are also pending.
- Stage 10 configured/browser release evidence remains open and is not waived by this plan.
- The operator must edit the live runbook with actual findings during the final pass; those edits become input to the final fixer session. The shortened manual pass should start with `npm run mvp:preflight`, then the fixture/configured smokes, then browser-only checks.

## Next Step

Run the focused demo seed against the approved disposable database, then rerun `npm run smoke:demo-household` before browser verification. Do not use the full seed unless catalogue/admin data is also required.

Execute `scripts/stage11-mvp-manual-test.md` as one continuous Stage 8–11 pass. Add observed
behavior and environment details to the runbook without credentials or private exports. Treat the
operator-edited runbook as the only source for Step 11.10 fixes; do not restart separate Stage 8–10
acceptance sessions.
