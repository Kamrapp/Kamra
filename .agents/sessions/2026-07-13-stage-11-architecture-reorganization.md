## Session

- Date: 2026-07-13
- Plan: `.agents/plans/2026-07-13-stage-11-vertical-slice-locality-plan.md`
- Branch: `dev/bg/stage-9-10`
- Current objective: Finish the bounded vertical-slice reorganization and hand the complete Stage 8–11 MVP verification to one manual-only operator runbook.

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
- Committed the ingestion-review admin refinement in `9539163`: review rows now expose status,
  decline reason, match confidence, and compact accept/decline actions; the review dialog stays open
  until its close control is used and the rail label is localized as Ingestion management.
- Committed the final shopping quick-add bridge in `a78d96c`: quick-add names now match known
  household Products after a short debounce, align and lock the Product unit, and persist the line
  against that Product so completion updates the existing stock anchor.
- Fixed the remaining target-comparison mismatch in `68e244e`: the shopping generator and derived
  target state already treated Current at or above Target as satisfied, but the table still colored
  above-target symbols yellow. The shared comparison rule now keeps target comparisons good while
  preserving the below-minimum error state, with focused regression coverage.
- Rewrote `scripts/stage11-mvp-manual-test.md` as the single manual-only Stage 8–11 runbook. Active
  sections contain executable checks and evidence collection only; accepted prior work is tracked in
  its bottom table, while operator notes and discoveries remain editable.

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
- The live runbook now contains only manual/configured checks. Its remaining browser evidence covers
  invitation/member actions, final Home alignment/theme checks, Build/generate/cancel behavior,
  known-household-Product quick-add matching, completion feedback, Shopping Trip creation, pricing,
  ingestion review, archive/repair operations, and final risk probes.
- The legacy shopping-list API remains a compatibility fallback only when no V2 Product Group/Product
  rows exist; the normal seeded household path now generates from the V2 workspace and visible table
  selection.
- The operator must edit the live runbook with actual findings during the final pass; those edits
  become input to the final fixer session. The shortened manual pass should start with
  `npm run mvp:preflight`, then the fixture/configured smokes, then browser-only checks.

## Review closeout (2026-07-13)

- Re-reviewed the committed application without changing CSS or normal UI behavior.
- Hardened the Household V2 client so a network failure or malformed successful workspace response
  returns the existing localized error state instead of leaving a blank ready workspace. Shared
  write calls now also turn network failures into the existing localized save failure result.
- Hardened auth response handling to fail closed on malformed current-user, login, registration, or
  preference payloads rather than throwing or persisting an invalid token.
- Corrected Stage 9 admin error classification: only duplicate-key writes return duplicate conflicts;
  known ingestion-review conflicts and invalid price observations retain their client errors, while
  unexpected database failures reach the shared 500 handler instead of being mislabeled.
- Validation after the review: 71 test files/255 tests, 7 integration tests, typecheck, lint, format
  check, web/API build, and diff check passed. The unsupported Vitest `--runInBand` attempt was a
  command error; the normal `npm test` run passed.
- These review changes are currently uncommitted and intentionally left for operator review.

### Review follow-ups intentionally left unchanged

- User deletion still needs a larger transaction-boundary review because it spans household cleanup,
  owner promotion, memberships, invitations, and the user record.
- Shopping-trip completion intentionally has resumable per-item writes; changing that to one global
  transaction would require an explicit idempotency and partial-failure decision.
- Feature-flag writes and audit append still deserve a concurrency/CAS review; this was outside the
  low-risk hardening boundary.
- Several API clients still trust successful JSON shapes; the auth and workspace paths were hardened
  because they are security or primary-workspace boundaries. Broader contract validation should be a
  planned follow-up rather than a scattered one-off change.

## Styling consistency review (2026-07-13)

- Centralized the duplicated shopping-scale track and thumb gradients as theme-aware global tokens;
  the rail now consumes one shared definition for both browser slider implementations.
- Added a shared keyboard focus ring for links and native controls, and classified the rail history,
  toast dismissal, stock stepper, and account controls with explicit component/shared classes.
- Reused the shared UI form/button tokens for account controls and removed the duplicate account
  control declarations. Other native fields were intentionally left under their existing scoped
  selectors because they are already styled and broad markup churn would risk layout regressions.
