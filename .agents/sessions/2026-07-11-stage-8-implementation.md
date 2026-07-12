# Stage 8 implementation session

## Session

- Date: 2026-07-11
- Plan: `.agents/plans/2026-07-11-stage-8-coherent-household-mvp-plan.md`
- Branch: `dev/bg/stage8`
- Current objective: Implement Stage 8 through small validated commits, keeping manual checks and decisions explicit.

## Completed

- Item: Step 1 contract/domain foundation implemented: Stage 8 household vocabulary, classification closure/matching, unit conversion, batch ordering, allocation-only aggregation, capabilities, and validators.
- Item: Added the durable domain dictionary at `docs/domain-language.md`.
- Item: Added the typed feature-flag registry/evaluator with explicit defaults, storage-failure behavior, bounded cache, invalidation, revision checks, and audit payload contracts.
- Item: Extended server logging with structured event metadata plus bounded sensitive-detail redaction.
- Item: Wired the typed feature service to a Mongo-backed flag store and the admin dashboard route; persisted change audits through a registered maintenance entry.
- Item: Added Step 3A classification migration contracts: legacy categories become Product Concepts/`is_a` edges, attributes become independent Product Attributes, and keyword/broken references are reported.
- Item: Added the Mongo classification repository with stable-id upserts, indexes, and idempotent migration reporting.
- Item: Registered classification/audit validator and migration execution in the database-maintenance routes; `Run all` can now invoke both new actions.
- Item: Added Step 3B legacy household stock migration and maintenance integration: local products become unconstrained Stock Targets, rows become Stock Batches, positive balances get one full allocation, and opening movements preserve migrated quantity.
- Item: Added `npm run smoke:transactions`, an isolated Mongo transaction check that verifies rollback and commit behavior and refuses production-named databases.
- Item: Transaction smoke passed against `kamra_dev`: rollback count 0, committed count 2, temporary collection cleaned up.
- Item: Started Step 4 with a reusable Mongo transaction runner and pure consumption planning for deterministic partial multi-batch commands.
- Item: Added transactional Stock Batch acquisition with operation receipts, acquisition movements, idempotent retry replay, and fingerprint conflict detection.
- Item: Added transactional Stock Batch allocation with criteria validation, unit compatibility, full-batch enforcement, and one-active-allocation protection.
- Item: Added transactional Stock Target consumption with stale-revision checks, deterministic planning, partial depletion, allocation updates, and per-batch movement history.
- Item: Added transactional batch correction and discard commands with revision checks, explicit movements, allocation reconciliation, and preserved history.
- Item: Added the explainable Stock Target aggregate projection with allocation-only totals, status, next expiry, expiring count, and combined notice codes.
- Item: Added a Mongo Stock Target read repository that returns the server-owned aggregate and allocated batch summaries.
- Item: Added the first v2 household route adapter for Stock Target reads with active-membership enforcement and schema-versioned responses.
- Item: Added the v2 manual Stock Batch acquisition route with server-built snapshots, membership enforcement, request validation, and stable command-error mapping.
- Item: Added the v2 batch allocation route with server-derived full quantity, membership/unit checks, and bounded override reasons.
- Item: Added the v2 Stock Target consume route with expected-revision and quantity/selection validation.
- Item: Added v2 correction and discard routes with shared membership checks, expected batch revisions, and stable command responses.
- Item: Full repository validation passed after the v2 command/route work.
- Item: Added pure Shopping Need generation, ad-hoc need creation, and revision-checked skip/restore transitions for the Stage 9 handoff.
- Item: Added Mongo Shopping Need persistence with one household list, idempotent creation, need upsert, and stale-revision transitions.
- Item: Registered `household_shopping_needs-v1` with database maintenance setup and run-all coverage before route integration.
- Item: Added v2 Shopping Need GET/POST and revision-checked skip/restore route adapters with membership enforcement.
- Item: Tightened the ad-hoc Shopping Need route to validate units explicitly without unsafe type assertions.
- Item: Added Stock Target repository CRUD and v2 create/update/archive routes with criteria, quantity, unit, policy, revision, and membership validation.
- Item: Added the bounded bilingual base classification pack and loader with cycle, parent, translation-parity, and template-criteria validation.
- Item: Added non-destructive Mongo base-pack sync with seed provenance, repeat-safe unchanged reporting, and customized-record conflict reporting.

