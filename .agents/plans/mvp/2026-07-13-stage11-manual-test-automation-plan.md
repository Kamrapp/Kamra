# Stage 11 Manual-Test Automation Audit

## Objective

Reduce the live Stage 8–11 runbook to checks that genuinely need a browser, an approved configured
database, or operator evidence. Add deterministic coverage only where the current code and test
harness can prove the behavior without redesigning the application.

The accepted baseline is the runbook state recorded before `257f07e`. Do not reopen checks already
accepted there unless a later implementation commit touched that behavior.

## Context Read

- `AGENTS.md`
- `.agents/planning-workflow.md`
- `.agents/coding-guidelines.md`
- `.agents/plans/mvp/2026-07-13-stage-11-vertical-slice-locality-plan.md`
- `.agents/sessions/mvp/2026-07-13-stage-11-architecture-reorganization.md`
- `scripts/mvp/stage11-mvp-manual-test.md`
- Existing household, Shopping Trip, matcher, ingestion-review, route, and integration tests
- Relevant Home, Shopping Trip, admin, repair, and API route implementations

## Research Gate

Not needed. This is a local test-boundary audit against already approved Kamra behavior. No
external research, new test framework, or dependency is required. Steps 1, 2, 4, and 5 do not
require a schema change. Step 3 resolved its database ownership gate by moving Stage 9 price
observations into a dedicated collection with its own validator and maintenance entry.

## User Requests

- Audit every open item in the Stage 11 manual test file for deterministic automation.
- Write tests from the intended outcome before judging current behavior.
- Permit only minor testability adjustments; avoid general refactoring.
- Remove manual steps only when automated evidence makes them unnecessary.
- Commit the resulting units separately.
- Reuse or add `npm run smoke:*` coverage where real MongoDB behavior needs configured proof.

## Current Reality

- Expiry inclusion/counting, target comparisons, owner selection/generation rules, Trip state
  transitions, custom-shop domain state, raw archive shape/checksums, Lidl repair planning, and a
  partial Trip retry already have deterministic coverage.
- The integration suite proves one active/custom Trip creation path and one existing-Product bought
  path with an idempotent retry, but does not assert all submitted purchase facts, the not-bought
  exclusion, new/unplanned Product creation, or the final completion result.
- Matcher tests cover applicable/stale selection and basic package ranking, but not the supported
  no-price/future/expired/conditional/superseded/incompatible matrix.
- Stage 9 admin route tests cover active-market listing and ingestion listing only. Repository tests
  do not replace HTTP-boundary validation for admin create/review routes.
- The first configured smoke attempt exposed a real collection collision: the Stage 9 price
  repository wrote its `PriceObservationCandidate` shape to `price_observations`, while the live
  catalogue validator requires the catalogue `PriceObservationRecord` shape. The approved fix is
  `shop_price_observations`; the old catalogue collection remains owned by the catalogue schema.
- Browser feedback, control reset/disable behavior, localized rendering, responsive layout, theme
  treatment, Activity presentation, and configured MongoDB evidence cannot be replaced safely by
  the current unit/integration harness.
- Duplicate impulse behavior is implemented in the component, while the reusable name-normalization
  helper is tested separately. A small extraction can make the duplicate key contract testable
  without adding Angular component-test infrastructure.

## Scope

### Required now

- Add deterministic matcher/planning tests for the supported price-state matrix and bounded
  alternate options. Do not invent new pricing policy; assert the behavior already represented by
  `ApplicablePriceState` and `ShoppingTripMatchOption`.
- Extend the existing app-handler integration test with one focused journey that proves active and
  custom Trip creation, bought-versus-not-bought completion, persisted quantity/unit/date/expiry/
  price/currency facts, existing-Product reuse, new/unplanned Product creation, and identical retry
  idempotency.
- Add a configured `npm run smoke:shopping-trip` script only for real MongoDB behavior that fake
  persistence cannot prove. It must fail closed outside `kamra_dev`, `kamra_test`, and `kamra_smoke`,
  use one unique run prefix for every temporary document, clean up only that prefix in `finally`,
  and fail if cleanup cannot complete. It exercises one active-market Trip, bought/not-bought
  completion, persisted purchase facts, one pending submission, and an identical retry. It must not
  change validators or maintenance state.
- Run the configured script as a separate step in the existing transaction-smoke workflow, update
  only the necessary path filters, and document its safety boundary in `scripts/README.md`.
- Add HTTP contract tests for current Stage 9 admin routes: admin-only access; valid/invalid and
  duplicate Shop Market, Shop Product, and Price Observation creates; accepted/corrected/rejected
  submission reviews; invalid revision/already-reviewed conflicts; and preservation of submitted
  facts. Test the current persistence contract only; do not claim review actions create catalogue
  records.
- Extract and test a small duplicate-key lookup only if it can be reused by the existing quick-add
  component without changing behavior.
- Rewrite or remove only deterministic clauses directly covered by new tests, then record the exact
  automated/manual boundary in the Stage 11 session handoff.

### Step 3 ownership resolution

Stage 9 now owns `shop_price_observations`, with a strict validator and dedicated indexes. The
`shop-price-observations-v1` maintenance entry creates or upgrades that collection and has a
separate idempotent migration that copies only legacy Stage 9-shaped documents from the old
catalogue collection. Catalogue-shaped records remain in place and are never rewritten or
deleted. The configured smoke is an operator gate until the validator action has been run in the
approved target database.

### Deferred or manual-only

