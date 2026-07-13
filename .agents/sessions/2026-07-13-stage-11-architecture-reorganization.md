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
- Completed the last reported Section 3 presentation refinement: the stock table header now shares
  constrained child sizing and compact labels with body rows, and the Group unit selector reserves
  a stable adjacent Custom-unit slot so switching between built-in and custom units does not move
  the surrounding details. The operator-confirmed Manual title and Group/Product detail checks are
  now marked complete; only the final amount-column alignment retest remains.
- Implemented the attached Section 4 shopping follow-ups in `757f252` and `3ed9f28`: Build mode is
  now owned by the visible Product Group/Product table, selected owners flow into the V2-compatible
  generator, the header cycles collapsed/default/all expansion states, and inline Product/Group
  target values complete a missing counterpart from the household multiplier.
- Added compact shopping rows with Product, Group-level, and impulse surfaces, additive same-unit
  impulse merging, clear unit-conflict feedback, completion-time V2 refresh, and completed-list
  clearing. The V2 completion path stores completed status before the browser panel clears.
- Fixed the Shopping Trip market-loading race by deferring requests until a household is selected.
  Added Custom shop selection with an optional persisted `shopNameSnapshot`; existing trip documents
  remain valid, and the existing `shopping-trip-foundation-v1` maintenance entry records that no
  backfill is required.
- Replaced the Section 4 implementation reminders in `scripts/stage11-mvp-manual-test.md` with
  browser/configured checks only. The deterministic generator and trip-domain cases are automated
  evidence; remaining checks cover visible selection, mode outcomes, list styling,
  completion refresh/clear, additive impulse behavior, and custom-shop UI behavior.
- Followed up on the scale-selection gap: V2 Build defaults now honor Start fresh, Business as
  usual, Keep it chill (including configured soon-expiry batches), and Stock 'em up semantics while
  leaving no-target rows available for manual selection only.
- Implemented the latest access/presentation follow-ups: pending invitations now appear in the Home
  household panel as well as the account rail, the household panel title is localized as
  Households/Háztartások, the Activity output defaults to 10rem with a 5–20rem range, navigation
  stays directly above it, management back-button sizing matches the shared controls, and Manual
  now includes Shopping trip terminology with more readable term rows.
- Implemented complete household deletion as an additional guarded management reset scope. The
  owner-only transaction removes household content, memberships, pending invitations, and the
  household identity, then the browser returns to Home. Repository and route tests cover the
  destructive scope separately from content-only resets.
- Follow-up validation fixed strict index-signature access in the deletion result map; application
  and API typechecking now pass with the new scope.
- Fixed the shared household feature-flag validator to accept the revision field already written
  by the revision-aware Mongo store. Added the explicit `feature-flag-revision-v1` maintenance
  entry with a no-op data migration, and changed the controlled-alpha checkbox to save immediately
  so its card no longer presents a misleading Save action.
- Refined the Product Group workspace action grid so Group/Product/Batch rows reserve the same four
  action positions. Batch editing now keeps Save, Cancel, an intentional empty child-action slot,
  and Discard aligned; Product state badges use the same rounded token treatment as Group badges.
  Light-theme Product and Batch surfaces now use the requested intermediate contrast.
- Added admin user management: admins can list users without password fields, set a new password,
  and delete a user with confirmation. Sole-owner households are deleted with their content; shared
  households remain and the next active member is promoted. Current-admin self-deletion is blocked,
  and repository/route tests cover password, deletion, cleanup, and promotion behavior.
- Applied the remaining rail and presentation feedback: navigation and Activity now share a bottom
  tools group, household-management buttons use the compact shared sizing, and Manual terminology
  rows have a more readable type scale. The live runbook now retains only the new browser/configured
  retests for invitations, deletion, workspace action positions/theme, feature flags, and users.
- Implemented the latest operator notes: household management is read-only for non-owners, reset
  confirmation clears when its scope changes, and localized Yes/No plus owner-only copy are present.
  The Product Group workspace now gives the expansion control its own shared grid column so header,
  Product, and Batch amount tracks align; Crawl review inputs, JSON, and secondary actions now use
  theme tokens instead of light-only white mixes.