## Changed Files

- Path: `packages/kamra-api-server/src/household/v2/contracts.ts`
- Path: `packages/kamra-api-server/src/household/v2/domain.ts`
- Path: `packages/kamra-api-server/src/household/v2/validation.ts`
- Path: `packages/kamra-api-server/src/household/v2/domain.test.ts`
- Path: `packages/kamra-api-server/src/household/v2/mongo-stock-read-repository.ts`
- Path: `packages/kamra-api-server/src/household/v2/mongo-stock-read-repository.test.ts`
- Path: `packages/kamra-api-server/src/http/routes/household-v2-routes.ts`
- Path: `packages/kamra-api-server/src/household/v2/mongo-stock-target-repository.ts`
- Path: `packages/kamra-api-server/src/household/v2/mongo-stock-target-repository.test.ts`
- Path: `packages/kamra-api-server/src/classification/base-content/base-classification.v1.json`
- Path: `packages/kamra-api-server/src/classification/base-content/i18n/en.json`
- Path: `packages/kamra-api-server/src/classification/base-content/i18n/hu.json`
- Path: `packages/kamra-api-server/src/classification/base-content/loader.ts`
- Path: `packages/kamra-api-server/src/classification/base-content/loader.test.ts`
- Path: `packages/kamra-api-server/src/classification/base-content/sync.ts`
- Path: `packages/kamra-api-server/src/classification/base-content/sync.test.ts`
- Path: `packages/kamra-api-server/src/http/app-handler.ts`
- Path: `packages/kamra-api-server/src/http/app-handler.test.ts`
- Path: `packages/kamra-api-server/src/http/routes/household-v2-routes.ts`
- Path: `packages/kamra-api-server/src/http/app-handler.ts`
- Path: `packages/kamra-api-server/src/household/v2/shopping-needs.ts`
- Path: `packages/kamra-api-server/src/household/v2/shopping-needs.test.ts`
- Path: `packages/kamra-api-server/src/household/v2/mongo-shopping-need-repository.ts`
- Path: `packages/kamra-api-server/src/household/v2/mongo-shopping-need-repository.test.ts`
- Path: `packages/kamra-api-server/src/database-maintenance/registry.ts`
- Path: `packages/kamra-api-server/src/http/routes/database-maintenance-route.ts`
- Path: `packages/kamra-api-server/src/http/app-handler.test.ts`
- Path: `packages/kamra-api-server/src/household/v2/contracts.ts`
- Path: `packages/kamra-api-server/src/household/v2/validation.ts`
- Path: `packages/kamra-api-server/src/household/v2/mongo-stock-command-repository.ts`
- Path: `packages/kamra-api-server/src/household/v2/mongo-stock-command-repository.test.ts`
- Path: `packages/kamra-api-server/src/household/v2/domain.ts`
- Path: `packages/kamra-api-server/src/household/v2/domain.test.ts`
- Path: `packages/kamra-api-server/src/test-support/fake-mongo.ts`
- Path: `packages/kamra-api-server/src/household/README.md`
- Path: `docs/domain-language.md`
- Path: `.agents/plans/2026-07-11-stage-8-coherent-household-mvp-plan.md`
- Path: `packages/kamra-api-server/src/feature-toggles/contracts.ts`
- Path: `packages/kamra-api-server/src/feature-toggles/service.ts`
- Path: `packages/kamra-api-server/src/feature-toggles/service.test.ts`
- Path: `packages/kamra-api-server/src/logging/kamra-logger.ts`
- Path: `packages/kamra-api-server/src/logging/kamra-logger.test.ts`
- Path: `packages/kamra-api-server/src/feature-toggles/mongo-store.ts`
- Path: `packages/kamra-api-server/src/feature-toggles/mongo-store.test.ts`
- Path: `packages/kamra-api-server/src/database-maintenance/registry.ts`
- Path: `packages/kamra-api-server/src/http/routes/admin-dashboard-route.ts`
- Path: `packages/kamra-api-server/src/http/app-handler.test.ts`
- Path: `packages/kamra-api-server/src/catalog/v2/classification.ts`
- Path: `packages/kamra-api-server/src/catalog/v2/classification.test.ts`
- Path: `packages/kamra-api-server/src/catalog/README.md`
- Path: `packages/kamra-api-server/src/catalog/v2/mongo-classification-repository.ts`
- Path: `packages/kamra-api-server/src/catalog/v2/mongo-classification-repository.test.ts`
- Path: `packages/kamra-api-server/src/http/routes/database-maintenance-route.ts`
- Path: `packages/kamra-api-server/src/household/v2/mongo-stock-migration.ts`
- Path: `packages/kamra-api-server/src/household/v2/mongo-stock-migration.test.ts`
- Path: `scripts/transaction-smoke.ts`
- Path: `scripts/README.md`
- Path: `package.json`
- Path: `packages/kamra-api-server/src/db/mongo-like.ts`
- Path: `packages/kamra-api-server/src/db/mongo-transaction.ts`
- Path: `packages/kamra-api-server/src/db/mongo-transaction.test.ts`
- Path: `packages/kamra-api-server/src/household/v2/domain.ts`
- Path: `packages/kamra-api-server/src/household/v2/domain.test.ts`

