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
- Item: Added the Product Group/target-policy contract slice: optional embedded target policies on Product Groups and Household Products, direct Product Group membership fields/indexes, Product Group maintenance registry setup, and an idempotent legacy reconciliation that links unambiguous Products, wraps anonymous Batches in generic Products, and reports multi-target Product conflicts. Focused repository tests (4) and typecheck passed.
- Item: Added the Product Group read model alongside the interim allocation read model. It derives Product/Group quantities from Product-owned Batches, rolls recursive ancestor groups once, keeps no-policy owners neutral, and exposes a parallel `productGroupWorkspace` route payload. Read-model tests (2) and typecheck passed.
- Item: Home now reads the Product Group workspace payload and renders Product Group → Product → Batch rows with recursive indentation, fixed columns, symbolic detail/add/select actions, Product identity details, neutral no-policy state, and existing Batch correction/discard controls. Product Group collection/mutation routes and Product assignment/target-policy request validation were added; typecheck and web build passed.
- Item: Replaced the one-block right-side Product editor with connected Product Group, Household Product, and Stock Batch composer blocks. Group/Product target-policy controls, Product Group assignment, GTIN/catalogue-id/note details, and explicit Batch quantity/date fields are present with left-facing Add/Save actions. Typecheck and web build passed. The compound create-all path still needs one server transaction command.
- Item: Added the idempotent transactional Product Composer command for the new Product + initial Batch path, including optional new Product Group, Movement, and operation receipt. The composer now uses it instead of sequential parent creation. Focused tests (4), typecheck, and web build passed.
- Item: Wired Product Group row selection into Home and the composer, so Group actions populate the top editor block while Product selection populates Product details. Typecheck and web build passed.

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

- Needed: The active Stage 8 plan now contains the final Product Group/embedded-target-policy redesign. The broad roadmap order is unchanged.
- Status: Stage 8 remains in implementation. Transaction validation is cleared and the interim allocation-based grouped workspace is committed, but it is not the final Home editor; direct Product→Product Group membership, migration/reconciliation, and the full table/composer redesign remain before manual closeout.

## Next Step

Do not extend the interim allocation-based Home editor. Start the approved Product Group/Product/Batch cutover described below: direct Product-to-Product Group membership and nested Group rollup must land before the requested three-layer table and three-block composer.

## Planned Home UI/UX redesign handoff (2026-07-12)

### Final terminology correction: Product Groups own optional target policies

The final first-layer entity is **Product Group**, not Stock Group or Stock Target. A Group and a Household Product each own an optional embedded target policy (tracking unit, minimum, desired restock amount, and relevant policy settings). A missing policy is valid and means neutral/not-tracked. This removes the separate current Stock Target entity from normal runtime ownership.

A Product has zero or one direct `productGroupId`; every normal Batch belongs to a Product. Group totals roll up direct/descendant Product quantities once. Generated Shopping Needs reference the Product Group or Product target-policy owner. Parent/child Group and Product targets must plan bottom-up with a parent residual to avoid duplicate needs. Current `StockTarget`/`StockAllocation` records are cutover/history input only; conflicting legacy multi-target Product histories require explicit resolution and never silently count through both paths.

### Why the current Home UI does not match the requested rework

The current grouped table and one-block right-side Product editor are an interim Stock Target implementation. They group a Product only through its individual Batch allocations. That model cannot safely provide the requested Product Group dropdown, automatic grouping of later Batches, nested Groups, or the requested three separate right-side blocks. The missing “add Product on Concept row” is also terminology drift: Home must use **Product Group**, not Product Concept, as its first layer.

### Final implementation design

- Home hierarchy is exactly **Product Group (plus Unassigned) → Household Product → Stock Batch**. Product Concepts stay deferred tagging/classification vocabulary and do not appear in this workspace.
- A Product has one optional direct Product Group. Batches always belong to a Product. Groups may nest; stock rolls up to ancestors once. Product and Group each own an optional embedded target policy and have derived current/minimum/state when tracked; Batch fields remain quantity/unit/Stocked at/Expiry/history.
- The old live Batch→Target allocation mechanism must be migrated/reconciled and retired from Home before the UI rework. Keep historical allocation/movement evidence; unresolved multi-target legacy Products stay Unassigned for an explicit operator/user choice.
- Left table is the primary CRUD surface. Group rows get pencil/save/X, magnifier-plus/minus details, and product-plus. Product rows get pencil/save/X, magnifier-plus/minus identity/details, Group dropdown, and stock-plus. Batch rows get quantity/unit/dates plus pencil/save/discard only. All actions are fixed-size accessible icon buttons.
- The right side becomes three joined blocks: Product Group, Product, Stock Batch. New blocks add; selected persisted rows save. Group name seeds a pristine Product name only; Batches have no name. Batch Add can atomically create missing parent Group/Product; Group Add creates only Group; Product Add creates only Product (and an explicitly selected unsaved Group if needed).
- Table selection populates the corresponding composer blocks: Group clears lower drafts; Product populates Group+Product; Batch populates all three. `Unassigned` clears/disables the Group block. Both surfaces share one draft/command service and refresh the same read model after save.

