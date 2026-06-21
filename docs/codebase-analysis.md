# Initial Codebase Analysis

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

## Current Runtime Signals

### Backend API

`KamraBE/KamraAPI/Program.cs` configures:

- ASP.NET Core controllers
- JWT authentication
- Swagger in development
- CORS for local Angular development
- Entity Framework `ApplicationDbContext`
- SQL Server connection string named `test`

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

### MongoDB Usage

`Common/MongoDbConnector/MongoDbConnector.cs` initializes MongoDB using appsettings plus user secrets.

Crawler infrastructure writes product, offer, link, and log collections through Mongo repositories.

### Crawlers

`Crawler/Base/BaseCrawler/Crawler.cs` contains Playwright-based crawling infrastructure with:

- selectors
- readers
- processors
- product and offer pipelines
- MongoDB persistence
- log handling

Sample crawlers exist for Lidl and Aldi.

### Frontend

`kamra-fe/package.json` indicates Angular 14 with Bootstrap and ngx-translate.

## Alignment With Target Direction

Already aligned or reusable:

- grocery product and offer domain exists
- Lidl and Aldi sources already exist
- MongoDB connector exists
- crawler abstraction exists
- frontend exists
- GitHub workflows already exist

Not yet aligned:

- current API is a persistent ASP.NET Core server, while target is serverless API routes
- current API uses SQL Server through Entity Framework, while target data layer is MongoDB Atlas
- crawler execution is code-level infrastructure, not yet packaged as GitHub Actions ingestion jobs
- canonical product identity resolution is not clearly separated as a deterministic transformation layer
- current frontend target framework has not been confirmed for the serverless MVP

## Main Structural Risks

- two persistence models may cause confusion: SQL Server entities and MongoDB records
- crawlers may write directly to collections without a clearly versioned raw snapshot model
- canonical product identity may be mixed with store-specific product data
- current API service layer may encourage extending the legacy backend instead of planning the serverless target
- workflows may exist but not yet represent the intended ingestion and transformation lifecycle

## Recommended Next Planning Step

Use `.agents/plans/initial-mvp-roadmap.md` as the active direction.

The next concrete plan should cover Stage 1 of the active roadmap: legacy inventory and extraction.

That plan should decide:

- what current code is retained
- what current code becomes reference material
- what is migrated toward serverless
- what is retired
- what first foundation slice proves the new architecture before the household/product MVP
