# Initial MVP Roadmap

Status: Finalized Planning Direction — implementation still requires per-stage approval

## Roadmap Concept

Kamra should become a small but real grocery-planning MVP without turning GitHub, Vercel, or any single managed platform into the center of the codebase.

Roadmap priorities:

- reach a useful household and product loop, not just infrastructure proof
- keep host and workflow adapters thin so the core app and job logic stay locally runnable
- add validation when the relevant code exists and the signal is meaningful
- stay fast enough for hobby-project momentum while leaving clean seams after the MVP rush
- favor direct, native, and existing repository capabilities over speculative abstractions, dependencies, and infrastructure

## Milestone Tracking

| Milestone | Focus | Status | Drift / notes |
| --- | --- | --- | --- |
| Stage 1 | Legacy inventory and extraction | Completed (docs) | Discovery strengthened the Angular-retention assumption, shared-contract direction, and migration-ledger need. |
| Stage 2 | Minimal serverless foundation | Completed | Vercel app/API and MongoDB connectivity are running; Stage 2 followups should be handled only when they block later stages. |
| Stage 3 | Product model foundation and seeded data | Completed | Finalized versioned product contracts, seed data, smoke validation, and admin-only product inspection before crawler work. |
| Stage 4 | Crawler intake and processing pipeline | Completed | Current in-scope ingestion, processing, operator review, product acceptance, source filtering, accepted-item hiding, strict new-ingestion collection validators, and explicit accept create/merge confirmation are in place. SPAR and Tesco are moved out of Stage 4 and should be revisited near the end of the MVP. |
| Stage 5 | Household stock foundation | Completed | User-owned household collections, membership-checked routes, demo household reseed, signed-in home pulse/editor, shopping-scale preview, admin dashboard controls, and durable `docs/household.md` are in place. |
| Stage 6 | Shopping list and low-stock notices | Completed | Deterministic shopping-list generation, DB-backed auto-tick feature toggle, household workspace refactor, start-fresh flow, read-only product browsing for signed-in users, About page, and logout redirect are implemented; browser/manual verification remains the main closeout task. |
| Stage 7 | Controlled alpha access and app module shell | Implemented | Admin-created alpha users with database-backed creation/login gating, empty household allocation, and direct product-lookup, household, site-admin, and dev-admin route grouping are implemented. |
| Stage 8 | Household-domain correctness and complete user-side shopping | Completed user-side; manual closeout pending | Product Groups with optional Group/Product target policies, Product-owned Batches/Movements, Shopping Needs, household settings, migrations, localized Home/Manual surfaces, v2-driven list generation, editable shopping lines, and transactional purchase-to-Product/Batch finalization are implemented. Remaining Stage 8 work is browser verification and bugfixing only. |
| Stage 9 | Shop, catalogue, price, and purchase-ingestion connection | Implementation complete; acceptance/bug-fix closeout pending | Shop Markets, Shop Products, Price Observations, matcher-driven Trip planning with override/skip, admin review, Trip persistence/completion, and Home Trip UI are implemented. Remaining work is configured seed/API/browser evidence and narrowly scoped bug fixes; Stage 9 must not reimplement the basic household list or purchase-to-stock loop. |
| Stage 10 | Alpha 1.0 hardening | Approved executable workflow; pending execution | Applies the final domain language, preserves/exports/imports Crawl Snapshots, fixes confirmed parser/data defects, improves demonstrated change-locality problems, and prepares external Alpha review through one continuous sequence of independently committed slices. |
| MVP closure | Release validation and bounded polish | Planned after Stage 10 | Runs the complete Stage 8–10 matrix, closes anticipated failure classes, records waivers, and permits only low-risk visual/interaction polish that does not alter domain behavior. |

Non-MVP and post-MVP ideas are tracked in `mvp-followups.md` so this roadmap stays focused on the shortest useful household grocery-planning MVP.

When a later session changes stage ordering, validation strategy, platform posture, or key risks, update this roadmap or explicitly make that update the next required planning step. Do not leave durable direction only in session notes.

## Objective

Move Kamra from the current legacy/prototype codebase into a compact serverless-first product MVP while preserving useful domain knowledge, crawler ideas, entity concepts, and reusable snippets.

No implementation is approved by this roadmap. Each stage needs its own reviewed plan or explicit approval.

This roadmap starts after the agentic preparation session. Bootstrap documentation work is pre-roadmap setup and is captured in `.agents/sessions/2026-06-21-bootstrap-docs.md`.

The deployment and eventual product MVP should stay viable on free tiers for demonstration, testing, and portfolio/reference use. A few trusted people may use it, and job applications may reference it as evidence of both product engineering and careful agentic workflow steering.

The product MVP is not reached by deployment, authentication, ingestion, or admin visibility alone. It is reached only when a user can create or join a household, manage products or household items, and receive useful low-stock or buy-before notices. Stages before that are foundation and pipeline proof.

## Current Reality

The repository contains:

- ASP.NET Core API with JWT, EF, SQL Server, and controllers
- Angular 14 frontend
- MongoDB connector code
- Playwright crawler infrastructure
- Lidl and Aldi crawler samples
- domain entities for products, stores, stock, tags, users, and households

The intended direction is:

- Vercel frontend and stateless API routes
- MongoDB Atlas as the MVP system of record
- separate real and demo data environments
- GitHub Actions cron jobs for ingestion
- raw snapshots before processed product data
- no public registration initially
- admin-only raw credential login first
- product contract and seeded-data proof before crawler enablement
- JSON validation and database smoke checks around model changes before real ingestion grows
- admin view for seeded, crawled, fetched, or processed products
- processed product pipeline before external alpha/demo users
- household workflows for normal users
- shopping-list value before external alpha/demo registration
- source-available public repository with secrets and private runtime data excluded
- likely one collaborator, with the process still working if collaboration is intermittent

## Guiding Constraints