### Required next-run order

1. Implement direct Product→Product Group + nested Group data migration, optional Group/Product target policies, validators, transaction commands, reconciliation reporting, and route/read-model tests.
2. Replace the left table with the three-level inline editor and icon semantics.
3. Replace the right-side Product editor with the three-block composer; remove the obsolete batch-only/inferred-target paths.
4. Reseed and run the newly listed manual flows, then update the single acceptance checklist with evidence.

The full implementation contract, migration behavior, icon semantics, composer rules, target-policy ownership, and manual acceptance criteria are in the active plan under **Final Product Group target-policy model (2026-07-12)**. No implementation was started in this planning update.

### Design safeguards and resolved uncertainty

- `desiredQuantity` is a restock destination, not a hard maximum. Current stock may exceed it without becoming invalid.
- A Group or Product may have no target policy. It still shows derived current stock; its state is neutral and it does not create a Shopping Need.
- Parent/child Group and Product targets are not additive. Shopping planning is bottom-up: satisfy the most specific Product/child Group policies, then create only the parent Group's residual shortage. Warn on incompatible parent/child settings instead of silently changing either policy.
- Group tracking units are required even without a target policy. Product assignment validates compatible units; only the existing narrow conversions are automatic.
- The migration must stop/report rather than guess when one Product's live Batch history points to multiple legacy Targets. Normal runtime never reads allocation and Product Group membership as two counting sources.

## Notes For Future Agent

