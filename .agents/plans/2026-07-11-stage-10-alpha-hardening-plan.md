# Stage 10 Alpha 1.0 Hardening Plan

Status: Implementation complete — all approved code-addressable slices, including Step 4A, Steps 5–10, and Step 11 release documentation, are committed; configured and browser evidence remain open (2026-07-13). Do not expand into a rewrite while closing those gates.

## Objective And Classification

Turn the working Stage 8-9 product into a credible Alpha 1.0 by freezing one domain language across code/data/UI, preserving and auditing real development Crawl Snapshots, repairing confirmed parser/data problems, tightening architecture where change-locality is demonstrably poor, completing failure-state and non-functional validation, removing temporary compatibility paths, and documenting the contributor/operator workflow.

Stage 10 is **required for maintainability before Alpha 1.0**. It is not authorization for a repository rewrite, formatting campaign, enterprise framework, speculative abstraction layer, or automatic execution of every possible hardening item. Each change must be tied to observed Alpha friction, a current correctness/security risk, or a documented release requirement.

## Entry Criteria

- The Stage 8 household loop and Stage 9 concrete shopping loop are implemented, but the revalidated browser/data-integrity holes in the MVP-hole table below are still open until their owning fixes and acceptance evidence exist.
- Their migrations are reconciled, current write paths use the new models, and known behavior bugs are fixed in their owning stages.
- A realistic development database contains Crawl Snapshots and Purchase Ingestion Submissions suitable for inspection.
- The Alpha acceptance scenario has been attempted at least once, so hardening is driven by observed friction rather than guesses.

Current implementation has the Stage 9 Trip, matcher-driven planning and override/skip path, persistence,
purchase-to-Product/Batch completion, Ingestion Submission persistence/review routes, strict completion
input validation, the Home Trip panel, and the richer admin Shop Product/Price editor. The core Stage 9
circle is present, but market selection, actual-result editing, bounded matches, focused completion lookup,
legacy-list retirement evidence, and configured/browser acceptance remain MVP-hole work before Alpha closeout.

Stage 10 may begin on bounded hardening findings while that acceptance evidence is collected, but it must
not waive a failed Stage 9 correctness check or move a behavior bug into cleanup documentation.

## MVP-hole revalidation (2026-07-13)

The earlier baseline was rechecked against the current runtime rather than treated as closed because the
backend contracts are richer than the browser path in several places. Stage 10 now has an explicit hole
closure gate before Alpha closeout:

| Area | Current truth | Stage 10 treatment |
| --- | --- | --- |
| Stage 8 Product Group workspace | Product Groups, Household Products, Product-owned Batches, target policies, expiry setting, and purchase finalization paths exist. | Keep the central manual acceptance matrix open until the configured/browser flows are confirmed. |
| Concrete Shopping Trip entry | The Home panel now loads active Shop Markets through an authenticated household route and uses a picker instead of a raw id field. | Implemented in Step 4A; configured/browser evidence remains open. |
| Actual purchase result | The Home panel now edits quantity/unit/paid price/currency/acquisition/expiry after marking a line bought, and supports unplanned purchases. | Implemented in Step 4A; browser finalization and retry evidence remains open. |
| Match safety | Trip creation now returns at most 12 compatible match options and records `matchOptionsTruncated`. | Implemented in Step 4A with matcher regression coverage. |
| Completion lookup | Completion now uses a focused indexed catalog-to-Household Product lookup rather than loading all Household Products. | Implemented in Step 4A with repository regression coverage. |
| Legacy Shopping Need/list boundary | Legacy Stage 8 list routes/components remain alongside Trips. | Prove Trip equivalence first; remove or isolate dead writes in Step 9 only after evidence. |
| Purchase history language | Current runtime stores purchase results in Trip Items and creates Ingestion Submissions; it has no separate `household_purchases` aggregate. | Keep Trip as the MVP history envelope and remove stale “Purchase aggregate” claims from current docs. |
| Ingestion/admin loop | Submission persistence/review and admin Shop Product/Price routes exist; configured and browser evidence is still open. | Verify during the final Alpha scenario; do not add receipt ingestion in Stage 10. |
| Data operations | Archive export, final-language cutover tooling, and read-only audit tooling are now implemented, but not run against the configured database. | Require operator evidence and conflict review before Alpha completion. |
| Frontend consistency | Theme tokens exist, but local component CSS still mixes repeated color-mix values, hardcoded layout assumptions, and verbose templates. | Add the bounded visual/CSS cleanup Step 8A; no domain or route behavior changes in that step. |

