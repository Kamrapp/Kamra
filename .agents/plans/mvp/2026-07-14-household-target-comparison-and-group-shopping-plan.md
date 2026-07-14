# Household target comparison and Product Group shopping refinement

## Objective

Finish the remaining Product Group workspace and shopping-list behavior needed for a coherent
household MVP:

- distinguish below-target, exactly-at-target, and above-target stock clearly;
- make manual Product/Group selection during shopping-list building reliable and predictable;
- make Product Group surplus fulfillment configurable without producing confusing duplicate group
  and Product entries;
- keep group-local overrides explicit, inherited by default, and persistable;
- align the shared table tracks and remove redundant Group detail information.

This is a plan-backed behavior and data-contract change. Implementation must proceed in separate,
reviewable commits after approval.

## Context Read

- `src/app/household/household-amount-comparison.ts`
- `src/app/household/household-amount-comparison.test.ts`
- `src/app/household/household-shopping-selection.ts`
- `src/app/household/household-v2-workspace.component.ts`
- `src/app/household/household-v2-workspace.component.html`
- `src/app/household/household-v2-workspace.component.css`
- `src/app/home.component.ts`
- `src/app/home.component.html`
- `src/app/household/household-v2.service.ts`
- `packages/kamra-api-server/src/household/v2/product-group-read-model.ts`
- `packages/kamra-api-server/src/household/v2/shopping-needs.ts`
- `packages/kamra-api-server/src/household/v2/shopping-needs.test.ts`
- `packages/kamra-api-server/src/household/v2/contracts.ts`
- `packages/kamra-api-server/src/household/v2/validation.ts`
- `packages/kamra-api-server/src/household/v2/mongo-product-group-repository.ts`
- `packages/kamra-api-server/src/http/routes/household-routes.ts`
- `packages/kamra-api-server/src/http/routes/household-v2-routes.ts`
- `packages/kamra-api-server/src/household/v1/contracts.ts`
- `packages/kamra-api-server/src/household/v1/schemas.ts`
- `packages/kamra-api-server/src/household/v1/validation.ts`
- `packages/kamra-api-server/src/database-maintenance/registry.ts`
- `packages/kamra-api-server/src/http/routes/database-maintenance-route.ts`
- `packages/kamra-api-server/src/household/current/demo-household-seed.ts`
- `tests/browser/home.shopping.spec.ts`
- `.agents/AGENTS.md`, `.agents/planning-workflow.md`, and `.agents/coding-guidelines.md`

## Research Gate

Not needed. The change is contained in the repository’s existing Angular, MongoDB, maintenance
registry, and deterministic shopping-needs code. No external service, standard, or current vendor
behavior changes the design decision.

## User Requests

1. Add a distinct above-target state. A current amount of 42 against a target of 8 must not be
   shown as merely “at target”; use a `>>` target marker and a darker green treatment.
2. Keep the between-minimum-and-target state informational/blue rather than green.
3. Hide comparison markers completely for untracked rows.
4. Allow Product and Product Group checkboxes to be manually selected and deselected while building
   a shopping list. Changing the shopping scale must reset selection to the new calculated defaults.
5. Add trustworthy tests for initial selection, manual changes, scale reset, and final generated
   content.
6. Make Product Group surplus distribution support `Don't split`, `Split evenly`, `Add least amount
   product`, `Add latest`, and `Add oldest`, with split evenly as the household default.
7. Make Group-local fulfillment and distribution overrides inherit the household setting by default;
   seed `Gyümölcsök` with a non-default override.
8. Remove duplicate Group detail values for target policy/minimum/desired quantity and the always-
   identical “Calculated from Products and batches” property. Keep minimum and desired quantity in
   the main row; use the detail row for unit and the two shopping overrides.
9. Fix the table header/row grid alignment and reduce unnecessary hierarchy indentation.

## Discovery Questions

No blocking question remains. The ambiguous “surplus” wording is resolved below as “Product Group
target fulfillment”: a group’s target shortage after direct Product needs are considered.

## User Decisions

- `desiredQuantity` remains the target/restock quantity, not a maximum.
- Above target is a valid, positive state and is not a warning or error.
- The household global distribution default is split evenly.
- The local Group dropdowns use an explicit `Default`/inherit option rather than copying global
  values into every override field at edit time.
- `Gyümölcsök` is seeded with a non-default local override so inheritance and local behavior can be
  observed in the demo fixture.