- Until the Product Group cutover is migrated, aggregate stock only from active Stock Allocations; never infer counted quantity from classification matches. After the cutover, Group aggregates come only from direct Product membership plus ancestor rollup—never from both allocation and membership paths.
- Composer context repair: when a Product is created from a selected Product Group, the draft now carries that Group id; when saving a new Product from a Group context, the Group is created first only when needed, then the Product is linked to it. Typecheck and web build passed.
- Batch composer selection: clicking a persisted Batch now populates the Product Group, Product, and Stock Batch composer blocks; saving that selection corrects the existing Batch instead of creating a duplicate. Product creation from a Group row now retains the selected Group context.
- Product Group integrity guard: Group target policies must use the Group tracking unit, and Group updates now walk the complete parent chain to reject indirect cycles or missing parents. Focused Product Group/read-model tests and typecheck passed.
- Product target-unit correction: Product drafts now own an explicit tracking unit for their optional target policy and persist it as the Product default unit; atomic Product+Batch creation validates the same policy/unit relationship instead of deriving Product policy units from whichever Batch happens to be entered.
- Regression expectations: the full suite now includes the Product Group maintenance validator/migration pair; `npm test` passes with 49 files and 194 tests, and typecheck passes.
- Final implementation checkpoint for this run: `npm run build:web` passes. Product Group/Product/Batch direct-membership read model, three-block composer, persisted Product target units, batch selection/editing, hierarchy-cycle checks, and maintenance registry coverage are committed. Manual confirmation remains required for seeded data, real Mongo migration/reconciliation, dark/light Home layout, and end-to-end create/edit/reassign flows.
- Planning alignment: Stage 9 now proves the direct one-Shop-Market trip/purchase loop before separate Shop Chain/Ingestion Source entities, global classification promotion, or multi-market fixtures; Stage 10 hardens only observed Alpha risks; post-MVP notes use the Product Group model rather than legacy Stock Target/Allocation assumptions.
- Update-failure root cause: Product and Product Group ids contain `:` and are percent-encoded by the browser service. The v2 routes were using encoded path captures for repository lookup, producing false not-found responses. Relevant route segments now decode before lookup; lint and typecheck pass.
- Home refinement checkpoint: Product Groups now default expanded while Products default collapsed until their stock is requested; empty rows have no inert disclosure; stock quantity/Stocked at/Expiry labels are explicit; unassigned is a non-aggregate pseudo-group; stock and empty-shopping sections are collapsible; and the three composer blocks use compact icon save/add/reset actions with collapsible content. Typecheck and web build passed.
- Deletion command slice: v2 Group deletion unassigns direct Products and detaches child Groups; Product deletion removes its owned Stock Batch records; Batch deletion continues through the history-aware discard command. The workspace confirms each action and logs entity context. Focused repository tests, lint, and typecheck passed.
- Home layout refinement: the Product Group hierarchy and the three-block editor now share one responsive two-column container; narrow layouts stack them. The left-rail activity display is newest-first so the most recent action is visible without scroll management. Typecheck and web build passed.
- Composer action intent: Add Product from a Product Group row now explicitly opens the Product editor with that Group preselected instead of opening the Group editor. Typecheck and web build passed.
- Stock comparison columns: Group and Product rows now use aligned `Minimum < Current < Target` columns, including the optional desired-restock value; Batch rows retain the same grid with Quantity, Stocked at, and Expiry labels. Typecheck and web build passed.
- Stock header alignment correction: the nested Stock batch header now applies the same depth indentation as the first batch-row cell, keeping “Stock batch” aligned with its data while preserving the shared grid columns. Typecheck and web build passed.
- Home corrective refinement (current): correction/discard routes now decode percent-encoded Batch ids, removing false 404s for colon-containing ids. Group and Product pencils enter an inline name/Product-Group save-cancel mode while also loading the matching right-side block. Batch pencils make Quantity, Stocked at, and Expiry editable in the row and load the right-side Batch block. Product rows no longer open an editor by clicking their label.
- Batch semantics/display: expiry may precede Stocked at, expired Batches sort first, then future expiry, then no-expiry Batches; expired expiry dates use the danger tone. Focused command/read-model tests cover both cases.
- Home legibility/layout: comparison glyphs now reflect minimum/desired-restock health, Current receives a subtle emphasis, Active household is structurally above the right-side three-block editor, and expanded stock/shopping panels share available vertical space while a collapsed Shopping list leaves stock the remainder.
- Settings/diagnostics: Manage household now confirms successful settings saves with a toast and reports failures there as well. Composer activity messages include the affected Product Group or Product name.
- UI-label feature toggle: `useAbbreviatedUiLabels` is a typed, global, default-off flag exposed in Dev Admin and delivered in the authenticated Product Group workspace payload. It shortens stock-state labels only when enabled; storage failure remains compact-labels off.
- Manual verification was rewritten at `scripts/stage8-demo-manual-test.md` for the Product Group UI. It explicitly marks moving shopping selection checkboxes into the v2 table as an unfinished Stage 8 follow-up rather than a verified behavior.
- Manual verification result (2026-07-12): Product Group terminology, expansion behavior, Product reassignment, Group rename, and right-side Product selection were confirmed. Follow-up fixes now preserve the inline Group dropdown selection with `ngModel`, expose Group tracking/target fields in expanded edit details, use defined theme tokens for comparison colors, and align Batch Quantity with the Current column.
- Feature/batch repair (2026-07-12): the legacy feature-flag validator/schema now recognizes `useAbbreviatedUiLabels`. Batch correction now permits legitimate corrections above original acquisition quantity and returns a validation response rather than a server error for invalid quantities. The focused repository regression covers the higher correction plus expiry-before-acquisition case.
- Stage 9 bridge start (2026-07-12): Shopping Need contracts now carry an explicit owner kind/id/display snapshot for Product Groups and Household Products while preserving `stock_target_legacy` for historical needs. The pure target-policy generator produces owner-based needs without a Shop/Product/Purchase side effect. This is the first required seam before replacing the legacy Home shopping-list selector.
- PR-readiness audit (2026-07-12): added the missing path-filtered/manual `Transaction Smoke` GitHub workflow promised by operations documentation. The remaining non-deferrable delivery gap is the direct owner-based Shopping Need regeneration plus Shopping Trip/purchase path; Home still invokes legacy `household_stock_items` shopping-list generation and must not be called complete until that flow is replaced or explicitly removed from the user path.
- API regression verification (2026-07-12): `app-handler.test.ts` now exercises the exact `useAbbreviatedUiLabels` admin update and end-to-end encoded Batch correction/discard HTTP paths against a fake Mongo transaction client. This covers the user-observed flag rejection and 404/500 batch route regressions without browser testing.
- Stage 9 Shop Market foundation (2026-07-12): added direct `ShopMarket` contracts, the `shop_markets`/`household_shopping_trips` v2 collection names, indexed Mongo repository, and `shopping-trip-foundation-v1` maintenance validator/migration action. This is intentionally separate from legacy household shop labels and is the first prerequisite for replacing Home’s legacy shopping selector.
- `is_a` is child-to-parent and effective concepts are inclusive; attributes remain independent.
- Keep the manual-check list current when UI or live Mongo behavior is introduced.
- Localization pass (2026-07-12): Stage 8 Product Group workspace, three-block composer, and Manage household settings now route visible labels, editor actions, state text, validation fallbacks, and confirmations through paired English/Hungarian household translation keys. Typecheck, lint, web build, and the full 50-file/198-test suite pass.
- Demo and clarity refinement (2026-07-12): simplified the Group detail wording to “Calculated from / Products and batches”; disabled already-empty composer clear actions; rejected duplicate impulse names with an activity-console entry while preserving the draft; enlarged comparison symbols and added good/danger state surfaces; and expanded the demo to six Groups, fifteen Products, and eighteen owned Batches covering target/no-target/empty/ungrouped/multi-expiry cases.
- Formatting standard (2026-07-12): added Prettier with repository-wide `npm run format` and `npm run format:check` scripts, print width 100, and `trailingComma: none`. Writable project files were formatted; `.agents` remains ignored because it is managed read-only in this workspace.
- Home follow-up fixes (2026-07-12): About action alignment, true Shopping list/Household stock panel collapse, title-row Refresh and compact Manage household gear action, slim Unassigned Products separator, editor reset synchronization after either save surface, removal of the productless demo batch, and required Product ownership for newly validated v2 batches. Manual checks were added to `scripts/stage8-demo-manual-test.md`; typecheck, lint, web build, and 198 tests pass.
- Batch-grid spacing fix (2026-07-12): batch rows and their subheader now use dedicated Stocked at and Expiry columns, preventing date overlap while keeping Quantity aligned with the product Current column. Lint and web build pass.
- Batch/product detail refinement (2026-07-12): Batch rows now expose magnifier, pencil, and discard actions without entering edit mode; Stocked at is shown in the expandable Batch details row and remains editable from the pencil flow. Product detail editing now persists GTIN and Note as well as name and Group. The obsolete household-panel “Loaded N stock rows” status was removed from the load path; mutation feedback remains available.
- Table density refinement (2026-07-12): removed the low-value nested Stock Batch header; Group/Product rows now use compact Minimum < Current < Target columns followed by one Unit column. Batch Quantity reuses the Current column and Batch Expiry spans the Unit/State area, keeping the action column aligned. Manual vocabulary cards were tightened for scan-friendly reading.
- Group shopping policy and Home bridge (2026-07-12): household settings now persist `groupTargetShoppingMode`, defaulting to `add_products_and_group_item`; the Manage household page exposes Product-and-Group-item, Product-only, and Ignore Group targets choices. The v2 Shopping Need generator applies Product shortages first, recalculates Group shortage, splits residual need across already-planned Products, chooses the earliest-expiring stocked Product otherwise, and creates a Group impulse need only in the default mode when no Product exists. When v2 Product Group data exists, the visible Home generation route now creates a compatibility shopping list from these needs, and purchase application creates/reuses Household Products and acquires v2 Stock Batches transactionally. Validator/migration coverage uses `household-group-shopping-policy-v1`; expiry remains editable after purchase.

