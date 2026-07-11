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

## Changed Files

- Path: `packages/kamra-api-server/src/household/v2/contracts.ts`
- Path: `packages/kamra-api-server/src/household/v2/domain.ts`
- Path: `packages/kamra-api-server/src/household/v2/validation.ts`
- Path: `packages/kamra-api-server/src/household/v2/domain.test.ts`
- Path: `packages/kamra-api-server/src/household/v2/mongo-stock-read-repository.ts`
- Path: `packages/kamra-api-server/src/household/v2/mongo-stock-read-repository.test.ts`
- Path: `packages/kamra-api-server/src/http/routes/household-v2-routes.ts`
- Path: `packages/kamra-api-server/src/http/app-handler.ts`
- Path: `packages/kamra-api-server/src/http/app-handler.test.ts`
- Path: `packages/kamra-api-server/src/household/v2/shopping-needs.ts`
- Path: `packages/kamra-api-server/src/household/v2/shopping-needs.test.ts`
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

- Issue: Mongo transaction support and the existing database abstraction still need an explicit Step 1/Step 4 integration check.
- Impact: Do not implement atomic stock commands until the configured topology is proven transaction-capable; revise the plan if it is not.
- Issue: The maintenance actions are wired, but configured-database smoke testing and production validator definitions remain outstanding.
- Impact: Local/fake Mongo proves routing and idempotent writes; an operator must still run the actions against the configured topology before relying on live migration results.
- Issue: Mongo transactions are not yet supported by the abstraction and have not been proven against the configured topology.
- Impact: Before Step 4 atomic stock commands, add the session/transaction seam and run the configured transaction smoke; if unsupported, pause for a plan revision as required by Stage 8.
- Issue: The connection logger reports the URI default database (`test`) while the smoke correctly targets configured `MONGODB_DB_NAME` (`kamra_dev`).
- Impact: This is expected Mongo client behavior, but future operational logs should consistently include the effective application database to avoid confusion.
- Issue: Step 4 command persistence and idempotency receipts are not implemented yet.
- Impact: The planner is write-free; no stock mutation is exposed until repository transactions enforce revisions, operation fingerprints, and one-active-allocation rules.
- Issue: Allocation, consume, correction, discard, and void commands are still pending.
- Impact: Batch acquisition is transactional, but the full household stock loop is not yet available.
- Issue: Allocation currently has no public API route; it is an internal repository command until Step 5.
- Impact: Browser users cannot invoke the new command yet; route cutover remains intentionally deferred until the command set is coherent.
- Issue: Correction/discard/void history commands and aggregate read projections are still pending.
- Impact: Consumption is transactional, but history reversal and full stock-status explanations are not yet available.
- Issue: Void/reversal authorization and aggregate read projections remain pending.
- Impact: Erroneous historical actions are not yet reversible through the command repository, and the UI/API still lacks explainable aggregate status output.
- Issue: The aggregate projection is currently a pure helper and not yet exposed through a v2 read repository or route.
- Impact: It is ready for API composition, but legacy household screens still use the v1 model until Step 5/6.
- Issue: The v2 read model and commands are not yet exposed through household API routes.
- Impact: Step 5 still needs route adapters, membership capabilities, stable error/status mapping, and v1 mutation cutover.
- Issue: Only the v2 Stock Target read route exists; acquisition/allocation/consume/correct/discard HTTP commands are not exposed yet.
- Impact: The new domain commands remain server-internal until request validation and stable error mapping are added.
- Issue: Allocation, consume, correction, and discard HTTP adapters are still pending.
- Impact: Manual acquisition can now be invoked through the v2 boundary, but the complete browser household loop is not exposed yet.
- Issue: Consume/correct/discard HTTP adapters remain pending.
- Impact: The domain commands are implemented and tested, but the route surface is not yet complete enough for browser use.
- Issue: Correction and discard route adapters remain pending, as do browser service contracts and UI integration.
- Impact: Consume is now exposed, but users still cannot complete the full correction/discard workflow through the v2 HTTP surface.
- Issue: The core v2 stock command route surface is now present, but no Angular client/service uses it yet and no browser manual flow has been run.
- Impact: Step 6 UI integration and manual desktop/mobile verification remain required before treating the household loop as usable.
- Issue: Full validation has not replaced the required browser walkthrough; no Angular client has been switched to v2 yet.
- Impact: Existing UI still exercises v1 behavior, while v2 routes/commands require a deliberate UI/service cutover.
- Issue: Shopping Needs are currently pure domain records; persistence, active-list uniqueness, routes, and UI are still pending.
- Impact: Stage 9 can consume the proposed snapshot shape, but users cannot yet manage persisted needs.
- Issue: UI/API manual verification has not started.
- Impact: Track the final browser checklist as implementation reaches the household workspace.

## Roadmap Or Plan Updates

- Needed: No roadmap change.
- Status: Stage 8 is in implementation; the Step 4 transaction gate is cleared by the manual smoke result.

## Next Step

Implement Step 4’s transaction-backed atomic stock command foundation.

## Notes For Future Agent

- Aggregate stock only from active Stock Allocations; never infer counted quantity directly from classification matches.
- `is_a` is child-to-parent and effective concepts are inclusive; attributes remain independent.
- Keep the manual-check list current when UI or live Mongo behavior is introduced.