The gate is not complete when code merely compiles. Each row must be implemented and tested, manually
confirmed where visual/configured evidence is required, or explicitly waived into post-MVP with an owner.

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
| Trip result | Historical bought result stored on a Trip Item | purchase order, completed shopping line |
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
9. Reprocess raw snapshots with fixed parser versions and reviewed overlays; review/promote Product Candidates. Historical parsed-row repair remains a separately reviewed write operation.
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

Execution rule for every step: implement only the named concern, read the listed owning slice and its nearest `AGENTS.md`/README first, add or update focused tests when behavior or risk warrants them, and stop on a failed prerequisite or unexplained schema conflict. Do not opportunistically rename/refactor outside the current step. Each step ends with proportionate acceptance checks and a reviewable diff.

## Single-agent continuous execution workflow

Stage 10 is executable by one agentic run from the current branch, with each safe unit committed before the next unit begins. The agent should continue through the ordered steps without waiting for a conversational checkpoint when all of the following are true: the scope is already approved here, the change is local and reversible, validation passes, and no configured database, private data, destructive action, or browser-only judgment is required.

For every unit, the agent follows the same loop:

1. Read the current session handoff, this plan, the owning code/docs, and the working-tree status. Record the starting commit and the exact finding or acceptance item being addressed.
2. Implement one narrow slice. Keep behavior policy in its owning domain/service and keep routes, scripts, and UI adapters thin.
3. Add focused tests or fixtures when the slice changes behavior, persistence, validation, authorization, or a release contract. Update the nearest durable documentation when commands, schemas, terminology, or operator behavior change.
4. Run proportionate checks before committing: focused tests first, then format check, lint, typecheck, and the relevant web/API build. Use configured Mongo smoke, migration, or archive checks only when their environment is available; record unavailable checks instead of faking evidence.
5. Update the active session handoff with the change, validation, known risk, and manual checks that became possible. Keep the central Stage 8–10 checklist as the only manual acceptance source of truth.
6. Create one new commit mapped to the step. Report the commit, checks, and next step, then continue automatically if no stop condition applies.

Recommended continuous sequence:

1. Baseline and terminology inventory.
2. Crawl Snapshot export and checksum verification tooling.
3. Final-domain-language maintenance action and deterministic cutover/reset support.
4. Read-only ingestion quality audit and correction-overlay schema.
4A. MVP-hole closure for the concrete Trip/browser/data-integrity gaps above; return behavior bugs to Stage 9 ownership. **Implemented (2026-07-13):** market picker, actual-result/unplanned purchase UI, bounded matches, and focused completion lookup. The legacy-list boundary and browser/configured evidence remain open.
5. Confirmed source-specific parser/normalizer fixes, one source per commit.
6. Crawl import/reprocessing and approved dry-run repair tools.
7. Targeted backend change-locality cleanup from the baseline findings.
8. Targeted frontend/contract boundary cleanup from observed workflow friction.
8A. Frontend minor facelift and CSS/HTML simplification after behavior is stable.
9. Schema, compatibility, registry, and dead-flag cleanup.
10. Non-functional, authorization, failure-state, redaction, pagination, accessibility, and operational hardening.
11. Repository and Alpha release documentation.
12. Full Alpha review, with narrow corrective commits only.

The agent must stop and return control when a decision would materially change the model or scope; a migration/archive checksum or identity conflict appears; manual browser/visual confirmation is the next meaningful evidence; a configured/private environment or operator action is required; a destructive action is proposed; or a validation failure cannot be explained and safely corrected in the current slice. “Stop” does not mean silently leave work uncommitted: update the session handoff with the exact blocker and next command. Never amend, push, reset, checkout, force-update, or rewrite history as part of this workflow; only additional commits are permitted unless the user separately requests another Git operation.

Implementation ownership map:

