# Kamra Architecture

## Purpose

This document describes the intended Kamra architecture.

For legacy reference notes, see `docs/codebase-analysis.md`, although current architecture has little to gain; some design concepts may be useful for evolving the successor structure.

## Target Model

Kamra is intended to use a serverless-first architecture:

- Angular frontend hosted on Vercel unless a later approved plan changes the frontend framework
- Node.js and TypeScript stateless API routes for query and lightweight orchestration
- MongoDB Atlas as the managed data store
- separate real and demo data environments, with demo data produced from workflow-built samples rather than direct live-database exposure
- GitHub Actions for ingestion and transformation jobs
- thin platform adapters so hosting, serverless entrypoints, and workflow orchestration stay replaceable
- user-facing household workflows separate from admin/operator workflows
- free-tier friendly operation for demo, testing, and portfolio/reference use
- Google account authentication as a later extension, not a household/product MVP blocker
- independent recommendations with no advertisement or seller agenda
- pull requests for reviewed delivery

## Application Concern Modules

Kamra should keep four product concerns separate even while the early navigation remains simple:

- Product lookup: a public or role-gated product checking surface, similar in purpose to an arukereso-style product search and comparison platform.
- Household management: normal user workflows for household membership, household stock, shopping lists, low-stock notices, and later expiry/buy-before behavior.
- Site administration: operator workflows for product identity review, merge candidates, source-product maintenance, offer or stock staleness, and ingestion visibility.
- Developer administration: restricted diagnostics for health checks, database smoke status, migration ledgers, seed state, user insight summaries, and operational troubleshooting.

The eventual UI may use four corner mini drawers or floating bubble launchers for these modules, but that is not required before the modules have useful screens. Until then, navigation should still group routes by these boundaries so access rules and product intent do not blur.

## Layers

### Frontend Layer

Responsibilities:

- product search UI
- shopping list UI
- household item and list management UI
- low-stock, missing-item, and buy-before notice UI
- optimization preferences
- display of offers, stores, and price comparisons
- sign-in and account session UI
- admin dashboard UI for operators
- admin whitelist management UI when the whitelist feature is enabled

The frontend should not own business-critical product matching or ingestion logic.

User-facing screens should focus on household workflows. Admin screens should focus on ingestion visibility, crawled/fetched product review, and data maintenance.

Frontend localization should be treated as an early MVP concern, not a later polish item.
Default application resources should come from files for stable content such as category labels, product names, and shell copy, while site-admin-managed database overrides can gradually fill in runtime translations and missing values.

### API Layer

Responsibilities:

- read canonical product data
- expose product and offer query endpoints
- generate lightweight shopping list results
- generate low-stock and buy-before notice results
- apply user request constraints
- enforce authentication and authorization
- separate household user access from admin access
- enforce registration whitelist checks when public self-registration is disabled
- send invitation and expiry emails only when the whitelist feature is enabled

API routes must remain stateless and should not perform crawling or long-running transformations.

Host-specific handler glue should stay small. The core request, auth, and domain logic should be runnable and testable outside Vercel-specific entrypoints so a future move to another serverless platform stays low-friction.

Expected business failures should use Result-style responses or an equivalent explicit convention instead of exceptions as control flow. Exceptions should represent unexpected or infrastructure failures.

When frontend and API shapes are genuinely the same, prefer shared TypeScript contracts instead of duplicative 1:1 DTOs. Use explicit mapping layers where auth, admin actions, raw snapshots, or public API boundaries differ.

The initial admin-only login can be bootstrapped with Vercel-managed credentials or secrets, but the authenticated admin identity should still map to a database record so roles, auditing, and future expansion remain data-driven.

### Ingestion Layer

Responsibilities:

- collect source data from stores
- run per-store adapters
- capture raw snapshots
- record source metadata and run metadata
- honor `docs/crawler-policy.md` for source review, rate limits, and disablement

Ingestion should run through GitHub Actions or equivalent event-driven batch execution.

Workflow files should remain thin orchestrators around checked-in scripts or modules. Source adapters, parsing, normalization, and transformation logic should live in locally runnable code rather than inside large workflow YAML files.

Workflows do not need to be limited to TypeScript. The model contract should still be consumable from non-TypeScript jobs through generated artifacts or another explicit compatibility layer.

Shared contracts should ideally produce both JSON Schema and OpenAPI artifacts when that remains cheap enough to maintain.

### Transformation Layer

Responsibilities:

- normalize raw source data
- deduplicate records
- resolve product identity
- partition availability and pricing by country and, where known, by region or store scope
- create canonical product documents
- update materialized query collections
- run standardized maintenance processors for merge candidates, stale records, and other data hygiene tasks

Transformations should be deterministic and reproducible from raw snapshots.

Swappable transformation behavior should be modeled as injected strategies where it helps keep crawlers, parsers, normalizers, and matchers replaceable without broad rewrites.

### Persistence Layer

Responsibilities:

