# Phase 1 usability completion

Status: Planned. This is the active post-MVP roadmap as of 2026-07-14. Each stage requires a
focused implementation plan and user approval before implementation.

## Objective

Finish Kamra's core household-to-catalogue loop as one coherent product experience:

- the household vocabulary and Shopping list drive the user journey;
- a household member can find and link an existing Product without understanding catalogue internals;
- shopping at one shop is a light mode around the open list, not a competing workflow;
- receipt evidence can reconcile purchases, create price observations, and improve Product links;
- an administrator can review large queues quickly without giving up corrections, provenance, or audit;
- crawl evidence is retained or consolidated by an explicit lifecycle rather than growing without bound.

Phase 1 is usability completion of the existing feature set. It is not a broad feature-expansion
phase and should end with the household, shopping, review, and catalogue bridge feeling intentional
rather than like adjacent technical surfaces.

## Transition from MVP

The MVP closed on 2026-07-14 with its household-side acceptance complete. The final Stage 11
Shopping Trip/pricing/ingestion-review checks, Crawl Snapshot archive/repair/dialog checks, and their
combined closure matrix were deliberately transferred to Phase 1 because the affected journeys will
be redesigned here. Repeating acceptance against the outgoing interaction model would create work
without protecting the intended Phase 1 behavior.

The archived MVP roadmap, plans, handoffs, and runbook remain evidence under their respective `mvp/`
folders. The transferred checks are owned by `scripts/phase1-manual-test.md` and must be finalized as
the stages settle, then executed once at the Phase 1 acceptance stage.

## Product principles

1. **Household-first language.** User-facing household terms define the journey. Technical ingestion,
   crawl, catalogue, and transaction terms appear only where the distinction helps an operator.
2. **Shopping list as the primary surface.** A shop-specific session enriches an open list; it does
   not require users to maintain a second representation of the same work.
3. **Evidence before inference.** Receipt and crawl facts keep provenance. Uncertain matches become
   reviewable candidates and do not silently overwrite shared Product facts.
4. **Fast paths remain reversible.** Rapid review supports keyboard-first decisions, deferral,
   correction, undo where safe, and visible conflicts/audit.
5. **Schemas serve the journey.** Existing Shopping Trip storage may remain when useful, but API and
   persistence boundaries must not force duplicate UI concepts.
6. **Automate stable behavior.** Write expected-outcome specs before checking current behavior. Prefer
   focused logic/component-controller specs for coordination across multiple UI blocks; reserve the
   final manual pass for real browser wiring, visual judgment, configured data, and operator safety.

## Required stages

The stages are sequential because each establishes language or contracts used by the next. A stage
may prepare a compatible seam for later work, but must not implement later-stage product behavior.

The complete sequence is planned early at deliberately different confidence levels:

| Stage | Planning confidence | Approval rule |
| --- | --- | --- |
| 1 | Approved detailed plan | Implement against the approved plan. |
| 2–4 | Implementation-oriented successor drafts | Reconcile predecessor runtime contracts, then obtain user approval before implementation. |
| 5–6 | Research- and decision-gated drafts | Approve measurement/research first; approve implementation only after the documented decision gate. |
| 7 | Closure framework | Revise after every stage and approve the executable acceptance plan after Stage 6. |

These plans may be revised at every stage boundary. A revision that changes architecture, data
policy, stage order, closure scope, or commit split needs explicit review; stage-internal file and
test details can follow runtime truth without pretending the early plan was exact.

### Stage 1 — journey contract and terminology

Define the canonical household journey and remove ambiguous language before expanding it.

Approved detailed plan: [Phase 1 Stage 1 plan](./phase-1-stage-1-journey-terminology-plan.md).

- Inventory user-facing and code-facing uses of Shopping list/Shopping Trip, Crawl/Ingestion, and
  Catalogue/Product.
- Choose one canonical term per user concept and document the few technical distinctions that must
  remain. Household terminology is the default; renames should not erase meaningful provenance or
  external-source boundaries.
- Specify the list-first state model: build list, start shopping at a selected shop, record purchases,
  optionally reconcile a receipt, finish shopping, and leave unpurchased rows on the list.
- Map compatibility boundaries and database-maintenance entries needed for later schema changes.
- Update the Phase 1 manual runbook with the agreed terms and journey, without executing its deferred
  acceptance sections.

Exit: one approved vocabulary and state-transition contract is reflected in the relevant durable
domain/architecture docs and can be used by every later stage.

### Stage 2 — household Product discovery and linking

Make the existing Product universe feel native inside household editing.

Detailed successor draft: [Phase 1 Stage 2 plan](./phase-1-stage-2-household-product-discovery-plan.md).

- Add a compact, paginated search over Products from the household add/link flow.
- Rank and explain suggestions using available names, identifiers, Product Concepts, Product Groups,
  tags, and other approved metadata; exact identifiers and prior household choices should outrank
  fuzzy metadata.
- Keep explicit create-new and leave-unlinked paths. Never silently create or relink a Product because
  a suggestion is merely plausible.
