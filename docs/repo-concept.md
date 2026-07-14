# Kamra Repository Concept

## Purpose

Kamra is a hobby grocery intelligence and optimization project.

The project aims to help users understand grocery prices across stores, search for products by intent, and eventually generate shopping plans that balance cost, store count, time, and distance.

The project also serves as a public reference for careful AI-assisted software delivery. The repository is source-available, the target deployment should remain free-tier friendly, and the MVP should be demonstrable for testing, portfolio, and job-application conversations without exposing private secrets or household data.

Kamra should stay independent: no advertising agenda, no seller-sponsored ranking, and no implied store endorsement.

## Product Direction

The lightweight household MVP closed on 2026-07-14. The active Phase 1 direction completes usability
across the same feature set: household-first terminology, compact Product discovery/linking,
high-throughput evidence review, a Shopping-list-first shop session, receipt-to-price/catalogue
reconciliation, and bounded crawl-data lifecycle management.

The system should eventually support:

- supermarket product and price ingestion
- offer and discount tracking
- canonical product identity across stores
- brand-agnostic product search
- household-focused user workspaces
- admin visibility into crawled and fetched product data
- shopping list generation
- multi-store optimization
- price history and comparison
- public demonstration with safe sample or controlled data
- Google account sign-in as a later auth extension

Future product directions should remain visible without becoming early scope:

- mobile-friendly shopping list use
- optimized shopping routes with a maximum number of shops
- preference modes such as quickest, cheapest, and best quality
- temporary product discovery for Lidl/Aldi-style limited offers
- user-submitted price updates from shop photos
- quick barcode and expiry-date scanning for household items
- comparison against common household staples to reveal missing basics
- suggestions for similar side-products or better offers than usual choices

## Audience And Collaboration

Expected early audience:

- the owner/admin
- a small number of trusted users
- one intermittent collaborator
- reviewers who may inspect the source-available repository as a work sample

The process should remain understandable to future agents and collaborators without relying on private conversation history.

## Core Domain Concepts

### Product

A canonical item that represents a real-world grocery product or product category.

Examples:

- BL55 wheat flour
- powdered sugar
- milk
- butter

### Store

A supermarket or shop source.

Initial examples from the existing code and notes:

- Lidl
- Aldi
- SPAR as a likely future source

### Store Product

A store-specific representation of a product, including source naming, URL, image, identifiers, and current or historical offer data.

### Offer

A time-bounded price, discount, or promotion associated with a store product.

### Price History

Historical price observations that allow comparison over time.

### Category And Tags

Flexible classification used for filtering, matching, constraints, and intent-based search.

### Intent Query

A user query that may not name an exact product.

Example:

- "flour" should find suitable flour options across stores even when names, brands, sizes, or source formats differ.

### User

A person using Kamra through an authenticated account.

For early product MVP planning, admin-controlled access and whitelisted registration are enough. Google account sign-in is useful later but should not block the household/product milestone.

Early user access should be controlled by the admin. Public registration is not open by default.

Current user profiles can store lightweight application preferences such as theme and language. Anonymous users can still set those preferences locally in the browser, but signing in should switch the app to the user's saved profile preferences.

### Household

A user-owned or user-shared workspace for grocery planning.

Users should primarily work inside households:

- adding items
- maintaining lists
- reviewing relevant products and offers
- eventually managing household inventory or fridge data

### Admin

An operator role for maintaining and inspecting the data pipeline.

Admins should be able to see crawled or fetched products, ingestion status, source issues, and product normalization state.

The admin surface is separate from the normal household-focused user experience.

Admins should also be able to create demo access by adding email addresses to a registration whitelist. A whitelisted person may register only with the whitelisted email address.

Whitelist entries should expire after 30 days if unused. When the whitelist feature is enabled, the system should send:

- an invitation email with a registration link when the entry is created
- an expiry email if the user did not register before the whitelist entry expired

This whitelist flow is feature-flagged. Email sending and whitelist cleanup cron must remain disabled until the feature flag is enabled.