- store raw snapshots
- store canonical product catalog
- store store-product mappings
- store offer and price history
- store transformation metadata
- store country and geographic offer scope metadata
- store users, households, memberships, and household items
- store admin review state for crawled or fetched products where needed
- store registration whitelist entries with email, expiry, status, and audit metadata

MongoDB Atlas is the target MVP persistence layer.

Even without EF Core, the persistence layer should include a migration-ledger concept so scripted document-shape changes can be tracked and applied safely.

## Access Model

Expected access boundaries:

- unauthenticated visitors may only access public or sign-in surfaces
- registration succeeds only for allowed identities, initially through admin-created whitelist entries
- authenticated users access their own household data
- household members may access shared household lists and items according to membership rules
- admins can inspect crawled/fetched products and ingestion state
- ingestion jobs write raw and transformed data through controlled credentials

Google account sign-in is an expected later authentication direction, but the household/product MVP can operate with admin-controlled and whitelisted access.

## Feature Flags

The whitelist registration feature must be behind a feature flag.

When disabled:

- admins may not trigger automatic invitation emails
- whitelist cleanup cron must not run
- registration remains closed except for the currently approved admin-only path

When enabled:

- admins can add email addresses to the whitelist
- invitation email is sent with a registration link
- unused whitelist entries expire after 30 days
- expiry email is sent if the person did not register

### Query Layer

Responsibilities:

- product search
- category filtering
- tag and constraint filtering
- intent-based product lookup
- price and offer lookup

Query logic should use canonical data, not raw crawler output directly.

Tags should be modeled so they can evolve into elastic-search inputs, synonym anchors, and intent-matching hints instead of remaining passive labels only.

### Optimization Layer

Responsibilities:

- generate shopping list options
- warn when household items are below desired limits
- compare store combinations
- apply max-store preferences
- balance cost, distance, and time once those inputs exist

Early optimization may be intentionally simple.

## Data Lifecycle

```text
External source
  -> ingestion adapter
  -> raw snapshot
  -> normalization
  -> canonical product catalog
  -> store product and price observations
  -> query model
  -> API route
  -> frontend
  -> shopping decision or generated list
```

## Data Modeling Principles

- raw crawled/fetched snapshots are preserved before processing
- processed products are optimized for common product queries
- price history is stored separately from product query documents
- store-specific products stay separate from canonical product identity
- country-specific assortment and pricing stay separate, even when products appear similar across countries
- transformation output must trace back to source snapshots
- current/collated values may be duplicated where they avoid frequent expensive calculations
- obvious future fields may exist empty when they prevent disruptive schema churn later
- uncertain matches should be represented explicitly, not hidden as confident canonical products
- uncertain store-product identity should remain unlinked until verified by stronger evidence or explicit review
- household inventory concepts should stay separate from store-offer observations even if they share some fields
- shared contracts should be designed for reuse by frontend and API first, with generated compatibility for workflow runtimes where needed
- composition should be modeled explicitly so compound products or household items can reference their parts
- composition should support quantity plus unit, with ratio represented through the same model instead of a special unrelated relation shape
- tags should remain queryable and normalization-friendly so later elastic or intent-based search can use them directly
- system-provided search signals and future user-created tags should remain distinguishable in the data model even if the frontend presents them in a shared visual cloud
- stock or availability records should be location-connectable from the beginning
- offer scope should support country-wide coverage first, with room for later regional scope where sources require it
- country-wide offers should use `regionCode = null`, while regional offers can set a concrete `regionCode`
- store records should always carry `countryCode`
- each brand should be able to have a country-level store record without region or address so country-wide starter data has a simple store anchor
- unit data should preserve all useful measurable dimensions instead of collapsing them too early
- products may legitimately carry multiple comparable quantity signals such as volume and weight at the same time

The exact MongoDB document model should be decided in its own planning session before implementation.

## Module Boundary Rules

- ingestion does not serve user requests
- API routes do not crawl
- expected domain and validation failures are returned explicitly instead of thrown as ordinary control flow
- auth and authorization checks are enforced before user-owned data access
- feature-flagged workflows do not run background jobs or send emails while disabled
- transformation does not depend on frontend state
- canonical products remain separate from store-specific products
- raw snapshots remain separate from transformed records
- admin product review remains separate from household user workflows
- optimization consumes queryable canonical data

## Operational Guardrails

- public demo behavior must not expose private household data
- crawler schedules should respect free-tier quotas and source friendliness
- crawler sources must be reviewed against `docs/crawler-policy.md` before enablement
- source-available public code must not require committed secrets or private data exports
- recommendations must not be advertisement-driven or seller-sponsored unless the project concept is explicitly revised
- architecture choices should remain understandable to one intermittent collaborator

## Current Migration Tension

The repository currently includes ASP.NET Core, Entity Framework, SQL Server migrations, Angular, MongoDB connector code, and Playwright crawlers.

Future plans should treat those as existing assets to evaluate. They should not assume that preserving every current project is required for the MVP.
