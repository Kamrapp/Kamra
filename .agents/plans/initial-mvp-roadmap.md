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
| Stage 2 | Minimal serverless foundation | In progress | Final tightening is planned in `2026-06-23-finalize-stage-2-plan.md`; keep the remaining pass small. |
| Stage 3 | First simple ingestion job | Planned | Keep workflow YAML small and move logic into scripts or modules. |
| Stage 4 | Product processing pipeline | Planned | Add contract and schema safeguards only when processing code exists. |
| Stage 5 | Controlled demo access | Planned | Keep demo access admin-controlled and minimal; full invitation and email automation is deferred. |
| Stage 6 | Household foundation | Planned | Keep household data boundaries simple and query-friendly first. |
| Stage 7 | Shopping list and low-stock notices | Planned | Favor deterministic core logic over premature optimization. |
| Stage 8 | Expiry and buffer logic | Planned | This is the first strong user-value milestone, not just ops maturity. |

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
- admin view for crawled/fetched products
- processed product pipeline before demo users
- minimal admin-controlled demo access before broader demo-user registration
- household workflows for normal users
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

## Stage 3: First Simple Ingestion Job

Goal:

- Add one simple scheduled ingestion path.

Scope slice:

- one GitHub Actions cron job
- one simple crawler/fetcher
- raw snapshot collection in MongoDB
- run metadata
- country-aware and scope-aware offer or assortment capture
- admin view showing crawled/fetched products or raw rows
- workflow YAML stays minimal and shells into checked-in scripts or modules
- ingestion entrypoints can run locally for debugging, not only inside GitHub Actions
- add ingestion-related PR checks only for workflow or ingestion-script changes once those files exist

Validation:

- manual workflow dispatch works
- scheduled workflow is defined
- raw snapshot preserves source truth
- admin can inspect the latest run
- cron frequency stays within free-tier and source-friendly limits
- workflow behavior is not trapped inside YAML-only logic

Questions:

- Which retailer or source should be the first enabled ingestion target after source-policy review and source-method investigation?
- Which acquisition method is best for the first enabled source: browser automation, public API, PDF ingestion, or another source-specific approach?
- Runtime: TypeScript/Playwright, lightweight fetch/parser, or selective .NET reuse only as temporary reference tooling?

## Stage 4: Product Processing Pipeline

Goal:

- Transform raw snapshots into queryable product records without losing traceability.

Expected model direction:

- raw snapshots stay separate
- processed products are easy to query
- store-specific products stay separate from canonical product identity
- price history is separate from current query documents
- current/collated values may be duplicated where frequent queries need them
- transformation is deterministic and rerunnable
- uncertain identity remains unlinked until verified
- standardized processor jobs can maintain merge candidates, stale data, and similar hygiene tasks
- schema-shaping logic stays explicit enough for later migration-ledger or backfill scripts
- shared contracts or generated artifacts should remain cheap to refresh when model boundaries change

Validation:

- raw-to-processed trace exists
- price observations can be tracked over time
- product queries do not need full price history by default
- snapshot or fixture tests protect stable transformation output
- contract or schema artifacts regenerate in PR-visible form when schema-relevant code exists
- model-shape changes gain migration-ledger or backfill validation once those mechanisms are introduced

## Stage 5: Controlled Demo Access

Goal:

- Let the admin create controlled demo-user access after there is processed product data worth demonstrating, without building the full communication workflow yet.

Scope slice:

- minimal feature flag for demo access
- admin can allow a small set of demo identities or create demo users through an explicit controlled path
- no uncontrolled public registration
- no automatic invitation email
- no automatic expiry email
- no whitelist cleanup cron
- leave room for the fuller whitelist and email workflow in `mvp-followups.md`

Validation:

- demo access fails for identities the admin has not allowed or created
- demo access succeeds for the controlled identity path
- feature flag disabled means no demo onboarding path is available
- audit metadata records who created or allowed the demo access

## Stage 6: Household Foundation

Goal:

- Let users organize products around households.

Scope slice:

- multiple users can belong to a household
- household members can create household product or item entries
- household entries can be manually created or linked to processed products where possible
- each household item has `minLimit`
- each household item has `currentAmount`
- minimal view for maintaining household item state
- household queries and mutations should stay simple enough for focused API or domain tests once this slice exists

Validation:

- users only access households they belong to
- household item state is easy to query
- data shape leaves room for units, package sizes, and product matching uncertainty

## Stage 7: Shopping List And Low-Stock Notices

Goal:

- Generate a shopping list and visible low-stock notices from household items below their minimum limit.

Scope slice:

- compare `currentAmount` with `minLimit`
- produce needed items
- show household users what they are likely to run out of, initially through in-app notices
- connect needed items to available products where possible
- keep unmatched needs visible
- list generation should live in deterministic core logic that is easy to test outside UI or server adapters

Validation:

- deterministic output from household fixture data
- common list-generation logic has focused tests
- missing products and unknown units are explicit

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

This includes broader crawler expansion, richer product moderation, Google sign-in, repository automation, installable mobile/PWA work, route optimization, barcode scanning, floating mini-menu navigation, and similar product or workflow improvements.

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

## Cross-Cutting Product And Ops Questions

Ask during the relevant planning sessions:

- What should public demo users be able to see without risking private household data?
- What usage limits are needed to stay inside free-tier boundaries?
- What feature flags must remain off in public/demo deployments?
- What should be documented for job-application reviewers?
- What contributor workflow is enough for one intermittent collaborator?
- Which practices belong in global agent settings or reusable skills instead of this repo?
- Which crawler sources are acceptable under `docs/crawler-policy.md`?
- What license wording should be shown to portfolio reviewers so source availability is clear without implying clone-and-host permission?

Current direction:

- keep Angular as the frontend baseline unless a later plan proves it is blocking
- use shared TypeScript contracts as the main app-facing source of truth
- keep workflows language-flexible per source
- keep workflow YAML and host-specific handlers thin around locally runnable code
- bootstrap admin login with Vercel-managed credentials while persisting admin identity in the database
- use workflow-generated sample datasets for demo environments instead of exposing live internal data
- prefer concern-specific PR checks plus lightweight smoke checks over one monolithic CI job
- treat stock as location-connectable and offers as country-wide first, with room for later regional scope
- represent country-wide offer scope with `regionCode = null`
- treat store records as country-scoped at minimum, with a country-level no-region no-address store anchor per brand for the first country-wide stock model
- model composition through quantity plus unit, including percentage-style composition via `%`

## First Recommended Next Step

Review and approve the Stage 2 finalization plan:

- `.agents/plans/2026-06-23-finalize-stage-2-plan.md`

Implementation should not start until that plan is approved.