- domain language/migration: `docs/domain-language.md`, final feature contracts/routes/repositories/UI/i18n/log events, database-maintenance registry/actions, and one shared admin/CLI operation
- crawl archive/audit/correction: reusable ingestion services plus thin `scripts/` entrypoints and `scripts/README.md`; no archive/correction logic in ordinary repositories or HTTP routes
- parser fixes: one Ingestion Source adapter and its sanitized fixtures per commit; bump processor version when output semantics change
- vertical cleanup: only the feature slice named by a baseline finding; preserve public behavior and prove reduced accidental touch points
- Alpha documentation: root/domain/operations/crawler/security/contribution docs updated to runtime truth after code and data checks pass

### Step 1 - Alpha baseline capture

- Inventory every legacy/final term across routes, collections/fields, contracts/files, UI/i18n, logs, seeds, and docs; run full tests/build/lint/typecheck, the end-to-end scenario, file/change-locality inventory, and query/index review. Record each finding with severity, owner, and the exact later step that owns it. The captured baseline is `docs/alpha-hardening-baseline.md`.
- Acceptance: no refactor begins without an observed problem and validation baseline.
- Commit: `docs: record alpha hardening baseline`

### Step 2 - Verified Crawl Snapshot archive export

- Implement the shared archive schema/export service and thin `crawl:export` script; add Git ignore/docs, deterministic manifest/checksum tests, bounded streaming, and sanitized archive inspection/round-trip shape coverage. The isolated database restore drill belongs with the importer in Step 6, when a restore path exists to exercise.
- Acceptance: export changes no database state; counts/checksums verify; archive includes all required raw runs/snapshots/provenance; sanitized fixtures prove round-trip shape; no archive is committed. **Complete (2026-07-13):** `da33cae feat: export verified crawl archives`.
- Stop condition: do not rename/reset/import anything if raw collections cannot be completely enumerated or the verification differs from source counts.
- Commit: `feat: export verified crawl archives`

### Step 3 - Final domain-language migration and reset

- Finalize `docs/domain-language.md`; add `alpha-domain-language-v1`; keep the already-shipped Product Group/Household Product/Stock Batch Home path as the final surface; and compose the existing idempotent migrations in order for deterministic records. Preserve raw crawl collections and legacy household evidence. Keep old allocation routes/repositories only as an explicitly named compatibility boundary until their removal has configured-data evidence; do not perform a blind repository-wide rename.
- Acceptance: final Home and Stage 9 surfaces use the dictionary; the maintenance registry and guarded CLI expose the same ordered cutover; validator/data actions remain separate and idempotent; previews report preserved collections and conflicts; raw counts/checksums are unchanged; final routes and locale titles pass contract/browser tests. **Implementation prepared (2026-07-13):** `MongoAlphaDomainLanguageMaintenance`, `npm run maintenance:alpha-domain-language`, and `alpha-domain-language-v1` admin actions are committed. Configured operator execution and legacy-conflict review remain release evidence, not hidden in code.
- Stop condition: if a migration reports a conflicting Product Group history, or a rename would make a Crawl Snapshot unreachable or invent Product/Shop Product identity, report it as a conflict and preserve/reprocess rather than guessing.
- Commit: `refactor: apply final domain language`

### Step 4 - Read-only crawl-data audit and correction-overlay preparation

- Add/run `scripts/audit-ingestion-quality.ts` around reusable audit logic, document it, and produce `docs/crawl-data-quality.md`, sanitized fixtures, and the validated correction-overlay schema; make no data changes.
- Acceptance: all active sources and required field classes are covered; report is reproducible and bounded; overlays cannot mutate or masquerade as raw evidence. **Implementation prepared (2026-07-13):** the pure audit service, bounded paged script, correction-overlay validator, tests, and operator documentation are committed. Running it against the configured development database remains an operator evidence step.
- Commit: `chore: audit ingestion data quality`

### Step 4A - MVP-hole closure gate