- Keep legacy code available until useful knowledge is extracted.
- Do not extend the old backend by default.
- Prefer small stages that prove one thing at a time.
- Keep hosting and workflow glue thin so GitHub or Vercel are replaceable later; add only cheap local seams that current work needs or that avoid an obvious near-term dead end.
- Prefer checked-in scripts and modules over large workflow files or host-specific handlers.
- Preserve raw crawl snapshots before transforming data.
- Keep product query data separate from price history.
- Add collated/current values only where they reduce common query cost.
- Discuss data model details during the relevant planning session before implementation.
- Prefer free-tier services and designs that remain demonstrable without ongoing hosting cost.
- Keep source-available public code clean enough to serve as a portfolio reference.
- Treat security, secrets, and abuse prevention as MVP concerns because the repository is public.
- Keep contributor workflow lightweight enough for one intermittent collaborator.
- Add tests and automation when the corresponding code path exists and the signal is worth the maintenance cost.
- Prefer small concern-specific PR checks over one opaque all-in validation workflow.
- Keep crawler behavior source-friendly and easy to disable.
- Keep recommendations independent from advertisements, seller sponsorship, or store agenda.

## Roadmap Granularity

Each roadmap stage is a product or architecture milestone, not necessarily one implementation session.

Before implementation, split the active stage into commit-sized or one-shot agentic units. A good unit should fit in one normal execution session, have one domain concern, and leave the app runnable afterward. If a stage starts requiring multiple long sessions, update the stage plan with smaller slices and move lower-value work to `mvp-followups.md`.

## Delivery Risks And Mitigations

- Platform lock-in risk: keep Vercel entrypoints and GitHub workflow files as thin adapters around app code and scripts that can also run locally.
- CI sprawl risk: add checks only when a repo slice becomes real, and keep them scoped to the changed concern where possible.
- MVP drag risk: avoid testing, pipeline work, or platform abstraction that exists only to look thorough; tie each addition to an actual code surface or operational risk.
- Followup sprawl risk: move non-essential ideas to `mvp-followups.md` instead of stretching active stages; do not prebuild their abstractions or configuration surfaces.

## Stage 1: Legacy Inventory And Extraction

Goal:

- Classify the current codebase before deleting, rewriting, or porting anything.

Expected output:

- fuller `docs/codebase-analysis.md`
- extraction notes for useful models, crawler patterns, selectors, and mapping ideas
- explicit keep/reference/retire guidance for frontend, backend, crawler, fetcher, workflow, and solution files
- session notes for what to keep versus throw away before the legacy branch split
- learnings for crawler architecture, legacy domain-model ideas, and shared-contract direction
- list of code to keep temporarily as reference
- list of code that can become legacy/archive

Questions:

- Which current entities should influence the first MongoDB schema?
- Which crawler code should be reused versus treated as reference?
- How should composition and tags influence the first canonical product schema and later elastic-search behavior?

## Stage 2: Minimal Serverless Foundation

Goal:

- Create the smallest deployed application that proves Vercel to MongoDB connectivity.

Scope slice:

- frontend deployed on Vercel
- frontend and API remain locally runnable without Vercel-only behavior
- raw admin credential login only
- no public registration
- API healthcheck route
- healthcheck connects to MongoDB and reports safe status
- MongoDB connection finalized for local and deployed environments
- admin bootstrap credentials managed through Vercel env vars or equivalent secrets
- authenticated admin identity persisted in the database
- host-specific handlers stay small around reusable app logic
- once frontend and API slices exist, add small PR checks for those slices rather than one broad workflow

Validation:

- local healthcheck works
- deployed healthcheck works
- the same core healthcheck path is callable locally and through the deployed adapter
- secrets are not committed
- unauthorized users cannot access admin-only surfaces
- free-tier limits are documented
- demo behavior does not expose private data
- platform-specific glue is visibly limited and replaceable

## Stage 3: Product Model Foundation And Seeded Data

Goal:

- Finalize the first minimal entity model and prove it with seeded product data before enabling crawlers.

Why this comes before crawling:

- crawler output needs a stable raw, processing, and query destination
- the first product contracts should support household queries before real data volume grows
- seeded data lets API, frontend, migration, and smoke-test behavior be validated without source-policy or crawler brittleness
- raw source payloads can retain extra data so later processors can extract more fields without recrawling, but crawler contracts should not be forced to change for obvious first-use cases

Scope slice:

- short research gate for grocery product model inputs before locking the first schema
- decide exact naming for product, source or store product, offer or price observation, stock location, household stock item, and raw snapshot concepts
- define minimal TypeScript contracts for canonical product query data and source-specific product data
- define processing-state concepts for raw or staged records, including processor version, last processed time, failure details, and intentional reset or reprocess behavior
- add JSON Schema or equivalent validation artifacts for seed fixtures and persisted model shapes
- add a database validation path that can run against `kamra_smoke` and a configured real app database without committing secrets
- add migration architecture concept for MongoDB document-shape changes, including a migration ledger and idempotent backfill scripts
- seed a few invented grocery products, source products, price or availability observations, and stock-location examples into the real app database for admin testing
- mark seed data clearly with source and environment metadata so it can be queried, refreshed, or removed intentionally
- add the smallest admin-only product list query in the API and frontend so seeded products can be inspected from the deployed app
- keep sample data non-private and synthetic unless a later source review allows real observed data

Research gate:

- use current primary sources only where they materially affect the model, such as common grocery identifiers, barcode/GTIN conventions, nutrition/allergen-style fields, MongoDB validation behavior, and the first candidate retailer source shape
- prefer storing broadly useful source payload data in raw snapshots over prematurely promoting every possible attribute into the canonical product document
- document which fields are first-class, which are retained only in raw/source payloads, and which are explicitly deferred

Validation:

- seed fixtures validate before insertion
- database smoke checks prove collection validation, seed insertion, query shape, and cleanup or refresh behavior
- product-list API and frontend read from the same model contracts used by the seed path
- model-shape changes have a visible migration-ledger or smoke-test update
- seeded data is enough to test initial household stock queries before crawling exists
- secrets and private runtime values remain outside source control

Status:

- completed in the current implementation slice; Stage 4 model adjustments should update `catalog/v1` intentionally if real ingestion proves the product/source/price shape is too narrow

Questions:

- Is the first canonical query object closer to "product", "item", or "element" in code naming, and which terms should be reserved for household stock?
- How much product source payload should be retained raw versus promoted into query documents?
- Which fields should be indexed immediately for admin and household-query tests?
- How should seeded data be distinguished from future crawled, processed, manually corrected, and demo-sample data?

## Stage 4: Crawler Intake And Processing Pipeline

Goal:

- Collect source data and process it into the Stage 3 product contracts without losing traceability or requiring avoidable recrawls.

Scope slice:

- manually dispatchable ingestion jobs before any production schedule is enabled
- source-specific crawler additions only after crawler-policy review and source-method investigation
- raw snapshot collection in MongoDB using the Stage 3 raw/source contract
- run metadata for source, country, scope, adapter version, schedule/manual trigger, and result summary
- source-friendly capture of country-aware and scope-aware offer or assortment data
- processor that reads raw snapshots, respects processing state, and writes queryable product/source-product/price records
- processing state prevents the same raw input from being processed repeatedly by the same processor version
- intentional reprocessing path when processor logic changes, including version bump or explicit reset
- admin view showing latest runs, raw/staged rows, processor failures, and processed product output
- workflow YAML stays minimal and shells into checked-in scripts or modules
- ingestion and processing entrypoints can run locally for debugging, not only inside GitHub Actions
- add ingestion-related PR checks only for workflow, ingestion-script, or processor changes once those files exist

Current status:

- `SimpleHtmlTableShop`, PENNY, ALDI, and COOP crawlers write ingestion runs and raw snapshots.
- Source-specific processing now writes queryable catalog records, source identifiers, price observations, stocks, and processing states for the current raw snapshot set.
- Price observations preserve offer history and restrictions; processors may write a current/collated `stocks.price` only when a safe default price is clear.
- Product lookup has server-backed paging, source filtering, and simple name-inclusion filtering with a debounce so filtering does not reload on every keystroke.
- The site-admin crawl view pages and virtualizes snapshot rows, can filter by crawl source, hides accepted items by default, and offers a toggle to include accepted items when needed.
- Accepting a crawl review item now previews whether the action will merge into an existing product or create a new one before writing catalog data.
- The app shell supports light/dark theme and English/Hungarian language preferences; signed-in preferences persist on the user profile and anonymous preferences persist in browser cookies.
- Default localization resources are nested JSON files under `src/app/i18n/`, currently `en.json` and `hu.json`, with a lightweight service in front of them.
- Tesco live product crawling is deferred because no documented public product/offers API/feed was found and the location-tagged offers page returned HTTP 403 from the crawler runner.
- Controlled PDF support through `SimplePdfShop` and Lidl brochure/PDF ingestion are in place.
- SPAR and Tesco brochure/catalogue work is intentionally moved out of Stage 4. Revisit them near the end of the MVP, after the current crawled-shop data has supported product lookup, household stock, and shopping-list/notice features.

Completion status:

- Stage 4 is complete for the current in-scope source set and manual supervision workflow as of 2026-07-08.
- Skipped/deferred shops, especially SPAR and Tesco, are not Stage 4 completion blockers and remain end-of-MVP expansion candidates.
- New ingestion collections are created with strict Mongo JSON schema validators; existing populated collections are not destructively recreated during normal setup.
- Final validation on 2026-07-08 passed: `npm run typecheck`, `npm run test`, `npm run lint`, `npm run build`, plus targeted `npm test -- packages/kamra-api-server/src/ingestion` after the final validator wiring.

Validation:

- manual workflow dispatch works before schedule enablement
- raw snapshot preserves source truth without unnecessary page noise or personal data
- raw-to-processed trace exists
- processing state prevents accidental duplicate processing and supports intentional reset
- price observations can be tracked over time
- product queries do not need full price history by default
- snapshot or fixture tests protect stable transformation output
- cron frequency, if enabled, stays within free-tier and source-friendly limits
- workflow behavior is not trapped inside YAML-only logic

Questions:

- What compact `site-admin` crawl-run view is enough to inspect snapshots, parsed rows, processing state, and one-snapshot manual processing before household work resumes?
- Which source-specific acquisition method is best for SPAR brochure viewer/PDF or Tesco catalogue/PDF when those sources are promoted back into scope near the end of the MVP?
- Runtime: TypeScript/Playwright, lightweight fetch/parser, Python, or selective .NET reuse only as temporary reference tooling?
- Which source fields should stay raw-only until real query needs justify promotion?

## Stage 5: Household Stock Foundation

Status:

- Completed on 2026-07-09.
- Durable closeout: `docs/household.md`.
- Stage 5 shipped household-owned stock collections, membership-checked API routes, demo household reseeding, signed-in home stock pulse/editor, shopping-scale preview levels, and an admin dashboard reset/maintenance surface.

Goal:

- Let users organize products around households.

Scope slice:

- multiple users can belong to a household
- model a household as a stock location where that reduces duplication, while keeping household membership and authorization separate from store/source locations
- decide the shared "stock location" abstraction only after Stage 3 product naming is settled
- household members can create household product or item entries
- household entries can be manually created or linked to processed products where possible
- each household item has `minLimit`
- each household item has `currentAmount`
- quantities preserve units and package-size ambiguity rather than collapsing values too early
- minimal view for maintaining household item state
- household queries and mutations should stay simple enough for focused API or domain tests once this slice exists
- admin user can test household stock against seeded products before external users exist

Validation:

- users only access households they belong to
- household item state is easy to query
- data shape leaves room for units, package sizes, and product matching uncertainty
- household stock can reference seeded products and still support unmatched manual items
- store/source stock and household stock do not leak into each other's authorization or update paths

Final validation:

- household, route, typecheck, lint, locale parity, and production build checks passed during Stage 5 closeout

## Stage 6: Shopping List And Low-Stock Notices

Goal:

- Generate a shopping list and visible low-stock notices from household items below their minimum limit.

Current status:

- deterministic shopping-list generation and persistence are implemented
- home workspace now separates stock overview/editor, shopping controls, and shopping finalization
- `Start fresh` creates an empty list for manual building
- stock rows can be highlighted and added one-by-one into an active shopping list
- partial completion honors the DB-backed `allowAutoTickingAllShoppingListEntries` feature toggle
- signed-in non-admin users can browse products read-only while edits remain admin-only
- About page and logout redirect refinements shipped as part of the Stage 6 continuation pass

