# Home stock refinement plan

Status: Approved by the user's 2026-07-12 request; expanded on 2026-07-12 with approval to bring forward the minimum Stage 9/10 work needed for a mergeable Stage 8 branch.

## Objective

Make the Stage 8 Home stock workflow compact and legible while fixing persisted Product Group/Product target-policy and reassignment failures.

## Required current work

1. Correct encoded entity-id handling and error reporting for Product Group/Product updates; add focused regression coverage.
2. Add explicit Group/Product/Batch deletion commands with the requested ownership rules.
3. Refine the existing Home workspace and composer: collapsible stock/shopping sections, compact two-column stock area, child-aware hierarchy expansion, inline row edits, compact detail rows, editor disclosure/clear behavior, accessible icon actions, status-colored comparisons, expiry-first Batch ordering, and visible Current values.
4. Improve activity/server operation context and update the Stage 8 session and demo manual script. Add the narrow global UI-label abbreviation flag through the existing typed feature-toggle registry and admin surface.
5. Replace the Home-visible legacy shopping-list handoff with a direct Product Group/Product target-policy planning bridge. This starts with persistent Shopping Needs owned by Product Groups or Products, then advances only as far into the single-shop Shopping Trip path as is necessary to avoid dual stock ownership or a misleading legacy completion action.
6. Run the focused Stage 10 merge-readiness review for the affected household/shopping boundaries: transactions, idempotency, validator/migration registry coverage, logging, authorization, and cross-stage docs. Do not pull in unrelated ingestion/archive work.

## Deferred

- Broad shared form-state infrastructure, a general disclosure framework, and pixel-perfect screenshot matching.
- Drag/drop classification, multi-group membership, and Stage 9 shopping-trip work.

## Commit units and validation

1. Route identity/error/lint repair — focused API tests, lint/typecheck.
2. Deletion commands — repository/route tests, typecheck.
3. Home interaction and visual refinement — focused component tests where practical, typecheck/build/manual script update.
4. Final regression/docs — full test, lint, typecheck, build.