- No frontend behavior or layout structure was changed intentionally. Validation passed after this
  review: formatting, lint, app/API typecheck, web build, and diff check.

## Latest validation and next step

- After `a78d96c`, targeted Prettier, app/API typecheck, zero-warning lint, and diff checks passed.
- The ingestion-review slice was formatted, typechecked, linted, and committed as `9539163`.
- The runbook rewrite was formatted and diff-checked, then committed with the session handoff as
  `aeb2078`.
- The production-template follow-up for ingestion decline actions is `257f07e`; the web build now
  compiles the FormsModule-bound selector successfully.
- After `68e244e`, the focused comparison test passed with 3 cases, plus typecheck, lint, diff
  checks, and the production web build.

## Automated manual-check audit (2026-07-13)

- Added `26f44ab` with pure client-side shopping-scale eligibility tests for no-policy rows, all
  four scale levels, and expiry-warning boundaries.
- Added `afc886e` with generator tests for Product/Group above-target no-op behavior and all empty
  group policies, extending the existing distribution and earliest-expiry coverage.
- Added `0e9eafd` with quick-add normalization tests for accents, punctuation, case, known Product
  matching, and no-match behavior while keeping the debounce/control UI manual.
- Added `e80cbe7` with a read-model fix and regression test: expired active Batches remain visible
  and count toward physical Product batch totals while the expiry policy still excludes them from
  derived Current. The formatter-only follow-up is `4e3cba6`.
- Updated the automated coverage ledger in `scripts/stage11-mvp-manual-test.md` as `f23478e`.
  Existing handler/repository/integration tests already cover feature-flag persistence, Batch
  correction/discard routes, invitations, reset/deletion, stale revisions, trip completion,
  ingestion review, and demo-fixture invariants; those were not duplicated.
- `npm run mvp:preflight` passed after these changes: 74 test files/269 tests, 8 deterministic
  integration tests, formatting, lint, typecheck, web build, API build, and diff checks. Browser,
  configured MongoDB, and operator-session checks remain manual by design.
- Refined the live runbook in `99e95b7`: the completed local preflight is checked rather than left
  as an open manual item, the automated Group aggregation probe was removed from open risks, and
  the document explicitly separates automated evidence from remaining browser/configured checks.
- Reconciled the runbook against the accepted `257f07e` state in `a2c7fac`: previously accepted
  access, fixture, Home workspace, shopping UI, settings, and admin checks are now covered rather
  than repeated. Active work is limited to the post-`257f07e` expiry/count and target-comparison
  retests, the previously skipped Shopping Trip/pricing/ingestion work, configured archive/repair,
  final evidence, and the remaining idempotency probe.
- Revised the generated manual-test automation plan to a bounded, executable scope: matcher matrix,
  Trip persistence assertions, Stage 9 HTTP contracts, one run-scoped Shopping Trip Mongo smoke,
  and duplicate-impulse key coverage. It explicitly avoids schema changes, catalogue side effects,
  browser-test infrastructure, and reopening accepted checks. Implementation is approved by the
  current user request and will proceed in the plan's separate commits.
- Implemented and validated the first two units as `201f567` and `b345e3f`. The configured smoke
  then exposed a real blocker before the Trip path: Stage 9 `MongoPriceObservationRepository`
  writes the V2 `PriceObservationCandidate` shape into the catalogue-owned `price_observations`
  collection, whose live validator requires the catalogue `PriceObservationRecord` shape. The
  revised plan now has a decision gate; recommended fix is a separate `shop_price_observations`
  collection with an explicit validator/index maintenance entry. Do not weaken the catalogue
  validator or commit the currently failing smoke until that ownership decision is approved.

Run the focused demo seed against the approved disposable database, then rerun
`npm run smoke:demo-household` before browser verification. Do not use the full seed unless
catalogue/admin data is also required.

Execute `scripts/stage11-mvp-manual-test.md` as one continuous Stage 8–11 pass, starting with the
automated preflight and then the remaining browser/configured checks. Add observed behavior and
environment details to the runbook without credentials or private exports. Treat operator edits as
the only source for Step 11.10 fixes; do not restart separate Stage 8–10 acceptance sessions.