Remaining closeout expectation:

- compact manual browser verification for household flow, product browsing, admin feature toggle, About page, and logout redirect

## Stage 7: Controlled Alpha Access And App Module Shell

Goal:

- Let a small number of external users see a useful alpha only after seeded/crawled products, household stock, and shopping-list basics exist.

Scope slice:

- minimal feature flag for controlled alpha or demo access
- admin can allow a small set of demo identities or create demo users through an explicit controlled path
- no uncontrolled public registration
- no automatic invitation email
- no automatic expiry email
- no whitelist cleanup cron
- audit metadata records who created or allowed access
- preserve a basic navigation shell that keeps four concerns separate even before the richer floating menu exists:
  - public or role-gated product checking, similar to an "arukereso" style product lookup surface
  - household management for normal users
  - site-admin product, merge, and stock-staleness operations
  - dev-admin diagnostics, database management, user insights, and health checks
- keep the eventual four-corner mini drawer or floating bubble menu in followups until the underlying modules are useful

Validation:

- unauthenticated and non-admin alpha creation fails
- alpha creation succeeds only when the database-backed flag is enabled
- each created alpha identity receives an empty household with initial owner membership
- disabling the flag blocks alpha-marked login while leaving demo and bootstrap identities unaffected
- external users cannot access admin, dev-admin, or other household data
- direct navigation paths keep product lookup, household, site-admin, and dev-admin boundaries visible

## Stage 8: Household-Domain Correctness

Goal:

- Correct the household inventory foundation and finish the safe household-to-generic-demand loop on which Stage 9 concrete shopping depends.

Approved planning direction:

- replace the one-stock-row-per-generic-product assumption with independently dated and linked stock batches
- make Product Groups, Product identity/classification, and concrete Product-owned Stock Batches distinct concepts; target policy is optional data owned by a Product Group or Product, not a peer entity
- replace legacy single tag parents with typed, cycle-safe Product Concept `is_a` relations so narrower concepts inherit broader concepts while Product Attributes/Search Keywords remain distinct
- let households create/move/merge scoped Product Concepts safely as classification/tagging vocabulary, without using them as Home stock grouping
- seed a bounded meaningful base concept/attribute/template pack from checked-in JSON with feature-local English/Hungarian translations through one idempotent CLI/admin sync service
- aggregate through a Product's single direct Product Group membership and ancestor rollup; legacy Batch allocations are reconciled and retained as history, never combined with membership aggregation
- add Product/Group aggregation, explicit consumption/correction/discard actions, immutable movement history, optimistic concurrency, idempotency, and atomic stock commands
- migrate existing household data through the database maintenance registry with separately tracked validator and data actions
- connect Product Group/Product target-policy owners, Shopping Needs, classifications, and Stock Batches through explicit ownership plus durable snapshots
- preserve manual/unlinked stock and keep catalogue archive/removal from invalidating household history
- redesign generic demand as Shopping Needs while completing the basic Home list and purchase-to-household-stock loop; Shop Markets, Prices, Shopping Trips, and admin Purchase Ingestion remain Stage 9
- add an accessible locally remembered 30/70–70/30 Household/Shopping home divider with 50/50 reset on non-stacked layouts; defer animated tri-state focus/inline quick-action rows
- add explainable low-stock and expiry/buy-before notices, including products without expiry dates
- finish the create-or-join workflow for existing controlled users with basic owner/member capabilities
- generalize the current database-backed flags into an admin-managed application feature-toggle service with typed definitions, safe defaults/failure behavior, audit history, bounded caching, and removal rules
- extend structured domain logging and persistent administrative audit coverage
- keep recommendation, automated matching, substitutions, receipt/barcode automation, and forecasting out of this milestone

Implementation plan:

- `.agents/plans/2026-07-11-stage-8-coherent-household-mvp-plan.md`

Validation:

- multiple generic/manual and explicit-Product Stock Batches under one Product Group retain independent acquisition/expiry dates and Product/classification snapshots
- inherited concepts match inclusively, independent attributes filter correctly, the motivating milk/pasta rules are explainable, and cycles/cross-household relations are rejected
- base content/template sync is additive, localized, repeatable, admin-previewable, and never overwrites customized/household content silently
- Product/Group rollups, partial consumption, corrections, depletion, and history remain consistent without double counting under retries and concurrent requests
- the Home user can generate, edit, mark bought, and finalize a shopping list; finalized lines create/reuse Household Products and Product-owned Stock Batches without requiring catalogue approval
- the desktop/tablet Household/Shopping divider is keyboard/pointer usable, locally remembers a clamped ratio, resets to 50/50, and leaves stacked mobile behavior unchanged
- warnings are explainable
- expiry and min-limit logic do not overwrite each other
- household users can understand why an item is suggested
- catalogue edits/archive do not invalidate household stock or history
- existing household data reconciles exactly after idempotent migration
- a controlled user can create or join a household and repeat the household-to-generic-demand loop without manual reconstruction
- notification channels beyond in-app notices are explicitly deferred unless planned

## Stage 9: Concrete Shopping And Catalogue Connection

Goal:

- Complete the MVP journey by translating generic demand into an overrideable one-shop plan, processing the trip manually, and feeding trusted/untrusted results into stock and catalogue workflows safely.

Scope:

- one direct country-specific Shop Market, kept separate from source metadata and physical branches; extract a Shop Chain or Ingestion Source only when current data needs independent identities
- one manually chosen shop and planned date
- Product/need-compatible Shop Product candidates, package normalization, applicable-Price-Observation selection, and deterministic cheapest repeated-single-SKU choice
- manual override/search, skip, unresolved generic, stale/no-price/conditional fallbacks, and match explanations
- explicit resumable Shopping Trip/Trip Item states instead of ambiguous booleans
- actual product/quantity/price/expiry and unplanned purchase recording
- atomic idempotent purchase-to-new-Product-owned-Batch/Movement conversion
- structured Purchase Ingestion with immediate household use and asynchronous admin review
- preserve qualified/custom classification snapshots through purchase ingestion without rewriting household history; defer household-to-global mapping/promotion until reviewed submissions prove the need
- minimum manual product, shop-product, and price-observation administration required to unblock the flow
- append-only/correctable price history and immutable shopping calculation snapshots

