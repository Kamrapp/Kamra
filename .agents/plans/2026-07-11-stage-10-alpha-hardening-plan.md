# Stage 10 Alpha 1.0 Hardening Plan

Status: In implementation (user-approved 2026-07-13). Keep hardening tied to concrete Stage 8/9 findings; do not expand into a rewrite.

## Objective And Classification

Turn the working Stage 8-9 product into a credible Alpha 1.0 by freezing one domain language across code/data/UI, preserving and auditing real development Crawl Snapshots, repairing confirmed parser/data problems, tightening architecture where change-locality is demonstrably poor, completing failure-state and non-functional validation, removing temporary compatibility paths, and documenting the contributor/operator workflow.

Stage 10 is **required for maintainability before Alpha 1.0**. It is not authorization for a repository rewrite, formatting campaign, enterprise framework, speculative abstraction layer, or automatic execution of every possible hardening item. Each change must be tied to observed Alpha friction, a current correctness/security risk, or a documented release requirement.

## Entry Criteria

- The complete Stage 8 household loop and Stage 9 concrete shopping loop work manually.
- Their migrations are reconciled, current write paths use the new models, and known behavior bugs are fixed in their owning stages.
- A realistic development database contains Crawl Snapshots and Purchase Ingestion Submissions suitable for inspection.
- The Alpha acceptance scenario has been attempted at least once, so hardening is driven by observed friction rather than guesses.

Current implementation has the Stage 9 Trip, matcher, persistence, purchase-to-Product/Batch completion,
Ingestion Submission persistence/review routes, and strict completion input validation. Browser workflow
verification and the remaining admin/user UI are still required before Stage 9 can be closed.

The Home Trip panel and richer admin Shop Product/Price editor are now available. The remaining
Stage 9 behavior gap is matcher/applicable-price wiring into Trip planning; Stage 10 must not
waive that domain-to-UI connection silently if it is needed for the configured Alpha scenario.

## Open Questions

None for implementation. Preserve raw Crawl Snapshots, prefer reset/reseed over speculative migration for disposable derived data, keep corrections as reviewed overlays, use one shared core behind admin/CLI actions, and remove active legacy vocabulary before Alpha. Any archive count/checksum mismatch or ambiguous raw identity is a hard stop, not an invitation to repair by guesswork.

## Current Maintainability Risks To Verify

Repository inspection already identifies review candidates, not automatic refactor mandates:

- `mongo-catalog-repository.ts` and `mongo-household-repository.ts` are each over 1,000 lines.
- `app-handler.test.ts` is over 3,000 lines; several route files, Angular services/components, and ingestion modules exceed 500 lines.
- Household frontend/server contracts are duplicated.
- Route handlers currently contain meaningful shopping orchestration and sequential persistence work.
- Catalogue hydration contains price collation policy inside the repository.
- Migration actions are selected through route-level conditionals, and some repositories contain setup/migration behavior alongside normal persistence.
- Ingestion source, retailer/shop identity, and price applicability are currently coupled in data shapes.
- The root README covers basic commands but lacks a complete Alpha demo, migration, contribution, security/limitations, and recovery path.
- The Stage 8 checked-in classification pack and runtime translations need a contributor/operator check proving they are easy to extend, sync non-destructively, and distinguish seeded/global/household provenance.
- There is linting but no separate formatting command; Stage 10 should decide based on actual contributor friction rather than add tooling ceremonially.

## Guardrails

- Refactor only when it fixes a concrete Stage 8/9 pain, isolates a known future change, removes dangerous compatibility/repair behavior, or materially improves tests/readability.
- Prefer feature-owned vertical slices: `household`, `shopping`, `catalog`, `shops`, `ingestion`, `site-admin`, `dev-admin`.
- Keep cross-slice contracts explicit and small; do not create a universal domain/common package.
- No event bus, generic workflow/command framework, DI framework, universal repository, abstract factory family, internal SDK, or elaborate schema-code-generation platform.
- File size alone is not a defect. Split by responsibility only when the result has a clear owner and improves change locality.
- Behavior-changing findings return to the owning Stage 8/9 plan/fixer scope if they are required for correctness; do not hide them in “cleanup.”
- Prefer an existing utility, native platform capability, or a small local correction before adding a new tool, dependency, shared layer, or automation. Record lower-value cleanup as post-MVP instead of consuming Alpha time.