## Validation

- Ran: `npm run typecheck`
- Result: Passed.
- Ran: `npm test -- --run packages/kamra-api-server/src/http/app-handler.test.ts`
- Result: 48 tests passed.
- Ran: `npx eslint packages/kamra-api-server/src/http/routes/household-v2-routes.ts packages/kamra-api-server/src/http/app-handler.ts`
- Result: Passed.
- Ran: `npm test`
- Result: 40 test files and 178 tests passed.
- Ran: `npm run lint`
- Result: Passed.
- Ran: `npm run build`
- Result: Web and API builds passed; generated output remained ignored/unchanged in Git.
- Ran: `npm test -- --run packages/kamra-api-server/src/household/v2/shopping-needs.test.ts`
- Result: 2 tests passed.
- Ran: `npx eslint packages/kamra-api-server/src/household/v2/shopping-needs.ts packages/kamra-api-server/src/household/v2/shopping-needs.test.ts`
- Result: Passed.
- Ran: `npm test -- --run packages/kamra-api-server/src/http/app-handler.test.ts`
- Result: 48 tests passed.
- Ran: `npx eslint packages/kamra-api-server/src/http/routes/household-v2-routes.ts packages/kamra-api-server/src/http/app-handler.ts packages/kamra-api-server/src/http/app-handler.test.ts`
- Result: Passed.
- Ran: `npm test -- --run packages/kamra-api-server/src/household/v2/domain.test.ts packages/kamra-api-server/src/http/app-handler.test.ts`
- Result: 54 tests passed.
- Ran: `npx eslint packages/kamra-api-server/src/household/v2/validation.ts packages/kamra-api-server/src/http/routes/household-v2-routes.ts packages/kamra-api-server/src/http/app-handler.ts`
- Result: Passed.
- Ran: `npm test -- --run packages/kamra-api-server/src/http/app-handler.test.ts`
- Result: 47 tests passed.
- Ran: `npx eslint packages/kamra-api-server/src/household/v2/validation.ts packages/kamra-api-server/src/http/routes/household-v2-routes.ts packages/kamra-api-server/src/http/app-handler.ts packages/kamra-api-server/src/http/app-handler.test.ts`
- Result: Passed.
- Ran: `npm test -- --run packages/kamra-api-server/src/http/app-handler.test.ts`
- Result: 46 tests passed.
- Ran: `npx eslint packages/kamra-api-server/src/http/routes/household-v2-routes.ts packages/kamra-api-server/src/http/app-handler.ts packages/kamra-api-server/src/http/app-handler.test.ts`
- Result: Passed.
- Ran: `npm test -- --run packages/kamra-api-server/src/household/v2/mongo-stock-read-repository.test.ts`
- Result: Passed.
- Ran: `npx eslint packages/kamra-api-server/src/household/v2/mongo-stock-read-repository.ts packages/kamra-api-server/src/household/v2/mongo-stock-read-repository.test.ts`
- Result: Passed.
- Ran: `npm test -- --run packages/kamra-api-server/src/household/v2/domain.test.ts`
- Result: 7 tests passed.
- Ran: `npx eslint packages/kamra-api-server/src/household/v2/domain.ts packages/kamra-api-server/src/household/v2/domain.test.ts`
- Result: Passed.
- Ran: `npm test -- --run packages/kamra-api-server/src/household/v2/mongo-stock-command-repository.test.ts`
- Result: 4 tests passed.
- Ran: `npx eslint packages/kamra-api-server/src/household/v2/mongo-stock-command-repository.ts packages/kamra-api-server/src/household/v2/mongo-stock-command-repository.test.ts`
- Result: Passed.
- Ran: `npm test -- --run packages/kamra-api-server/src/household/v2/mongo-stock-command-repository.test.ts`
- Result: 3 tests passed.
- Ran: `npx eslint packages/kamra-api-server/src/household/v2/mongo-stock-command-repository.ts packages/kamra-api-server/src/household/v2/mongo-stock-command-repository.test.ts`
- Result: Passed.
- Ran: `npm test -- --run packages/kamra-api-server/src/household/v2/mongo-stock-command-repository.test.ts`
- Result: 2 tests passed.
- Ran: `npx eslint packages/kamra-api-server/src/household/v2/mongo-stock-command-repository.ts packages/kamra-api-server/src/household/v2/mongo-stock-command-repository.test.ts`
- Result: Passed.
- Ran: `npm test -- --run packages/kamra-api-server/src/household/v2/mongo-stock-command-repository.test.ts`
- Result: Passed.
- Ran: `npx eslint packages/kamra-api-server/src/household/v2/mongo-stock-command-repository.ts packages/kamra-api-server/src/household/v2/mongo-stock-command-repository.test.ts packages/kamra-api-server/src/db/mongo-like.ts packages/kamra-api-server/src/test-support/fake-mongo.ts`
- Result: Passed.
- Ran: `npm test -- --run packages/kamra-api-server/src/db/mongo-transaction.test.ts packages/kamra-api-server/src/household/v2/domain.test.ts`
- Result: 8 tests passed.
- Ran: `npx eslint packages/kamra-api-server/src/db/mongo-transaction.ts packages/kamra-api-server/src/db/mongo-transaction.test.ts packages/kamra-api-server/src/household/v2/domain.ts packages/kamra-api-server/src/household/v2/domain.test.ts`
- Result: Passed.
- Ran: `npm test -- --run packages/kamra-api-server/src/household/v2/domain.test.ts`
- Result: 5 tests passed.
- Ran: `npm test -- --run packages/kamra-api-server/src/feature-toggles/service.test.ts packages/kamra-api-server/src/logging/kamra-logger.test.ts`
- Result: 5 tests passed.
- Ran: `npx eslint packages/kamra-api-server/src/feature-toggles packages/kamra-api-server/src/logging/kamra-logger.ts`
- Result: Passed.
- Ran: `npm test -- --run packages/kamra-api-server/src/feature-toggles packages/kamra-api-server/src/http/app-handler.test.ts`
- Result: 48 tests passed.
- Ran: `npx eslint packages/kamra-api-server/src/feature-toggles packages/kamra-api-server/src/database-maintenance/registry.ts packages/kamra-api-server/src/http/routes/admin-dashboard-route.ts packages/kamra-api-server/src/http/app-handler.test.ts`
- Result: Passed.
- Ran: `npm test -- --run packages/kamra-api-server/src/catalog/v2/classification.test.ts packages/kamra-api-server/src/http/app-handler.test.ts`
- Result: 47 tests passed.
- Ran: `npx eslint packages/kamra-api-server/src/catalog/v2 packages/kamra-api-server/src/database-maintenance/registry.ts packages/kamra-api-server/src/http/app-handler.test.ts`
- Result: Passed.
- Ran: `npm test -- --run packages/kamra-api-server/src/catalog/v2`
- Result: 3 tests passed.
- Ran: `npx eslint packages/kamra-api-server/src/catalog/v2`
- Result: Passed.
- Ran: `npm test -- --run packages/kamra-api-server/src/http/app-handler.test.ts packages/kamra-api-server/src/catalog/v2`
- Result: 48 tests passed.
- Ran: `npx eslint packages/kamra-api-server/src/feature-toggles/mongo-store.ts packages/kamra-api-server/src/http/routes/database-maintenance-route.ts packages/kamra-api-server/src/catalog/v2`
- Result: Passed.
- Ran: `npm test -- --run packages/kamra-api-server/src/http/app-handler.test.ts packages/kamra-api-server/src/household/v2`
- Result: 51 tests passed.
- Ran: `npx eslint packages/kamra-api-server/src/household/v2/mongo-stock-migration.ts packages/kamra-api-server/src/http/routes/database-maintenance-route.ts packages/kamra-api-server/src/database-maintenance/registry.ts packages/kamra-api-server/src/http/app-handler.test.ts`
- Result: Passed.
- Not run: Full test, lint, build, and Mongo transaction smoke; defer until the next meaningful integration unit or closeout.
- Ran: `npm run typecheck`
- Result: Passed with the transaction script included.
- Ran: `npx eslint scripts/transaction-smoke.ts`
- Result: Passed.
- Ran: `npm run smoke:transactions`
- Result: Passed manually against `kamra_dev`; rollback count 0 and committed count 2.