## Current closeout status (2026-07-12)

Stage 8 user-side implementation is complete on `eff796b`. The Home Product Group →
Household Product → Stock Batch workspace now supports the basic household loop: generate,
edit, and finalize a shopping list, with purchased lines creating or reusing Products and
Product-owned Batches. Remaining Stage 8 work is manual/browser verification and narrowly
scoped bug fixing only.

Stage 9 is intentionally separate. It adds Shop Markets, Shop Products, Price Observations,
Shopping Trips, and admin-reviewed Purchase Ingestion for finalized trips. It must reuse the
Stage 8 Product/Batch finalization commands and must not be treated as a prerequisite for the
basic Home shopping experience.

## Stage 9 matcher and override checkpoint (2026-07-13)

- `b0dbb53 feat: wire shopping trip product matching` connects the tested matcher and applicable-price selection to Trip creation and the Home Trip panel. Trip Items now show package count, expected total, price state, and localized explanation data.
- `414bb92 feat: support shopping trip match overrides` adds compatible match options, server-owned re-selection, and an explicit unresolved-line skip path. A user can select another compatible Shop Product before continuing; the server recalculates the selected package and price fields under optimistic revision checks.
- Validation for the matcher/override slice: `npm run typecheck`, `npm run lint`, `npm run format:check`, focused matcher/trip tests (5 passed), and `npm run build:web` pass.
- Stage 9 implementation is now complete. Remaining work is configured database/API/browser acceptance, realistic seed/compatibility evidence, and narrowly scoped bug fixing. Stage 10 may proceed as bounded hardening, but a failed Stage 9 correctness check remains owned by Stage 9.

## Stage 10 continuous workflow checkpoint (2026-07-13)

- The Stage 10 plan now defines a single-agent continuous execution loop: inspect, implement one slice, validate, update this session, commit, and continue automatically when no decision, private/configured environment, destructive action, unexplained validation failure, or manual/browser evidence is required.
- The ordered Stage 10 slices and commit boundaries remain in `2026-07-11-stage-10-alpha-hardening-plan.md`; the new workflow explicitly prohibits amend, push, reset, checkout, force operations, and history rewriting.
- The central manual acceptance checklist remains the source of truth for Stage 8–10 human verification. Add only concrete newly testable actions there; do not create competing checklists in this session file.