## MVP quality automation follow-up (2026-07-14)

- Approved and implemented the bounded `.agents/plans/2026-07-14-mvp-quality-automation-plan.md`
  through Step 6 in separate commits: `13221e5`, `a81197b`, `f6838c4`, `e88705f`, `31b003a`, and
  `248899a`.
- Added four secret-free Chromium browser contracts for authenticated Home loading, Home shopping
  selection/retry/cancel/duplicate handling, one Shopping Trip completion path, and Stage 9 pricing
  and review feedback. The fixture fails on unexpected API requests; it does not write MongoDB.
- Added fail-closed response guards for the browser-exercised client consumers. Feature-flag and
  ingestion-review writes now reject lost compare-and-set matches before reporting success; audits
  are appended only after a successful flag write.
- The shared Mongo transaction helper retries only errors carrying `TransientTransactionError`, up
  to three attempts. Non-transient failures and unknown commit results remain visible. The elevated
  `npm run smoke:shopping-trip` passed and proved concurrent completion/review single-winner
  behavior with no duplicate Batch, Movement, operation, or Ingestion Submission records.
- The `Browser Contracts` workflow is Chromium-only and path-filtered to browser-facing source,
  harness, and configuration. `mvp:preflight` remains browser-free.
- The live runbook was reconciled so directly proven synthetic browser outcomes are recorded under
  `Covered and accepted`; remaining manual work is real-data persistence, visual/locale/theme and
  responsive review, configured archive/repair evidence, and final two-user/deployment checks.

Final automation closeout is ready in the documentation/handoff commit after the runbook review.
`npm run mvp:preflight` passed with 9 deterministic integration tests and 286 full tests; the
Chromium suite passed all 4 contracts; and the elevated `npm run smoke:shopping-trip` passed with
concurrent completion/review assertions. Do not treat the synthetic browser suite as a waiver for
real-data or subjective UI evidence.

## Home shopping panel layout refinement (2026-07-14)

- Updated the Home grid so the household workspace and Shopping list share desktop space predictably,
  collapsed panels remain compact, and mobile panels use natural stacked flow with minimum separation.
- The expanded Shopping list now keeps its heading, quick-add, finalize controls, and status compact;
  only the item table's shell consumes flexible height and scrolls. Shopping Trip is collapsed by
  default with an accessible disclosure control and responsive content flow.
- Updated the browser contract to expand Trip explicitly, and added the default-collapsed/toggle
  assertion. Added the remaining visual and narrow-layout checks to the live runbook.
- Validation passed: full Chromium suite (4 tests), formatting, lint, typecheck, and web build.

## Browser harness cleanup (2026-07-14)

- Replaced the browser harness's nested `npm run dev:web` command with a direct Angular launcher and
  cooperative Windows teardown. Playwright records a run-scoped PID, requests shutdown through a
  stop marker, and the launcher terminates the Angular child it owns before the shell closes.
- `npm run test:browser` passed all 4 contracts and exited in 7.7 seconds; port 4200 had no listener,
  no temporary PID/stop files remained, and only the pre-existing long-lived environment processes
  were present afterward. `npm run format:check`, `npm run lint`, and `npm run typecheck` passed.

## Household target comparison and Group shopping refinement (2026-07-14)

- Implemented and committed the approved target/comparison and Product Group shopping plan in
  `809303a`, `7930eeb`, `51936eb`, `566a2b0`, `3c0d098`, and `af5d394`.
- Household stock now distinguishes below minimum, between minimum/target, exact target, and above
  target. Above target uses a `>>` marker and stronger-good styling; untracked rows have no markers.
- Shopping-list building preserves manual Product/Group checkbox changes until the scale changes;
  focused Chromium coverage proves default selection, manual toggles, scale reset, and final request
  ownership.
- Group target fulfillment now supports no split, split evenly, least amount, latest stocked, and
  oldest stocked strategies. Each Group persists explicit `default`/local overrides, and the Group
  details row shows the inherited household value without duplicating target quantities.
- The household validator accepts the new distribution values. Legacy `even`/`proportional` values
  normalize to `split_evenly`; Product Group maintenance upgrades its validator and backfills missing
  inherited overrides separately from the data migration.
