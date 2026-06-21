# Kamra Architecture

## Purpose

This document describes the intended Kamra architecture.

It should be read together with `docs/codebase-analysis.md`, because the current codebase contains legacy or prototype structures that do not fully match this target.

## Target Model

Kamra is intended to use a serverless-first architecture:

- frontend hosted on Vercel
- stateless API routes for query and lightweight orchestration
- MongoDB Atlas as the managed data store
- GitHub Actions for ingestion and transformation jobs
- user-facing household workflows separate from admin/operator workflows
- free-tier friendly operation for demo, testing, and portfolio/reference use
- Google account authentication as a later extension, not a household/product MVP blocker
- independent recommendations with no advertisement or seller agenda
- pull requests for reviewed delivery

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

Expected business failures should use Result-style responses or an equivalent explicit convention instead of exceptions as control flow. Exceptions should represent unexpected or infrastructure failures.

### Ingestion Layer

Responsibilities:

- collect source data from stores
- run per-store adapters
- capture raw snapshots
- record source metadata and run metadata
- honor `docs/crawler-policy.md` for source review, rate limits, and disablement

Ingestion should run through GitHub Actions or equivalent event-driven batch execution.

### Transformation Layer

Responsibilities:

- normalize raw source data
- deduplicate records
- resolve product identity
- create canonical product documents
- update materialized query collections

Transformations should be deterministic and reproducible from raw snapshots.

Swappable transformation behavior should be modeled as injected strategies where it helps keep crawlers, parsers, normalizers, and matchers replaceable without broad rewrites.

### Persistence Layer

Responsibilities:

- store raw snapshots
- store canonical product catalog
- store store-product mappings
- store offer and price history
- store transformation metadata
- store users, households, memberships, and household items
- store admin review state for crawled or fetched products where needed
- store registration whitelist entries with email, expiry, status, and audit metadata

MongoDB Atlas is the target MVP persistence layer.

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
- transformation output must trace back to source snapshots
- current/collated values may be duplicated where they avoid frequent expensive calculations
- obvious future fields may exist empty when they prevent disruptive schema churn later
- uncertain matches should be represented explicitly, not hidden as confident canonical products

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