## Current Reality

### Comparison and state

`product-group-read-model.ts` currently collapses every quantity at or above `desiredQuantity` into
`at_target`. The client comparison helper has only neutral, good, and error classes, and the target
comparison is always marked good. The workspace template renders static `<` markers even when a row is
untracked. This is why a large surplus is visually indistinguishable from an exact target.

### Shopping selection

`HouseholdV2WorkspaceComponent` emits candidate/default selection state from an effect that also reads
the selected-owner input. `HomeComponent.setShoppingSelectionDefaults()` writes defaults back into the
selected set whenever shopping selection mode is active. A checkbox toggle therefore causes the child
to re-emit defaults and the parent to restore them, which explains why manual selection appears not to
work. The existing scale-change reset behavior is directionally correct and should be preserved.

The legacy household shopping-list POST already accepts `selectedOwnerIds` and passes them to the V2
need generator. The browser contract currently verifies build/retry/cancel and duplicate impulse
handling, but not manual checkbox changes or the final selected-owner payload.

### Group shopping generation

`shopping-needs.ts` calculates direct Product needs first. For Group shortage it distributes only over
Products that already have a direct Product need; if none exists it chooses one earliest-expiring
stocked Product. It has only `even` and `proportional` distribution values and does not apply local
Group overrides. This cannot split a target shortage across no-target Products such as the three fruit
Products.

### Group data and settings

`ProductGroup` has a target policy but no local shopping-policy fields. Household settings currently
store `groupTargetShoppingMode` and `groupTargetShoppingDistributionMode` with the old
`even`/`proportional` distribution values. Product Group mutation and read routes pass target and unit
data but not shopping overrides. Existing database maintenance entries cover the original household
group shopping fields and Product Group collection/index setup; a new value set and new group fields
need explicit maintenance tracking rather than an unrecorded validator/data-shape change.

### Table/detail presentation

Header and rows each use the stock grid, but the current template inserts static comparison cells and
row-depth padding independently. Batch rows, detail rows, and action slots use related but not fully
shared tracks. Group details still repeat target policy and derived-source information that is already
represented by the main row.

## Intended Direction

### 1. Target state and comparison language

Use four tracked quantity states:

| State | Meaning | Badge/marker treatment |
| --- | --- | --- |
| `below_minimum` | Current is below the minimum | danger; minimum marker `<` |
| `between_minimum_and_target` | Current meets minimum but is below target | info/blue; target marker `<` |
| `at_target` | Current exactly equals target | good green; target marker `=` |
| `above_target` | Current is above target | darker good green; target marker `>>` |

`not_tracked` remains neutral. A row without a target policy renders no comparison markers at all.
The minimum/current separator may remain the compact track separator for tracked rows, but its color
must reflect the minimum comparison; the target separator is dynamic and carries the `<`, `=`, or
`>>` marker. The header keeps the same shared tracks and readable labels without pretending that an
untracked row has a comparison.

The comparison helper should expose a small typed state/class contract rather than making the
template infer semantics from CSS. Add focused tests for below, equal, between, and above boundary
values, plus no-policy behavior. Update selection eligibility so `above_target` is never selected by
ordinary low-stock scales merely because it is tracked.

### 2. Reliable selection editing

Separate “derive candidates/defaults” from “render selected IDs”:

- candidate/default derivation reacts to workspace data and shopping scale, not to the selected-ID
  input;
- the parent applies defaults when entering build mode and when the scale changes;
- checkbox toggles update only the selected set until the next scale change;
- candidate changes prune stale selected IDs without resetting valid manual changes;
- generating sends the final selected owner IDs through the existing request path.

Selection semantics remain explicit:

- selecting a Product requests that Product;
- selecting a Group requests that Group’s effective target-fulfillment policy and strategy;
- selecting both must de-duplicate resulting needs by owner/product identity;
- an empty selection creates an empty generated list rather than silently falling back to defaults.

Add browser coverage using the existing API fixture:

1. enter build mode, assert expected default checkboxes, toggle one expected row off and another
   eligible row on, and verify the local checked state;
2. change scale and verify the selection is recalculated from that scale, discarding the manual
   changes from the previous scale;
3. make a final manual change, generate, and assert the POST payload and rendered shopping list use
   the final IDs rather than the initial defaults.

### 3. Global and local Product Group shopping policy