- The demo fixture uses global split-evenly by default, explicit inherited overrides on all Groups,
  and `Gyümölcsök` with a local `latest` override. `scripts/demo-household-smoke.ts` asserts those
  contracts in addition to ownership, expiry, and batch permutations.
- Focused generator/read-model/repository tests, typecheck, lint, formatting, and the demo seed test
  pass. The configured database maintenance actions and the final browser visual check remain open.

Next action: run the household validator action for the changed household/Product Group contracts in
the approved disposable database, then run `npm run seed:demo-household` and
`npm run smoke:demo-household`; finish the new manual checks in `scripts/stage11-mvp-manual-test.md`.

## Empty Product Group distribution regression (2026-07-14)

- Verified that an empty targeted Product Group does not enter product selection for any local
  distribution strategy. The generator falls back to one Group-owned need when the effective
  household mode allows a Group item; `add_products_only` still produces no row.
- Added a parameterized regression covering `split_evenly`, `least_amount`, `latest`, `oldest`, and
  `dont_split` local overrides on an empty Group.
- `npx vitest run packages/kamra-api-server/src/household/v2/shopping-needs.test.ts`, typecheck,
  lint, and diff checks pass.

## Docker local runtime (2026-07-14)

- Added a root Node 24 multi-stage `Dockerfile`, `compose.yaml`, `.env.docker.example`, and
  `.dockerignore`. Compose runs the complete same-origin Angular/API app with a named-volume MongoDB
  service and healthchecks.
- Added `scripts/container-server.ts` to serve compiled Angular assets and delegate `/api/*` to the
  existing Node adapter. Added `scripts/container-bootstrap.ts` plus the entrypoint so configured
  seeds run only when the local `seed_ledger` is incomplete; normal restarts preserve household data.
- Updated README, `docs/tech-ops.md`, and `scripts/README.md` with local startup, reset behavior,
  managed-Mongo deployment guidance, and the explicit local-only/no-auth boundary.
- `npm run build`, `npm run typecheck`, `npm run lint -- --no-fix`, `npm run format:check`, `npm test`
  (75 files / 296 tests), and diff checks pass. A local compiled-server probe returned the Angular
  shell and `GET /api/healthz` 200. Docker CLI execution was unavailable in this environment.

## Product Group shopping allocation correction (2026-07-14)

- Fixed explicit Group/Product selection so a Group is never appended beside Product needs that
  represent the same Group. Product-only Group overrides also no longer produce a Group line.
- Even Group splits now round each base share down to one decimal place beyond the Group target's
  precision, then add the exact remainder to the first Product. This keeps values readable while
  preserving the full Group shortage.
- Added regression coverage for integer and fractional target precision, selected Group splits,
  selected Product + Group combinations, and Product-only overrides.
- Focused shopping-needs tests (22), full tests (75 files / 300 tests), typecheck, lint, formatting,
  and diff checks pass.

## Shopping-list build visibility (2026-07-14)

- Starting Build Shopping List now expands the Product Group workspace before selection mode is
  enabled, so the newly shown checkboxes are immediately visible.
- The Chromium Home contract now collapses the workspace first, starts building, and verifies that
  the household table reopens with selection controls.

## Shopping completion visibility (2026-07-14)

- Completing shopping already collapses the Shopping List panel; Home now reopens the Product Group
  workspace when the refreshed stock page arrives, making the applied stock visible immediately.
- The browser fixture covers the finish request and verifies the shopping panel is collapsed while
  the household workspace is expanded afterward.

## Household grid nesting and child counts (2026-07-14)

- Reduced the shared household grid's leading spacing and made the header, Group, Product, and Batch
  rows use the same track definition. Groups and Unassigned Products now use the outer expansion
  track; Products and Batches use one and two visual name indents respectively.
- Group rows show a compact total Product count, and Unassigned Products shows the same `(n)` form
  instead of a separate `n products` label. Empty Unassigned Products keeps its expansion slot blank.
- Added a browser contract for shared tracks and child counts. Typecheck, lint, formatting, and the
  five focused Home browser tests pass.

## Runbook automation reconciliation (2026-07-14)

- Added a stateful Chromium contract for Household management settings: expiry policy and max-limit
  multiplier save with visible feedback, request ownership, and persistence after reload.