## Final Domain Language And Rename Boundary

Stage 8 and Stage 9 create new code with these names. Stage 10 removes remaining legacy names from active API routes, Mongo collections/fields, TypeScript symbols/files, page titles, labels/translations, logs/events, seeds, admin copy, and current documentation:

| Final term | Precise meaning | Legacy/ambiguous terms to remove from active surfaces |
| --- | --- | --- |
| Product Concept | Inclusive product class connected by `is_a`; e.g. spaghetti is a kind of pasta | category tag, generic tag, taxonomy node |
| Product Attribute | Independent product characteristic; e.g. gluten-free | facet tag, attribute tag |
| Product Group Template | Seeded starting definition copied into a household Product Group | requirement template, rule template |
| Target policy | Optional minimum/desired-restock policy owned by a Product Group or Household Product | standalone target, rule, requirement |
| Product | Canonical product identity independent of a retailer | catalog item |
| Shop Product | A Shop Market's representation/listing of a Product | product source, source product |
| Product Group | Household-owned, optionally nested group of Household Products | stock target, stock group, household entry |
| Stock Batch | Separately dated/identified quantity held by a household | stock item, inventory row |
| Legacy Stock Allocation | Historical/migration record from the pre-Product-Group model | active grouping link |
| Stock Movement | Immutable quantity change/history event | movement |
| Shopping Need | Generic shortage/ad-hoc intent before a shop is selected | shopping-list line, requirement line |
| Shopping Trip / Trip Item | Concrete one-market shopping plan and its items | shopping list, shopping line |
| Purchase / Purchase Item | Historical bought result | purchase order, completed shopping line |
| Shop Market | Country-specific commercial market; a separate Shop Chain exists only if active markets need shared administration | store, shop source |
| Ingestion Source | Adapter/feed that supplies evidence; a separate record exists only when it needs independent lifecycle/review management | shop, product source |
| Crawl Snapshot | Immutable raw fetched evidence | crawl content, raw product |
| Product Candidate | Parsed/reviewable proposed Product/Shop Product facts | staged product |
| Price Observation | Append-only price evidence | offer record, current price |
| Ingestion Submission | Structured user/admin evidence awaiting review | shopping completion payload |

Persist relation kind `is_a`; user-facing copy says “is a kind of.” Use `catalog` in code/API/database/technical docs and natural localized “catalogue” spelling only in prose/UI where desired. “Offer” is a displayed applicable promotional Price Observation, not a separate identity. Legacy terms may remain only in a clearly named migration/compatibility adapter with a removal test.

Create `docs/domain-language.md` in Stage 8 and treat it as the executable dictionary. If an implementer needs a new synonym or cannot map a current field to one final term, pause that unit and update the plan/dictionary before writing a new schema.

### Terminology maintenance entry and operator timing

Register `alpha-domain-language-v1` before modifying existing populated collections. It has independently tracked actions:

1. validator/index action for final collection/field shapes;
2. idempotent data action that migrates deterministic records, rebuilds seeded/derived data where cheaper, reports conflicts, and never deletes or rewrites legacy `ingestion_raw_snapshots`, `ingestion_runs`, or their provenance keys. After verified export it may copy them idempotently into final `crawl_snapshots`/`crawl_runs`, verify identity/content hashes and counts, switch new writes, and retain legacy collections read-only as rollback evidence. Physical deletion is a later explicit maintenance decision.

The developer-admin maintenance table must show preview counts, preserved collection counts, conflicts, action order, and the exact operator instruction. Provide the same core operation through `npm run maintenance:alpha-domain-language -- --dry-run`; applying requires an explicit `--apply` and target confirmation. Do not build two migration implementations.