## Stage 9 user-based purchase alternative checkpoint (2026-07-13)

- The current uncommitted slice adds a persisted `purchaseHouseholdProductId` choice to Trip Items. Home loads the household’s existing Products, lets the shopper choose one for the actual purchase, or explicitly choose creation of a new Household Product.
- Trip completion validates and reuses the chosen Product, records the resulting Product id on the Trip Item, and otherwise reuses a Household Product linked to the matched catalog Product before creating a new identity.
- Validation passed: 55 test files / 211 tests, `npm run format:check`, `npm run typecheck`, `npm run lint`, `npm run build:web`, and `npm run build:api`.
- Commit is pending because the managed elevated Git reviewer was unavailable due capacity. Do not use amend, push, reset, checkout, or any workaround; stage these files and create one new commit when the approved additional-commit path is available.

## Stage 10 Step 1 checkpoint (2026-07-13)

- The Stage 9 wrapup commit is `f130abc`; the working tree was clean before this slice.
- `docs/alpha-hardening-baseline.md` records the passing validation baseline and assigns observed risks to later Stage 9/10 slices. The most important findings are missing Crawl Snapshot archive tooling, the raw Market-id Home entry, an incomplete actual-result editor, route-owned shopping orchestration, unbounded Product lookup/match options, and transitional legacy Shopping List/Trip coexistence.
- Baseline validation passed: 55 test files / 211 tests, formatting, lint, typecheck, web build, and API build. Configured Mongo/browser/archive checks remain intentionally unrun and are tracked in the central manual checklist.
- Next safe slice: implement verified read-only Crawl Snapshot export with manifest/checksum tests. Do not rename or import raw data until the export evidence is independently verified.

## Stage 10 Step 2 checkpoint (2026-07-13)

- Commit `da33cae feat: export verified crawl archives` adds the reusable read-only exporter and `npm run crawl:export`. It streams the raw `ingestion_runs` and `ingestion_raw_snapshots` collections in bounded pages, emits stable gzip JSONL plus a last-written manifest, verifies source counts, and records uncompressed SHA-256 checksums.
- The exporter refuses a non-empty destination and generated `.artifacts/` output is ignored by Git. `scripts/README.md` documents the command and operational safety boundary.
- Focused archive tests pass, including checksum/decompression shape and non-empty-directory rejection. Full validation passed: 56 test files / 213 tests, lint, format check, typecheck, API build, and web build.
- The full isolated-database restore drill is intentionally not claimed yet: the importer does not exist until Stage 10 Step 6. The archive inspection test is the available round-trip evidence for this slice.
- Next safe slice: finalize the `alpha-domain-language-v1` maintenance entry and deterministic cutover/reset support, but preserve raw ingestion collections and stop on any identity or checksum conflict.

## Stage 10 Step 3 checkpoint (2026-07-13)

- The final domain dictionary now states the runtime truth: Product Groups own target policy, Household Products own reusable identity and optional target policy, Stock Batches belong to Products, Shopping Trips/Trip Items are the current purchase-history envelope, and Ingestion Submissions are catalogue-review evidence. It explicitly records `household_local_products`, `household_stock_items`, Stock Targets, and Stock Allocations as migration/compatibility terms rather than new Home concepts.
- Commit pending in this slice adds `alpha-domain-language-v1` to the maintenance registry, `MongoAlphaDomainLanguageMaintenance`, matching admin actions, and `npm run maintenance:alpha-domain-language`. Preview is default; apply requires `--apply --target=<configured database> --operator=<identity>`. The action composes existing stock, Household Product, and Product Group migrations in that order, preserves legacy collections, and reports counts/conflicts.
- Focused maintenance tests and full validation are green: 57 test files / 215 tests, lint, format check, typecheck, and API build.
- The repository still contains old allocation routes/repositories as an explicit compatibility boundary. Do not rename or delete them without configured-data evidence that no supported client or unresolved legacy history depends on them. The next safe slice is the read-only Crawl Snapshot quality audit and correction-overlay schema; operator execution of this cutover remains a configured-environment check.

## Stage 10 Step 4 checkpoint (2026-07-13)

- The read-only ingestion quality slice adds `auditIngestionQuality`, `ingestion-correction-overlay-v1`, `npm run audit:ingestion-quality`, and `docs/crawl-data-quality.md`. The audit pages raw runs/snapshots in bounded chunks, reports identity/provenance/row/price/date/identifier issues, and caps returned issue detail; it never mutates MongoDB or raw payloads.
- Correction overlays are separately validated normalized-field records keyed by snapshot id, row index, and source fingerprint. Raw `payloadText` and unknown fields are rejected; applying overlays remains deferred to the future import/reprocessing step.
- Full validation passed: 58 test files / 217 tests, lint, typecheck, API build, web build, and format check. The configured database audit has not been run and is intentionally left as operator evidence.
- Next safe slice: source-specific parser/normalizer corrections only after the audit report identifies a concrete defect. Do not invent parser fixes from sanitized tests alone; if no configured report is available, proceed to importer/reprocessing infrastructure instead.

