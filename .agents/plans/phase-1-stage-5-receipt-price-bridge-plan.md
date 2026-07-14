# Phase 1 Stage 5 — receipt reconciliation and price-observation bridge

Status: Research-gated successor plan. The research and decision work can be approved after Stage 4;
implementation must wait for the decision checkpoint in this plan.

## Objective

Let a household member attach one supported digital receipt to an active shopping session, correct
uncertain reconciliation, and turn confirmed receipt facts into idempotent purchase and price
evidence without silently changing shared Products.

This stage proves one reliable end-to-end path. It does not build a generalized receipt platform or
promise arbitrary OCR.

## Dependencies and current reality

- Stage 4 owns the final Shopping-list/session commands, bought-row semantics, leftovers, retry, and
  completion behavior. This plan must be reconciled against those implemented contracts.
- Stage 2 owns household-to-Product discovery and explicit linking.
- Stage 3 owns shared-evidence review candidates, corrections, conflicts, and audit.
- Current shopping persistence already records Trip/result facts and price-related evidence, but the
  repository has no approved receipt format, extractor, upload threat model, or retention policy.
- Receipt examples must be sanitized fixtures. Private user receipts and production payloads must not
  enter the repository, logs, screenshots, or test output.

## Research and decision gate

Research is required before extractor or schema implementation. Capture the result in durable
operations/architecture documentation and obtain user approval for these decisions:

1. **First supported input.** Compare realistic digital-receipt formats and access rules. Prefer a
   structured, documented format over image OCR when it can prove the first complete journey.
2. **Trust boundary.** Define accepted type/signature, maximum size and line count, validation,
   malformed/encrypted input behavior, malware posture, timeout/resource limits, and safe errors.
3. **Privacy and retention.** Identify payment, loyalty, address, account, and other personal fields;
   decide what is rejected, redacted, retained, encrypted, displayed, logged, and deletable.
4. **Execution model.** Verify whether extraction fits the serverless request limits or needs a
   bounded asynchronous job. Do not introduce a queue merely for hypothetical future formats.
5. **Confidence policy.** Define which shop, time, currency, identifier, line, quantity, unit, and
   price facts can be accepted automatically and which require explicit correction.
6. **Evidence lifetime.** Decide whether raw upload bytes are retained at all, for how long, and what
   normalized/checksum evidence is sufficient for retry, audit, and deletion.

The checkpoint must name the approved format/adapter, processing mode, retention matrix, confidence
rules, sanitized fixtures, and known unsupported cases. If no candidate is reliable and lawful
enough, stop after research and revise the Phase 1 closure criterion instead of implementing a fake
adapter.

## Intended contract after the gate

### Upload and normalized evidence

- Receipt upload is optional and available only within an authorized active shopping session.
- One successful input creates or reuses an idempotent upload/evidence record using a stable content
  identity; retries cannot duplicate reconciliation or price observations.
- The extractor boundary is the smallest interface needed by the one approved adapter. Its normalized
  result carries format/version, merchant/shop evidence, purchase time, currency, bounded raw line
  label, quantity/unit, total or unit price, identifiers, confidence, and field-level provenance.
- Original evidence and normalized/derived facts remain distinguishable. Deleting raw bytes must not
  fabricate provenance or leave an unexplained shared fact.

### Reconciliation

- Implement reconciliation as deterministic core logic before wiring the UI. Prefer exact receipt
  identifiers and explicit session/Product/shop links; then use normalized name and amount evidence.
- A confident receipt line may confirm or enrich one bought row. A plausible or ambiguous line stays
  unresolved until the member chooses or corrects it.
- Extra receipt lines can become explicit unplanned bought rows. Missing receipt lines do not erase
  bought marks, and unmatched list rows remain on the open list.
- Corrections show their consequence before persistence. Reprocessing the same corrected evidence is
  stable, and stale session/reconciliation revisions fail visibly.
- A member can finish with no receipt or unresolved receipt rows. The UI states what was applied,
  deferred for review, or left unresolved.