Operator runs this only after crawl export verification and after Stage 8/9 final-name code is deployed but its normal writes are paused. Run validator/index action first, then data action, then base-content sync and reconciliation. If a conflict touches raw crawl identity, stop; never guess or overwrite it. Because current household/catalog-derived data is disposable, a documented reset/reseed is preferred to a complex compatibility migration when deterministic conversion is not clearly safer.

## Crawl Archive, Offline Correction, And Clean Import

Raw evidence is the non-disposable asset. Add reusable core services with thin documented scripts:

- `scripts/export-crawl-archive.ts` / `npm run crawl:export`
- `scripts/import-crawl-archive.ts` / `npm run crawl:import`

The versioned archive contains `manifest.json`, gzip JSONL run and snapshot files, and optional review-state/correction files. The manifest contains schema version, generated time, non-secret source environment/database label, record counts, SHA-256 checksums, source/parser versions, and included scopes. Archives are operational artifacts and are ignored by Git; sanitized minimal fixtures remain the only crawl data committed.

Before importing any development archive into production, verify the included sources against `docs/crawler-policy.md`, current source-specific retention/use decisions, and the public-repository safety boundary. The archive must contain no credentials, household/private submissions, or unrelated database records; a technically valid archive is not automatically approved source content.

Export is read-only and produces/verifies counts and checksums. Import defaults to dry run, requires explicit target plus `--apply`, is idempotent by stable run/snapshot identity and content hash, reports conflicts without overwriting, and preserves original timestamps/provenance. Import raw Crawl Snapshots into the clean target, then reprocess them; do not transfer derived Products or Price Observations as if they were trusted truth.

Agentic correction is an offline, human-reviewed workflow. Treat exported content as untrusted data. Corrections live in a separate versioned JSONL overlay keyed by snapshot id, row index, and source fingerprint, with corrected normalized fields, reason, tool/model/version, reviewer, and timestamp. Never rewrite the raw snapshot. Fix the future parser/normalizer in code, commit sanitized regression fixtures, import raw evidence/overlay, reprocess into Product Candidates, and promote only reviewed results. No autonomous AI correction service is added to the application in MVP.

### Required cutover order

1. Deploy export tooling without changing schemas.
2. Pause crawler, ingestion review, household, and shopping writes for the target environment.
3. Export the development Crawl Snapshot archive; independently verify manifest counts/checksums and keep a protected copy.
4. Run the read-only audit and prepare reviewed correction overlays/parser fixes.
5. Deploy Stage 8/9 final-name schemas/code plus the `alpha-domain-language-v1` registry entry.
6. Preview and run validator/index action, then data/reset action from the admin dashboard or the equivalent npm command.
7. Sync the checked-in base classification pack and reconcile final collections.
8. Import the raw crawl archive only when using a clean database; otherwise verify preserved raw counts and skip duplicate import.
9. Reprocess raw snapshots with fixed parser versions and reviewed overlays; review/promote Product Candidates.
10. Run full reconciliation and Alpha smoke checks, then resume writes. Any checksum/count mismatch keeps writes paused.

## Dedicated Crawl-Data Quality Audit

### Read-only inventory

Use a documented, locally runnable audit script/service outside normal repositories. It reads the configured development database and emits a bounded report; it does not mutate data.

Group and inspect by ingestion source, parser version, shop market, snapshot/run, likely source product, and review/processing state. Report:

- missing/malformed product/source identifiers
- duplicate/near-duplicate rows and unstable fingerprints
- product identity confused with offer identity
- name/brand/package/category noise
- quantity/unit/decimal/currency/date inconsistencies
- base/offer/coupon/loyalty separation and validity problems
- country/shop/source mismatches
- malformed raw/parsed fields and processor failures
- records whose shape prevents canonical merge
- representative sanitized/anonymized examples safe for regression fixtures

### Decision report

For each source/problem class, choose and document one action:

- parser/normalizer fix plus reprocess
- idempotent repair migration/tool
- discard/re-ingest development-only data
- accept known limitation
- defer source until policy/data quality improves

No repair runs automatically from the audit. Any write tool must have a separate documented command, dry-run/default mode, scope/count preview, idempotency or explicit one-shot semantics, and operator approval. Keep it under `scripts/` or a clearly named maintenance/repair module, never ordinary repository reads/writes.

