# MVP Closure Plan

Status: Closed and archived on 2026-07-14 with a revised scope. Household-side acceptance completed;
Shopping Trip/pricing/ingestion-review, Crawl Snapshot archive/repair/dialog, and combined closure
evidence transferred to Phase 1 because those workflows will be redesigned.

This document preserves the original broader closure target. Unexecuted items below are historical
requirements, not claims of passed MVP evidence. The decision record is in
`scripts/mvp/stage11-mvp-manual-test.md`.

## Objective

Turn the completed Stage 8 household loop, Stage 9 concrete shopping workflow, and Stage 10
hardening into a technically ready internal MVP. Closure may fix bugs and make small visual
improvements, but it must not introduce new domain behavior or reopen the shop/catalogue scope.

## Required validation

- Run the full automated suite, format, lint, typecheck, web/API builds, catalogue smoke, and transaction smoke.
- Run database validator and migration actions in preview, then in an approved disposable environment; record independent completion for validators and data migration.
- Walk the full two-user scenario: household isolation, Product Group/Product/Batch CRUD, expiry policy, target-policy shopping generation, shop selection, unresolved/no-price/stale lines, partial trip resume, bought/not-bought completion, retry, and admin ingestion review.
- Verify history preservation: Product and Batch snapshots, Price Observations, Purchase records, Ingestion Submissions, correction/reversal, and no duplicate effects after retry.
- Verify English/Hungarian parity, keyboard labels, dark/light themes, narrow layout, loading/empty/403/404/409/500 states, and activity-console diagnostics.
- Verify seeded realistic volumes and bounded query behavior for Products, Shop Products, prices, Trips, submissions, and household Batches.

## Current handoff from Stage 10 (2026-07-13)

- Local release gate is green: 64 test files/231 tests, format, lint, typecheck, web build, and API build.
- Read-only ingestion audit traverses 55 runs, 66 snapshots, and 12,172 rows. It currently reports 78
  persisted Lidl duplicate identities; the committed parser fix and dry-run repair predict zero after
  reparsing, but the reviewed apply operation has not been run.
- The read-only processed-ingestion check reports no failed states but four pending snapshots captured
  on 2026-07-13 (ALDI, two Lidl brochures, and PENNY). Process those through the normal ingestion command
  before treating the configured catalogue evidence as green.
- Transaction/catalogue smoke and the alpha-domain-language maintenance preview have passed in the
  configured environment. Clean-target archive restore, repair apply/reconciliation, and browser/two-user
  acceptance remain explicit closure evidence rather than automated claims.

## Anticipated error classes

- stale Trip or Product revisions; duplicate operation ids; partial transaction rollback
- missing/disabled Shop Market; no match, no price, stale price, expired offer, wrong currency, incompatible package unit
- unresolved manual purchase; invalid quantity/date/price; duplicate impulse or duplicate submission
- admin-only ingestion review leakage; accepted review rewriting historical snapshots
- migration validator/data-action drift; seed conflicts; locale fallback gaps; route compatibility accidentally reactivating legacy writes
- responsive overflow, fixed-table/header collapse, focus loss after inline mutation, and color-only status communication

## Closure evidence and waivers

Every failed check gets an issue, owning stage, severity, reproduction, and commit. A waiver
must name the risk, reason, owner, and follow-up. Stage 8–10 is not called release-ready while
an unowned correctness, authorization, history, or transaction failure remains.

## Bounded polish allowance

After correctness is green, allow only small visual improvements such as spacing, label density,
focus styling, and responsive breakpoint adjustments. Any component relocation, new page/flyout,
data-model change, or new workflow becomes a post-closure plan item.