## Decisions

- Decision: Use a versioned `household/v2` contract area while retaining `v1` as migration input.
- Reason: This matches the approved Stage 8 cutover boundary and prevents new persistence/routes from silently inheriting the one-row stock model.
- Decision: Keep unit/date rules in small pure helpers and validators before persistence.
- Reason: Migration and atomic command code can reuse executable invariants and remain independently testable.

## Open Issues

- Issue: Cross-stage manual verification is now centralized in `.agents/plans/stage8-10-manual-acceptance-checklist.md`.
- Impact: Stage 8 is not closeable and Stage 9/10 cannot start until the relevant checklist sections and evidence are completed.
- Issue: The connection logger reports the URI default database (`test`) while the smoke correctly targets configured `MONGODB_DB_NAME` (`kamra_dev`).
- Impact: This is expected Mongo client behavior, but future operational logs should consistently include the effective application database to avoid confusion.
- Issue: Stage 8 implementation is incomplete at product level: checked-in classification content sync, household-local classification management, invitation/join management, migration reconciliation, void/reversal policy, structured domain-event coverage, Angular v2 service/UI cutover, and generated Shopping Need synchronization remain.
- Impact: The v2 backend foundation and route slices are not yet a coherent browser workflow; do not mark Stage 8 complete or begin Stage 9 implementation.
- Issue: Reusable Household Product identity is now represented by a `household_products` repository and API; product classification is revisioned and future product-backed batches inherit it while preserving batch snapshots. The grouped workspace read model now derives target aggregates server-side and exposes product/unassigned-batch hierarchy, and authenticated Home now renders that hierarchy read-only with refresh.
- Impact: Browser grouping is implemented but needs manual confirmation; product/batch editing and full migration/reconciliation still need implementation.
- Issue: Transaction smoke is useful for Mongo topology/driver/transaction-path changes but not for unrelated PRs.
- Impact: The plan/docs now recommend a separate narrowly triggered Smoke workflow, while unit transaction tests remain in secret-free App Checks.
- Issue: Stock Target CRUD is now complete at the initial backend route boundary; classification content, household management, UI cutover, reconciliation, and generated-need synchronization remain.
- Impact: Stage 8 is still not closeable, but the next backend dependency for the household workspace is now available.
- Issue: Base pack validation is implemented, but shared sync/provenance persistence and admin preview/apply are still pending.
- Impact: The pack is safe to consume in tests; it is not yet runtime classification authority.
- Issue: The checked-in base pack currently remains smaller than the plan’s final representative staple set and its admin/seed surfaces are not complete.
- Impact: Do not treat the current pack as Stage 8 closeout content until the required milk/pasta/bread/eggs/detergent/staples coverage and sync surfaces are finished.
- Issue: Base-pack sync is implemented as a reusable service but not yet exposed through admin preview/apply routes or CLI/seed registration.
- Impact: Operators cannot safely run the sync through the intended admin surface yet.
- Issue: Stage 9 and Stage 10 plans remain proposed and require their stated approval checkpoints after Stage 8 and Stage 9 close respectively.
- Impact: No Stage 9/10 code should be started in this session until those gates are genuinely reached.