### Acceptance

- Every active source has a quality summary and representative fixture.
- Confirmed parser defects have focused tests and fixes.
- Repair/re-ingest/discard decisions are explicit and reproducible.
- Catalogue mergeability improves without destroying raw source truth or price history.

## Architecture And Change-Locality Review

Use the following concrete change probes:

1. Add a batch property.
2. Add a shop market.
3. Add an ingestion method to an existing market.
4. Change applicable-price selection.
5. Add a Trip Item terminal state.
6. Add a validator field and migration.
7. Add a household concept/attribute filter.
8. Add future receipt ingestion without implementing OCR.

For each, map touched contracts, domain logic, persistence, route, UI, locale, and tests. A broad touch count is acceptable when a public contract genuinely changes; refactor only accidental duplication or misplaced policy.

Review and improve where evidence supports it:

- route slices adapt HTTP and delegate; they do not own matching/transaction/domain state machines
- repositories persist/query their aggregate and do not silently repair legacy data
- migrations, repair tools, compatibility adapters, and ingestion normalization have named homes and removal conditions
- catalog Price Observation applicability, household Product Group target-policy planning, and Shopping Trip transitions remain pure/testable domain services
- frontend services do transport/mapping; components do not duplicate server business policy
- duplicated browser/server DTOs use a small browser-safe shared contract or fixture parity test, not a new universal SDK
- error translation and validation are consistent within each boundary without one giant schema
- admin-only operational functionality remains outside normal household UX

## Validation And Schema Strategy

- Keep versioned domain boundary schemas and domain-specific fragments for dates, money, quantity, ids, snapshots, and audit metadata.
- Validate untrusted transport and persistence writes; domain functions accept already validated types and still enforce business invariants.
- Prefer type inference from a chosen schema only where it removes actual duplicate declarations. Do not launch a broad generator migration solely for elegance.
- Keep explicit transport/domain/persistence mappings when shapes have different ownership, security, or lifecycle.
- Add compatibility fixtures for still-supported historical records; every compatibility adapter documents data version, reason, tests, and removal condition.
- Validator and existing-data migrations remain separate registry actions with reconciliation output.
- Validators reject; they do not silently coerce important business quantities, dates, prices, or identity.

## Error, Observability, And Operational Review

- Exercise loading, empty, validation, authorization, no-match, no-price, stale, conflict, partial/resume, unavailable dependency, and unexpected transaction failures across the Alpha path.
- Verify one canonical structured event per domain command, safe correlation/operation ids, useful warning/error codes, and persistent privileged audit records.
- Check logs for sensitive names/emails/notes/raw payloads and remove duplicate request/repository noise.
- Verify feature toggles have typed definitions, admin state, audit history, failure behavior, tests, owner/removal condition; remove temporary Stage 8/9 cutover flags.
- Check bounded pagination/index use on Products, Shop Products, Price Observations, Ingestion Submissions, Stock Movement history, audit records, and Shopping Trip history.
- Verify base-classification seed drift/conflict reports, English/Hungarian parity, runtime fallback telemetry/state, and purchase-ingestion snapshots/review without silently rewriting household history.
- Run basic realistic-volume timings. Optimize only measured query/UI problems; no distributed cache/platform is planned.

## Alpha Non-Functional Baseline

Required before Alpha 1.0:

- household isolation and owner/member authorization matrix
- idempotent/retry-safe stock and purchase commands; optimistic concurrency
- strict input validation, stable ids, unique indexes, archival/history rules
- calendar-date, offer-range, country/currency, and quantity-unit correctness
- documented migrations, reconciliation, repair/dry-run, and internal backup/recovery expectations
- accessible keyboard-labelled, non-color-only core interactions and responsive household/shopping/admin paths
- English/Hungarian locale parity at shipped boundaries
- realistic deterministic seeds and the full Alpha scenario
- documented “add one concept/attribute/template and translation, preview sync, apply sync” contributor/operator workflow
- CI/full local commands for test, typecheck, lint, build, and relevant schema/fixture checks
- basic security/known-limitations documentation and no secrets/private exports