- Close the revalidated Stage 9 gaps before calling the Alpha user loop complete: add a household-visible active Shop Market picker, expose actual purchase result fields (quantity, unit, paid price, acquisition/expiry, Product/new-product choice), support unplanned purchases, bound match options with truncation state, add focused catalog-to-Household Product lookup, and prove the legacy Shopping Need/list boundary does not bypass Trip completion. Keep matching/completion policy in focused services rather than expanding the route.
- Acceptance: route/domain tests cover every new command and failure path; the browser panel can select a valid market, resolve/skip matches, record an actual result, finalize it into Product-owned Batches and Ingestion Submissions, retry without duplicates, and recover from stale revisions. Update the central manual checklist and return any behavior regression to Stage 9. **Code complete (2026-07-13):** the household-visible Trip safety slice is implemented; remaining acceptance is equivalence/retirement evidence for the legacy list plus configured/browser evidence.
- Stop condition: if the active-market ownership model, unplanned-purchase identity, or legacy-list retirement would materially change the approved domain, pause for a decision rather than infer one.
- Commit per independent concern: `fix: close <trip or completion> MVP gap`.

### Step 5 - Source-specific parser/normalization fixes

- Fix only confirmed defects, bump versions where reprocessing semantics require it, and add targeted real-shaped sanitized tests. **Implemented for Lidl HU (2026-07-13):** repeated same-page PDF text now emits only the first stable page/item identity; parser version is `0.1.1` and the regression fixture covers the repeated product block.
- Acceptance: fixtures prove the defect/fix; unrelated sources remain stable. **Code complete:** review and, if approved, run the bounded historical parsed-row repair/reprocessing operation; the raw payload and current historical snapshots remain unchanged until that explicit operator action.
- Commit per independent source: `fix: normalize <source> ingestion data`

### Step 6 - Crawl import, reprocessing, and approved repair tools

- Implement the shared import service/thin `crawl:import` script, correction-overlay validation/application during reprocessing, and separate dry-run-first idempotent repairs only for approved audit findings. Do not import derived Products/Price Observations. **Implemented foundation (2026-07-13):** manifest/checksum-verified runs/snapshots import, stable identity/content conflict reporting, dry-run default, explicit target/apply guard, repeat no-op behavior, and reviewed overlay application to an in-memory snapshot copy before existing parser processing.
- Acceptance: import dry run is default; explicit target/apply is required; repeated identical import is a no-op; conflicts do not overwrite; raw truth remains intact; corrected parser output becomes reviewable Product Candidates; post-run reconciliation is proven. **Code complete (2026-07-13):** the Lidl historical parsed-row repair is dry-run-first, bounded by source/parser/version and optional snapshot id, requires exact target/operator confirmation for writes, and uses a content-hash compare-and-set update. Remaining work is configured clean-database restore evidence.
- Commit per repair class: `chore: add <scope> data repair`

### Step 7 - Targeted backend vertical-slice cleanup

- Move confirmed route/repository policy into feature domain services and isolate migrations/compatibility/repair code. Split large files only along these owners. **First slice implemented (2026-07-13):** Shopping Trip creation matching and response shaping now live in the focused `shopping-trip-planning` service; the route remains responsible for authentication, persistence, and HTTP validation.
- Acceptance: selected change probes touch fewer unrelated responsibilities; behavior tests remain green; no generic framework appears. **Remaining:** only extract further responsibilities when a concrete route-locality problem is demonstrated.
- Commit per slice: `refactor: localize <feature> responsibilities`

### Step 8 - Targeted frontend and contract cleanup

- Reduce confirmed component/service responsibility problems, establish shared-contract/parity approach, and normalize boundary error states.
- Acceptance: Stage 8/9 workflows behave identically; core states are explicit and localized; no broad UI rewrite. **Implemented parity guard (2026-07-13):** the feature-toggle validation key list is tested against the server definition registry so the compact-label toggle cannot silently drift out of request validation.
- Commit per slice: `refactor: simplify <feature> frontend boundary`

### Step 8A - Frontend minor facelift and CSS/HTML simplification

