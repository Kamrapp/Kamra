# Initial MVP Roadmap

Status: Active Draft

## Roadmap Concept

Kamra should become a small but real grocery-planning MVP without turning GitHub, Vercel, or any single managed platform into the center of the codebase.

Roadmap priorities:

- reach a useful household and product loop, not just infrastructure proof
- keep host and workflow adapters thin so the core app and job logic stay locally runnable
- add validation when the relevant code exists and the signal is meaningful
- stay fast enough for hobby-project momentum while leaving clean seams after the MVP rush

## Milestone Tracking

| Milestone | Focus | Status | Drift / notes |
| --- | --- | --- | --- |
| Stage 1 | Legacy inventory and extraction | Completed (docs) | Discovery strengthened the Angular-retention assumption, shared-contract direction, and migration-ledger need. |
| Stage 2 | Minimal serverless foundation | Completed | Vercel app/API and MongoDB connectivity are running; Stage 2 followups should be handled only when they block later stages. |
| Stage 3 | Product model foundation and seeded data | Completed | Finalized versioned product contracts, seed data, smoke validation, and admin-only product inspection before crawler work. |
| Stage 4 | Crawler intake and processing pipeline | Completed | Current in-scope ingestion, processing, operator review, product acceptance, source filtering, accepted-item hiding, strict new-ingestion collection validators, and explicit accept create/merge confirmation are in place. SPAR and Tesco are moved out of Stage 4 and should be revisited near the end of the MVP. |
| Stage 5 | Household stock foundation | Completed | User-owned household collections, membership-checked routes, demo household reseed, signed-in home pulse/editor, shopping-scale preview, admin dashboard controls, and durable `docs/household.md` are in place. |
| Stage 6 | Shopping list and low-stock notices | Completed | Deterministic shopping-list generation, DB-backed auto-tick feature toggle, household workspace refactor, start-fresh flow, read-only product browsing for signed-in users, About page, and logout redirect are implemented; browser/manual verification remains the main closeout task. |
| Stage 7 | Controlled alpha access and app module shell | Planned | Move external demo access later, after household and list value exist; keep public/product, household, site-admin, and dev-admin concerns visibly separate. |
| Stage 8 | Expiry and buffer logic | Planned | This completes the first strong product MVP loop with buy-before style usefulness. |

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
- Keep hosting and workflow glue thin so GitHub or Vercel are replaceable later.
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
- Followup sprawl risk: keep seams explicit now and move non-essential ideas to `mvp-followups.md` instead of stretching active stages.

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

- alpha/demo access fails for identities the admin has not allowed or created
- alpha/demo access succeeds for the controlled identity path
- feature flag disabled means no onboarding path is available
- external users cannot access admin, dev-admin, or other household data
- navigation grouping keeps module boundaries visible even if the UI remains simple

## Stage 8: Expiry And Buffer Logic

Goal:

- Warn users before they run out or before items expire. Completing this stage is the first strong product MVP milestone.

Future fields:

- expiry dates
- warning buffer
- desired safety stock
- buy-before date
- consumption estimate where useful

Validation:

- warnings are explainable
- expiry and min-limit logic do not overwrite each other
- household users can understand why an item is suggested
- notification channels beyond in-app notices are explicitly deferred unless planned

## Deferred Expansion

Items that are valuable but not required for the first household/product MVP live in `mvp-followups.md`.

This includes broader crawler expansion, richer product moderation, Google sign-in, repository automation, installable mobile/PWA work, route optimization, barcode scanning, four-corner floating module navigation, and similar product or workflow improvements.

Promote those items back into this roadmap only when they directly support the next MVP milestone, remove a current blocker, or the user explicitly chooses the tradeoff.

## Cross-Cutting Data Questions

Ask during the relevant planning sessions:

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
- represent country-wide offer scope with `regionCode = null`
- treat store records as country-scoped at minimum, with a country-level no-region no-address store anchor per brand for the first country-wide stock model
- model composition through quantity plus unit, including percentage-style composition via `%`

## First Recommended Next Step

Plan Stage 6 shopping-list generation from the documented Stage 5 household stock model and shopping-scale preview.

Treat broader crawler expansion as deliberately paused unless a later plan promotes a source back into active scope.