Use two separate concepts with explicit names so “split” is not confused with “add products”:

#### Group target fulfillment mode

`groupTargetShoppingMode` remains the household-level mode:

- `add_products_and_group_item`: use Product entries where a strategy can represent the shortage and
  allow a Group impulse remainder when no Product representation is available;
- `add_products_only`: use Product entries only; never create a Group impulse;
- `ignore_group_targets`: do not generate needs solely from Group targets.

Each Product Group gets `groupTargetShoppingModeOverride` with values
`default`, `add_products_and_group_item`, `add_products_only`, and `ignore_group_targets`. `default`
means inherit the household value. The Group details UI labels it as `Default (<short global
value>)`, for example `Default (add + group)` or `Default (ignore)`, and the label updates when the
household setting changes.

#### Group shortage distribution strategy

Replace the old user-facing `even`/`proportional` distinction with
`groupTargetShoppingDistributionMode` values:

- `dont_split`: retain the shortage as one Group-owned need when a Group-level remainder is needed;
- `split_evenly`: distribute the remainder across all eligible Products in the Group, including
  Products without their own target; deterministic remainder goes to the last sorted Product;
- `least_amount`: put the remainder on the Product with the lowest derived Current;
- `latest`: put the remainder on the Product with the newest available stocked-at date;
- `oldest`: put the remainder on the Product with the oldest available stocked-at date, including
  expired but still available Batches.

All Product selection strategies use stable tie-breaking by display name and then ID. For `latest`
and `oldest`, only active/available Batches are candidates; a Product with no Batch is a fallback
only when no Product has a usable Batch. If no Product exists, `add_products_and_group_item` may emit
the Group impulse, while `add_products_only` and `ignore_group_targets` emit nothing.

Each Product Group gets `groupTargetShoppingDistributionModeOverride` with values `default`,
`dont_split`, `split_evenly`, `least_amount`, `latest`, and `oldest`. `default` inherits the
household strategy and is displayed as `Default (split)`, `Default (oldest)`, etc.

The effective policy is resolved per Group before generation:

1. resolve each override against the household setting;
2. calculate direct Product shortages;
3. calculate the Group remainder after those direct needs;
4. apply the effective strategy to that remainder;
5. apply the effective fulfillment mode to any unrepresentable remainder;
6. merge needs by Product owner ID and keep deterministic ordering.

This makes the default fruit case produce three Product entries when the Group remainder is split
evenly, while `Gyümölcsök` can demonstrate a non-default seeded strategy. A Group with no Products
still follows the impulse/no-impulse mode rules.

### 4. Group details and shared table tracks

Keep Group minimum and desired quantity editable in the main row. The Group details row should contain
only:

- tracking unit;
- “When this Product Group is below target” override;
- “How to distribute Group shortage” override.

Remove the duplicate target-policy checkbox/summary, repeated minimum/desired values, and the static
“calculated from Products and batches” text. Editing a Group continues to open its details row.

Define one shared CSS grid track custom property for the header, Group, Product, Batch, separator, and
relevant details rows. The selection column is the only conditional leading track. Reduce hierarchy
indentation to one compact depth step, keep disclosure/name cells in the same first track, narrow the
Min/Current/Target tracks to the readable minimum, and reserve the Unit/State/Actions tracks once.
Batch Quantity must occupy the same track as Product Current; Batch expiry belongs in the later date/
state area without changing action-column positions. Validate the grid at desktop and narrow widths.

## Scope

- Extend the read-model state, client comparison contract, localization, badges, markers, and tests.
- Fix the selection synchronization loop and add the three requested browser contracts.
- Implement the new deterministic Group shortage strategies and explicit per-Group effective-policy
  resolution in the shared V2 generator.
- Add API/client contracts and mutation handling for Group overrides and the new household strategy
  enum.
- Add database maintenance entries/actions for the changed household strategy values and Product Group
  override fields. Keep validator completion separate from data migration completion.
- Backfill legacy household distribution values deterministically and backfill existing Product Groups
  to explicit `default` overrides. Do not rewrite shopping history.
- Seed `Gyümölcsök` with a non-default override and add smoke assertions for effective policy and
  strategy coverage.
- Remove redundant Group detail UI and align the shared workspace grid.
- Update the Manual terminology/settings copy and the live Stage 11 runbook with only the new manual
  checks after automated coverage is added.