## Manual actions currently testable

- Product-first: create an unclassified concrete Household Product, add two batches, classify the Product later, and verify future batches inherit classification while prior snapshots stay unchanged.
- API product anchor: create/list via `/api/households/{householdId}/products`, classify via `/classification` with `expectedRevision`, then create a batch with `householdProductId`; verify stale revisions are rejected.
- API Product identity edit: PATCH `/api/households/{householdId}/products/{productId}` with `expectedRevision`; verify display/identity changes increment Product revision without changing existing batches.
- API error contract: missing Product anchors return 404 and stale Product/Target revisions return 409 instead of being reported as generic server failures.
- Home editing slice: grouped Product rows can rename a Product, and Batch rows can correct quantity or discard through transactional commands; catalogue identity fields are preserved when only the name changes.
- Batch metadata correction: transactional correction now also accepts acquisition and expiry dates with the invariant that expiry cannot precede acquisition.
- Full regression check: `npm test` passes with 46 files and 186 tests; `npm run typecheck` passes after updating maintenance expectations for `household-products-v1`.
- Expiry policy correction: expiry-before-acquisition is now valid; `allowExpiredItems` is stored per household, defaults to true during creation/migration, is editable from grouped Home, and when false excludes expired batches from derived available totals and consumption while preserving visibility/history.
- Demo fixture: reseeding now adds two allocated milk Products under one Target, an expired-before-acquisition yogurt batch, and an unassigned no-expiry flour batch. Manual script: `scripts/stage8-demo-manual-test.md`.
- Dark-mode fix: the Stage 8 grouped workspace now uses the repository's actual theme tokens instead of undefined light-only fallbacks; build passed.
- CSS audit: the Stage 8 workspace stylesheet now keeps layout-only rules; global `ui-*` classes/tokens own panels, surfaces, text, controls, status tokens, errors, and form fields. No local color literals remain in app stylesheets.
- Home rework boundary: compact grouped v2 table and Manage household settings are in scope; v2 shopping-list selection/generation must not call the legacy v1 row-id endpoint and remains pending its dedicated bridge.
- Home compact-grid slice: the grouped v2 workspace now has a fixed header and aligned Target Current/Minimum/State columns, with collapsed Target/Batch editors; household name, multiplier, and expiry policy moved to owner-only Manage household settings.
- v2 creation repair: the Home editor now creates/edits `household_products` and optional positive-quantity Batches; empty Products are visible in Unassigned. Legacy v1 editor writes are no longer rendered on Home. Product/Target id URL encoding caused 404s for colon-containing ids and is corrected.
- Household-local Concept slice: `household_product_concepts` is registry-managed and alphabetically listed; grouped Home creates Concepts in its footer and the Product editor associates/de-associates them via household-scoped direct concept references.
- Creation allocation boundary: additional manual Batches are visible unassigned until an explicit transactional Target allocation UI is implemented; no inferred allocation from Product identity is allowed.
- Explicit existing-Product stock entry: grouped Product rows now expose `Add stock`, opening the right-side Product editor in batch-only mode. This creates a separate physical Batch without rewriting Product identity/classification or inferring Target allocation.
- Empty Product visibility coverage: the workspace read-model test now protects Product-only entries in the Unassigned group.
- Validation: `npm test -- --run packages/kamra-api-server/src/household/v2/mongo-stock-read-repository.test.ts` passed (3 tests); `npm run typecheck` passed; `npm run build:web` passed.
- Manual script: `scripts/stage8-demo-manual-test.md` now includes the explicit existing-Product `Add stock` flow and the revised sequence.
- Classification fix: Product concept checkboxes now use standalone Angular form bindings with an explicit boolean setter; repository coverage confirms create-time direct concept references are retained.
- Concept uniqueness: household-local Concept creation now rejects duplicate normalized keys with a `409` conflict, including database unique-index races, and the UI reports that the name already exists.
- 2026-07-12 UX decision: Home is Stock Target-first, not Product Concept-first. Product Concepts remain persisted classification/tagging vocabulary but are removed from the household stock workspace until seeded catalogue classification receives a dedicated MVP design. The primary editing hierarchy is Stock Target/Unassigned → Household Product → Stock Batch; allocation remains Batch-level and explicit.
- Stock Target-first table slice: Home no longer creates or assigns Product Concepts. It creates Stock Targets inline, supports in-row Target rename with save/cancel icon actions, and exposes minimum/target/unit through a details icon. `npm test` (47 files/190 tests), typecheck, and web build passed.
- Manual page: `/manual` is linked above About in the right rail. Its Household & shopping tab is public, while its Product & ingestion tab is enabled only for admins; both English and Hungarian vocabulary use the project’s current domain terminology.
- Client activity console: a resizable left-rail window records concise browser activity with `HH:mm` timestamps and mirrored browser-console output. Browser logger `debug`/`info` entries are local by default; `warn`/`error` also forward with a session client id and route. Target/Product/Batch mutations now log start, success, and failure outcomes.
- Activity console level treatment: debug, info, warn, and error rows use faded theme-aware status backgrounds and matching text colors, aligned with the household stock-state visual language.
- Activity console resize refinement: only the scrollable log-output field is vertically resizable; the console header/card no longer carries the resize handle. Web build passed.
- Manual rail visibility fix: Manual and About now share one sticky right-rail reference stack, with Manual structurally above Project note instead of both cards competing for the same sticky position. Web build passed.
- Manual rail anchoring refinement: the right rail now uses a column flex layout so the combined Manual/Project note stack is pushed to the bottom together. Web build passed.
- About dark-mode contrast: the About hero mark/info panel now derives its background from the theme-aware panel surface instead of mixing in a fixed light color. Web build passed; visually confirm the quoted pantry-helper text in both themes.
- Router outlet spacing fix: the empty Angular `router-outlet` host was participating as a stretched first CSS-grid row inside `.page-scroll`; it is now `display: contents` so routed pages start consistently at the top. Web build passed; compare all standard pages with Dev Admin manually.
- Manual/About visual refinement: Manual now uses the About-style translucent hero and a connected tab strip/content panel; shared UI buttons no longer inherit link underlines when rendered as anchors. Web build passed; visually check About actions and both Manual tabs in light/dark themes.
- Compact page headers: shared page shells now use a smaller title scale and tighter vertical rhythm; About’s hero no longer enforces a tall desktop minimum, and Manual’s hero padding is reduced. The routed content remains the area that can expand; web build passed. Visually compare standard page headers with Dev Admin.
- Grid stretch correction: Manual’s hero and tab strip now size to content, while the tab content panel receives the remaining page height; About’s hero content is also top-aligned within its compact row. Web build passed; visually confirm there is no oversized blank hero or tab header area.
- Seed validator repair: adding `allowExpiredItems` changed an already-completed household validator, so `household-expired-item-policy-v1` now independently upgrades the validator and backfills the permissive default before demo reseeding.
- API grouped workspace: GET `/api/households/{householdId}/stock-workspace`; verify target totals are derived from active allocations, allocated batches group under their Household Product, and unallocated batches remain visible.
- Browser Home: sign in, select a household, confirm the grouped Stage 8 workspace appears above the legacy controls, refresh it, and verify target/product/batch/unassigned hierarchy.
- Need-first: create a generic Stock Target and unanchored opening batch, then identify concrete Household Products and allocate later batches to the same target without rewriting opening history.
- Verify grouped Home hierarchy: Stock Target groups first, Household Products beneath, individual Batches beneath Products, plus visible unassigned/unclassified groups; target current amount is derived/read-only.
- Run `npm run smoke:transactions` against an approved disposable database and record rollback 0, commit 2, cleanup, and effective database name.
- Do not close Stage 8 until the full cross-stage checklist at `.agents/plans/stage8-10-manual-acceptance-checklist.md` is confirmed or explicitly waived item by item.

