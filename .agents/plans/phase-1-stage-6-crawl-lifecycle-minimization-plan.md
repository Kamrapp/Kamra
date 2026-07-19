# Phase 1 Stage 6 — crawl lifecycle and data minimization

Status: Research- and measurement-gated successor plan. Only the read-only audit and policy decision
should be approved initially; mutation implementation waits for that checkpoint.

## Objective

Bound crawl storage and review growth while preserving unresolved evidence, correction capability,
and source provenance. Exact repeats should be idempotent, plausible repeats should share review work
without destructive merging, and processed evidence should follow an explicit recoverable lifecycle.

## Dependencies and current reality

- Stage 3 owns the implemented source-capture and extracted-entry review states, correction history,
  deferral, and candidate audit used to decide whether evidence is still active.
- Stage 5 clarifies which normalized/derived facts are sufficient when raw receipt evidence is
  deleted; crawl evidence must use the same provenance principles where applicable.
- Current ingestion persistence already uses stable raw snapshot, run, and Product-review-item
  collections and has exact daily idempotency behavior. That does not yet prove near-duplicate
  identity, retention safety, storage bounds, or recovery.
- There is no approved measurement of real state distribution, duplicate clusters, document sizes,
  age, or index cost. A retention window or merge rule chosen now would be guesswork.

## Measurement and policy gate

Run a bounded read-only audit against an explicitly approved non-sensitive environment. Report
aggregates only; do not export raw source payloads into plans, commits, logs, or fixtures.

Measure, where the current schema allows:

- document and byte estimates by collection, source type, age bucket, and lifecycle/review state;
- exact identity/content-hash repeats and the work they currently duplicate;
- candidate near-match clusters using explainable source-specific fields, without merging them;
- relationships from captures to runs, entries, decisions, corrections, shared Product facts, and
  operator-visible history;
- unresolved, deferred, failed, accepted, declined, superseded, and orphaned states;
- current indexes, write/read patterns, free-tier/hosting limits, and likely cleanup batch cost.

Then obtain user approval for:

1. a lifecycle/retention matrix for every state, including raw, normalized, derived, rejected,
   deferred, failed, superseded, and orphaned records;
2. the evidence required before compact, archive, or delete, plus the restore/recovery expectation;
3. exact duplicate identity per source and the conflict policy when source metadata differs;
4. non-destructive near-match/group identity and which fields remain independently reviewable;
5. manual versus scheduled execution, bounded batch size, dry-run output, audit lifetime, and stop/
   resume behavior;
6. operational thresholds and alerts that define acceptable database/review growth.

If the data cannot justify safe terminal states or recovery, implement observability and exact
idempotency only, then defer destructive minimization rather than inventing certainty.

## Intended lifecycle contract after the gate

### Exact identity and pending work

- A stable source identity plus canonical content identity makes exact repeated capture idempotent.
  Replays may update safe occurrence metadata but cannot create duplicate review decisions or facts.
- Similar unresolved captures are grouped or point at a canonical review candidate; they are not
  destructively collapsed. Every occurrence needed for provenance and later correction stays
  addressable under the approved retention policy.
- Grouping is deterministic, bounded, explainable, and source-aware. A weak cross-source/name match is
  a review hint, not identity.

### Processed evidence lifecycle

- Raw evidence becomes eligible for compaction/archive/deletion only when the approved terminal-state
  rules, durable derived facts, checksums/source references, audit requirements, and recovery policy
  are satisfied.
- Unresolved, deferred, conflicted, or failed evidence is never silently removed by age alone.
- Cleanup is an explicit idempotent state transition with a recorded reason, policy version, counts,
  and failure. Archive verification precedes deletion when archive is part of the policy.
- Reprocessing, correction, source history, and operator investigation remain possible to the degree
  promised by the approved matrix; the UI must not claim unavailable raw evidence still exists.

### Operator control

- Provide lifecycle counts and bounded drill-down without loading or exposing entire raw payloads.
- Every mutating action offers a dry-run summary first, processes bounded batches sequentially, stops
  on the first unknown failure, and can safely resume without repeating completed work.