Not required: production SLOs, HA/DR automation, external APM, penetration testing program, public registration hardening, or enterprise support policy.

## Professional Repository Baseline

Update only concise, workflow-owned documents:

- root README: value proposition, Alpha status, screenshots/links if available, setup, commands, demo journey, limitations
- `docs/domain-language.md`: final Product Concepts/Attributes, Product Groups/target policies/Batches/Movements, Shopping Needs/Trips, Purchases, shops, ingestion, Crawl Snapshots, and Price Observations
- environment/configuration and database migration/repair/backup expectations
- crawler/source policy and data-quality report
- logging and feature-toggle operations
- `CONTRIBUTING.md`: small-step workflow, validation, architecture boundaries, PR expectations
- `SECURITY.md`: private reporting/contact posture, secrets, household data, supported Alpha expectations
- release/known-limitations checklist

Do not add a code of conduct, governance charter, issue templates, or other ceremony unless there is a current collaborator need.

## Ordered Implementation And Commit Boundaries

Execution rule for every step: implement only the named concern, read the listed owning slice and its nearest `AGENTS.md`/README first, add or update focused tests when behavior or risk warrants them, and stop on a failed prerequisite or unexplained schema conflict. Do not opportunistically rename/refactor outside the current step. Each step ends with proportionate acceptance checks and a reviewable diff; the next step does not begin automatically.

Implementation ownership map:

- domain language/migration: `docs/domain-language.md`, final feature contracts/routes/repositories/UI/i18n/log events, database-maintenance registry/actions, and one shared admin/CLI operation
- crawl archive/audit/correction: reusable ingestion services plus thin `scripts/` entrypoints and `scripts/README.md`; no archive/correction logic in ordinary repositories or HTTP routes
- parser fixes: one Ingestion Source adapter and its sanitized fixtures per commit; bump processor version when output semantics change
- vertical cleanup: only the feature slice named by a baseline finding; preserve public behavior and prove reduced accidental touch points
- Alpha documentation: root/domain/operations/crawler/security/contribution docs updated to runtime truth after code and data checks pass

### Step 1 - Alpha baseline capture

- Inventory every legacy/final term across routes, collections/fields, contracts/files, UI/i18n, logs, seeds, and docs; run full tests/build/lint/typecheck, the end-to-end scenario, file/change-locality inventory, and query/index review. Record each finding with severity, owner, and the exact later step that owns it.
- Acceptance: no refactor begins without an observed problem and validation baseline.
- Commit: `docs: record alpha hardening baseline`

### Step 2 - Verified Crawl Snapshot archive export

- Implement the shared archive schema/export service and thin `crawl:export` script; add Git ignore/docs, deterministic manifest/checksum tests, bounded streaming, and a restore drill against an isolated test database.
- Acceptance: export changes no database state; counts/checksums verify; archive includes all required raw runs/snapshots/provenance; sanitized fixtures prove round-trip shape; no archive is committed.
- Stop condition: do not rename/reset/import anything if raw collections cannot be completely enumerated or the verification differs from source counts.
- Commit: `feat: export verified crawl archives`

### Step 3 - Final domain-language migration and reset

- Finalize `docs/domain-language.md`; add `alpha-domain-language-v1`; rename active API/database/contracts/files/events/i18n/page titles to the dictionary; migrate deterministic records and reset/reseed disposable derived data; preserve raw crawl collections. Keep legacy reads only where a tested cutover adapter is strictly required.
- Acceptance: repository searches find legacy terms only in migration fixtures/adapters/history docs; validator/data actions remain separate and idempotent; admin and CLI previews agree; raw counts/checksums are unchanged; final routes and locale titles pass contract/browser tests.
- Stop condition: if a rename would make a Crawl Snapshot unreachable or an ambiguous Product/Shop Product conversion would invent identity, report it as a conflict and preserve/reprocess rather than guessing.
- Commit: `refactor: apply final domain language`

### Step 4 - Read-only crawl-data audit and correction-overlay preparation

