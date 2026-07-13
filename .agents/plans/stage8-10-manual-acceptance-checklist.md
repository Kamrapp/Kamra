# Stage 8–10 Manual Acceptance Checklist

This is the single source of truth for manual/browser verification carried forward from Stage 8 through Stage 10. Plan files describe ownership and automated validation; this file records the human journey and its current status. Do not mark an item complete from unit tests alone.

## Current status

- Stage 8: User-side implementation complete; manual/browser verification and bugfixes remain. The Home Product Group → Household Product → Stock Batch workspace, grouped-target generation, editable shopping list, and Product/Batch finalization are in the current branch.
- Stage 8 Home editing: The Product Group → Product → Batch hierarchy is the final user-side direction. Legacy allocation/stock-row behavior is compatibility or migration input only.
- Stage 9: Implementation complete; it adds Shop Markets, Shop Products, Price Observations, resumable Shopping Trips, finalized-trip Purchase Ingestion, and the household-visible Trip result flow. Configured/browser acceptance remains open.
- Stage 10: Implementation complete as bounded Alpha hardening. Archive, domain-language, audit, matching-safety, Trip result, parser-repair, maintenance, parity, and release-documentation slices are committed; operator and browser evidence remain open.

## Stage 8 household foundation

- [ ] Open the Manual from the right rail. Verify the household/shopping guide is available to everyone, the product/ingestion guide is disabled for non-admins and enabled for admins, and both locales use the intended terminology.
- [ ] Use the left-rail Activity console during Product Group, Product, and Batch actions. Verify concise start/success/failure messages, browser-console mirroring, error forwarding, scroll behavior, and vertical resize from the lower-right corner.
- [ ] Sign in as controlled user A; create a household; confirm anonymous and unauthorized states.
- [ ] As owner A, invite controlled user B; accept as B; confirm both users see only the shared household and unrelated users remain isolated.
- [ ] Create a Product Group without Products; configure its tracking unit and optional target policy. Verify a Group/Product without a target policy remains visible with a neutral not-tracked state.
- [ ] Create a concrete Household Product first without classification; add two batches; classify the Product later; verify future batches inherit classification while historical batch snapshots remain unchanged.
- [ ] Create a generic manual Household Product first with an approximate opening Batch; later edit/identify the Product and assign it to a Product Group without rewriting the Batch history.
- [ ] Create `pasta.spaghetti is_a pasta`; verify inherited matching and explainable failures for missing required, no accepted any-of, and excluded attributes.
- [ ] Sync the checked-in English/Hungarian classification pack from admin; verify preview is write-free, apply is audited, repeat sync is a no-op, and missing custom locale text falls back without changing stable criteria ids.
- [ ] Create household-local concepts/attributes; verify they cannot modify global classification or leak across households.
- [ ] Add generic/manual and explicit-Product Batches with separate acquisition/expiry dates; assign Products to Groups and leave one Product unassigned.
- [ ] Verify a Product contributes once to its direct Product Group and each ancestor, never to multiple sibling Groups; legacy allocation history does not contribute after cutover.
- [ ] Verify aggregate quantity, minimum/target status, next expiry, expiring count, no-expiry behavior, and combined low-stock/expiry explanations.
- [ ] Partially consume across batches using automatic and selected order; verify depleted status, movement history, and idempotent retry behavior.
- [ ] Correct a batch upward/downward; discard a batch; verify revisions, movements, allocation reconciliation, and stale-tab guidance.
- [ ] Archive/unpublish a linked catalogue Product; verify household snapshots, stock, and history remain usable.
- [ ] Generate, edit, skip, restore, and regenerate Shopping Needs after stock changes; verify one active need list and no Shop/Product/Purchase side effects.
- [ ] Verify Home top-level rows are Product Groups plus an Unassigned group; expand Group/Product/Batch details; confirm target-policy amounts are derived/read-only and Batch physical fields remain editable.
- [ ] Sign in and manually verify the Stage 8 grouped workspace renders on Home, refreshes, and keeps target/product/batch/unassigned hierarchy visible.
- [ ] Edit a Household Product identity and verify its existing batch acquisition/expiry/history remains unchanged; verify stale Product revisions are rejected.
- [ ] From a grouped Product row, click `Add stock`; verify the right editor switches to batch-only mode, keeps Product identity read-only, saves a separate batch, and leaves the Product in its existing group/unassigned state.
- [ ] Create a Product with no initial batch; verify it appears under Unassigned/Unclassified, then use `Add stock` to add its first physical batch.
- [ ] Verify Home no longer exposes household Product Concept creation or assignment; classification remains deferred from the stock workspace and no existing classification data is deleted.
- [ ] After the Product Group/Product/Batch cutover, verify Home uses Product Groups (not Product Concepts) as the first layer, with recursively nested Groups, an Unassigned pseudo-group, Products assigned to zero or one direct Group, and Batches only beneath Products.
- [ ] Create/edit/rename/discard a Product Group, Product, and Batch from the left table. Verify the fixed action columns expose pencil/save/X, magnifier-plus/minus detail states, product-plus, and stock-plus with keyboard labels/tooltips; no action position changes with row text length.
- [ ] Use the Product details Group dropdown to move a Product between Groups and to Unassigned. Verify all its Batches move with it, direct/ancestor totals and Product/Group states update once, no duplicate contribution appears, and incompatible-unit/stale failures leave the prior state intact.
- [ ] Use the three-block right-side composer to add/save each layer independently, then create a Group+Product+Batch through the Batch action. Verify parent creation is atomic/idempotent, pristine-name mirroring never overwrites an edited Product name, Batches have no fake name, selection synchronizes all blocks, and clear/cancel never saves data.
- [ ] Use the Product Group hierarchy: add/edit a Product Group, add a Product in its context, add a Batch, and verify every later Batch of that Product automatically contributes through the same Group membership.
- [ ] Create a Product Group from the table footer; edit its name inline using save/cancel actions, open its details, and edit tracking unit plus optional minimum/desired target. Confirm the derived current amount remains read-only.
- [ ] Correct a batch quantity and discard a batch from grouped Home; verify the target aggregate refreshes and the batch remains in history/status rather than disappearing silently.
- [ ] Edit a batch acquisition/expiry date from grouped Home; verify an expiry-before-acquisition date is accepted and valid changes refresh without changing the Product identity.
- [ ] Verify an expiry date before acquisition is accepted; toggle household `allowExpiredItems` off/on and confirm expired stock remains visible but is excluded/included in derived availability and consumption accordingly. Default must be permissive.
- [ ] Run the repeatable seeded demo flow in `scripts/stage8-demo-manual-test.md` and record any deviations from the expected grouped data, derived totals, policy behavior, or history behavior.
- [ ] Verify the grouped workspace API/read model supplies the same recursive hierarchy and derives Group totals from Product membership/ancestor rollup rather than legacy allocations.
- [ ] Check English/Hungarian labels, keyboard operation, narrow mobile layout, loading/empty/error/403/404/409 states, and light/dark themes.
- [ ] Verify admin flags, audit history, maintenance actions, structured logs, redaction, and effective database name in diagnostics.
- [ ] Run `npm run smoke:transactions` against `kamra_smoke` or another approved disposable database; record rollback `0`, commit `2`, cleanup, and effective database name.

