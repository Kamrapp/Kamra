# Phase 1 Stage 3 — scalable review and simpler administration

Status: Draft successor plan. Review after Stage 2 and obtain user approval before implementation.

## Objective

Turn source and Product-evidence review into a resumable, high-throughput workbench where an admin can
reliably perform an `accept → accept → later → decline → correct` rhythm at both source-capture and
extracted-entry level. Separate routine Product/source review from dangerous developer operations.

## Why this can be planned now

- Crawl/source snapshots, parsed rows, review items, Product acceptance previews, paging, filtering,
  status persistence, and revision conflicts already exist.
- Current review is row-oriented and supervised, but not optimized for continuous decisions or large
  queues.
- Site Admin, shopping/price review, and Developer Admin are already separate route areas, even though
  labels and navigation remain mixed.

The exact queue query/index changes and whether a bounded undo is supportable must be decided from
the implemented decision model and measured fixture, not presumed here.

## Required behavior

### Two related queues

- Provide a Source capture queue with source, capture time, processing/review progress, counts,
  failures, and resumable filters.
- Provide an Extracted entry/Review candidate queue for the rapid decision loop.
- Preserve the visible relationship between a candidate and every source capture/entry that supports
  it; source-level progress must not hide unresolved child evidence.
- Use cursor/bounded pagination or an equivalent stable continuation contract; never load an entire
  large queue into the browser.

### Rapid decision controller

- Make Accept, Later, Decline, and Correct the stable primary actions.
- After a successful decision, advance to the next eligible candidate while keeping focus and current
  filters predictable.
- Provide visible keyboard shortcuts with a touch-friendly equivalent; do not rely on gesture-only or
  hover-only actions.
- `Later` must be a persisted, resumable state or ordering decision—not a client-only skip that loses
  the item.
- Decline requires a bounded reason; Correct shows the proposed versus corrected fact before commit.
- Disable overlapping actions, handle stale revisions explicitly, preserve unsaved correction input
  on recoverable failures, and never optimistically show success before persistence wins.

### Source-level and reversal safety

- Preview the exact child impact of source-level accept/defer/decline/reprocess actions.
- Broad or destructive actions require explicit confirmation and must stop on the first failed child
  operation when sequential consistency matters.
- Add undo only if the approved persistence model can express a valid compensating decision with
  audit/provenance. Otherwise expose correction/reopen and say why irreversible decisions cannot be
  undone.
- Persist actor, timestamp, revision, action, bounded reason, previous/new status, and correction
  provenance in the appropriate audit/history boundary.

### Simpler administration

- Apply the Stage 1 labels: Product management, Source review, and Developer tools.
- Keep routine review and Product facts under Site Admin; keep database maintenance, diagnostics,
  seeds, users, feature flags, and destructive actions under Developer tools.
- Product/price evidence from household shopping may reuse the decision language and shared review
  controller, but receipt-specific reconciliation fields remain Stage 5 concerns.

## Data and migration decisions

- Inspect current review statuses, revisions, reasons, corrections, and audit records before defining
  the final transition table.
- If `later`, correction history, source-level progress, or reversal metadata changes an existing
  collection, define stable maintenance-registry ids before implementation.
- Validator updates and existing-data migrations remain independent, idempotent actions.
- Backfill legacy pending/accepted/declined records deterministically; ambiguous history remains
  explicit rather than guessed.
- Query/index work must be justified by the realistic queue fixture and measured explain/query plan.

## Implementation units and commit split

### Commit 1 — decision policy, queue contracts, and migration registry

- Write expected transition, conflict, correction, defer/resume, audit, and source-impact specs.
- Define bounded queue/cursor/count contracts and the source-candidate relationship.
- Register validator/data migrations if the accepted contract changes stored review records.
- Commit message idea: `feat: define scalable review contracts`

### Commit 2 — backend queues and decision commands

- Implement bounded Source capture and Review candidate queries in the ingestion/review slices.
- Implement revisioned Accept/Later/Decline/Correct commands and source-level previews/actions.
- Preserve provenance and audit; validate authorization and duplicate/idempotent submissions.
- Add realistic-volume repository/route tests and any evidence-based indexes.
- Commit message idea: `feat: add resumable review queues`

### Commit 3 — rapid review workbench

- Build a focused review controller/state seam with tests before the UI.
- Implement continuous next-item navigation, keyboard/touch actions, correction mode, failure recovery,
  progress, filters, and resume behavior.
- Keep raw evidence bounded/redacted and avoid copying payloads into logs or test artifacts.
- Commit message idea: `feat: add rapid source review workbench`

### Commit 4 — administration navigation and operational polish

- Reorganize visible navigation/landing content around Product management, Source review, and
  Developer tools without changing authorization semantics.
- Add safe source-level confirmations, audit presentation, and reversal/correction explanation.
- Update active ingestion/admin docs and the Phase 1 runbook.
- Commit message idea: `refactor: clarify Product and developer administration`

## Validation

- Pure state-transition and controller specs written before implementation.
- Route/repository tests for pagination, filters, counts, revisions, authorization, audit, and
  source-level partial failure.
- Realistic large synthetic queue performance test with bounded memory/result size.
- Accessibility review of focus order, shortcut discoverability, disabled/loading states, and touch
  alternatives; integrated browser acceptance remains deferred.
- `npm test`, `npm run test:integration`, `npm run typecheck`, lint, build, format, and diff checks.
- Configured Mongo smoke only when validators/indexes/concurrency claims require real Mongo evidence.

## Exit criteria

- An admin can process a long mixed sequence quickly, defer work, interrupt, and resume without loss
  or duplicate decisions.
- Source- and entry-level status/count/provenance remain consistent and understandable.
- Conflicts, corrections, decline reasons, and safe reversal/reopen paths are explicit and audited.
- Large queues remain bounded and responsive at the approved fixture size.
- Routine review is clearly separated from Developer tools and dangerous maintenance.

## Deferred and excluded

- Autonomous acceptance, learned confidence thresholds, and bulk mutation without preview.
- Receipt-specific extraction/reconciliation UI (Stage 5).
- Crawl retention/compaction and near-duplicate lifecycle (Stage 6).
- Broad Product taxonomy governance not needed by the current review loop.

## Revision gate

After Stage 2, align Product result summaries and picker reuse. After Stage 3, revise Stage 5's
receipt-candidate handoff and Stage 6's lifecycle states against the implemented review contract.