- Scheduled cleanup, if approved, uses the same core executor and policy as the manual operator path.
  Platform scheduling remains thin glue.
- Dangerous broad actions require explicit scope and confirmation; no hidden TTL or fire-and-forget
  deletion is introduced.

## Data and migration rules

- Define registry ids, validator actions, and idempotent data migrations before changing an existing
  MongoDB collection. Validator and migration completion remain separately tracked.
- Backfills compute deterministic identities/states, are rerunnable, report conflicts, and do not
  guess near-match merges.
- Add indexes only from measured query/write needs. Include index storage/write amplification in the
  gate rather than assuming every grouping field needs an index.
- Collection or route renames are not required for terminology cleanup; preserve compatible technical
  boundaries when they remain accurate.

## Commit-sized implementation sequence

1. **Read-only audit and evidence report** — add or document a bounded measurement command, validate
   it against approved data, and record aggregate findings and unanswered questions. No cleanup.
2. **Approved lifecycle specification** — finalize the retention/state/recovery matrix, exact and near
   identities, operator controls, thresholds, database registry entries, and expected-outcome specs.
3. **Exact idempotency and deterministic backfill** — protect new captures and safely identify existing
   exact repeats with repository tests and configured Mongo evidence.
4. **Non-destructive review grouping** — coalesce repeated pending work at the Stage 3 queue boundary
   while preserving occurrences, conflicts, provenance, and corrections.
5. **Lifecycle executor and operator surface** — implement dry-run/apply, bounded batches, archive or
   compaction verification, stop/resume, audit, authorization, counts, and diagnostics.
6. **Operationalization and documentation** — enable only the approved manual/scheduled mode, validate
   volume behavior and recovery, update runbooks/smokes, and remove no evidence beyond policy.

If measurement changes the data model, destructive policy, or execution model materially, revise and
reapprove this plan before Step 2.

## Validation plan

- Expected-outcome specs for canonical identity, occurrence accumulation, grouping boundaries,
  lifecycle eligibility, dry-run/apply equivalence, batch resume, and idempotency.
- Repository/integration tests for state relationships, correction/provenance preservation, conflicts,
  authorization, partial failure, archive verification, and recovery where promised.
- Configured Mongo smoke for unique/index behavior, backfills, validators, batching, and reruns against
  an approved disposable fixture database.
- Bounded synthetic volume tests derived from measured distributions, with explicit result-size,
  memory, query-count, and duration expectations rather than production payload copies.
- Operator-safety checks proving dry-run counts, confirmation scope, stop-on-failure, retry, and audit.
- Update `scripts/phase1-manual-test.md` for configured counts, grouping clarity, archive/repair, and
  safety evidence; execute the integrated pass only in Stage 7.
- Run repository tests, integration, typecheck, lint, build, format, and diff checks applicable to
  each commit.

## Exit criteria

- Exact repeated captures no longer duplicate stored work or downstream decisions.
- Similar pending captures share bounded review work without losing individual provenance or being
  falsely merged.
- Every processed-evidence state has an implemented, documented, and measured retention outcome.
- No unresolved evidence can be silently deleted; every mutation is dry-runnable, bounded,
  auditable, idempotent, and safely resumable.
- Database and review growth remain within the approved thresholds on realistic fixtures, and any
  archive/recovery promise has been exercised.

## Deferred and excluded

- Expansion of crawler/source coverage or changes to source acquisition policy.
- Learned/opaque near-duplicate clustering and cross-source automatic identity merges.
- Hidden TTL deletion or enabling unattended destructive cleanup before measured operator runs prove
  the policy.
- Long-term analytics/data-warehouse design unrelated to operational minimization.

## Revision gate

After Stage 3, replace assumed review states and grouping UI with its actual contract. After Stage 5,
align evidence retention and deletion terminology. The measurement report is a hard checkpoint:
revise the implementation steps if its findings contradict these assumptions.

