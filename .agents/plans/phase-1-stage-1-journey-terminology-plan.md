# Phase 1 Stage 1 — journey contract and terminology

Status: Approved for implementation on 2026-07-14. Implement through the three reviewable commits
defined below.

## Objective

Establish one household-first journey and vocabulary that every later Phase 1 stage can use without
confusing user concepts with implementation layers.

Stage 1 should:

- make the Shopping list the primary household concept and describe shop-specific activity as
  context around that list;
- replace ambiguous user-facing Crawl/Ingestion and Catalog/Products wording with a small, explicit
  vocabulary;
- distinguish household Products, shared Products, shop-specific listings, and evidence only where
  the distinction matters;
- align English and Hungarian navigation, headings, actions, feedback, the in-app manual, and active
  durable documentation;
- document compatibility mappings so later stages can change behavior without a premature API,
  collection, or repository-wide rename.

This is a language and journey-contract stage. It does not implement Product search, the review
workbench, the list-first shopping behavior, receipt extraction, or crawl minimization.

## Context read

- `AGENTS.md`, `.agents/plan-template.md`, and the active Phase 1 roadmap.
- `docs/domain-language.md`, `docs/architecture.md`, `docs/household.md`, and
  `scripts/phase1-manual-test.md`.
- `src/app/i18n/en.json`, `src/app/i18n/hu.json`, translation parity coverage, shell navigation,
  routes, the manual glossary, household shopping components, Product UI, and Site/Developer Admin
  surfaces.
- Current API routes and Mongo collection contracts for catalog, ingestion, Shopping Needs,
  Shopping Trips, and Ingestion Submissions.

## Research gate

No external research is needed. This is a product-language decision grounded in Kamra's current
runtime and the user-approved Phase 1 journey. Accessibility still requires clear action-oriented
labels, but no standards-sensitive implementation is being designed in this stage.

## User requests and decisions already made

- Household terminology should drive the product experience.
- The Shopping list should be the visible interface; a Shopping Trip should not appear as a second
  list or equal competing workflow.
- Crawl/Ingestion and Catalog/Products ambiguity should be removed.
- Later Phase 1 stages will redesign shopping, review, receipts, and crawl lifecycle, so Stage 1 must
  establish their shared language without implementing them early.
- Deterministic terminology expectations should be automated with focused specs; the integrated
  Phase 1 manual run remains deferred until Stage 7.

## Current reality

The current implementation has coherent technical boundaries but inconsistent visible language:

- `Shopping Trip` appears in 11 files and `Shopping Need` in 7. English UI copy exposes both a
  Shopping list and a separate Shopping trip, while Hungarian already often uses the simpler
  `Bevásárlás` for the trip concept.
- `Crawl` appears in 38 files and `Ingestion` in 61. The UI alternates among Crawl review, Crawls,
  Crawl Snapshot, Ingestion management, raw crawl context, parsed crawl rows, and review items.
- `Catalog` appears in 53 files, `Catalogue` in 6, and `Product` is used for household-owned,
  shared, and shop-specific identities. English UI and docs mix American and British spelling.
- Stable runtime boundaries include `/api/catalog/*`, `/api/admin/ingestion-submissions`,
  `/api/households/*/shopping-trips`, `catalog/*` and `ingestion/*` package paths, and the
  `household_shopping_trips`, `household_shopping_need_lists`, `ingestion_submissions`,
  `ingestion_raw_snapshots`, and `ingestion_product_review_items` collections.
- Routes such as `/product-lookup`, `/site-admin/ingestion`, and `/dev-admin` are already linked and
  may be bookmarked. Their visible labels can improve without changing the URLs.
- Translation parity currently proves only that English and Hungarian leaf keys align and are
  non-empty; it does not protect the intended vocabulary of high-value UI labels.

## Recommended vocabulary contract

These are the proposed defaults for quick approval. Technical names in the final column remain
stable during Stage 1.

