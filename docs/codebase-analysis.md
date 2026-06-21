# Codebase Analysis

## Purpose

This is the first lightweight analysis of the existing Kamra repository.

It is not a full refactor plan. It exists to make current runtime reality visible before future planning.

## Current Repository Shape

The repository contains several solution areas:

- `KamraBE/`: ASP.NET Core API, business services, Entity Framework data access
- `Common/`: shared models, entities, MongoDB connector, utilities
- `Crawler/`: base crawler infrastructure and sample Lidl/Aldi crawlers
- `Fetcher/`: fetcher project
- `kamra-fe/`: Angular frontend
- `.github/workflows/`: existing workflow files

The Visual Studio solutions (`ALL.sln`, `KamraBE.sln`, `Common.sln`, `Crawler.sln`, `Fetcher.sln`) reflect a prototype-era split between API, persistence, crawler, fetcher, and shared-model work. They are useful for discovery, but they are not aligned with the intended serverless-first runtime shape.

## Current Runtime Signals

### Backend API

`KamraBE/KamraAPI/Program.cs` configures:

- ASP.NET Core controllers
- JWT authentication
- Swagger in development
- CORS for local Angular development
- Entity Framework `ApplicationDbContext`
- SQL Server connection string named `test`

The API is a persistent ASP.NET Core server, not a stateless serverless boundary. Its current auth flow is also tightly coupled to SQL-backed users and direct JWT issuance.

### Relational Data Model

`KamraBE/DataAccess/Data/ApplicationDbContext.cs` defines tables for:

- elements
- components
- tags
- property values
- stock
- households
- stores
- users
- shops

It seeds Lidl and Aldi shops.

This model captures several durable domain ideas, but the runtime choice itself is legacy:

- `Element` is the closest current concept to a canonical product
- `Stock` mixes household inventory and store offer concerns
- `Component` models parent-child composition with a `Ratio`
- `Tag`, `Element2Tag`, `Property`, and `PropertyValue` model flexible classification and typed attributes
- `Household` exists only as a minimal placeholder
- `User` and auth are prototype-level and should not be carried forward as-is

### MongoDB Usage

`Common/MongoDbConnector/MongoDbConnector.cs` initializes MongoDB using appsettings plus user secrets.

Crawler infrastructure writes product, offer, link, and log collections through Mongo repositories.

The connector and repository layer show useful operational ideas:

- raw-ish source records and logs were already persisted separately from SQL entities
- product and offer records carry migration and fault flags
- offer persistence already treats time-bounded observations differently from product records

This is still not the target persistence model, because it was designed as support infrastructure around the .NET prototype instead of a clean serverless data contract.

### Crawlers

`Crawler/Base/BaseCrawler/Crawler.cs` contains Playwright-based crawling infrastructure with:

- selectors
- readers
- processors
- product and offer pipelines
- MongoDB persistence
- log handling

Sample crawlers exist for Lidl and Aldi.

The crawler layer is the strongest reusable legacy asset in the repository. It already separates:

- source selectors from generic crawl orchestration
- link collection from detail-page processing
- HTML extraction from JSON extraction
- product records from offer records
- crawl logs from product/offer data

The current implementation is still legacy in several ways:

- collection names are store-specific and pipeline-owned rather than centered on durable raw snapshot contracts
- crawl runs are not modeled as first-class ingestion runs
- the crawler writes transformed store records directly instead of preserving a clearer immutable raw snapshot boundary
- it depends on a custom .NET runtime packaging model rather than GitHub Actions workflow packaging

### Fetcher

`Fetcher/Instance/Fetcher.cs` reads crawler-written Mongo records and uploads them into the ASP.NET API through DTO mappers.

This project is best treated as a migration bridge, not as future architecture:

- it exists to sync Mongo crawler output into the SQL/API world
- it duplicates validation and migration-state handling
- it hardcodes a localhost API endpoint
- it carries broad exception swallowing that should not be preserved

The main future value is conceptual:

- migration batches and migration-state metadata were considered explicitly
- mapper boundaries between persistence shapes and API shapes are still a useful idea

### Frontend

`kamra-fe/package.json` indicates Angular 14 with Bootstrap and ngx-translate.

The current frontend is small, but not throwaway. It already contains:

- a login/signup shell with a simple auth-main switcher
- reactive forms for login and registration
- an auth interceptor that attaches bearer tokens
- localization plumbing through `@ngx-translate/core`
- language selection wired through `AppComponent`

The current weaknesses are implementation-specific, not architectural blockers:

- routes are not yet used meaningfully
- auth success/failure UX is minimal
- environment handling is still local-backend oriented
- the current API surface points at the legacy ASP.NET server

## Durable Legacy Concepts Worth Keeping

### Domain Concepts

Worth preserving as future TypeScript model inputs:

- canonical product versus store-specific product distinction
- household as a first-class workspace
- product composition through parent/child relationships
- flexible tags plus weighted tag assignment
- typed property/value-list concepts for extensible metadata
- time-bounded offer or price observations

Concepts to preserve carefully but redesign:

- `Component.Ratio` is useful as a signal that products can contain other products, but it is too narrow to assume every composition is ratio-only
- `Stock` currently overloads store offers and household inventory; future Mongo models should split those concerns
- `PropertyValue` proves the need for typed/extensible attributes, but its composite relational key should not be copied directly

Composition should stay visible as a first-class product-model concern. A future product, element, or item model will likely need to express that one thing can contain or be made of other things, even if the exact representation moves beyond the current parent-child-plus-ratio design.

Tags should also be treated as more than display labels. The legacy model hints at a future elastic-search and intent-search role where product terms or attributes such as `Bio`, `Tej`, and possibly even `3,8%` can participate in search, matching, filtering, and later ranking behavior.

The legacy tag idea is probably heading toward two related concepts:

- system-owned normalized search signals that drive matching and search behavior
- future user-owned custom tags that remain visible in the UI but are distinguishable in storage and behavior

### Mapping Boundaries

The `ToDto`, `ToModel`, and `ToMongoDto` mapper pattern is worth carrying forward in spirit:

- keep clear translation boundaries when crossing between raw snapshots, normalized store records, canonical products, query documents, and API responses
- avoid unnecessary 1:1 DTO duplication when a shared TypeScript contract is sufficient
- still allow explicit mapping layers when auth, admin actions, ingestion payloads, or public API stability require them

### Crawler Patterns

Worth preserving:

- per-source selector configuration
- generic crawl orchestration
- attribute-driven field extraction ideas
- separate product and offer pipelines
- link deduplication
- update-only marked fields for partial refresh
- logging as a first-class output

Need redesign before reuse:

- direct writes into final collections instead of immutable raw snapshots
- runtime ownership inside .NET projects instead of workflow jobs
- limited run metadata
- weak failure typing and broad catch blocks in some paths

### Frontend Patterns

Worth preserving:

- Angular as the current frontend baseline
- login/signup UI structure as a starting point for Stage 2 auth work
- ngx-translate-based localization support
- auth interceptor concept

Need redesign:

- routes and view composition
- auth/session lifecycle
- integration with future serverless API routes
- environment and deployment wiring

## Keep / Reference / Retire Guidance

### Keep As Direct Reference During Migration

- `kamra-fe/` login, signup, auth shell, and localization plumbing
- `Crawler/Base/` orchestration, selector, processor, and pipeline concepts
- `Crawler/Sample/` Lidl and Aldi selectors and parsing examples
- `Common/Models/Entities/` as domain-reference material
- `Common/Models/Mapper/` as mapper-pattern reference
- `Common/MongoDbConnector/` for legacy collection and repository ideas only
- SQL migration files as historical schema evidence

### Retain Only As Legacy Reference

- `KamraBE/` API controllers and business services
- `KamraBE/DataAccess/` EF Core context and migrations
- `Fetcher/` Mongo-to-API bridge
- `.github/workflows/auto_push_*` repository automation workflows
- solution files that exist only to organize the .NET prototype

### Safe To Retire From Future Runtime

- EF Core and SQL Server as application runtime dependencies
- ASP.NET Core as the default MVP server runtime
- crawler registration through the legacy backend
- fetcher-driven migration into SQL-backed endpoints

## First-Pass Target Direction Derived From Legacy Reality

The legacy code suggests a clearer target direction than the initial bootstrap docs could state confidently:

- keep Angular unless deployment or maintenance friction proves it is a blocker
- move backend runtime work to Node.js and TypeScript for serverless API routes
- define shared TypeScript contracts for canonical models that frontend and server can both consume
- generate language-agnostic contract artifacts for workflow jobs so ingestion is not forced into TypeScript
- keep a migrations ledger in MongoDB even after EF Core is removed
- treat workflow jobs as the replacement for crawler registration and long-running backend infrastructure
- bootstrap admin login with Vercel-managed credentials, but keep the admin identity itself in the database
- maintain separate real and demo data environments, with demo data built from workflow-generated sample output rather than live internal data exposure

Workflow runtime should stay pragmatic per job. JavaScript or TypeScript is the most consistent default with the planned app stack, but Python or even C# can still be acceptable for individual crawlers or transformation jobs when the source or tooling fit is clearly better.

## Main Structural Risks

- mixing household inventory concerns with store-offer concerns again in the new Mongo model
- over-reusing relational entity shapes that were optimized for EF rather than document storage
- copying source-specific crawler outputs directly into user-query collections
- replacing explicit mapper boundaries with uncontrolled shared models everywhere
- deleting legacy code before its domain ideas and parsing patterns are captured durably
- assuming Angular must be replaced before there is evidence it blocks the MVP

## Recommended Next Planning Step

Use `.agents/plans/initial-mvp-roadmap.md` as the active direction.

The next concrete implementation plan after this inventory should cover the first serverless foundation slice:

- Angular deployment path on Vercel
- Node.js and TypeScript API surface
- shared model-contract strategy
- MongoDB connection and migration-ledger setup
- admin-only auth path derived from the current login shell without reusing the old backend
