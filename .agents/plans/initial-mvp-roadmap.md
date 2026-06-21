# Initial MVP Roadmap

Status: Draft

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
- GitHub Actions cron jobs for ingestion
- raw snapshots before processed product data
- no public registration initially
- admin-only raw credential login first
- admin view for crawled/fetched products
- processed product pipeline before demo users
- feature-flagged admin whitelist for demo user registration
- household workflows for normal users
- Google account sign-in as a later authentication extension
- source-available public repository with secrets and private runtime data excluded
- likely one collaborator, with the process still working if collaboration is intermittent

## Guiding Constraints

- Keep legacy code available until useful knowledge is extracted.
- Do not extend the old backend by default.
- Prefer small stages that prove one thing at a time.
- Preserve raw crawl snapshots before transforming data.
- Keep product query data separate from price history.
- Add collated/current values only where they reduce common query cost.
- Discuss data model details during the relevant planning session before implementation.
- Prefer free-tier services and designs that remain demonstrable without ongoing hosting cost.
- Keep source-available public code clean enough to serve as a portfolio reference.
- Treat security, secrets, and abuse prevention as MVP concerns because the repository is public.
- Keep contributor workflow lightweight enough for one intermittent collaborator.
- Keep crawler behavior source-friendly and easy to disable.
- Keep recommendations independent from advertisements, seller sponsorship, or store agenda.

## Stage 1: Legacy Inventory And Extraction

Goal:

- Classify the current codebase before deleting, rewriting, or porting anything.

Expected output:

- fuller `docs/codebase-analysis.md`
- extraction notes for useful models, crawler patterns, selectors, and mapping ideas
- list of code to keep temporarily as reference
- list of code that can become legacy/archive

Questions:

- Archive legacy code in-place, move it under a legacy folder, or keep it untouched until the new MVP runs?
- Which current entities should influence the first MongoDB schema?
- Which crawler code should be reused versus treated as reference?

## Stage 2: Minimal Serverless Foundation

Goal:

- Create the smallest deployed application that proves Vercel to MongoDB connectivity.

Scope slice:

- frontend deployed on Vercel
- raw admin credential login only
- no public registration
- API healthcheck route
- healthcheck connects to MongoDB and reports safe status
- MongoDB connection finalized for local and deployed environments

Validation:

- local healthcheck works
- deployed healthcheck works
- secrets are not committed
- unauthorized users cannot access admin-only surfaces
- free-tier limits are documented
- demo behavior does not expose private data

Questions:

- Next.js on Vercel, minimal Vercel app, or another frontend/serverless framework?
- Temporary admin credentials in Vercel env vars, MongoDB admin document, or external auth provider from the start?

## Stage 3: First Simple Ingestion Job

Goal:

- Add one simple scheduled ingestion path.

Scope slice:

- one GitHub Actions cron job
- one simple crawler/fetcher
- raw snapshot collection in MongoDB
- run metadata
- admin view showing crawled/fetched products or raw rows

Validation:

- manual workflow dispatch works
- scheduled workflow is defined
- raw snapshot preserves source truth
- admin can inspect the latest run
- cron frequency stays within free-tier and source-friendly limits

Questions:

- First source: existing Lidl sample, existing Aldi sample, SPAR, or a deliberately simpler stable source?
- Runtime: TypeScript/Playwright, .NET reuse, or lightweight fetch/parser first?

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

Validation:

- raw-to-processed trace exists
- price observations can be tracked over time
- product queries do not need full price history by default
- snapshot or fixture tests protect stable transformation output

## Stage 5: Feature-Flagged Demo User Whitelist

Goal:

- Let the admin create controlled demo-user access after there is processed product data worth demonstrating.

Scope slice:

- feature flag for whitelist registration
- admin can add email addresses to a registration whitelist
- whitelisted users can register only with the whitelisted email
- whitelist entries expire after 30 days if unused
- invitation email is sent when a whitelist entry is created
- expiry email is sent if the user did not register before expiry
- email sending and cleanup cron stay disabled until the whitelist feature flag is enabled

Validation:

- registration fails for non-whitelisted emails
- registration succeeds for a valid whitelisted email
- expired whitelist entries cannot be used
- emails are not sent while the feature flag is disabled
- cleanup cron does not run while the feature flag is disabled
- audit metadata records who created the whitelist entry

Questions:

- Should the first email provider be a real free-tier provider, a console/log adapter, or a no-op adapter until the flag is enabled?
- Should whitelist links be single-use tokens or email-only checks for the first implementation?

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

## Stage 9: Crawler Expansion

Goal:

- Add more sources and improve processing quality.

Scope:

- additional crawlers
- better normalization
- identity resolution
- admin moderation for uncertain matches
- richer price history
- limited-offer product discovery

Validation:

- each source has raw snapshots
- source-specific parsing is isolated
- canonical matching remains traceable
- admin can inspect uncertain product mappings

## Stage 10: Authentication Upgrade

Goal:

- Add Google account sign-in as a final authentication extension after the household/product MVP is already useful.

Scope:

- Google auth
- no public registration beyond allowed sign-in rules
- admin allowlist or role assignment
- normal user role

Validation:

- unauthorized users cannot register into useful access
- admin access remains protected
- user identity remains linkable to household membership
- existing admin and whitelist flows keep working

## Cross-Cutting Data Questions

Ask during the relevant planning sessions:

- Which legacy entities should influence MongoDB documents?
- Which properties should exist early even if initially empty?
- Which values should be collated into query documents?
- Which values must remain historical only?
- How should units and package sizes be represented?
- How should uncertain product identity matches be represented?
- What snapshot granularity is enough for price history and debugging?
- What admin actions are needed before automatic product merging is trusted?

## Cross-Cutting Product And Ops Questions

Ask during the relevant planning sessions:

- What should public demo users be able to see without risking private household data?
- Should the deployed demo have sample data, real crawled data, or both?
- What usage limits are needed to stay inside free-tier boundaries?
- What feature flags must remain off in public/demo deployments?
- What should be documented for job-application reviewers?
- What contributor workflow is enough for one intermittent collaborator?
- Which practices belong in global agent settings or reusable skills instead of this repo?
- Which crawler sources are acceptable under `docs/crawler-policy.md`?
- What license wording should be shown to portfolio reviewers so source availability is clear without implying clone-and-host permission?

## Post-MVP Horizons

Keep these visible as direction, but out of the first product MVP unless a later plan explicitly promotes them:

- mobile app or installable PWA shopping-list experience
- route optimization with max-shop constraints and preferences for quickest, cheapest, or best quality
- user-submitted price updates from shop photos
- quick barcode and expiry-date scanning for existing household items
- discovery of temporary Lidl/Aldi-style products
- household baseline comparison to show commonly missing staples
- similar or side-product recommendations when better offers exist
- stronger quality, brand, dietary, and preference modeling

## First Recommended Next Step

After markdown review, create the Stage 1 plan:

- inventory current code
- classify useful legacy knowledge
- decide what to archive or keep as reference
- identify first MongoDB schema draft inputs

Implementation should not start until that plan is approved.
