# Stage 8–10 Manual Acceptance Checklist

This is the single source of truth for manual/browser verification carried forward from Stage 8 through Stage 10. Plan files describe ownership and automated validation; this file records the human journey and its current status. Do not mark an item complete from unit tests alone.

## Current status

- Stage 8: Not ready for manual closeout. The v2 household stock workspace and Product/Batch editing slices are implemented, but the remaining backend/admin/membership/reconciliation work and browser confirmation are still required.
- Stage 9: Blocked until Stage 8 closeout and separate plan approval.
- Stage 10: Blocked until Stage 9 closeout and separate plan approval.

## Stage 8 household foundation

- [ ] Sign in as controlled user A; create a household; confirm anonymous and unauthorized states.
- [ ] As owner A, invite controlled user B; accept as B; confirm both users see only the shared household and unrelated users remain isolated.
- [ ] Create a Stock Target without a Product; edit minimum, target, unit, expiry warning, consumption policy, and flat Acceptance Criteria.
- [ ] Create a concrete Household Product first without classification; add two batches; classify the Product later; verify future batches inherit classification while historical batch snapshots remain unchanged.
- [ ] Create a Stock Target first with an approximate unanchored opening batch; later create/identify concrete Household Products and allocate their batches to the same target without rewriting the opening history.
- [ ] Create `pasta.spaghetti is_a pasta`; verify inherited matching and explainable failures for missing required, no accepted any-of, and excluded attributes.
- [ ] Sync the checked-in English/Hungarian classification pack from admin; verify preview is write-free, apply is audited, repeat sync is a no-op, and missing custom locale text falls back without changing stable criteria ids.
- [ ] Create household-local concepts/attributes; verify they cannot modify global classification or leak across households.
- [ ] Add generic/manual and explicit-Product batches with separate acquisition/expiry dates; allocate matching batches; leave one batch unassigned.
- [ ] Verify overlapping Stock Targets do not double-count a physical batch and one batch cannot have two active allocations.
- [ ] Verify aggregate quantity, minimum/target status, next expiry, expiring count, no-expiry behavior, and combined low-stock/expiry explanations.
- [ ] Partially consume across batches using automatic and selected order; verify depleted status, movement history, and idempotent retry behavior.
- [ ] Correct a batch upward/downward; discard a batch; verify revisions, movements, allocation reconciliation, and stale-tab guidance.
- [ ] Archive/unpublish a linked catalogue Product; verify household snapshots, stock, and history remain usable.
- [ ] Generate, edit, skip, restore, and regenerate Shopping Needs after stock changes; verify one active need list and no Shop/Product/Purchase side effects.
- [ ] Verify Home top-level rows are grouped Stock Targets plus an Unassigned/Unclassified group; expand Product and Batch details; confirm target amount is derived/read-only and batch physical fields remain editable.
- [ ] Sign in and manually verify the Stage 8 grouped workspace renders on Home, refreshes, and keeps target/product/batch/unassigned hierarchy visible.
- [ ] Edit a Household Product identity and verify its existing batch acquisition/expiry/history remains unchanged; verify stale Product revisions are rejected.
- [ ] From a grouped Product row, click `Add stock`; verify the right editor switches to batch-only mode, keeps Product identity read-only, saves a separate batch, and leaves the Product in its existing group/unassigned state.
- [ ] Create a Product with no initial batch; verify it appears under Unassigned/Unclassified, then use `Add stock` to add its first physical batch.
- [ ] Create a Product while selecting a household Concept; reopen the Product editor and verify the checkbox remains selected and the Product’s direct concept reference is present.
- [ ] Correct a batch quantity and discard a batch from grouped Home; verify the target aggregate refreshes and the batch remains in history/status rather than disappearing silently.
- [ ] Edit a batch acquisition/expiry date from grouped Home; verify an expiry-before-acquisition date is accepted and valid changes refresh without changing the Product identity.
- [ ] Verify an expiry date before acquisition is accepted; toggle household `allowExpiredItems` off/on and confirm expired stock remains visible but is excluded/included in derived availability and consumption accordingly. Default must be permissive.
- [ ] Run the repeatable seeded demo flow in `scripts/stage8-demo-manual-test.md` and record any deviations from the expected grouped data, derived totals, policy behavior, or history behavior.
- [ ] Verify the grouped workspace API/read model supplies the same hierarchy and does not count unallocated batches in Stock Target totals.
- [ ] Check English/Hungarian labels, keyboard operation, narrow mobile layout, loading/empty/error/403/404/409 states, and light/dark themes.
- [ ] Verify admin flags, audit history, maintenance actions, structured logs, redaction, and effective database name in diagnostics.
- [ ] Run `npm run smoke:transactions` against `kamra_smoke` or another approved disposable database; record rollback `0`, commit `2`, cleanup, and effective database name.

## Stage 9 concrete shopping journey

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