## Roadmap Or Plan Updates

- Needed: The active Stage 8 plan now contains the approved Home Stock Group/Product/Batch redesign gate. The broad roadmap order is unchanged.
- Status: Stage 8 remains in implementation. Transaction validation is cleared and the interim allocation-based grouped workspace is committed, but it is not the final Home editor; direct Product→Stock Group membership, migration/reconciliation, and the full table/composer redesign remain before manual closeout.

## Next Step

Do not extend the interim allocation-based Home editor. Start the approved Stock Group/Product/Batch cutover described below: direct Product-to-Stock-Group membership and nested Group rollup must land before the requested three-layer table and three-block composer.

## Planned Home UI/UX redesign handoff (2026-07-12)

### Final terminology correction: Product Groups own optional target policies

The final first-layer entity is **Product Group**, not Stock Group or Stock Target. A Group and a Household Product each own an optional embedded target policy (tracking unit, minimum, desired restock amount, and relevant policy settings). A missing policy is valid and means neutral/not-tracked. This removes the separate current Stock Target entity from normal runtime ownership.

A Product has zero or one direct `productGroupId`; every normal Batch belongs to a Product. Group totals roll up direct/descendant Product quantities once. Generated Shopping Needs reference the Product Group or Product target-policy owner. Parent/child Group and Product targets must plan bottom-up with a parent residual to avoid duplicate needs. Current `StockTarget`/`StockAllocation` records are cutover/history input only; conflicting legacy multi-target Product histories require explicit resolution and never silently count through both paths.