- Consolidated the live runbook again: confirmed management, workspace CRUD/layout, visual,
  navigation, admin, and diagnostics checks moved to the accepted ledger; remaining checks are
  invitation placement/title, manual/activity readability, reset/deletion retest, amount-track and
  state-badge presentation, Crawl review theme, and configured archive/repair/ingestion evidence.

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
- `src/app/household/household-v2-workspace.component.html`
- `src/app/household/household-v2-workspace.component.ts`
- `src/app/household/household-v2-workspace.component.css`
- `src/app/household/household-shopping-list.component.ts`
- `src/app/household/household-shopping-list.component.html`
- `src/app/household/household-shopping-list.component.css`
- `src/app/household/household-shopping-trip-panel.component.ts`
- `src/app/household/shopping-list-line.component.ts`
- `src/app/household/household-v2.service.ts`
- `src/app/dev-admin/admin-feature-flags-card.component.ts`
- `src/app/dev-admin/admin-alpha-access-card.component.ts`
- `src/app/dev-admin/admin-dashboard.component.ts`
- `src/app/dev-admin/admin-dashboard.component.html`
- `packages/kamra-api-server/src/http/routes/`
- `packages/kamra-api-server/src/household/v2/shopping-needs.ts`
- `packages/kamra-api-server/src/household/v2/shopping-needs.test.ts`
- `packages/kamra-api-server/src/household/v2/shopping-trip-domain.ts`
- `packages/kamra-api-server/src/household/v2/shopping-trip-domain.test.ts`
- `packages/kamra-api-server/src/household/v2/stage9-contracts.ts`
- `packages/kamra-api-server/src/household/v2/product-group-read-model.ts`
- `packages/kamra-api-server/src/household/v2/mongo-product-group-read-repository.ts`
- `packages/kamra-api-server/src/database-maintenance/registry.ts`
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
- After the Section 3 table/editor refinement, 247 tests across 69 files, typecheck, lint,
  formatting, web build, and diff checks passed.
- `npm run mvp:preflight` passed locally with 240 tests/65 files, 7 integration tests, formatting, lint, typecheck, web build, and API build.
- `npm run smoke:demo-household` reached the configured MongoDB database but failed because the current disposable household document lacks `groupTargetShoppingMode`; this is a useful stale-seed/schema signal and was not masked. Reseed/migrate that environment before operator testing.
- A later smoke run found no `household1` in the selected database at all. The validator now reports the selected database and instructs the operator to run `npm run seed:demo-household` before retrying; no automatic database write was performed.
- The focused seed then exposed the underlying schema drift before fixture deletion: `kamra_dev.households` is missing `groupTargetShoppingMode` in its MongoDB validator. The seed now fails early with the exact maintenance entry and distinguishes running the validator action from merely marking it complete.
- The teardown guard was verified without the confirmation argument; it failed closed before any database write.
- After the Section 4 implementation, `npm run typecheck`, `npm run build:web`, and `git diff --check`
  passed. Focused V2 shopping-needs, Shopping Trip domain, route, and household shopping-completion
  suites passed (11 tests in the latter three suites; 8 shopping-needs tests separately).
- After the scale-selection follow-up, `npm run typecheck`, `npm run lint -- --no-warn-ignored`,
  and `npm test` passed (69 files, 250 tests).
- After the access/presentation follow-up, typecheck and zero-warning lint passed; the household
  deletion, feature-flag validator, workspace action alignment, and admin user-management work
  remain in progress.

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
- The operator accepted the Section 3 workspace structure, CRUD/derived-data pass, responsive
  behavior, and accessibility checks. The live runbook retains only shared header/body amount-column
  alignment and final state-badge presentation.
- Stage 10 configured/browser release evidence remains open and is not waived by this plan.
- Section 4 browser evidence remains open in the live runbook: visible Build checkboxes and
  tri-state expansion, exact selected-owner output, group-mode presentation, compact source colors,
  additive impulse behavior, completion clear/refresh, and Custom shop creation still need operator
  confirmation against the approved disposable household.
- The legacy shopping-list API remains a compatibility fallback only when no V2 Product Group/Product
  rows exist; the normal seeded household path now generates from the V2 workspace and visible table
  selection.
- The operator must edit the live runbook with actual findings during the final pass; those edits
  become input to the final fixer session. The shortened manual pass should start with
  `npm run mvp:preflight`, then the fixture/configured smokes, then browser-only checks.

## Next Step

Run the focused demo seed against the approved disposable database, then rerun
`npm run smoke:demo-household` before browser verification. Do not use the full seed unless
catalogue/admin data is also required.

Execute `scripts/stage11-mvp-manual-test.md` as one continuous Stage 8–11 pass, starting with
Section 4 now that the attached shopping feedback is implemented. Add observed
behavior and environment details to the runbook without credentials or private exports. Treat the
operator-edited runbook as the only source for Step 11.10 fixes; do not restart separate Stage 8–10
acceptance sessions.