### Product and price bridge

- Confirmed receipt identifiers may justify linking the household purchase to an existing Product;
  weak name similarity cannot silently create, merge, or relink a shared Product.
- Shared Product corrections or uncertain new evidence become Stage 3 review candidates with receipt
  provenance rather than direct catalogue mutations.
- Price observations include Product or explicit unresolved identity, shop/market, observed date,
  currency, quantity/unit basis, applicable conditions, and source evidence where available.
- Observation identity and retry behavior are explicit. The same receipt/session application cannot
  create duplicate price or stock facts.

## Data and operational rules

- Inventory affected collections only after the research decision fixes the contract. Any validator,
  new required field, index, or existing-data change follows the database maintenance registry rule;
  validator work and data migration remain independently tracked.
- File parsing is isolated from request/auth logic and receives bounded bytes or a controlled object,
  not arbitrary filesystem or network authority.
- Logs use stable receipt/evidence ids and safe status metadata, never raw lines or private payloads.
- Provide explicit retry, delete/retention, failure, and operator-diagnostic behavior for the chosen
  processing mode.

## Commit-sized implementation sequence

1. **Research record and approved contract** — document format comparison, threat/privacy model,
   retention, execution mode, confidence policy, fixtures, and the user decision. No extractor yet.
2. **Expected-outcome contracts and database registry** — add normalized evidence, reconciliation,
   observation-identity specs, boundaries, and any required maintenance entries before production
   behavior.
3. **One extractor and safe upload path** — implement only the approved adapter, validation,
   idempotent evidence persistence, authorization, retry, and safe diagnostics.
4. **Session reconciliation experience** — connect the extractor result to deterministic matching,
   corrections, unresolved states, and list/session commands with focused coordination specs.
5. **Price/Product bridge and operations** — persist idempotent observations, explicit Product links
   or review candidates, finalize retention/delete handling, smokes, and durable documentation.

Each unit receives normal review before the next. If research requires an asynchronous worker or a
materially different data boundary, revise this plan and commit split before implementation.

## Validation plan

- Expected-outcome pure specs for extraction normalization, stable matching, ambiguity, corrections,
  totals/quantities, observation identity, partial completion, and retries.
- Sanitized format fixtures covering a valid receipt plus consequential malformed, duplicate,
  oversized, unsupported, missing-field, and privacy-redaction cases.
- Route/repository tests for authorization, content validation, stale revisions, persistence,
  deletion/retention, review-candidate handoff, and duplicate prevention.
- Configured Mongo smoke for receipt/session/price persistence when the approved design changes
  validators, indexes, transactions, or idempotency boundaries.
- Security/resource-limit checks appropriate to the chosen parser. Do not use live private receipts as
  routine CI fixtures.
- Update `scripts/phase1-manual-test.md` for real upload wiring, understandable correction, locale,
  and operator/privacy evidence; execute it only in Stage 7.
- Run the repository test, integration, typecheck, lint, build, format, and diff checks applicable at
  each commit.

## Exit criteria

- One approved digital-receipt type safely enriches an active session end to end.
- Reconciliation is explainable and correctable; ambiguous lines never silently complete purchases.
- Confirmed receipt evidence creates traceable, idempotent stock and price facts and only justified
  Product links.
- No-receipt, unresolved, retry, reload, failure, and deletion/retention paths are explicit.
- The implemented privacy, resource, provenance, and operational behavior matches the approved gate.

## Deferred and excluded

- Arbitrary photographed-receipt OCR and a multi-provider extraction platform.
- Automatic shared Product creation/merging from uncertain receipt text.
- Household cost forecasting, discount discovery, shop comparison, and alternative suggestions; these
  are the core follow-up after Phase 1.
- Expansion to formats not evaluated at the research gate.

## Revision gate

After Stage 4, replace assumptions with its actual session commands and evidence ownership. After
Stage 3, use its implemented candidate contract rather than inventing a receipt-only review system.
Revise Stage 6 with the resulting raw-evidence and derived-fact retention requirements.