- Extended the Home browser contract to verify Group detail terminology and the removal of the
  obsolete calculated-source text.
- Reconciled `scripts/stage11-mvp-manual-test.md` so active sections contain only real seeded,
  visual, configured-environment, or multi-user evidence. Synthetic settings, grid/details/count,
  selection, completion, Trip, and admin checks now live only in the covered ledger.
- The full Chromium browser suite passes with 9 tests; typecheck, lint, Prettier, and diff checks
  also pass for this slice.

## Household grid alignment follow-up (2026-07-14)

- Fixed the shared Product Group workspace tracks so the header reserves the same four-button
  action width as data rows; this prevents fractional tracks from shifting the header labels.
- Moved Product disclosure controls into the dedicated leading grid cell, leaving an empty slot for
  Products without Batches so all Product names start at the same position.
- Added browser assertions for shared cell starts and expandable versus empty Product rows. The
  focused and full Chromium suites pass after this correction.

## Invitation action follow-up (2026-07-14)

- Replaced textual incoming-invitation actions with compact accessible ✓/× controls in both the Home
  household panel and the secondary account rail; the rail now supports rejection as well as
  acceptance.
- Moved the accepted Manual/diagnostics checks out of the active runbook. Only the narrow-viewport
  invitation action layout remains open for visual confirmation.
- Added a two-surface browser contract. The full Chromium suite now passes with 10 tests; typecheck,
  lint, Prettier, and diff checks pass.

## Household scrollbar/comparison follow-up (2026-07-14)

- Added a stable vertical scrollbar gutter to the Product Group table body so header and data rows
  keep the same grid tracks whether the body overflows or not.
- Simplified above-target comparison output from `>>` to `>` while keeping its stronger good-state
  color; the active runbook wording is updated accordingly.
- Browser coverage now checks shared cell starts both before and after forcing table overflow.

## Household header gutter follow-up (2026-07-14)

- Kept the stable body gutter and extended only the header surface across that gutter with a
  non-layout pseudo-element. This avoids changing the shared grid tracks while removing the visible
  right-edge gap when the table scrollbar is present.
- The browser contract now checks both exact cell alignment and the extended header boundary in the
  overflowing state. No new manual test step is needed beyond the existing visual table check.

## Household comparison track follow-up (2026-07-14)

- Widened both comparison columns to `1.25rem` in normal and shopping-selection layouts so the
  marker remains inside its cell and cannot collide with Current or Target values.
- Added a browser assertion for the minimum comparison-cell width; the focused overflow alignment
  contract remains passing.

## Household unit inheritance follow-up (2026-07-14)

- Added explicit unit selectors to the Product and Batch editors. Assigned Products can copy their
  parent Product Group unit through `Match Product Group`; every Batch can copy its owner Product
  unit through `Match Product`. The Product Group option is omitted for unassigned Products.
- The copy actions persist the resolved tracking unit rather than introducing a special storage
  value, keeping existing target-policy and quantity validation contracts intact. Custom units keep
  their `custom:` storage form and existing display behavior.
- Batch corrections now carry the edited unit through the frontend service, route validation, and
  transaction repository; movement records use the resulting unit as well. API and repository tests
  cover the persisted unit update, including a compatible `l` → `ml` correction.
- Typecheck, lint, focused API tests (53 tests), formatting, and diff checks pass. A browser visual
  check remains useful for the two new selectors and for confirming the match-group option is absent
  on an unassigned Product.

## Shopping list row actions and oldest-product selection (2026-07-14)

- `db280b0` fixes the Group Oldest strategy so it compares each Product's latest available Batch;
  an older expired/replaced Batch no longer makes that Product win. A multi-Batch regression fixture
  covers the Alma/Kiwi case.
- `ff31f84` adds editable impulse names, discard actions for every shopping-list row, localized
  Purchased wording, a compact inherited list grid, and an explicit cancellation event that
  reopens the household workspace. Selection cancellation preserves the intentional workspace
  collapse after Generate.
- `c76238f` protects both selection-cancel and active-list-cancel reopening in the Chromium contract.
- Validation after these commits: 23 focused shopping-needs tests, 7 Home Chromium tests, app/API
  typecheck, lint, targeted Prettier, and `git diff --check` passed. Full preflight was not rerun.