- After Step 4A behavior is stable, audit shared theme tokens and the Stage 8–9 surfaces for repeated hardcoded colors, dark/light mismatches, duplicated control styles, unnecessary wrapper/grid rules, and templates whose structure obscures state. Reuse global classes/tokens before adding local values; simplify markup only when bindings and accessibility semantics remain clear. **First slice implemented (2026-07-13):** added shared spacing/surface/border compatibility tokens and removed undefined Trip-panel theme references so existing admin/Trip surfaces resolve consistently in both themes.
- Keep this slice visual and low-risk: no endpoint, persistence, target-policy, shopping, or authorization changes. Preserve the current compact table/editor hierarchy, responsive overflow behavior, fixed headers, and keyboard labels. Prefer a small shared utility/token addition over a new styling framework.
- Acceptance: light and dark screenshots/manual checks show consistent surfaces, status colors, controls, disabled/error states, focus rings, and readable contrast; `npm run format:check`, lint, typecheck, web build, and relevant component tests pass. **Remaining:** browser screenshots/contrast confirmation and any larger layout redesign; record the latter as post-MVP instead of stretching this slice.
- Commit per independent surface: `style: simplify <surface> theme consistency`.

### Step 9 - Schema, compatibility, and maintenance cleanup

- Consolidate domain-specific fragments, document/remove dead adapters and flags, move all one-time glue out of runtime repositories, verify registry/reconciliation.
- **Implemented slice (2026-07-13):** corrected `shopping-trip-foundation-v1` so its validator action initializes Shop Markets, Shopping Needs, Shopping Trips, and Ingestion Submissions together. A focused maintenance test protects the collection boundary.
- Acceptance: every remaining compatibility path has owner/removal condition; normal reads do no repair work. **Code complete:** remaining compatibility cleanup and any legacy-write retirement depend on configured data/conflict evidence, not another unreviewed code slice.
- Commit: `refactor: isolate schema migration compatibility`

### Step 10 - Non-functional and observability hardening

- Close concrete authorization, failure-state, logging/redaction, pagination/index, accessibility/responsive, realistic-volume, and backup/recovery gaps that the Alpha path, observed failures, or release requirements demonstrate; do not add platform/tooling work merely to fill a checklist.
- **Implemented slice (2026-07-13):** Shopping Trip and admin Ingestion Submission history GET routes now use bounded, indexed page reads with explicit `page`, `pageSize`, and `hasNextPage` metadata. Focused repository coverage protects the limit/overflow contract.
- **Implemented slice (2026-07-13):** the Stage 9 admin market, Shop Product, Price Observation, and Ingestion Submission surface now gives operators localized success/failure feedback, logs failed requests to the activity console, disables overlapping actions while a request is active, and rejects incomplete or invalid pricing forms before sending them.
- Acceptance: Alpha non-functional baseline above passes without production-platform expansion. Remaining catalogue/price-history paging and configured realistic-volume evidence require a concrete UI/query need before implementation. The configured audit must pass on the current populated data; raw archive/audit traversal must use an indexed sort path. **Code complete (2026-07-13):** audit traversal passes over 55 runs, 66 snapshots, and 12,172 rows; it reports 78 persisted Lidl duplicate identities. The dry-run repair predicts zero after reparsing, but configured write/reconciliation evidence is still open.
- The locale/parity portion of the automated baseline now has a focused browser-resource test: English and Hungarian translation leaf keys must match and remain non-empty.
- Commit by concern when independent: `chore: harden alpha operations`

### Step 11 - Repository and Alpha release documentation

- Complete concise setup/contribution/security/domain/demo/limitations docs and final validation checklist.
- **Implemented (2026-07-13):** README Alpha journey and safety boundary, `CONTRIBUTING.md`, `SECURITY.md`, `docs/alpha-operations.md`, and `docs/alpha-release-checklist.md` now describe the current Product Group/Shopping Trip runtime and clearly separate automated, configured, and browser evidence.
- Acceptance: a new technical reviewer can run, seed, exercise, test, and understand the project without private conversation history. Remaining acceptance is the configured/operator and browser evidence listed in the release checklist.
- Commit: `docs: prepare kamra alpha 1.0`

### Step 12 - Final Alpha review

- Run full automated validation, terminology search, locale/schema parity, configured database smoke/reconciliation, archive checksum/restore drill, crawl quality check, two-user browser scenario, and independent review focused on correctness/regression/missing tests.
- Acceptance: the MVP-hole gate and Stage 8–10 manual matrix have no open blocker; remaining items are explicitly post-MVP; frontend polish remains limited to the approved minor facelift boundary.
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