## Stage 10 plan revalidation checkpoint (2026-07-13)

- The Stage 10 plan now contains an explicit MVP-hole revalidation table and Step 4A gate. It records that the Home Trip path still needs a household-visible Shop Market picker, compact actual-result editing (quantity/unit/paid price/acquisition/expiry), an unplanned-purchase path, bounded match options, focused catalogue-to-Household Product lookup, and legacy Shopping Need/list equivalence evidence before Alpha closure.
- The plan also adds Step 8A for a bounded frontend facelift: reuse shared theme tokens/classes, remove repeated hardcoded color/layout values, simplify CSS/HTML where semantics stay clear, and verify light/dark/focus/responsive behavior. It must not change domain or endpoint behavior.
- The roadmap/domain wording now treats Trip Items as the current purchase-history envelope; no separate Purchase aggregate is claimed. Archive, cutover, and audit tools remain implemented-but-configured-evidence-open.
- No implementation was started for the new plan steps in this planning update. The existing validated audit slice remains uncommitted from the previous Git reviewer-capacity block; commit it before beginning Step 4A or Step 8A.

## Stage 10 Step 4A backend safety checkpoint (2026-07-13)

- The Step 4A backend slice bounds Shopping Trip match options to 12 and persists `matchOptionsTruncated` so large candidate sets remain explicit and safe to render. The direct override path still validates any selected Shop Product server-side.
- `MongoHouseholdProductRepository.findFirstByCatalogProductId` uses the existing household/catalog index and deterministic ordering. Trip completion no longer loads every Household Product for the catalogue fallback.
- Focused validation passed: matcher/repository tests (6 passed) and `npm run typecheck`.
- Next slice: expose household-visible active Shop Markets and replace the Home Trip raw-id field with a picker; then add the actual-result/unplanned purchase editor.

## Stage 10 Step 4A household Trip safety checkpoint (2026-07-13)

- The household-visible Trip slice is now implemented: active Shop Markets are served through `GET /api/households/:id/shop-markets` and selected from a localized Home picker; raw market-id entry is removed.
- Trip Items now expose a compact actual-result editor for quantity, unit, paid price, currency, acquisition, and expiry. The same fields are persisted on the Trip Item, used when creating the Product-owned Stock Batch, and copied to the pending Ingestion Submission.
- In-progress Trips can add idempotent unplanned purchases. They become normal Trip Items and can be finalized into a new Household Product and Stock Batch without bypassing the Trip workflow.
- Match options remain bounded at 12 with explicit truncation metadata; completion uses the focused catalog-product lookup from the previous checkpoint. Domain coverage includes an idempotent unplanned-item test.
- Validation for this unit: focused domain/matcher/repository tests pass, `npm run typecheck`, `npm run lint -- --max-warnings=0`, and Prettier formatting pass. Full suite/build and the authenticated browser/configured Mongo checks remain next evidence.
- Next safe slice: run full validation and commit this unit, then prove/isolate the legacy Shopping Need/list boundary before the Step 8A frontend-only facelift.

## Stage 10 Step 6 archive import checkpoint (2026-07-13)

- `packages/kamra-api-server/src/ingestion/archive/crawl-archive-import.ts` and `npm run crawl:import` now provide a dry-run-first importer for the verified Crawl Snapshot archive. It verifies the manifest, exact archive file names, gzip JSONL checksums, and record counts before planning writes.
- Import is limited to `ingestion_runs` and `ingestion_raw_snapshots`; identical records are skipped, stable run/snapshot identity or content conflicts are reported without writes, and apply requires both `--apply` and an exact `--target=<database>` match. Derived Products and Price Observations are intentionally excluded.
- Focused archive tests cover dry run, apply, repeat no-op behavior, checksum-backed export/import, and raw identity conflict protection. Typecheck passes.
- Remaining Step 6 work is correction-overlay application/parser reprocessing and configured clean-database restore evidence; no archive was imported into a real database in this session.
- Next safe slice: add overlay-aware reprocessing into the existing source processing pipeline, or stop if a concrete parser/data defect requires a configured audit report first.

## Stage 10 Step 6 overlay-aware reprocessing checkpoint (2026-07-13)