| Concept | Recommended user-facing English | User-facing boundary | Current technical compatibility name |
| --- | --- | --- | --- |
| Household planning surface | Shopping list | The list and its rows remain visible before, during, and after shopping. | Shopping Need list, Shopping Need, current shopping-list compatibility records |
| Active shop context | Shopping | Actions read `Start shopping`, `Finish shopping`, and `Cancel shopping`; details are shop/purchase details, not another list. | Shopping Trip, Trip Item, `/shopping-trips`, `household_shopping_trips` |
| Shared trusted identity | Product | Use `shared Product` only where ownership must be contrasted with household data. | catalog Product, `/api/catalog/*`, `catalog/*` |
| Household-owned identity | Product in household context; Household Product in technical/help text | Do not force members to parse the qualifier on every Home row. | Household Product, `household_products` |
| Retailer-specific identity | Shop listing | A retailer's representation/package of a Product; not another canonical Product. | Shop Product |
| Incoming source record | Source capture | One retained source input with provenance. | Crawl Snapshot, `ingestion_raw_snapshots` |
| Acquisition action/job | Crawl | Reserve for the technical act/job that fetches public source material, not the whole review area. | crawler jobs, crawl run ids |
| Parsed source row | Extracted entry | One entry extracted from a source capture. | parsed crawl row/source row |
| Reviewable proposed fact | Review candidate | Evidence awaiting accept, defer, decline, or correction. | ingestion product review item, Ingestion Submission where context requires |
| Operator workspace | Source review | The place to review captures and extracted entries. | Ingestion management, Crawl review, `/site-admin/ingestion` |
| Transformation activity | Processing | Parsing/normalizing evidence into entries and candidates. `Ingestion` remains an internal umbrella term. | ingestion processors and package names |
| Shared Product administration | Product management | Trusted Products, shop listings, prices, and accepted evidence. | Site Admin/catalog administration |
| Operational administration | Developer tools | Diagnostics, database maintenance, users, seed state, and feature flags. | Developer Admin, `/dev-admin` |

English active UI and prose should use American `catalog` only when the technical collection/layer
must be named. Normal member-facing UI should say `Products`, not `Catalog` or `Catalogue`.
Historical MVP artifacts retain their original wording.

## Decisions to approve before implementation

The plan recommends each A option. The user can approve all A defaults together or revise individual
items.

1. Visible shop context:
   - **A — Shopping (recommended):** action-led copy such as Start/Finish shopping; `Shopping Trip`
     remains an internal compatibility name.
   - **B — Shopping session:** exposes a distinct but subordinate session noun.
   - **C — Shopping Trip:** keep the current visible term and only clarify its relationship to the
     list.
2. Incoming-data administration:
   - **A — Source review (recommended):** Source captures → Extracted entries → Review candidates;
     Crawl is only the acquisition method and Ingestion is internal.
   - **B — Crawl review:** keep Crawl Snapshot/Crawl row language and rename only Ingestion.
   - **C — Data intake:** use a broader umbrella but retain technical sublabels beneath it.
3. Shared product surface:
   - **A — Products (recommended):** member and primary navigation use Products; Product catalog is
     a technical/help distinction.
   - **B — Product catalog:** retain the catalog noun throughout the UI.
   - **C — Product library:** introduce a new user-facing metaphor.
4. Admin labels:
   - **A — Product management / Source review / Developer tools (recommended):** label surfaces by
     work rather than role or implementation layer.
   - **B — Site Admin / Developer Admin:** retain role-oriented labels and improve only child pages.
   - **C — Products & sources / Operations:** use two broader top-level labels.

Exact Hungarian phrases should be reviewed alongside the first copy diff rather than inferred from
English mechanically. The conceptual distinctions and action hierarchy must remain identical across
both locales.

## User decisions

Approved on 2026-07-14:

1. **1A — Shopping:** use action-led Shopping copy; keep Shopping Trip as a technical compatibility
   name.
2. **2A — Source review:** use Source captures → Extracted entries → Review candidates; reserve
   Crawl for acquisition and Ingestion for internal implementation language.
3. **3A — Products:** use Products in member and primary navigation; reserve Product catalog for
   technical/help distinctions.
4. **4A — Product management / Source review / Developer tools:** label administration by the work
   performed rather than role or implementation layer.

## Intended direction

### Household journey contract

The visible state sequence becomes:

```text
Household stock
  -> Build Shopping list
  -> Review/edit Shopping list
  -> Start shopping (choose shop)
  -> Mark list rows bought and add unplanned rows
  -> Optionally add/reconcile receipt evidence in a later stage
  -> Finish shopping
  -> Apply bought rows to stock; leave remaining rows on the Shopping list
```

Stage 1 documents this contract and adjusts existing copy where it can do so truthfully. It must not
claim that automatic bought tracking, receipt reconciliation, or the final list-first behavior exists
before Stages 4–5 implement it.

### Compatibility rule

Use three levels explicitly:

1. **User language:** may change in Stage 1 through locale values, headings, navigation, help text,
   and feedback.
2. **Current code language:** component/type/function names may remain when they accurately describe
   the existing implementation. Do not perform a repository-wide mechanical rename.
3. **Persisted/public language:** API paths, collection names, document fields, error codes, registry
   ids, archive manifests, and stored audit event names remain stable in Stage 1.