## Optional Work

- Add a small API response field containing resolved effective Group policy for diagnostics. This is
  useful but not required if the frontend can derive the displayed `Default (...)` label from the
  already loaded household settings.
- Add a compact strategy explanation tooltip to the Group detail dropdowns.

## Deferred Work

- Product-specific shopping strategy overrides; this plan keeps those targets independent from Group
  target fulfillment.
- Proportional distribution as a separate user-facing strategy. Existing `proportional` records are
  migrated to the new deterministic `split_evenly` default unless implementation finds evidence that
  preserving it is required for existing user data; if so, record that as a compatibility alias
  rather than exposing a sixth option.
- Allocation of one physical Batch to multiple Product Groups. The current Product Group model owns
  Products and Batches remain under Products, as already decided.
- Shopping-trip ingestion, catalogue matching, and price observation workflows.

## Non-Goals

- No redesign of the whole Home page or right-side editor.
- No new shopping-list persistence model; use the existing selected-owner request and V2 need
  generator bridge.
- No deletion of legacy collections or historical records.
- No automatic product classification/tagging.

## Assumptions

- The current legacy shopping-list POST is the user-facing bridge and remains the only generation path
  that needs selected-owner IDs for this slice.
- `StockBatch.acquiredOn` is the stocked-at date used by latest/oldest selection. Expired active
  Batches remain eligible for the oldest strategy because they are still physical stock when the
  household expiry policy permits them.
- Product Group names and IDs are stable enough for deterministic tie-breaking after display sorting.
- Existing database-maintenance test fakes can exercise the new validator/migration actions without a
  live MongoDB connection.

## Open Questions

None blocking implementation. If the live validator layout prevents a safe Product Group validator
upgrade, keep the fields optional at the Mongo boundary, validate them in the V2 repository/route, and
record the limitation in the maintenance entry instead of weakening an existing catalogue or
household validator.

## Side Suggestions

- Add a small “effective: inherited/local” hint next to each Group override after the core behavior is
  stable; it is useful but not needed for correctness.
- Consider a pure `resolveGroupShoppingPolicy()` helper shared by the generator and future preview UI
  so the displayed Default label cannot drift from generation behavior.

## Steering Notes

- The earlier “at target” implementation was intentionally conservative for the comparison indicator,
  but the accepted household meaning now requires a separate above-target state.
- The earlier distribution name implied only even/proportional arithmetic. The requested UX is a
  product-selection strategy, so the plan replaces that ambiguity with explicit `dont_split`,
  `split_evenly`, `least_amount`, `latest`, and `oldest` semantics.
- The earlier Group detail row duplicated main-row target data. This plan removes it and reserves the
  detail row for behavior that cannot be understood from the amount columns.

## Implementation Steps

### Step 1 — Target state and comparison contract

- Goal: Add `above_target`, dynamic target markers, info/strong-good styling, and blank markers for
  untracked rows.
- Files likely affected: `product-group-read-model.ts`, `household-amount-comparison.ts`, their
  tests, workspace template/component/CSS, localization and Manual terminology.
- Validation: focused unit tests, typecheck, lint, web build; inspect generated state labels through
  the existing fixture where practical.
- Commit message idea: `feat: distinguish above-target household stock`

### Step 2 — Reliable manual shopping selection

- Goal: Remove the default-selection feedback loop and preserve manual toggles until the scale changes.
- Files likely affected: `household-v2-workspace.component.ts`, `home.component.ts`, browser fixture,
  `tests/browser/home.shopping.spec.ts`, and the live runbook ledger.
- Validation: the three browser contracts described above plus full Chromium suite.
- Commit message idea: `fix: preserve manual shopping selections`

### Step 3 — Generator strategies and effective Group policy

- Goal: Implement global strategies, local overrides, deterministic product candidate selection,
  selected-owner semantics, and no-product/no-impulse behavior.
- Files likely affected: `shopping-needs.ts`, `shopping-needs.test.ts`, Product Group read model
  contracts, legacy/V2 household routes, and API/client settings types.
- Validation: unit matrix for all strategies/modes, selected-owner cases, empty groups, expired and
  no-stock tie breaks; route/integration tests for generated list payloads.
- Commit message idea: `feat: make Product Group shopping strategies explicit`

### Step 4 — Schema and maintenance migration