- Reviewed `ingestion-correction-overlay-v1` records can now be loaded from JSONL by `scripts/process-ingestion.ts` with `--reprocess --overlay-file=<path>`. The loader validates each record, rejects duplicate snapshot/row keys, requires selected snapshots, and refuses overlay use without reprocessing.
- `applyIngestionCorrectionOverlays` verifies the current snapshot/row source fingerprint, rejects stale or duplicate/out-of-range overlays, applies only the reviewed normalized fields to a cloned snapshot, and leaves raw Mongo data untouched. Existing deterministic `processSourceOfferSnapshot` processing then writes the normal reviewable catalog dataset.
- Audit and processor tests pass for valid correction, raw immutability, stale fingerprint rejection, malformed overlays, and existing deterministic outputs. Configured overlay generation, real parser/source regression selection, and clean-database reprocessing remain operator/review evidence.
- Next safe slice: targeted backend change-locality or schema/compatibility cleanup from the Alpha baseline; do not invent source parser changes without a concrete audit report.

## Stage 10 Step 7 backend locality checkpoint (2026-07-13)

- Shopping Trip creation no longer owns matching policy and response-shaping details in the HTTP route. `shopping-trip-planning.ts` builds explicit Trip Items from open Shopping Needs, Shop Products, price observations, bounded match options, and truncation metadata.
- The route still owns request authentication, market/need loading, optimistic persistence, and direct match override validation. No generic framework or behavior change was introduced.
- Pure planning coverage passes for package math, expected total, selected catalog Product, and explicit match options. Full validation remains the next commit gate.

## Stage 10 Step 8A frontend token checkpoint (2026-07-13)

- The global stylesheet now owns the missing `--space-1`, `--ui-border`, and `--ui-surface-muted` compatibility tokens used by existing compact surfaces. Dark mode overrides resolve through the same theme-aware line/surface tokens.
- The Home Trip panel now uses the canonical `--line-panel` and `--surface-soft-background` values directly instead of undefined local `--ui-*` references. No markup, endpoint, or persistence behavior changed.
- Remaining Step 8A evidence is browser light/dark/focus/responsive confirmation; larger Home layout changes stay post-MVP unless manual review identifies a concrete usability defect.

## Stage 10 Step 11 release documentation checkpoint (2026-07-13)

- Added the Alpha reviewer/operator surface: README demo journey and safety notes, `CONTRIBUTING.md`,
  `SECURITY.md`, `docs/alpha-operations.md`, and `docs/alpha-release-checklist.md`.
- Updated `.agents/plans/mvp-followups.md` to distinguish implemented archive/export foundations from
  the still-open configured restore drill, browser/configured acceptance, parser evidence, legacy-list
  retirement, and other intentionally deferred work. The five high-value ideas and three frontend
  simplification candidates remain explicitly post-MVP.
- Validation for the documentation slice: `npm run format:check` and `git diff --check` pass. The
  documentation does not claim configured Mongo, archive-restore, or browser evidence.
- Next safe slice: review the remaining Step 9/10 code boundary for a concrete non-functional gap,
  then run the full local validation before any final-review checkpoint. Stop when configured/browser
  evidence becomes the next meaningful action.

## Stage 10 bounded-history checkpoint (2026-07-13)

- Shopping Trip history and admin Ingestion Submission history now have bounded `listPage` repository
  reads using the existing date/status indexes. The corresponding GET routes return the existing arrays
  plus `{ page, pageSize, hasNextPage }` metadata; default page size is 50 and the server caps it at 100.
- Existing unpaged repository methods remain available only for compatibility/tests; the active history
  routes use the bounded methods. This does not change Trip matching, completion, or review policy.
- Focused repository tests cover the first-page/has-next behavior. `npm run typecheck`, lint with zero
  warnings, format check, and `git diff --check` pass.
- Remaining non-functional candidates are admin catalogue/price history pagination and any measured
  realistic-volume/index evidence. Do not add client paging controls without a real screen need; the
  current admin surface still expects its first bounded page and can be extended later.

## Stage 10 Step 9 foundation maintenance checkpoint (2026-07-13)

- The `shopping-trip-foundation-v1` validator action now initializes all of its actual runtime
  dependencies: `shop_markets`, `household_shopping_need_lists`, `household_shopping_trips`, and
  `ingestion_submissions`. Previously it omitted the Need and Trip repository setup even though the
  registry described the Trip foundation.
- Added a focused test that protects the four-collection maintenance boundary. No existing data is
  migrated, deleted, or rewritten by this correction.
- Remaining Step 9 work is configured registry/reconciliation evidence and explicit cleanup of legacy
  adapters only after supported-client/conflict evidence exists.

## Stage 10 authorization/history route checkpoint (2026-07-13)

- Added route-contract coverage for the household Shop Market picker and admin Ingestion Submission
  history: non-members receive 403, non-admins are rejected, active markets are filtered, and the
  admin response exposes bounded page metadata.
- The focused route test passes with the fake Mongo boundary, alongside typecheck, lint, and format
  checks. This is automated authorization evidence; it does not replace the two-user browser check.

## Stage 10 realistic-volume audit checkpoint (2026-07-13)