- Angular component/event-wiring tests requiring new browser/component-test infrastructure.
- Visual color, theme, overflow, dialog, side-rail, viewport, and locale inspection.
- Toast, Activity, focus, debounce timing, and reload/refresh presentation.
- Real configured-database archive/checksum evidence and production-validator proof.
- Historical Crawl Snapshot archive inspection and Lidl repair against an operator-approved real
  snapshot. A synthetic smoke cannot replace evidence about the selected historical payload.
- Final two-user/operator evidence and waiver review.

## Non-Goals

- No behavior redesign, broad refactor, new test framework, or dependency.
- No production fix beyond a narrow testability seam. If an intended-outcome test needs a model,
  schema, policy, or UX decision, stop that step and report it instead of expanding this plan.
- No claim that fake/in-memory persistence replaces configured MongoDB acceptance.

## Implementation Steps

### Step 1 — Price and matching contracts

- Add expected-outcome cases for no-price, future, expired, coupon/loyalty conditional, superseded,
  and incompatible candidates in the existing matcher tests.
- Cover bounded alternate options through the existing planning seam and assert package count,
  selected price observation, expected total, price state, and truncation. Do not add a route that
  does not currently exist.
- Remove those deterministic calculations from the manual list while retaining visible rendering,
  locale, and narrow-viewport checks.
- Validation: focused matcher/planning/route tests, typecheck, lint, formatting check.
- Commit: `test: cover Shopping Trip price and match states`

### Step 2 — Trip creation and completion effects

- Extend the existing deterministic app-handler integration coverage for active-market and custom
  Trip creation without 400/404 responses.
- Assert only bought lines create stock, entered quantity/unit/date/expiry/price/currency persist in
  the Batch, Trip Item, and pending Ingestion Submission, existing Products are reused, a genuine
  new or unplanned purchase creates one usable Product/Batch, and identical retries create no
  duplicate Product, Batch, submission, or operation.
- Remove those persistence/idempotency clauses from the manual list while retaining visible resume,
  refresh, clear, and success-feedback checks.
- Validation: focused integration suite, typecheck, lint, formatting check.
- Commit: `test: cover Shopping Trip persistence and retries`

### Step 3 — Configured Shopping Trip MongoDB smoke

- Run `npm run smoke:shopping-trip` as a locally runnable configured smoke after the
  `shop-price-observations-v1` validator action has been executed. It must refuse databases
  outside `kamra_dev`, `kamra_test`, and `kamra_smoke`; use one unique run prefix for every temporary
  document; and delete only that prefix in `finally`, failing if cleanup cannot complete.
- Exercise the real app handler and MongoDB collections for one active-market Trip, one bought and
  one not-bought item, persisted purchase facts, one pending submission, and an identical completion
  retry. Do not assert archive/repair behavior or modify validators/maintenance state from this
  smoke.
- The command is a separate step in the existing `.github/workflows/transaction-smoke.yml` job
  and widen path filters only for the smoke, its route/domain dependencies, package metadata, and
  the workflow. Do not create another configured workflow.
- Document the command, safety boundary, writes, and cleanup in `scripts/README.md`.
- Do not use this smoke to remove the archive/repair manual checks: those require an
  operator-approved historical snapshot, manifest/output inspection, and proof about that selected
  data rather than synthetic run-scoped records.
- Validation: local typecheck/lint/format checks and the command against an approved disposable
  database when configuration is available. If the validator has not been run, the smoke remains
  an explicit operator release gate rather than silently changing maintenance state.
- Commit: `test: add configured Shopping Trip smoke`

### Step 4 — Admin route contracts

- Test invalid and valid Shop Market, Shop Product, and Price Observation requests at the HTTP
  boundary using current repositories/fake persistence, including duplicate responses and admin
  authorization.
- Test accepted, corrected, and rejected ingestion decisions, review notes, stale revision/already
  reviewed conflicts, and history listing without losing submitted facts. These tests cover status
  persistence only; catalogue side effects remain outside this plan.
- Remove those deterministic API/result clauses from the manual list while retaining form feedback,
  localization, overlapping-action handling, Activity presentation, and browser review UX.
- Validation: focused Stage 9 route/repository tests, typecheck, lint, formatting check.
- Commit: `test: cover Stage 9 admin route outcomes`

### Step 5 — Duplicate impulse boundary and reconciliation

- The small pure lookup helper is already reused by quick-add duplicate detection and has focused
  normalized-name tests. No Angular component-test infrastructure or further extraction is justified
  for this local boundary.
- Correct the runbook's ambiguous duplicate wording to match the accepted behavior: keep the draft,
  make no second line, and report that the item is already present. Retain visible feedback/Activity
  verification as manual because the current harness does not test Angular wiring.
- Update the runbook ledger and Stage 11 session handoff with exact automated evidence and remaining
  manual boundaries.
- Run the complete preflight after all focused tests pass.
- Commit: `docs: reconcile Stage 11 automated evidence`

## Risks

- Large integration scenarios can hide which contract failed. Keep creation/matching and completion
  assertions grouped by one user journey but use precise intermediate assertions.
- Fake Mongo behavior is not configured Mongo behavior. Do not remove configured checks.
- The configured smoke writes temporary records. Every id must be run-scoped, every target database
  must be explicitly allowlisted, and cleanup must use exact run-scoped filters even after failure.
- Component-only outcomes can look deterministic while depending on Angular/browser wiring. Keep
  those manual unless the existing harness can test them without new infrastructure.
- A new test may expose intended behavior that current code does not satisfy. Make only a small fix
  already implied by the accepted contract; stop and report if it requires a model, schema, policy,
  or UX decision.

## Approval Checkpoint

The user approved this revised scope by requesting that it be made totally doable, committed, and
implemented. The plan is intentionally limited to deterministic contracts, one safe configured
smoke, and documentation reconciliation.