## Stage 9 concrete shopping journey — implementation complete plus manual verification

- [ ] On Home, start a concrete Shopping Trip from the compact Trip panel by choosing an active Shop Market; confirm the draft progresses through matching/ready/in-progress without losing the underlying Shopping Need list.
- [ ] Mark Trip Items bought and not bought, finalize the Trip, refresh Home, and confirm bought lines create Product-owned Batches while not-bought lines do not create stock.
- [ ] During an in-progress Trip, choose an existing Household Product as the actual purchased Product, finalize the Trip, and confirm the new Batch belongs to that Product rather than creating a duplicate. Also test the explicit “create a new Household Product” choice for a genuine alternative.
- [ ] Resume a partially processed Trip and retry the same completion operation; confirm no duplicate Product, Batch, Movement, or Ingestion Submission is created.
- [ ] As an admin, list pending Ingestion Submissions, accept/reject/correct one with a matching revision, and confirm stale review is rejected while household stock history remains unchanged.
- [ ] As an admin, exercise the market, Shop Product, Price Observation, and submission-review actions. Confirm successful saves show feedback, invalid forms are rejected locally, failed requests remain visible as errors and in the Activity console, and overlapping actions are disabled until the request settles.
- [ ] Confirm Trip creation invokes the matcher: a priced candidate shows package count, expected total, selected Price Observation, and explanation; no-price/stale/conditional/incompatible candidates remain explicit rather than silently becoming priced.
- [ ] When multiple compatible Shop Products are returned, choose a different match in the Trip panel and confirm the server recalculates package count, applicable price, and explanation under the new revision.
- [ ] Leave an unresolved line unresolved, confirm the trip cannot continue until it is skipped or matched, then skip it and confirm the remaining lines can proceed.
- [ ] During an in-progress Trip, add an unplanned purchase with quantity/unit, mark it bought, record actual result details, and finalize it into a new Household Product and Product-owned Batch.
- [ ] Record a purchased line's actual quantity, unit, paid price, currency, acquisition date, and expiry in the compact result editor; save it, refresh/resume, and confirm those values reach the resulting Batch and Ingestion Submission.
- [ ] Generate enough compatible Shop Products to exceed the response limit; confirm the Trip shows the bounded best matches and an explicit truncation note.