Implementation plan:

- `.agents/plans/2026-07-11-stage-9-concrete-shopping-catalogue-plan.md`

Validation:

- one user completes and later repeats the shop-specific workflow without direct database editing
- expired offers are not current, base/offer prices coexist, stale/no-price states are explicit, and historical plans remain stable
- retries/partial completion do not duplicate purchases, batches, movements, prices, or ingestion submissions
- unknown purchases enter household stock immediately and can later be reviewed without rewriting history

## Stage 10: Alpha 1.0 Hardening

Goal:

- Validate real data and the complete workflow, repair confirmed defects, improve architecture only where evidence shows poor locality or dangerous coupling, and finish a concise professional Alpha baseline.

Scope:

- final dictionary rename across active API/database/code/UI/i18n/logs/docs where a term remains active, with an operator-visible maintenance action
- verified Crawl Snapshot archive export/import, raw-preserving offline correction overlays, and clean reprocessing into Product Candidates
- read-only development crawl-data audit followed by confirmed parser fixes and dry-run-first repair/reprocessing tools
- architecture/change-locality review using concrete change probes; refactor only demonstrated poor locality or dangerous coupling
- targeted route/repository/service/component responsibility cleanup; no broad rewrite
- schema/validation consistency and explicit compatibility/migration/repair ownership
- loading/empty/error/partial/conflict, logging/redaction, permissions, pagination/index, accessibility/responsive, and realistic-volume checks proportional to the Alpha path and observed risk
- dead compatibility/temporary flag removal
- setup, migration, contribution, security, demo, limitation, and Alpha readiness documentation

Implementation plan:

- `.agents/plans/2026-07-11-stage-10-alpha-hardening-plan.md`

Validation:

- the final Alpha acceptance scenario passes against realistic seeded/development data
- every active ingestion source has a quality decision and confirmed repairs have regression fixtures
- remaining compatibility paths and deferred limitations are explicit
- a new technical reviewer can run, understand, test, and demonstrate Kamra without private context

## Final Alpha 1.0 Assessment

The combined Stage 8-10 roadmap is conceptually complete for meaningful single-user and family internal testing **if all three stages and the acceptance scenario are completed**. Stage 8 is now a complete user-side household/list/purchase foundation. Stage 9 adds the concrete shop/product/price and finalized-trip ingestion-review circle without taking basic household usefulness hostage to catalogue data. Stage 10 verifies that the result is trustworthy and understandable enough to call Alpha 1.0.

The external presentation target is a deliberately engineered **source-available public Alpha**, consistent with `LICENSE.md`; documentation must not imply permissive clone-and-host open-source rights.

The smallest additional MVP work found in this final review, beyond the earlier Stage 8 plan, is now explicitly in Stage 9:

- country-specific shop identity separated from source metadata, with separate chain/source entities only when evidence requires them
- valid/stale/no-price-aware one-shop product selection
- resumable manual trip processing and correction
- append-only price correction/history rather than destructive replacement
- user purchase ingestion that does not block household stock
- minimum admin product/shop-product/price creation needed when crawlers are incomplete

Without those items Kamra would remain an inventory tracker plus catalogue browser, not a validation of the intended grocery-planning concept. Advanced optimizers, receipt automation, rich catalogue tooling, analytics, and prediction are not needed for Alpha 1.0.

## Important Overlooked Requirements And Risks

| Finding | Repository evidence/risk | Classification | Owning stage |
| --- | --- | --- | --- |
| Concept hierarchy versus attribute tags | Current `product_tags.parentKey` does not provide typed, cycle-safe inherited relationships. | Required for MVP correctness | 8 |
| Meaningful initial classification content | Empty taxonomy/rule tables would make the new model technically correct but painful to test/use; destructive reseeding would endanger custom content. | Required for MVP usability | 8 |
| Runtime domain-content localization | Static Angular resources cannot represent admin/user-created concepts; identity must remain stable while labels resolve/fallback by locale. | Required for MVP usability | 8-9 |
| Direct Product Group membership | Batch-level or classification-driven grouping would make later Batches inconsistent or double-counted; Products need one clear Group and ancestor rollup. | Required for MVP correctness | 8 |
| Safe concept move/merge | Household-created hierarchy states otherwise cannot be corrected or reorganized. | Required for MVP usability | 8 |
| Shop market identity | `household_shops` mixes country, source names, and store-brand keys; cross-country offers could be conflated. | Required for MVP correctness | 9 |
| Price applicability | Catalogue hydration selects latest per kind without shopping-date validity/staleness policy. | Required for MVP correctness | 9 |
| Price history preservation | Crawl acceptance currently deletes prior source-product observations. | Required for MVP correctness | 9 |
| Manual catalogue escape hatch | No direct product/shop-product/price create path can unblock a shopping match when crawlers are incomplete. | Required for MVP usability | 9 |
| Resumable trip states | Current tick/planned/purchased/application booleans allow ambiguous workflows and weak retries. | Required for MVP correctness/usability | 9 |
| Shopping submission trust boundary | User-entered product/price facts must enter stock immediately but not silently become canonical. | Required for MVP correctness | 9 |
| Real crawl-data quality | No source-wide audit proves current parsed rows are mergeable/correct. | Required for maintainability before Alpha 1.0 | 10 |
| Change locality | Large repositories/routes/components and duplicated contracts may spread future changes; refactor only confirmed cases. | Required for maintainability before Alpha 1.0 | 10 |
| Repeated UX failure states | Loading, empty, no-match, stale, partial, conflict, and resume behavior require end-to-end verification. | Required for MVP usability | 9-10 |

## Final Domain Terminology

