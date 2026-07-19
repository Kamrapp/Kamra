# Phase 1 Stage 2 — household Product discovery and linking

Status: Draft successor plan. Reconcile terminology after Stage 1, then obtain user approval before
implementation.

## Objective

Let a household member find and link an existing shared Product from the normal household Product
create/edit flow without knowing ids or leaving the household workspace. Keep create-new and unlinked
paths explicit, prevent accidental duplicates, and remain responsive at realistic Product volume.

## Why this can be planned now

- Household Products already carry an optional `catalogProductId` and persisted identity snapshot.
- The Products API already supports authenticated pagination, bounded page size, source filtering,
  and name search.
- Product responses already expose useful names, identifiers/source facts, and tag keys; Product
  Concepts/Attributes are available through the classification model.
- The household editor currently exposes the link as a raw field, so the required seam is concrete.

The exact ranking weights and any new Mongo index are implementation-time decisions based on focused
fixtures and query-plan evidence, not assumptions in this plan.

## Required behavior

### Compact household picker

- Replace raw shared-Product id entry with one compact search/picker in the Household Product editor.
- Search incrementally with cancellation/stale-response protection, bounded result pages, clear
  loading/empty/error states, and keyboard-accessible selection.
- Show only enough identity context to distinguish results: Product name, relevant identifiers or
  source/brand/package facts, and a small set of useful concept/attribute/tag labels.
- Show the current link and allow an explicit change or unlink action without rewriting historical
  Stock Batch snapshots.

### Deterministic search and suggestions

- Define a pure, explainable ranking policy before implementing the query path.
- Prioritize exact stable identifier matches, then normalized exact names, strong token/name matches,
  prior household links, and approved concept/attribute/tag evidence.
- Treat Product Group names as household intent/context, not proof that a shared Product matches.
- Do not add learned matching, an external search engine, or a fuzzy-search dependency in this stage.
- Return a short explanation code for suggested results so the UI can distinguish identifier, name,
  prior-use, and metadata suggestions.
- Paginate independently of ranking and use a stable deterministic tie-breaker.

### Safe linking and creation

- A suggestion never links automatically. Saving requires the member's explicit selected Product or
  explicit unlinked/create-new choice.
- When a member starts creating a Product whose normalized name or identifier strongly matches an
  existing Household Product or shared Product, show a duplicate warning and the relevant choices;
  do not silently merge.
- Revalidate the selected shared Product server-side on save and return an expected failure if it is
  missing, archived, inaccessible, or stale.
- Preserve household authorization, nullable links, identity snapshots, and correction history.

## Architecture and data boundaries

- Extend the existing read-only Products query rather than create a second Product index or household
  copy of the shared Product collection.
- Add household-context suggestion input only when it has current value; keep the base Products query
  reusable and bounded.
- Shared Product reads remain available to signed-in users; shared Product mutation remains admin-
  controlled.
- Household Product writes remain in the household command/repository boundary.
- If a new or changed index is required on an existing collection, register the validator/index
  maintenance implications before implementation. Do not add an index without query-shape evidence.
- Historical Batch and purchase snapshots retain the name/identity captured at acquisition even if
  the current Household Product link changes.

## Implementation units and commit split

### Commit 1 — expected ranking and query contracts

- Add sanitized fixtures covering identifiers, normalized names, concepts, attributes, tags,
  archived Products, ambiguous matches, prior household links, pagination, and stable ties.
- Write failing expected-outcome specs for ranking, explanation codes, bounds, and stale query input.
- Extend shared Product query/response contracts only with fields the approved UI needs.
- Commit message idea: `test: define household Product discovery contracts`

### Commit 2 — bounded Product discovery API

- Implement the smallest query/ranking path behind the existing catalog route slice.
- Enforce authentication, input bounds, pagination, stable ordering, and safe archived/inaccessible
  behavior.
- Add or adjust Mongo indexes only after inspecting the real query; update the database maintenance
  registry if an existing collection's structure/validator requires it.
- Cover route, repository, authorization, and realistic-volume behavior.
- Commit message idea: `feat: add household Product discovery query`

### Commit 3 — compact household linking UX

- Replace the raw id input with the compact picker and explicit current-link/change/unlink/create-new
  states.
- Reuse the current Household Product editor and service; do not create a parallel management page.
- Protect request cancellation, overlapping saves, stale revisions, duplicate warnings, focus, and
  localized success/failure feedback with focused state/coordination specs.
- Commit message idea: `feat: add household Product picker`

### Commit 4 — persistence guardrails and documentation

- Revalidate links on write, preserve snapshots/history, and expose expected failures consistently.
- Update active household/Product docs and the deferred Phase 1 manual runbook.
- Record query limits and any configured Mongo validation required for release.
- Commit message idea: `docs: document household Product linking`

## Validation

- Pure ranking/suggestion specs written before implementation.
- Focused editor coordination specs without HTML-level browser interaction duplication.
- Route/repository integration tests for search, pagination, authorization, and save validation.
- Realistic bounded fixture proving query/result limits.
- `npm test`, `npm run typecheck`, `npm run lint -- --max-warnings=0`, `npm run build`,
  `npm run format:check`, and `git diff --check`.
- Run `npm run smoke:catalog` only if Product indexes/validators change, against an approved database.
- Update but do not execute the integrated Phase 1 manual runbook.

## Exit criteria

- A member can search, page, inspect, select, change, or remove a shared Product link inside the
  household flow.
- Identifier/name/metadata suggestions are deterministic, bounded, and explainable.
- Weak matches never silently link or create/merge Products.
- Existing links and historical snapshots remain understandable and correctable.
- Search remains responsive at the approved realistic catalogue fixture size.
- Stable automated evidence covers ranking, API, persistence, authorization, stale responses, and
  duplicate warnings.

## Deferred and excluded

- Learned/semantic/vector search, Elasticsearch, and generalized recommendation infrastructure.
- Automatic Product Group assignment or shared Product promotion.
- Shop/price optimization and alternative Product recommendations after Phase 1.
- Receipt identifier matching, owned by Stage 5.
- Review-workbench Product correction, owned by Stage 3.

## Revision gate

At Stage 1 completion, reconcile exact terms and locale keys. At Stage 2 completion, revise Stage 3's
candidate summary and Product-selection assumptions using the implemented query contract.

