# Session State

## Session

- Date: 2026-07-09
- Plan: `.agents/plans/2026-07-09-stage-6-shopping-list-low-stock-notices-plan.md`
- Branch: current workspace branch
- Current objective: draft and revise Stage 6 shopping-list and low-stock notice plan

## Completed

- Item: created the Stage 6 draft plan.
- Item: incorporated user decisions about persisted generated-list references, separate preview/create routes, check-off state, stock updates from bought items, list-only item creation, editable amounts, editable prices, and future-safe price observations.
- Item: expanded Stage 6 from generated-list preview into a purchased-item feedback loop that can update household stock and preserve price observations for later catalog merging.
- Item: resolved household-only price observations as separate household custom purchase price observation records, not catalog `PriceObservationRecord` records.
- Item: resolved stock application as a separate shopping-list action: checkmarks only gray out list lines, while "update stocks per purchased items" applies quantities to household stock.
- Item: added optional generic shop selection, seeded current crawler shops, and future household favourite-shop direction to the Stage 6 plan.
- Item: incorporated Stage 6 UX decisions for compact expandable rows, quick-add row, inline editable stock-application date, exact quantities, and full scrollable list display.

## Changed Files

- Path: `.agents/plans/2026-07-09-stage-6-shopping-list-low-stock-notices-plan.md`
- Path: `.agents/sessions/2026-07-09-stage-6-shopping-list-planning.md`

## Validation

- Ran: plan self-review by reading the updated plan.
- Result: passed for planning coherence.
- Not run: code tests.
- Reason: documentation/planning-only change.

## Decisions

- Decision: persisted shopping-list lines should store stable ids plus display snapshots.
- Reason: this supports later reconciliation, stock updates, and catalog merging without losing what the user saw at generation time.
- Decision: preview and create should be separate API operations using shared generator logic.
- Reason: this keeps review and persistence behavior explicit while avoiding duplicated generation rules.
- Decision: Stage 6 includes check-off, editable amounts, editable observed prices, and bought-item stock application.
- Reason: the shopping list should be usable in-store and feed household stock plus price knowledge back into Kamra.
- Decision: low-stock notices should initially come through the shopping-list route.
- Reason: this avoids bloating the household stock page contract and keeps notices aligned with the generator.
- Decision: household-only purchase prices should be stored as separate household custom purchase price observations.
- Reason: catalog `PriceObservationRecord` requires catalog product/source ids, and Stage 6 should keep household/shopping-list value independent from catalog merging.
- Decision: ticking a shopping-list line should not update stock by itself.
- Reason: users need a lightweight in-store checkmark that grays out the row while keeping amounts editable.
- Decision: household stock updates should happen through a separate "update stocks per purchased items" action.
- Reason: final stock application needs confirmation, idempotency, and clear handling of unticked entries.
- Decision: partially unticked shopping lists require a confirmation popup before stock update.
- Reason: this prevents accidental stock changes while still allowing a fast "tick everything and update" flow when the feature toggle allows it.
- Decision: add generic country-level shops and optional shopping-list shop selection.
- Reason: this gives purchase price observations useful shop context without requiring address-specific store management or catalog coupling.
- Decision: use compact shopping-list rows by default with expandable price/details.
- Reason: this keeps the in-store flow fast while preserving richer capture when needed.
- Decision: include a one-line quick-add row.
- Reason: impulse/manual purchases are common and should not require leaving the shopping list.
- Decision: show and allow editing the stock-application date next to the stock-update button.
- Reason: defaulting to today/list date avoids a popup, while inline edit still handles real shopping timing.
- Decision: keep quantities exact in Stage 6.
- Reason: rounding/package logic needs more product thought and should not distort stock math now.
- Decision: keep the full scrollable list instead of a top-three urgent summary.
- Reason: users should avoid repeated shopping trips by seeing soon-needed items before they become urgent.

## Open Issues

- Issue: exact generic shop schema and seed placement still need implementation selection.
- Impact: keep the model small: country-level shop identity, display label, source/store brand keys, and status should be enough for Stage 6.

## Roadmap Or Plan Updates

- Needed: no roadmap update yet.
- Status: Stage 6 plan remains draft and awaits approval or revision.

## Next Step

Review and approve or revise `.agents/plans/2026-07-09-stage-6-shopping-list-low-stock-notices-plan.md`; if approved, start with Step 1 contracts, generic shops, and pure generator.

## Notes For Future Agent

The user wants Stage 6 to become the first real shopping-trip loop, not just a generated low-stock preview. Checkmarks should gray out list lines without applying stock changes; a separate stock-update button applies ticked or confirmed-all lines. Household-only prices should be stored as separate custom household purchase price observations and converted to catalog observations only during a later merge. Shopping lists may optionally reference generic shops such as Lidl Hungary, but `none` remains valid. The shopping-list UI should be compact and expandable, include quick add, keep quantities exact, show editable stock-application date inline, and keep the full scrollable list. Implementation is not approved yet.