### Why the current Home UI does not match the requested rework

The current grouped table and one-block right-side Product editor are an interim Stock Target implementation. They group a Product only through its individual Batch allocations. That model cannot safely provide the requested Product Group dropdown, automatic grouping of later Batches, nested Groups, or the requested three separate right-side blocks. The missing “add Product on Concept row” is also terminology drift: Home must use **Stock Group**, not Product Concept, as its first layer.

### Final implementation design

- Home hierarchy is exactly **Stock Group (plus Unassigned) → Household Product → Stock Batch**. Product Concepts stay deferred tagging/classification vocabulary and do not appear in this workspace.
- A Product has one optional direct Stock Group. Batches always belong to a Product. Groups may nest; stock rolls up to ancestors once. Product and Group both have their own derived current/minimum/state; Batch fields remain quantity/unit/Stocked at/Expiry/history.
- The old live Batch→Target allocation mechanism must be migrated/reconciled and retired from Home before the UI rework. Keep historical allocation/movement evidence; unresolved multi-target legacy Products stay Unassigned for an explicit operator/user choice.
- Left table is the primary CRUD surface. Group rows get pencil/save/X, magnifier-plus/minus details, and product-plus. Product rows get pencil/save/X, magnifier-plus/minus identity/details, Group dropdown, and stock-plus. Batch rows get quantity/unit/dates plus pencil/save/discard only. All actions are fixed-size accessible icon buttons.
- The right side becomes three joined blocks: Stock Group, Product, Stock Batch. New blocks add; selected persisted rows save. Group name seeds a pristine Product name only; Batches have no name. Batch Add can atomically create missing parent Group/Product; Group Add creates only Group; Product Add creates only Product (and an explicitly selected unsaved Group if needed).
- Table selection populates the corresponding composer blocks: Group clears lower drafts; Product populates Group+Product; Batch populates all three. `Unassigned` clears/disables the Group block. Both surfaces share one draft/command service and refresh the same read model after save.

### Required next-run order

1. Implement direct Product→Stock Group + nested Group data migration, validators, transaction commands, reconciliation reporting, and route/read-model tests.
2. Replace the left table with the three-level inline editor and icon semantics.
3. Replace the right-side Product editor with the three-block composer; remove the obsolete batch-only/inferred-target paths.
4. Reseed and run the newly listed manual flows, then update the single acceptance checklist with evidence.

The full implementation contract, migration behavior, icon semantics, composer rules, and manual acceptance criteria are in the active plan under **Home Stock Group / Product / Batch redesign (implementation gate, 2026-07-12)**. No implementation was started in this planning update.

## Notes For Future Agent

- Until the Stock Group cutover is migrated, aggregate stock only from active Stock Allocations; never infer counted quantity from classification matches. After the cutover, Group aggregates come only from direct Product membership plus ancestor rollup—never from both allocation and membership paths.
- `is_a` is child-to-parent and effective concepts are inclusive; attributes remain independent.
- Keep the manual-check list current when UI or live Mongo behavior is introduced.
