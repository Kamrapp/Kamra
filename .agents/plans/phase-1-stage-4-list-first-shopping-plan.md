# Phase 1 Stage 4 — Shopping-list-first shop session

Status: Draft successor plan. Review after Stages 1–3 and obtain user approval before implementation.

## Objective

Remove the visible duality between Shopping list and Shopping Trip. The Shopping list remains the
household workspace; choosing a shop starts lightweight shopping context, bought marks are captured
as purchase evidence, finishing applies bought rows to stock, and unbought rows remain on the list.

## Why this can be planned now

- The application already has persisted Shopping lists/Shopping Need lists, a revisioned Shopping
  Trip state machine, shop selection, matching, actual-result fields, unplanned purchases,
  transaction-backed completion, retry/idempotency coverage, and cancellation.
- The problem is the ownership and UI relationship between two existing models, not an unknown new
  domain.

Exact compatibility migration details must be finalized from the records present when this stage
starts.

## Canonical ownership

- **Shopping list:** household intent, editable planned rows, bought marker/amount, and remaining work.
- **Shopping session (current Shopping Trip storage):** selected shop/custom shop, shopping date,
  status, purchase/result evidence, selected shop listing/price, receipt reference later, completion
  operation id, and audit/history.
- **Stock Batch/Movement:** household inventory result created only for confirmed bought quantities.
- **Review candidate/Price Observation:** shared evidence emitted from confirmed purchase/receipt
  facts without becoming the household source of truth.

Stage 4 should retain current Shopping Trip storage where it provides the transaction/evidence
boundary. It must not expose a second list-shaped workspace or duplicate editable intent state.

## Required state contract

```text
open Shopping list
  -> Start shopping (select shop and date)
  -> active shopping context linked to the list
  -> list-row bought/not-bought/unplanned updates record session evidence
  -> Finish shopping
  -> atomically apply bought rows and session evidence
  -> remove/archive bought work; keep unresolved/unbought rows on the open list
```

- Starting shopping is one action from the list and supports active Shop Market or explicit custom
  shop.
- A household has at most one active shopping context for the relevant open list unless a later plan
  explicitly introduces multi-shop concurrency.
- Marking a row bought during active shopping updates the list presentation and session evidence
  through one command boundary; retries cannot create duplicate effects.
- Unplanned purchases enter through the list and are linked to the active session automatically.
- Detailed actual Product, amount/unit, price/currency, acquisition date, and expiry remain optional
  progressive details unless required for a valid Stock Batch.
- Cancelling shopping closes only the shop context and preserves the underlying Shopping list and its
  recoverable intent. The plan must explicitly decide how already marked bought evidence is retained
  or reverted before implementation.
- Finishing with partial/unresolved work applies only confirmed bought rows and leaves the rest on the
  list with understandable status.

## Compatibility and migration

- Inventory open/partial/completed/cancelled Shopping Trips and active Shopping lists before locking
  the mapping.
- Define a deterministic compatibility read for existing Trip records and a migration only for fields
  required by the new list/session link or completion semantics.
- Add stable maintenance-registry entries before structural changes to existing collections.
- Keep validator and data migration actions separate and idempotent.
- Preserve completed/cancelled Trip history, existing Product/Batch snapshots, Price Observation
  references, and Ingestion Submissions.
- Do not rename API routes or collections merely to match user copy; adapt behind the existing route
  boundary unless a compatibility alias has a concrete benefit.

## Implementation units and commit split

### Commit 1 — expected list/session state contract

- Write pure expected-outcome specs for start, bought/unbought, unplanned, cancel, resume, partial
  finish, retry, leftover preservation, and illegal/stale transitions.
- Define one application command/result contract for list + session mutations.
- Add maintenance-registry definitions if accepted stored shapes change.
- Commit message idea: `test: define list-first shopping transitions`

### Commit 2 — transactional persistence and compatibility

- Implement list/session linkage and commands using existing repositories and transaction runner.
- Preserve idempotency, revision conflicts, authorization, history, and completion cleanup.
- Add compatibility reads/migrations for existing active and historical records.
- Extend configured shopping smoke to prove real Mongo concurrency/transaction behavior where needed.
- Commit message idea: `feat: unify shopping list and session persistence`

### Commit 3 — list-first household coordination

- Extract or reuse a focused coordination seam so multi-panel state transitions have direct specs.
- Make Start shopping part of the Shopping list flow; show shop/session details progressively rather
  than as an equal panel.
- Route bought/unbought/unplanned actions through the unified command and keep reload/resume feedback
  understandable.
- Commit message idea: `feat: make Shopping list the shopping workspace`

### Commit 4 — finish/cancel UX and legacy surface removal

- Implement partial finish and leftover-list behavior, safe cancellation, collapsed details, and
  clear terminal state presentation.
- Remove only UI/service branches made unreachable by the new flow; retain technical compatibility
  paths still used by stored history or APIs.
- Update household/domain docs and the deferred Phase 1 runbook.
- Commit message idea: `refactor: retire the separate Shopping Trip workflow`

## Validation

- Pure state-machine and coordination specs before implementation.
- Route/repository integration tests for list/session atomicity, authorization, stale revisions,
  cancellation, retry, partial finish, and duplicate prevention.
- `npm run smoke:shopping-trip` updated to the new list-first contract and run only against an
  approved disposable database.
- Existing transaction smoke when transaction abstractions change.
- `npm test`, integration tests, typecheck, lint, build, format, and diff checks.
- Update transferred manual checks for the new flow; defer integrated visual/locale/real-data
  execution until Stage 7.

## Exit criteria

- Members manage one visible Shopping list, not parallel list and Trip representations.
- Starting shopping adds shop context with one action and no raw market id requirement.
- Bought and unplanned rows are captured once in the active session and survive reload/retry.
- Cancellation cannot strand, archive, or silently discard the Shopping list.
- Finishing applies only bought rows to stock and leaves unresolved/unbought rows on the list.
- Historical Trip/purchase/stock/evidence records remain readable and traceable.

## Deferred and excluded

- Receipt upload/reconciliation (Stage 5).
- Multi-shop optimization, cost forecasting, and automatic alternative suggestions after Phase 1.
- Offline/PWA behavior.
- Broad schema renaming unrelated to the list-first contract.

## Revision gate

Before implementation, reconcile terminology from Stage 1 and any Product/review contract changes
from Stages 2–3. After completion, revise Stage 5 against the final session command, evidence, and
leftover-list semantics.