- Goal: Register and implement the new household strategy enum and Product Group override fields,
  including validator and migration completion tracking.
- Files likely affected: V1 contracts/schemas/validation, V2 contracts/validation, Product Group
  repository, database-maintenance registry/routes/tests, and migration/validator smoke coverage.
- Validation: maintenance registry tests, fake-database migration tests, configured validator action if
  available, and a focused API save/reload smoke.
- Commit message idea: `feat: migrate Product Group shopping overrides`

### Step 5 — Group editor and shared grid refinement

- Goal: Remove redundant Group detail data, add inherited/local override selectors, and align header,
  Group, Product, Batch, separator, and action tracks.
- Files likely affected: `household-v2-workspace.component.html/.ts/.css`, localization, shared grid
  tokens where appropriate, and browser assertions for details and action alignment.
- Validation: typecheck, lint, web build, Chromium interaction checks; manual visual review remains
  required for theme/responsive alignment.
- Commit message idea: `refactor: clarify Product Group controls and table tracks`

### Step 6 — Demo fixture, smoke coverage, and documentation closeout

- Goal: Seed a non-default `Gyümölcsök` override, assert representative strategy/state data, update
  terminology and the live Stage 11 runbook to leave only manual visual/configured checks.
- Files likely affected: `demo-household-seed.ts` and tests, smoke scripts/docs, Manual localization,
  `.agents/sessions/mvp/2026-07-13-stage-11-architecture-reorganization.md`, and
  `scripts/mvp/stage11-mvp-manual-test.md`.
- Validation: demo seed/fixture smoke, full Vitest suite, `npm run mvp:preflight`, browser suite, and
  diff check.
- Commit message idea: `test: close out Product Group shopping coverage`

## Validation Plan

Automated:

- focused amount/state and shopping-needs unit tests;
- API/integration tests for household strategy persistence, Product Group override persistence, and
  selected-owner generation;
- maintenance validator/migration tests;
- demo-household smoke assertions for `above_target`, inherited defaults, and the seeded fruit local
  override;
- `npm run mvp:preflight` and the Chromium browser contracts.

Manual after implementation:

- toggle a scale, manually add/remove Product and Group checkboxes, change scale, and verify reset;
- generate and confirm the final selected set, including a Product Group with an even split;
- inspect `Gyümölcsök` inherited/local override labels and switch the household setting to confirm
  `Default (...)` updates;
- verify below-minimum, between, exact-target, above-target, and untracked rows in light/dark themes;
- verify header, Product Current, Batch Quantity, and action columns remain aligned at desktop and
  narrow widths.

## Risks

- Changing `at_target` semantics affects selection eligibility, state labels, fixture expectations, and
  browser locators. Mitigate with one typed state mapping and focused regression tests.
- Migration ordering matters because old household enum values must be converted before the new UI
  persists them. Keep validator and migration actions independent and report counts.
- Group generation can duplicate needs when a Group and one of its Products are both selected. Use a
  single owner/product map and deterministic merge rules, then test explicit selection combinations.
- Date strategy behavior can be ambiguous when Products have no active Batches. Keep the fallback and
  tie-breaking rules in the pure generator tests.
- Shared grid changes can regress responsive layout. Keep CSS changes in the dedicated UI step and
  leave visual/theme assertions manual rather than claiming unit coverage.

## Approval Checkpoint

The user approved this plan for implementation. The implementation status and commit mapping below
are the current source of truth for what has landed.

## Implementation status (2026-07-14)

The plan was approved and implemented in these atomic commits:

- `809303a` — above-target state, comparison markers, and state styling.
- `7930eeb` — manual Product/Group shopping-selection synchronization and browser contracts.
- `51936eb` — explicit Product Group shopping strategies and household settings contract.
- `566a2b0` — validator/schema strategy values, legacy-value normalization, and Product Group
  inherited-override migration/maintenance action.
- `3c0d098` — Group detail override controls, inherited-label read-model fields, and shared table
  grid tracks.
- `af5d394` — demo fixture/smoke coverage and the focused Stage 11 manual retest checklist.

The focused unit, repository, typecheck, lint, and formatting validations pass. Demo seed/smoke
coverage now asserts the split-evenly household default, explicit Group inheritance, and the
seeded `Gyümölcsök` local strategy. Remaining evidence is limited to the live configured
maintenance/seed execution and the manual visual/interaction checks in the Stage 11 runbook.