## MVP Boundaries

The MVP is closed around the household product/stock, target, notice, and Shopping-list value loop.
Its final separate Shopping Trip/pricing/ingestion-review and Crawl Snapshot acceptance was moved to
Phase 1 because those experiences are being redesigned. The archived evidence is in
`scripts/mvp/stage11-mvp-manual-test.md`; the current closure target is defined in
`.agents/plans/phase-1-usability-completion-plan.md`.

Initial MVP should focus on:

- ingesting data from a small number of stores
- storing raw snapshots
- transforming snapshots into canonical product data
- querying products and offers
- filtering product offers by name and source
- admin-created demo users through a feature-flagged registration whitelist
- household-level item and list workflows
- low-stock, missing-item, and buy-before notices so users can avoid running out silently, starting with in-app notices
- admin review of crawled/fetched products
- explicit manual confirmation before crawled products create new catalog records or merge into existing products
- generating basic shopping-list recommendations
- keeping infrastructure low-cost and low-maintenance
- staying within free-tier limits for hosting, database, and scheduled jobs
- avoiding public registration or uncontrolled access

## Archived MVP Build Sequence

The completed MVP sequence was:

1. clean up and classify legacy code while preserving useful knowledge
2. prove MongoDB connectivity from a minimal Vercel deployment
3. add admin-only raw credential login with no public registration
4. finalize the first product, source-product, processing-state, and stock-location model contracts
5. add JSON validation, database smoke checks, migration-ledger direction, and synthetic seeded products
6. expose a minimal admin-only product list query so seeded products can be inspected in the deployed app
7. add one source-friendly crawler/fetcher and raw snapshot storage only after the model destination exists
8. process raw snapshots into queryable product data with traceable processing state
9. add households with multiple users and product or item tracking
10. generate shopping lists and low-stock notices from items below minimum limits
11. add controlled alpha/demo access after the household and shopping-list loop has value
12. add expiry dates, warning buffers, and buy-before notices
13. expand crawlers and improve product processing
14. add Google sign-in and richer auth only after the household/product MVP is useful

## Non-Goals For Early MVP

The early MVP should not attempt:

- full household inventory management beyond the first useful low-stock and expiry workflows
- OCR-based receipt or shelf scanning
- native mobile app workflows
- autonomous data correction without review
- advanced route optimization beyond simple constraints
- large-scale marketplace coverage
- multi-provider enterprise authentication
- complex role-management UI beyond basic user/admin needs
- paid infrastructure requirements
- advertisement-driven ranking or seller-sponsored recommendations
- public write access to production data

## Future Extensions

Likely future work:

The core goal immediately after Phase 1 is household price intelligence: estimate the expected cost
of an open Shopping list, then offer configurable and explainable savings suggestions such as a
compatible alternative Product or another shop with a current discount. Suggestions must expose
price freshness, offer conditions, expected savings, and compatibility reasoning; they must not be
advertising-driven or silently rewrite household choices.

- OCR-based price scanning
- household pantry and fridge tracking
- expiry-date tracking
- barcode and expiry-date quick scan for existing household items
- user-submitted price observations from shop photos
- temporary product discovery for limited-time store offers
- household baseline comparison to suggest commonly missing staples
- side-product suggestions when similar products have better offers
- manual enrichment workflows
- richer admin moderation and product merge tools
- richer identity-resolution tooling
- richer user-specific preferences beyond the current theme and language settings
- mobile app or installable PWA shopping-list experience
- broader route optimization with max-shop constraints, distance, travel time, price, and quality
  preferences after the household price-intelligence step is trustworthy

## Current Repository Reality

The existing repository already contains useful historical implementation work:

- ASP.NET Core API
- Angular frontend
- SQL Server data model through Entity Framework
- MongoDB connector projects
- crawler infrastructure
- Lidl and Aldi crawler samples

This code is runtime truth, but it is not automatically the target architecture. Future plans should decide what to reuse, migrate, replace, or retire.