- Configured read-only maintenance preview passed and reported the current final/legacy collection
  counts. Transaction and catalog smoke also passed against the configured cluster.
- The configured ingestion quality audit initially failed before reporting because sorting the populated
  `ingestion_raw_snapshots` collection by unindexed `id` exceeded MongoDB's 32 MB in-memory sort limit.
- Corrected the archive/audit traversal to use MongoDB's always-present `_id` index instead of an
  unindexed full-collection application `id` sort. No new schema action or data write is required. The
  configured audit is now safe to rerun and should remain within the MongoDB sort memory limit on the
  populated environment.
- The latest configured audit then completed over 55 runs, 66 snapshots, and 12,172 rows. It reported
  78 `duplicate_row_identity` issues, all from Lidl HU brochure snapshots; other active sources
  reported no issues.
- The issue is repeated same-page PDF text extraction. Lidl parser `0.1.1` now keeps the first stable
  page/item identity and has a sanitized repeated-block regression test. Historical snapshots remain
  unchanged; a bounded, reviewed historical parsed-row repair/reprocessing action is still required
  before this audit finding can be considered operationally closed.

## Stage 10 Step 5 Lidl parser checkpoint (2026-07-13)

- Added a page-local source-record identity guard to the Lidl HU brochure parser and bumped its parser
  version from `0.1.0` to `0.1.1`. This removes repeated rows caused by duplicated PDF text extraction
  without collapsing distinct products across pages.
- The focused Lidl source suite passes (6 tests), including a sanitized repeated-product-block case.
- Next safe slice: add the explicit dry-run-first historical parsed-row repair/reprocessing boundary,
  then rerun local validation. Do not mutate configured MongoDB data automatically.

## Stage 10 Step 6 Lidl historical repair checkpoint (2026-07-13)

- Added `packages/kamra-api-server/src/ingestion/repair/lidl-brochure-parser-repair.ts` and the
  `npm run repair:lidl-brochure` script. It is dry-run-first, bounded to the known previous parser
  version, optionally narrowed to one snapshot, and requires exact `--target` plus `--operator` for
  writes.
- Apply mode reparses the preserved payload and updates only derived `parsedRows` and `parserVersion`
  through a content-hash compare-and-set filter. It does not rewrite payload text, content hashes, or
  catalog data. The repair plan fails closed on malformed payloads or source/parser mismatches.
- Focused repair coverage protects duplicate removal and payload immutability. The configured database
  has not been mutated by this session. The read-only repair dry run selected 22 Lidl snapshots, found
  78 duplicate derived rows before reparsing, and predicts zero afterward. The next operator action is
  archive/plan review before any apply run.

Historical open-issue entries above describe intermediate checkpoints and are superseded by
this closeout section where they say the Home bridge is still pending or Stage 8 cannot close.

## Stage 9 continuation checkpoint (2026-07-12)

Work continued on branch `dev/bg/stage-9-10` in separate commits:

- `a8d411f feat: define Stage 9 trip and matching domain` — Trip/Trip Item contracts, state transitions, applicable-price selection, and deterministic one-SKU matching.
- `44b0d4c feat: persist and expose shopping trips` — indexed Trip repository plus household create/list/update routes with optimistic revision checks.
- `71a1eee feat: add shop products and price history` — market-scoped Shop Product and append-only Price Observation repositories, tests, and maintenance registry entry.

Stage 9 remains in implementation. At this checkpoint, the next required slice is the browser-facing Trip workflow and realistic end-to-end evidence; Stage 10 hardening can proceed only on bounded correctness findings while final Stage 9 UI acceptance remains open.

## Stage 9/10 continuation checkpoint (2026-07-13)

- `57c7773 feat: finalize shopping trips into household stock` adds the completion route: existing Household Products receive Product-owned Batches, unknown purchases use the atomic Product+Batch composer, and each bought item creates a pending Ingestion Submission.
- `dc8dc50 feat: add Stage 9 market and ingestion review routes` adds admin-only Shop Market and Ingestion Submission list/create/review routes.
- `85357b6 fix: validate shopping trip purchase inputs` rejects empty completion payloads and invalid purchase units.
- Stage 9 still needs the browser-facing Trip workflow, admin product/price UI, realistic fixtures, and compatibility retirement evidence. Stage 10 has started with input-boundary hardening but is not complete.
- `81eca6b feat: add household shopping trip panel` adds the localized Home Trip panel for starting/resuming, marking, and finalizing concrete trips; the shared manual checklist now covers it.
- Audit correction (2026-07-13): Stage 9 is not yet bug-hunt-only. The matcher and applicable-price service are pure/tested, but Trip creation currently leaves items unresolved and the Home panel does not yet display package/price/stale/no-price decisions. Wire that seam before Stage 9 closeout; admin pricing UI/routes are otherwise present.