If a later behavioral stage benefits from changing level 2 or 3, its plan must define compatibility,
deprecation, route aliases, validator changes, and independent database migration actions. Stage 1
records the mapping; it creates no database-maintenance registry entry because it changes no stored
shape.

## Required scope

### 1. Finalize the vocabulary and journey contract

- Review and approve/revise the four choices above.
- Add a concise canonical table to `docs/domain-language.md` with English term, reviewed Hungarian
  term, definition, audience, current technical aliases, and owning later stage.
- Mark old terms as `technical`, `compatibility`, `historical`, or `deprecated user copy`; do not call
  a runtime term removed until the code actually stops emitting it.
- Record the list-first state sequence and the boundary between Shopping list state, shopping
  transaction/evidence, household stock, and shared Product facts.

### 2. Protect expected user vocabulary first

- Before changing locale values, add table-driven expectations to the existing translation test for
  the approved high-value navigation, page-title, glossary, shopping-action, and admin-review keys.
- Run the focused test against current copy to reveal the expected mismatches before implementation.
- Keep assertions semantic and limited to selected public labels. Do not scan all text for banned
  words because technical/manual contexts legitimately retain compatibility terms.
- Continue checking English/Hungarian key parity and non-empty values.

### 3. Align household and shopping copy

- Update English and reviewed Hungarian locale values so the Shopping list is primary and shop
  context uses the approved subordinate/action language.
- Align section titles, buttons, empty/error/success feedback, the in-app manual, and accessible
  labels. A failure returned from `shopping_trip_*` may display approved Shopping copy without
  renaming the stable error code.
- Keep existing behavior honest: do not describe purchased-row automation, receipt upload, or
  leftover-list behavior that is not implemented yet.
- Retain current i18n key names when they are internal implementation identifiers. Rename a key only
  when it is part of the user-language contract and the small change clearly reduces immediate
  confusion.

### 4. Align Product and administration copy

- Replace user-facing Catalog/Catalogue navigation with the approved Products language.
- Qualify shared, Household, and shop-specific identities only in editors, review evidence, help, or
  errors where choosing the wrong identity has consequences.
- Rename visible Crawl/Ingestion administration labels to the approved Source review hierarchy and
  align capture, entry, processing, candidate, and accepted Product wording.
- Apply the approved administration labels to navigation and page titles without changing route
  paths or authorization boundaries.
- Update English/Hungarian glossary definitions so each technical alias points back to the canonical
  user concept instead of presenting multiple equal synonyms.

### 5. Document compatibility and hand off later renames

- Update active `docs/repo-concept.md`, `docs/architecture.md`, `docs/household.md`, and
  `docs/ingestion.md` only where they describe current or intended language.
- Do not rewrite archived MVP plans, sessions, evidence, migration ids, or historical terminology.
- Add a compatibility section listing the stable API routes, collections, error/event names, and
  code areas intentionally retained through Stage 1.
- Assign any justified technical rename to its owning detailed plan: Product discovery (Stage 2),
  review/admin (Stage 3), shopping (Stage 4), receipt evidence (Stage 5), or crawl lifecycle
  (Stage 6).
- Update `scripts/phase1-manual-test.md` terminology expectations, but do not execute the integrated
  manual run before Stage 7.

## Optional work

- Add redirect aliases for user-facing browser routes only if a reviewed route change provides clear
  user value. The recommended Stage 1 path is to keep URLs stable.
- Rename narrowly local frontend symbols when leaving the old name would make the new copy genuinely
  hard to maintain. Each rename must stay within the owning file/slice.

## Deferred work

- Shopping-list-first behavior and any Shopping Trip schema/API redesign: Stage 4.
- Compact Product search, ranking, linking, and suggestion metadata: Stage 2.
- Review queue structure, rapid decisions, keyboard workflow, undo, and admin information
  architecture: Stage 3.
- Receipt extraction/reconciliation and household-to-price/Product evidence: Stage 5.
- Crawl deduplication, retention, compaction, and collection lifecycle: Stage 6.
- Post-Phase-1 household cost forecasting and price optimization.

## Non-goals

- No MongoDB collection, validator, index, registry id, or existing-data migration change.
- No public API route, request/response field, error code, audit event, or archive-manifest rename.
- No repository-wide directory, filename, type, interface, component, or test rename.
- No new compatibility abstraction, terminology service, translation storage system, or dependency.
- No behavior changes to Shopping-list generation, shopping completion, review decisions, Product
  matching, ingestion processing, or authorization.
- No broad Playwright/browser interaction suite or visual snapshot coverage.

## Implementation steps and commit split

