# Home stock refinement plan

Status: Approved by the user's 2026-07-12 request; implementation in progress.

## Objective

Make the Stage 8 Home stock workflow compact and legible while fixing persisted Product Group/Product target-policy and reassignment failures.

## Required current work

1. Correct encoded entity-id handling and error reporting for Product Group/Product updates; add focused regression coverage.
2. Add explicit Group/Product/Batch deletion commands with the requested ownership rules.
3. Refine the existing Home workspace and composer: collapsible stock/shopping sections, compact two-column stock area, child-aware hierarchy expansion, inline row edits, compact detail rows, editor disclosure/clear behavior, and accessible icon actions.
4. Improve activity/server operation context and update the Stage 8 session and demo manual script.

## Deferred

- Broad shared form-state infrastructure, a general disclosure framework, and pixel-perfect screenshot matching.
- Drag/drop classification, multi-group membership, and Stage 9 shopping-trip work.

## Commit units and validation

1. Route identity/error/lint repair — focused API tests, lint/typecheck.
2. Deletion commands — repository/route tests, typecheck.
3. Home interaction and visual refinement — focused component tests where practical, typecheck/build/manual script update.
4. Final regression/docs — full test, lint, typecheck, build.