- [ ] From an open Shopping Need, select exactly one enabled Shop Market and planned shopping date.
- [ ] Verify automatic Product/Shop Product matches show package math, applicable price, stale/no-price/conditional states, and match explanations.
- [ ] Override a match, leave one line unresolved, and skip one line; verify all choices remain explicit and editable.
- [ ] Use the shopping view on a narrow/mobile layout; refresh and resume an in-progress trip without losing state.
- [ ] Manually record actual Product, quantity, price, currency, acquisition date, and expiry; verify a later expiry creates a new Stock Batch.
- [ ] Retry completion and inject/follow a failure path; verify no duplicate Purchase, Stock Batch, Movement, or Price Observation and transaction rollback is visible.
- [ ] Record an unknown/manual product; verify household stock is immediately usable while catalogue review remains asynchronous.
- [ ] Admin-review an unknown Product/Shop Product/price fact; verify promotion is audited, history snapshots remain unchanged, and later trips can reuse the reviewed fact.
- [ ] Verify base, offer, stale, unpriced, manual, substitution, and no-price states in both locales.

## Stage 10 Alpha hardening and release

- [ ] Run the complete Stage 8 → Stage 9 Alpha scenario twice without direct database editing.
- [ ] Verify final domain terminology in page titles, labels, logs, API responses, maintenance UI, seeds, and error states.
- [ ] Run configured transaction, migration/reconciliation, locale/parity, archive checksum/restore, and crawl-quality checks using disposable/smoke data.
- [ ] Confirm the narrowly triggered Transaction Smoke workflow runs for Mongo transaction abstraction/command/repository/dependency changes and is intentionally absent for unrelated frontend/docs PRs.
- [ ] Verify archive/export and repair workflows are dry-run safe, bounded, auditable, and never alter raw crawl evidence unexpectedly.
- [ ] Verify authorization matrix, stale/conflict/failure states, redaction, pagination/index behavior, responsive layouts, keyboard accessibility, and realistic seeded volume.
- [ ] Complete the final two-user browser walkthrough and record known limitations/post-MVP deferrals.

## Evidence log

Record date, environment/database name, tester, route/build commit, and any failed or deferred item here. Never record credentials or private data.

- 2026-07-11: Transaction smoke passed manually against `kamra_dev`; rollback count 0, committed count 2, temporary data cleaned up.
- 2026-07-11: Household Product anchor repository/API implemented with revisioned classification and product-backed batch inheritance; automated validation passed. Browser grouping and end-to-end Product-first flow remain unchecked.
- 2026-07-11: Grouped workspace read model implemented with server-derived target aggregates, Product grouping, and visible unassigned batches; automated repository tests passed.
- 2026-07-11: Initial Angular Home rendering now consumes the grouped workspace read model; `npm run build` passed. Manual browser confirmation remains required.
- 2026-07-11: Product identity edits now have a separate revisioned backend route and repository test; classification and identity updates remain distinct.
- 2026-07-13: Stage 10 local release gate passed: 64 test files/231 tests, format, lint with zero warnings, typecheck, web build, and API build. Transaction/catalogue smoke and the alpha-domain-language maintenance preview also passed in the configured environment.
- 2026-07-13: Read-only ingestion audit traversed 55 runs, 66 snapshots, and 12,172 rows. It found 78 persisted Lidl duplicate identities; the parser fix and dry-run repair predict zero after reviewed reprocessing. Four snapshots captured on 2026-07-13 remain pending normal ingestion processing. These are evidence items, not manual acceptance confirmations.