### Commit 1 — define the canonical vocabulary contract

- Goal: approve and document the canonical EN/HU concepts, journey sequence, and compatibility map.
- Files likely affected: `docs/domain-language.md` and narrowly relevant active architecture/domain
  docs.
- Validation: terminology-table review, Markdown links, `npm run format:check`, and `git diff --check`.
- Commit message idea: `docs: define Phase 1 household language contract`

This commit is the approval gate for copy implementation. If the terminology choices change, revise
the contract before proceeding.

### Commit 2 — protect and apply the visible vocabulary

- Goal: write expected vocabulary tests first, observe current mismatches, then align English and
  Hungarian household, shopping, Product, navigation, and admin copy.
- Files likely affected: `src/app/i18n/translation-parity.test.ts`, `src/app/i18n/en.json`,
  `src/app/i18n/hu.json`, and only components with unavoidable hard-coded visible copy.
- Validation: focused translation test before/after, full `npm test`, `npm run typecheck`,
  `npm run lint -- --max-warnings=0`, `npm run build:web`, and `npm run format:check`.
- Commit message idea: `refactor: align household-first product language`

### Commit 3 — reconcile active documentation and acceptance ownership

- Goal: make active product/operations documentation and the deferred Phase 1 runbook use the
  approved vocabulary without rewriting history.
- Files likely affected: `docs/repo-concept.md`, `docs/architecture.md`, `docs/household.md`,
  `docs/ingestion.md`, `README.md`, and `scripts/phase1-manual-test.md` as needed.
- Validation: terminology search with intentional technical/historical exceptions, Markdown link
  validation, `npm run format:check`, and `git diff --check`.
- Commit message idea: `docs: align Phase 1 terminology and acceptance`

## Validation plan

### Automated

- Add expected-outcome assertions before changing current locale values.
- `npm test -- src/app/i18n/translation-parity.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run lint -- --max-warnings=0`
- `npm run build:web`
- `npm run format:check`
- `git diff --check`
- Validate local Markdown links using the existing repository-safe link check approach.

No Mongo smoke is required because Stage 1 does not touch persistence, validators, transactions, or
configured data. `npm run test:browser` remains the one application-shell smoke and is not expanded
for terminology behavior.

### Review evidence

- Review the selected English/Hungarian terminology table and locale diff side by side.
- Confirm navigation, headings, actions, glossary definitions, and feedback all use the same concept
  hierarchy by inspection of the translation keys and consuming components.
- Update Section 1 of `scripts/phase1-manual-test.md`; do not run the integrated Phase 1 matrix yet.
- Record every remaining old term as an intentional technical, compatibility, or historical use.

## Exit criteria

Stage 1 is complete when:

- the four vocabulary decisions and exact EN/HU terms are user-approved;
- `docs/domain-language.md` contains the canonical journey, definitions, aliases, and ownership map;
- household UI copy presents Shopping list as primary and does not present Shopping Trip as a second
  list;
- primary user navigation says Products rather than exposing the catalog implementation layer;
- operator copy distinguishes Source capture, Extracted entry, Processing, and Review candidate;
- Product, Source review, and Developer tools labels identify the purpose of admin surfaces without
  changing authorization or routes;
- focused translation/vocabulary tests and the normal frontend validation pass;
- stable technical names and later-stage rename candidates are documented rather than silently
  changed;
- the deferred Phase 1 manual runbook matches the approved vocabulary and remains unexecuted.

## Risks and mitigations

- **Copy claims future behavior.** Keep wording tied to current runtime; reserve the final list-first
  flow for Stage 4.
- **Product becomes too generic.** Qualify ownership or retailer scope at decision points, not on
  every household row.
- **Crawl provenance becomes hidden.** Keep Crawl as the acquisition method and retain technical ids,
  source metadata, and audit language where operators need it.
- **Hungarian becomes a literal English translation.** Review exact Hungarian phrases as product
  copy and require conceptual parity rather than word-for-word equivalence.
- **Mechanical rename breaks compatibility.** Exclude routes, persistence, error codes, events, and
  archive formats; later owning stages must plan any justified change.
- **Vocabulary tests become brittle.** Assert a small approved set of public terms rather than
  snapshotting or banning terms across the repository.
- **Historical evidence is rewritten.** Limit reconciliation to active docs; archived MVP artifacts
  retain the language used when their evidence was captured.

## Approval checkpoint

Approved on 2026-07-14 with choices `1A 2A 3A 4A`. The three-commit split and the rule that Stage 1
changes user language while preserving technical compatibility names are approved. Exact Hungarian
copy remains subject to review in the first implementation diff, as specified by the plan.