- **Product Concept (`ProductConcept`):** generic product meaning such as milk, semi-skimmed milk, pasta, or spaghetti. Concept nodes have strong, explicit `is_a` relationships.
- **Product Attribute (`ProductAttribute`):** independent filter such as gluten-free or 1.5%-fat. It does not become a parent/child concept merely because it classifies a product.
- **Product Group Template (`ProductGroupTemplate`):** seeded/global suggestion containing a group name, safe tracking unit, and optional target policy defaults; copying it creates an independently editable household Product Group.
- **Search Keyword (`SearchKeyword`):** search/matching hint only; never sufficient for eligibility or identity.
- **Product Group (`ProductGroup`):** household-owned, optionally nested group such as milk or bread. Products belong to at most one direct Group; Group totals roll up from descendant Products.
- **Target policy (`TargetPolicy`):** optional minimum/desired-restock policy owned by a Product Group or Household Product. It is not a standalone Stock Target.
- **Product (`Product`):** canonical explicit catalog identity with brand and measurements.
- **Shop Product (`ShopProduct`):** one shop-market-specific retailer representation of a product. Replaces “product source” as a domain/API term.
- **Stock Batch (`StockBatch`):** acquired physical quantity with Product/manual snapshot, acquisition/expiry, and remaining amount.
- **Legacy Stock Allocation (`StockAllocation`):** historical/migration link from the superseded Batch-to-Stock-Target model; new runtime grouping uses Product membership.
- **Stock Movement (`StockMovement`):** immutable explanation of acquisition, consumption, correction, discard, expiry/removal, or reversal.
- **Shopping Need (`ShoppingNeed`):** generic demand derived from a Product Group or Household Product target-policy shortage, or entered ad hoc. It is not yet a selected product or purchase.
- **Shopping Trip (`ShoppingTrip`):** selected shop/date plus planned/unresolved items and resumable shopping results. Avoid using generic “shopping list” for both needs and trips.
- **Trip Item (`ShoppingTripItem`):** one need/selection/result line within a shopping trip.
- **Purchase (`Purchase`) / Purchase Item (`PurchaseItem`):** immutable historical record of what was actually bought, including actual product/manual snapshot, quantity, prices, expiry splits, and stock/ingestion references.
- **Shop market:** country-specific retailer market. Extract a separate Shop Chain only when active markets need shared administration; physical branches remain deferred.
- **Ingestion Source (`IngestionSource`):** acquisition method/adapter, separate from shop identity; introduce a separate persisted record only when it needs independent lifecycle or review management.
- **Crawl Snapshot (`CrawlSnapshot`):** immutable crawler-captured source payload plus capture/parser provenance.
- **Ingestion Submission (`IngestionSubmission`):** structured manual/shopping/repair input awaiting trust review.
- **Product Candidate (`ProductCandidate`):** normalized reviewable interpretation of crawl/submission data before catalog promotion.
- **Price Observation (`PriceObservation`):** append-only product/shop-market price fact with kind, time, optional validity, origin, and correction relationship.
- **Offer:** user-facing description of an applicable promotional price observation; not a duplicate product or shop identity.

Vocabulary rules:

- Reserve `is_a` for persisted relation values/code; UI copy says “is a kind of.”
- Avoid new domain/API/database uses of ambiguous `tag`, `rule`, `requirement`, `product source`, `store`, `inventory`, `purchase order`, or unqualified `shopping list`.
- Use `catalog` consistently in code, API paths, database/package names, and technical docs. UI copy may use the locale's natural spelling, but it must not create a second domain concept.
- Legacy names may appear only in migration/compatibility adapters with a removal note.

## Relationship And Ownership Matrix

| From -> To | Relationship | Stability rule |
| --- | --- | --- |
| Narrow concept -> broad concept | Strong explicit `is_a` edge | Cycle-safe; move/merge audited; historical snapshots survive. |
| Product -> concepts/attributes | Strong classification assignments | Product id remains identity; inherited concepts are derived. |
| Product Group/Product -> target policy | Optional embedded policy | Missing policy means neutral/not-tracked; policy snapshots drive generated Shopping Needs. |
| Stock Batch -> Product/Shop Product | Optional reference + immutable acquisition snapshot | Manual/unresolved allowed; catalog archive/merge cannot invalidate history. |
| Household Product -> Product Group | Zero-or-one direct membership | Batches inherit grouping; ancestor rollup counts a Product once. |
| Shopping Need -> Product Group/Product | Strong owner reference when generated, optional when ad hoc | Preserve target-policy/shortage snapshot; parent/child planning is residual, not additive. |
| Trip Item -> selected Shop Product/Price Observation | Optional reference + immutable plan snapshot | Unresolved/no-price allowed; later observations do not rewrite plan. |
| Purchase -> plan/actual product/batches | Strong historical references plus snapshots | Corrections/reversals append history. |
| Shopping submission -> catalogue decision | User-confirmed/inferred candidate link | Admin decision affects future catalogue use, not past purchase/stock. |
| Shop product -> shop market/catalogue product | Strong references | Market is country-specific; ingestion method is separate. |
| Price observation -> shop product/market | Strong append-only reference | Corrections supersede; do not delete history. |
| Crawl/purchase input -> source provenance | Strong provenance | Raw/structured source is untrusted until reviewed; a separate Ingestion Source record is optional. |

## Stage Dependencies And Prioritization

1. **Stage 8 — household correctness:** no Stage 9 concrete shopping writes land on the legacy one-row stock model. Complete and reconcile Product Groups with Group/Product target policies, Product-owned Batches/Movements, Shopping Needs, feature toggles, and logging first.
2. **Stage 9 — MVP usability:** correct Shop Product/Price Observation foundations before automatic matching; then add Shopping Trips, matching, UI, Purchase conversion/Ingestion, and workflow validation.
3. **Stage 10 — Alpha maintainability:** verify the Crawl Snapshot archive first, apply final-language migration/reset, audit/reprocess actual data, then perform evidence-based cleanup. Move behavior bugs back to the owning feature.
4. **Post-MVP:** optimize, automate, visualize, predict, and broaden only after internal use validates the loop.

Detailed ordered steps, commit boundaries, validation, migration, and acceptance criteria live in the linked stage plans. Review each commit-sized unit before continuing.