- The live runbook now contains only three new Section 4 manual checks for impulse rename/discard,
  Purchased presentation, and both cancellation paths; the accepted real-data selection and
  distribution checks were moved into the covered ledger.

## Household header scrollbar gutter follow-up (2026-07-14)

- `64a28d7` replaces the Product Group header's width overhang with an explicit final spacer track
  inside the bordered grid. Header and body content tracks remain aligned while the reserved
  scrollbar space stays inside the shell in both overflow states.
- The browser contract now ignores only that intentional header spacer when comparing content cell
  starts and asserts that the header remains within the shell boundary. All 7 focused Home Chromium
  tests, typecheck, lint, formatting, and diff checks pass.

## Shopping table and action icon consistency (2026-07-14)

- Flattened Shopping List rows into one bordered table surface with a visible header band and
  compact, non-rounded row separators. Amount, impulse-name, and unit editors now reuse the same
  form-field treatment as household inline editors.
- Added theme-aware `info`, `warning`, and `danger` tones to the shared table icon button. Product
  Group/Product/Batch detail controls now use the household magnifier-plus/minus icon; save and
  add actions use info, edit pencils use warning, and cancel/discard actions use danger.
- Browser coverage checks the shopping table surface/header, household detail SVG, and action tones.
  Typecheck, lint, focused Home Chromium tests (7), formatting, and diff checks pass.

## Shopping Trip compact workspace (2026-07-14)

- Replaced the text Refresh control with the shared icon button and turned Trip items into a compact
  table. Secondary price, match, purchase, and actual-result data now lives behind a per-item
  magnifier details row instead of making every item a large card.
- Moved shop, planned date, status, Continue/Finalize, and Cancel into a fixed `After trip` side
  block; cancelling uses the existing domain `cancelled` transition and returns to trip start.
- Added localized labels and Chromium coverage for the compact layout, details interaction, and
  cancellation. Typecheck, lint, Prettier, diff checks, Home auth, and Shopping Trip browser tests
  pass.

## Home section and row sizing follow-up (2026-07-14)

- Added the global `section-toggle` style and applied it consistently to Household stocks, Shopping
  list, and Shopping trip. Removed duplicate kicker/title blocks so each panel has one compact
  header line.
- Shopping List and Shopping Trip table bodies now use content-sized rows aligned to the top rather
  than stretching rows into spare panel height. Purchased items now use a leading disclosure marker
  and the same italic, stronger separator treatment as Unassigned Products.
- Building a shopping list collapses both lower panels before opening household selection. Browser
  coverage verifies the shared toggle class, simplified Household stocks heading, and both panels
  collapsing on Build. Typecheck, lint, Prettier, diff checks, and combined Home/Trip browser tests
  pass.

## Catalog schema artifact generation follow-up (2026-07-14)

- The catalog smoke workflow exposed formatting-only drift: the checked-in v1 artifact had been
  reformatted by the repository-wide Prettier change while the generator still wrote raw
  `JSON.stringify` output.
- `scripts/generate-catalog-schemas.ts` now resolves the repository Prettier configuration for the
  generated artifact before writing it. This keeps regeneration deterministic and makes the workflow
  diff check detect actual schema changes rather than formatter differences.
- Validation: regeneration plus `git diff --exit-code` passes, targeted Prettier passes, API
  typecheck passes, and all 18 catalog/seed tests pass. No schema or database migration change was
  required.

## Above-target Group shopping selection fix (2026-07-14)

- Fixed the explicit-selection path that treated a manually selected above-target Product Group as
  a one-unit below-minimum Group need. It now preserves the Group policy metadata (`2 kg` target in
  the seeded bread case), marks the forced selection as manual, and applies the effective Group
  distribution strategy before falling back to a Group-owned line.
- A selected Group using split mode now produces Product-owned needs for its Products, so `Kenyér`
  is represented by `Fehér kenyér` and `Rozskenyér` rather than a misleading Group-only line.
- Added focused unit coverage for the exact above-target split case and an application integration
  check for target/current/reason metadata on a manually selected Group line. API typecheck, lint,
  formatting, and 34 focused tests pass.