- Add/run `scripts/audit-ingestion-quality.ts` around reusable audit logic, document it, and produce `docs/crawl-data-quality.md`, sanitized fixtures, and the validated correction-overlay schema; make no data changes.
- Acceptance: all active sources and required field classes are covered; report is reproducible; overlays cannot mutate or masquerade as raw evidence.
- Commit: `chore: audit ingestion data quality`

### Step 5 - Source-specific parser/normalization fixes

- Fix only confirmed defects, bump versions where reprocessing semantics require it, and add targeted real-shaped sanitized tests.
- Acceptance: fixtures prove the defect/fix; unrelated sources remain stable.
- Commit per independent source: `fix: normalize <source> ingestion data`

### Step 6 - Crawl import, reprocessing, and approved repair tools

- Implement the shared import service/thin `crawl:import` script, correction-overlay validation/application during reprocessing, and separate dry-run-first idempotent repairs only for approved audit findings. Do not import derived Products/Price Observations.
- Acceptance: import dry run is default; explicit target/apply is required; repeated identical import is a no-op; conflicts do not overwrite; raw truth remains intact; corrected parser output becomes reviewable Product Candidates; post-run reconciliation is proven.
- Commit per repair class: `chore: add <scope> data repair`

### Step 7 - Targeted backend vertical-slice cleanup

- Move confirmed route/repository policy into feature domain services and isolate migrations/compatibility/repair code. Split large files only along these owners.
- Acceptance: selected change probes touch fewer unrelated responsibilities; behavior tests remain green; no generic framework appears.
- Commit per slice: `refactor: localize <feature> responsibilities`

### Step 8 - Targeted frontend and contract cleanup

- Reduce confirmed component/service responsibility problems, establish shared-contract/parity approach, and normalize boundary error states.
- Acceptance: Stage 8/9 workflows behave identically; core states are explicit and localized; no broad UI rewrite.
- Commit per slice: `refactor: simplify <feature> frontend boundary`

### Step 9 - Schema, compatibility, and maintenance cleanup

- Consolidate domain-specific fragments, document/remove dead adapters and flags, move all one-time glue out of runtime repositories, verify registry/reconciliation.
- Acceptance: every remaining compatibility path has owner/removal condition; normal reads do no repair work.
- Commit: `refactor: isolate schema migration compatibility`

### Step 10 - Non-functional and observability hardening

- Close concrete authorization, failure-state, logging/redaction, pagination/index, accessibility/responsive, realistic-volume, and backup/recovery gaps that the Alpha path, observed failures, or release requirements demonstrate; do not add platform/tooling work merely to fill a checklist.
- Acceptance: Alpha non-functional baseline above passes without production-platform expansion.
- Commit by concern when independent: `chore: harden alpha operations`

### Step 11 - Repository and Alpha release documentation

- Complete concise setup/contribution/security/domain/demo/limitations docs and final validation checklist.
- Acceptance: a new technical reviewer can run, seed, exercise, test, and understand the project without private conversation history.
- Commit: `docs: prepare kamra alpha 1.0`

### Step 12 - Final Alpha review

- Run full automated validation, terminology search, locale/schema parity, configured database smoke/reconciliation, archive checksum/restore drill, crawl quality check, two-user browser scenario, and independent review focused on correctness/regression/missing tests.
- Acceptance: no open blocker in the Alpha readiness checklist; remaining items are explicitly post-MVP.
- Commit only narrow fixes found by review.

## Explicit Deferrals

The cross-stage human verification source of truth is `.agents/plans/stage8-10-manual-acceptance-checklist.md`. Stage 10 closeout must update its evidence log and must not duplicate the checklist elsewhere.

- Broad rewrite to a new architecture/framework.
- Arbitrary file-size limits or repository-wide style churn.
- Enterprise DI/event/workflow/repository/schema-generation platforms.
- Production operations, external observability, SLOs, HA/DR automation.
- Rich analytics/catalogue/price UX listed in post-MVP backlog.

## Approval Checkpoint

Stage 10 implementation is approved for the bounded hardening slices above. Do not call Alpha complete
until Stage 9 browser acceptance is recorded and every cleanup unit names the concrete finding it resolves.