## Final End-To-End Alpha Acceptance Scenario

The Alpha 1.0 release candidate must complete this without direct database editing:

1. Sign in as a controlled user and create/access a household.
2. Preview/sync the checked-in localized base classification pack as admin; verify a repeat sync is unchanged.
3. Create a Product Group with an optional target policy from localized guidance, then create custom household content with a missing-language fallback.
4. Create/move/correct an `is_a` relationship; verify a merge preserves references/history.
5. Create milk and constrained pasta Product Groups with units/minimum/desired-restock policies.
6. Add generic/manual and explicit catalogue stock with multiple acquisition/expiry batches.
7. Assign concrete Household Products to Product Groups, inspect Stock Batches, and prove direct/ancestor rollups count each Product once.
8. Consume partially, mark fully consumed, correct, discard/void an invalid batch through the right action, and inspect immutable history.
9. Generate Shopping Needs from shortages and add one ad-hoc unresolved Shopping Need.
10. Select one country-specific shop market and planned shopping date.
11. Translate Shopping Needs into concrete Shop Products/Price Observations; inspect why matches were selected and expected package counts/totals.
12. Override one match, keep one no-price/no-match item unresolved, and skip one line.
13. Start shopping, save partial results, leave, and resume.
14. Mark bought/not-bought, adjust actual quantity/price, substitute an actual product, and add an unplanned purchase.
15. Record separate normal/offer values and validity where known plus batch expiry splits.
16. Complete the Shopping Trip and verify new Product-owned Stock Batches/Movements and Purchase history were created once.
17. Retry the same completion and verify no duplicate side effect.
18. Confirm an unknown purchase created household stock immediately and a pending structured ingestion review item carrying classification snapshots.
19. As site admin, link/create/correct/reject the submission and append price observations without changing household history; defer custom classification promotion.
20. Generate a later trip and verify the trusted shop product/price/classification can be reused.
21. Archive/merge a referenced catalogue product and verify historical trip, purchase, and stock snapshots still render.
22. Inspect feature-toggle state, maintenance state, structured logs, and audit records for a deliberately exercised failure.
23. Repeat with a second household member and verify role/household isolation.

## Alpha 1.0 Non-Functional Readiness Checklist

- [ ] Important commands are idempotent, retry-safe, revision-checked, and transactionally consistent.
- [ ] Household/member/admin authorization and data isolation tests pass.
- [ ] Inputs, dates, units, currency/country, state transitions, and identifiers are validated explicitly.
- [ ] Validators, indexes, migration actions, reconciliation, and repair/rollback expectations are documented and tested.
- [ ] Archive/correction/reversal semantics preserve stock, purchase, catalogue, and price history.
- [ ] Core loading, empty, error, no-match, no-price, stale, partial, conflict, and resume states are usable/localized.
- [ ] Core UI is keyboard-labelled, non-color-only, responsive, and manually checked on narrow/desktop layouts.
- [ ] Logs are structured/redacted/useful; privileged audit records and feature-toggle changes persist.
- [ ] Product, price, history, ingestion, and admin tables use bounded pagination and appropriate indexes.
- [ ] Realistic seeds cover multiple batches, hierarchy rules, two markets, current/stale/offer/no-price, unresolved, substitution, and unknown purchase.
- [ ] Base classification content is checked in, schema/parity tested, additive/idempotent through CLI/admin, and documented for contributor extension.
- [ ] Basic realistic-volume checks show no misleading MVP result; measured issues are fixed without platform expansion.
- [ ] Internal database backup/recovery expectations are documented; no production HA/DR promise is implied.
- [ ] Crawl Snapshot export counts/checksums verify, an isolated import/reprocess drill passes, and no raw evidence is rewritten by a correction overlay.
- [ ] Active APIs, collections/fields, types/files, UI/i18n, events, seeds, and current docs use the final domain dictionary; legacy terms remain only in named tested adapters/history.
- [ ] Test, typecheck, lint, build, locale/schema parity, database smoke/reconciliation, and full browser scenario pass.
- [ ] README, architecture/domain, operations, contribution, security, and known-limitations documentation reflects runtime truth.
- [ ] No temporary migration flag, silent repair-on-read, or undocumented compatibility branch remains.

## Work Classification Matrix

| Major block | Classification |
| --- | --- |
| Product Groups with optional Group/Product target policies, Product-owned Batches/Movements, expiry/consumption/correction, migration | Required for MVP correctness |
| Bounded localized Product Concepts/Attributes and non-destructive CLI/admin sync/runtime fallback where current workflows use them | Required for MVP usability |
| Household membership management, inspectable Stock Batches/history, Shopping Needs, usable empty/error/conflict states | Required for MVP usability |
| Direct Shop Market identity, Price Observation applicability/history correction, Shopping Trip state machine, idempotent Purchase conversion, trust boundary for Ingestion Submissions | Required for MVP correctness |
| One-shop automatic choice, overrides, unresolved/no-price fallbacks, resumable mobile/manual completion, minimum admin data entry | Required for MVP usability |
| Final-language maintenance action, verified Crawl Snapshot archive/import/reprocessing, confirmed parser repairs, evidence-based cleanup, Alpha docs | Required for maintainability before Alpha 1.0 |
| Rich catalogue/offer UX, receipt scanning/OCR, multi-shop optimization, duplicate/merge intelligence, substitution ranking, prediction/notifications/analytics | High-priority post-MVP |
| Floating navigation, broad hosted observability, workflow automation, advanced governance/localization polish | Optional later enhancement |

## Cross-Stage Migration And Compatibility Strategy