- Prevent accidental duplicates and make an existing link understandable and correctable.
- Establish query/index limits so the experience remains responsive with a large catalogue.

Exit: a household member can find, select, correct, or deliberately create a Product through one
compact flow, with ranking behavior protected by focused specs.

### Stage 3 — scalable review and simpler administration

Turn crawl- and candidate-level review into a high-throughput workbench.

Detailed successor draft: [Phase 1 Stage 3 plan](./phase-1-stage-3-scalable-review-admin-plan.md).

- Provide queue views at both source capture/Crawl Snapshot level and individual extracted-entry
  level, with an unambiguous relationship between the two.
- Support a rapid `accept → accept → later → decline → correct` rhythm with keyboard controls,
  immediate next-item navigation, clear focus, and a compact touch-friendly equivalent.
- Preserve deferral, decline reasons, corrections, confidence, provenance, history, and safe stale-
  revision handling. Add a bounded undo only where the persisted action can actually be reversed.
- Make bulk/source-level actions explicit about their effect on child entries and require confirmation
  for destructive or broad decisions.
- Simplify Site Admin versus Developer Admin navigation so product review, operational maintenance,
  and diagnostics do not compete in one undifferentiated surface.
- Reuse the review decision model for other evidence candidates where appropriate, without forcing
  crawl-specific fields onto receipt reconciliation.

Exit: an admin can process a realistically large synthetic queue efficiently, interrupt and resume
it safely, correct exceptions, and understand what was persisted.

### Stage 4 — Shopping-list-first shop session

Remove the visible duality between Shopping list and Shopping Trip.

Detailed successor draft: [Phase 1 Stage 4 plan](./phase-1-stage-4-list-first-shopping-plan.md).

- Keep the open Shopping list as the main workspace. Starting shopping is one action that selects a
  Shop Market or an explicit custom shop and opens lightweight session details.
- While the session is active, marking a list row bought automatically records it in that session.
  Unplanned purchases are added through the list and recorded by the same path.
- Preserve actual Product, quantity/unit, price/currency, acquisition date, and expiry facts when
  known, but reveal detail progressively instead of making every purchase a form workflow.
- Make resume, cancellation, retry, and idempotent completion understandable. Cancellation must not
  strand or silently discard the underlying list.
- Finishing the session applies purchased rows to household stock and leaves only unresolved or
  unpurchased rows on the still-open list.
- Keep existing Shopping Trip persistence if it remains the clearest transaction/evidence boundary;
  adapt contracts or schema only when that helps the list-first experience.

Exit: a member can go from list to shopping and back without managing two competing objects, and
retry/reload behavior cannot duplicate purchases, stock, or observations.

### Stage 5 — receipt reconciliation and price-observation bridge

Use receipt evidence to complete the session and feed useful facts toward the shared catalogue.

Research-gated successor draft:
[Phase 1 Stage 5 plan](./phase-1-stage-5-receipt-price-bridge-plan.md).

Research gate before implementation:

- compare supported digital-receipt formats and realistic extraction modules before choosing the
  first adapter; prefer structured digital receipts when they provide a simpler reliable first path;
- define privacy, file-type/size, malware handling, payment/personal-data redaction, raw-file
  retention, and deletion rules;
- define confidence and correction requirements for identifiers, line items, quantities, units,
  prices, currency, shop, and timestamps.

Required behavior:

- Offer one receipt-upload action inside an active shopping session, backed by a replaceable but
  minimal extractor boundary with at least one real approved format.
- Reconcile extracted rows with bought, remaining, and unplanned list rows. Show uncertain matches
  for correction rather than silently completing them.
- Add missing purchases and available amounts/prices/identifiers, then create idempotent price
  observations with source evidence and applicable shop/date context.
- Link to real Products when identifiers or confirmed reconciliation justify it. Route uncertain
  shared-catalogue changes through review rather than promoting household guesses automatically.
- Allow the user to finish without a receipt or with unresolved receipt rows; explain what remains
  pending and preserve retry safety.

Exit: an approved receipt type can enrich and reconcile one shopping session, produce traceable price
observations, and improve Product links without duplicate or unjustified shared facts.

### Stage 6 — crawl lifecycle and data minimization

Keep ingestion useful without allowing raw or pending crawl data to drown the database.

Measurement-gated successor draft:
[Phase 1 Stage 6 plan](./phase-1-stage-6-crawl-lifecycle-minimization-plan.md).

Research gate before implementation:

- measure volume, state distribution, duplicate patterns, and provenance requirements on approved
  non-sensitive data;
- decide retention windows and whether raw processed evidence is retained, compacted, archived, or
  deleted for each terminal state;
- distinguish exact duplicate identity from near-match grouping. Similar unprocessed captures must
  not be destructively merged until the evidence and conflict policy is approved.

Required behavior:

- Deduplicate exact captures with stable source identity/content hashes and idempotent writes.
- Coalesce matching pending work into a review group or canonical candidate while retaining the
  source references needed for provenance and later correction.
- Compact or archive processed raw records only after durable derived facts, checksums/provenance,
  and operator recovery expectations are satisfied.