- Register stable validator and data actions before changing existing collections; track them independently.
- Stage 8 migrates legacy household rows to Product Groups, Product-owned Stock Batches, and opening Stock Movements where deterministic; legacy Stock Targets/Allocations remain history/migration input and ambiguous Product histories are reported rather than guessed.
- Stage 8 base-content synchronization is seed-ledger reference-data work, not a structural migration: it adds/updates only checksum-proven seed-owned records and reports customized/archived conflicts.
- Stage 9 migrates `household_shops` to direct Shop Markets, creates final `shop_products`, and changes Price Observation handling from destructive latest-value replacement to append/correct/select. Separate chain/source records are introduced only if the current data needs them. Historical legacy shopping/Purchase snapshots remain readable.
- Each cutover uses a bounded maintenance/write gate only where required, no indefinite dual writes, idempotent reconciliation, and a documented rollback evidence window.
- Stage 10 first exports/verifies Crawl Snapshots, then runs `alpha-domain-language-v1`, resets/reseeds disposable derived data where safer, imports/reprocesses raw evidence if using a clean database, and removes dead v1 writes/adapters only after reconciliation. Physical purge always needs a separate explicit maintenance decision.
- One-time audit/repair tools live outside repositories/runtime paths, default to dry-run, report scope/counts, and document repeat behavior.

## Cross-Stage Validation, Logging, And Feature-Toggle Strategy

- Pure domain tests own hierarchy closure, Product Group rollup/residual planning, expiry/consumption, price applicability/package math, and trip transitions.
- Contract/schema snapshots own persisted/transport shapes; repository/API tests own transactions, concurrency, idempotency, permissions, pagination, and migration reconciliation.
- Browser acceptance owns the connected user journey and all meaningful loading/empty/error/partial/conflict states.
- Domain command owners emit one structured event with correlation/operation ids; persistent audit covers privileged hierarchy, stock-history reversal, shop/catalogue, ingestion-review, feature-toggle, and maintenance changes.
- Feature toggles remain global/admin-managed initially, typed, audited, cached with bounded failure behavior, and removed with their stabilized branches. They never replace permissions or domain states.
- Stage 10 reviews realistic-volume query plans/indexes and data quality; it does not add infrastructure without measured need.

## Deferred Expansion

Items that are valuable but not required for the first household/product MVP live in `mvp-followups.md`.

This includes broader crawler expansion, richer product moderation, Google sign-in, repository automation, installable mobile/PWA work, route optimization, barcode scanning, four-corner floating module navigation, and similar product or workflow improvements.

Promote those items back into this roadmap only when they directly support the next MVP milestone, remove a current blocker, or the user explicitly chooses the tradeoff.

## Historical And Future Data Questions

These prompts remain useful for older stages and post-MVP planning; they are not open decisions for Stages 8-10. The final glossary, stage plans, migration rules, and stop conditions govern implementation. Reopen a prompt only if verified repository reality contradicts a stated stage invariant.

- Which legacy entities should influence MongoDB documents?
- Which properties should exist early even if initially empty?
- Which values should be collated into query documents?
- Which values must remain historical only?
- How should units and package sizes be represented?
- How should uncertain product identity matches be represented?
- How should shared TypeScript contracts map to workflow jobs that are not written in TypeScript?
- How should migration-ledger records be modeled after EF Core is removed?
- How should composition records and tag-like normalized search signals be stored so later elastic search stays explainable?
- How should country-wide, regional, and location-specific availability or pricing scope be represented?
- Which canonical product fields are truly required in the first schema versus better left deferred until real ingestion data forces them?
- Which shared contract shapes are internal-only versus intended to remain stable across public API boundaries?
- How should unresolved identity or merge-candidate records be modeled so automated processors and later review can work safely?
- What snapshot granularity is enough for price history and debugging?
- What admin actions are needed before automatic product merging is trusted?
- Which fields belong in seeded synthetic fixtures so household queries can be tested before crawling?
- Which model changes require JSON Schema regeneration, database smoke checks, and migration-ledger entries?
- How should raw/staged processing states represent pending, processed, failed, skipped, stale, and intentionally reset records?
- What processor-versioning rule prevents duplicate processing while still allowing intentional reprocessing after logic changes?
- Should household and store/source inventory share a stock-location abstraction in code, or only a smaller shared quantity/stock-value model?

## Cross-Cutting Product And Ops Questions

Ask during the relevant planning sessions:

- What should public demo users be able to see without risking private household data?
- Which parts of the product lookup surface can become public later, and which must remain role-gated until alpha/demo access exists?
- What usage limits are needed to stay inside free-tier boundaries?
- What feature flags must remain off in public/demo deployments?
- What should be documented for job-application reviewers?
- What contributor workflow is enough for one intermittent collaborator?
- Which practices belong in global agent settings or reusable skills instead of this repo?
- Which crawler sources are acceptable under `docs/crawler-policy.md`?
- What license wording should be shown to portfolio reviewers so source availability is clear without implying clone-and-host permission?
- Which navigation/module boundaries should be visible in the simple UI before the floating mini-menu concept is promoted?

Current direction:

- keep Angular as the frontend baseline unless a later plan proves it is blocking
- use shared TypeScript contracts as the main app-facing source of truth
- keep workflows language-flexible per source
- keep workflow YAML and host-specific handlers thin around locally runnable code
- bootstrap admin login with Vercel-managed credentials while persisting admin identity in the database
- use workflow-generated sample datasets for demo environments instead of exposing live internal data
- prefer concern-specific PR checks plus lightweight smoke checks over one monolithic CI job
- treat stock as location-connectable and offers as country-wide first, with room for later regional scope
- prove product, source-product, stock-location, and processing-state contracts with seeded synthetic data before enabling crawlers
- keep seed data clearly marked by source/environment so it can support real database testing without becoming mistaken for crawled data
- make JSON validation, schema artifacts, database smoke checks, and migration-ledger behavior part of the first product-model stage
- move controlled external alpha/demo access until after household stock and shopping-list value exist
- keep public product lookup, household management, site-admin operations, and dev-admin diagnostics as separate app concerns even if the first navigation remains simple
- identify a shop market by chain plus country; keep ingestion method separate and defer physical branches
- represent offer scope explicitly as market/country first, with region/branch only when real source data requires it
- model composition through quantity plus unit, including percentage-style composition via `%`

## First Recommended Next Step

Review and approve or revise `.agents/plans/2026-07-11-stage-8-coherent-household-mvp-plan.md`, then implement one approved commit-sized step at a time.

Treat broader crawler expansion as deliberately paused unless a later plan promotes a source back into active scope.