- Expose lifecycle counts, failures, and retry/cleanup actions through bounded operational surfaces.
- Register validator and data migrations independently in the database maintenance registry.

Exit: repeated crawls do not create unbounded duplicate review work, processed evidence follows an
explicit verified retention policy, and no cleanup path can silently discard unresolved evidence.

### Stage 7 — integration hardening and Phase 1 acceptance

Close the whole journey only after the preceding behavior has stabilized.

Closure-framework draft:
[Phase 1 Stage 7 plan](./phase-1-stage-7-integration-acceptance-plan.md).

- Reconcile naming, navigation, accessibility, responsive layout, localization, activity/error
  feedback, authorization, and stale/concurrent actions across the household and admin surfaces.
- Fill consequential automated gaps with expected-outcome specs, configured Mongo smoke scripts, or
  API contracts. Do not preserve outgoing behavior merely because the old manual runbook described it.
- Finalize and execute `scripts/phase1-manual-test.md` once against the release candidate, including
  the transferred Shopping Trip/pricing/ingestion and Crawl Snapshot archive/repair checks in their
  new workflows.
- Record evidence, explicit residual risks, and deliberate post-Phase-1 deferrals. Do not close the
  phase with required checks hidden in a session note.

Exit: all Phase 1 closure criteria below are met or an explicit user-approved waiver records owner,
risk, and follow-up.

## Phase 1 closure criteria

Phase 1 is complete when:

- household terminology is consistent and the list-first journey requires no understanding of
  ingestion/catalogue implementation boundaries;
- Product discovery and linking remain usable at realistic catalogue size;
- admins can rapidly review realistic large crawl/candidate queues with correction, deferral,
  provenance, conflict handling, and resumability;
- shopping is started from the list, purchases are captured automatically, and finishing leaves
  unpurchased list items without duplicate side effects;
- at least one approved receipt path reconciles purchases and creates traceable price observations
  and justified Product links;
- crawl retention/deduplication bounds database growth without erasing unresolved or required source
  evidence;
- automated tests protect stable domain and cross-component coordination, configured Mongo smokes
  cover persistence/transaction risks, and the final manual runbook passes in approved environments;
- durable product, architecture, operations, terminology, and testing documentation matches runtime
  truth.

## Cross-cutting quality requirements

- Accessibility and keyboard behavior are product requirements for the high-throughput review flow.
- Hungarian and English copy must use the approved vocabulary consistently.
- Every write path needs visible success/failure, authorization, stale-write behavior, idempotency
  where retries are realistic, and Activity/audit evidence appropriate to its audience.
- Receipt and crawl payloads are untrusted data. Validate at boundaries; do not expose raw private
  payloads in logs, screenshots, commits, or manual-test evidence.
- Structural MongoDB changes follow the database maintenance registry rule; validators and existing-
  data migrations remain separate operator actions.
- Performance acceptance uses bounded realistic fixtures rather than unbounded production exports.

## Validation strategy

Each stage plan must identify the smallest useful layers:

1. Pure/domain specs for ranking, matching, state transitions, reconciliation, retention, and
   idempotency.
2. Larger focused spec files for core coordination that crosses several UI blocks, using small
   injectable/testable seams where needed. Avoid HTML-level end-to-end or snapshot tests when the
   stable behavior can be protected more directly.
3. Route/repository tests and `npm run smoke:*` scripts for configured Mongo behavior that cannot be
   proven in memory.
4. Focused browser/manual checks only for actual wiring, accessibility, layout, localization,
   subjective clarity, real approved data, and operator-only safety.
5. One deferred integrated Phase 1 manual pass after Stage 6 and final hardening, not a repeated pass
   over workflows scheduled for replacement.

## Commit and planning split

- Keep early successor plans at the confidence supported by current runtime code. Reconcile and
  approve the next plan at each stage boundary; pass its research/decision checkpoint separately
  when implementation details depend on evidence not yet available.
- Split implementation into reviewable behavior, persistence/API, UI, automated validation, and
  documentation units where those boundaries are meaningful.
- Update the shared Phase 1 manual runbook as acceptance points become stable, but execute the full
  runbook only in Stage 7.
- Record scope changes here when they alter stage order, architecture, validation strategy, or the
  Phase 1 closure definition.

## Deliberate deferrals

- broad multi-shop route optimization or automatic shop selection;
- offline/PWA shopping mode unless Phase 1 research proves it necessary for the approved flow;
- generalized OCR across arbitrary photographed receipts before one reliable receipt format exists;
- autonomous catalogue mutation from low-confidence crawl or household evidence;
- visual snapshot suites or broad Playwright-style duplication of behavior already protected by
  focused specs;
- unrelated catalogue enrichment, social features, or convenience polish that does not close the
  household-to-catalogue loop.

## Approval checkpoint

The user approved this top-level Phase 1 direction, MVP transition, and Stage 1 plan in the
2026-07-14 requests. Stages 2–7 are early successor drafts, not implementation approval. Each must be
reconciled at the preceding stage boundary and reviewed before code changes; Stages 5–6 also require
their documented research/decision approval.
