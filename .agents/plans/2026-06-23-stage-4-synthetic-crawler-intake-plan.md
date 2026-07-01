# Stage 4 Synthetic Crawler Intake Plan

Status: Active, being revised after initial ingestion sources landed

## Objective

Plan Stage 4 crawler intake around controlled sources first, then extend into reviewed real-source offer crawlers:

- `SimpleHtmlTableShop`: a synthetic Hungarian shop page with a stable HTML product table, HUF prices, country-wide availability, and effectively infinite stock.
- `SimplePdfShop`: a synthetic Hungarian shop PDF with similar product and price content.
- real Hungarian retailer offer sources, currently PENNY, ALDI, and COOP raw ingestion.
- next planned real sources: Tesco Zirc supermarket static/location offer page, then Lidl PDF/brochure ingestion when PDF processing is ready.

The goal is to prove ingestion, raw snapshots, processing, workflow orchestration, tests, and admin/operator visibility before relying on broad crawling or public product lookup value.

## Context Read

- `AGENTS.md`
- `.agents/planning-workflow.md`
- `.agents/coding-guidelines.md`
- `.agents/plan-template.md`
- `.agents/plans/initial-mvp-roadmap.md`
- `docs/architecture.md`
- `docs/tech-ops.md`
- `docs/crawler-policy.md`
- `docs/codebase-analysis.md`
- `docs/logging.md`
- `.agents/learnings/crawler-source-research.md`
- `.agents/learnings/crawler-pipeline-patterns.md`
- `packages/kamra-api-server/AGENTS.md`
- `api/AGENTS.md`
- `packages/kamra-api-server/src/catalog/README.md`
- `packages/kamra-api-server/src/catalog/v1/contracts.ts`
- `packages/kamra-api-server/src/catalog/v1/schemas.ts`
- `packages/kamra-api-server/src/catalog/current/mongo-catalog-repository.ts`
- `scripts/catalog-smoke.ts`
- `.github/workflows/catalog-smoke.yml`
- `package.json`
- `tsconfig.api.json`
- `vitest.config.ts`

Repository state check:

- `git -c safe.directory=D:/Code/Kamra status --short` was clean before this plan file was added.
- 2026-07-01 documentation refresh found a clean worktree before updates.

## Research Gate

Needed because Stage 4 touches crawler policy, workflow scheduling, MongoDB validation, parser tooling, and PDF extraction behavior.

Durable crawler-source research is captured in `.agents/learnings/crawler-source-research.md`. Stage 4 should be considered planning-complete only after checking that learning note for the latest synthetic-source guidance, real-source scouting notes, acquisition preference, and source-review checklist.

Primary/current sources checked:

- IETF RFC 9309, Robots Exclusion Protocol: robots rules are crawler instructions, not authorization, and crawlers should use identifiable user-agent behavior, longest-match rule handling, and clear handling of allow/disallow rules. Source: https://datatracker.ietf.org/doc/html/rfc9309
- GitHub Actions events: `workflow_dispatch` is the right first trigger for manual ingestion; scheduled workflows run on the default branch, may be delayed or dropped at high-load times, and should not be the first proof path. Source: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- GitHub Actions billing and usage: public repositories can use standard GitHub-hosted runners for free, but usage still has limits and policy constraints. Source: https://docs.github.com/en/actions/concepts/billing-and-usage
- GitHub Actions secure use: secrets need least privilege, token permissions should be restricted, and untrusted values should not be interpolated directly into shell scripts. Source: https://docs.github.com/en/actions/reference/security/secure-use
- MongoDB `db.createCollection()`: collection validators, `validationLevel: "strict"`, and `validationAction: "error"` align with the Stage 3 schema approach. Source: https://www.mongodb.com/docs/manual/reference/method/db.createcollection/
- Cheerio docs: Cheerio is suitable for parsing static HTML strings and selecting table content, but it does not execute JavaScript or render pages. Source: https://cheerio.js.org/docs/intro/
- PDF.js examples: PDF parsing is promise-based, can load documents and pages, and has Node examples, but extracting text from PDFs should be treated as document parsing rather than reliable DOM-style table access. Source: https://mozilla.github.io/pdf.js/examples/
- PDFKit docs: PDFKit can generate Node PDFs as streams, which is useful for deterministic synthetic PDF fixtures. Source: https://pdfkit.org/docs/getting_started.html
- Playwright CI docs: Playwright remains a later option for JavaScript-rendered real sources, but it adds browser runtime weight and is not needed for the first static HTML table source. Source: https://playwright.dev/docs/ci-intro

Real Hungarian retailer scouting captured in the learning note:

- PENNY Hungary is the recommended first real-source candidate after synthetic sources because its public offers page exposed product names, package sizes, validity dates, current prices, old prices, and unit prices in static page text.
- ALDI Hungary is the recommended second candidate because its public offers page exposed product listings, validity windows, unit prices, and `Cikkszám` item numbers. The Roksh-powered `shop.aldi.hu` storefront exposes public-app API endpoints in its JavaScript bundle, but those should be treated as internal/public-app APIs requiring policy and terms review before use.
- COOP Hungary is a smaller static HTML backup candidate.
- SPAR Hungary exposed useful offer text but looked less consistently structured for headline price extraction.
- Lidl Hungary has clear offer and brochure paths, but static product-offer extraction was not obvious during research; defer until PDF, browser automation, or official/API-source investigation is justified.

Decision impact:

- Stage 4 should begin with file/local synthetic source adapters, not live network crawlers.
- The first workflow should be manually dispatched, not scheduled.
- Workflow YAML should remain a thin wrapper around checked-in scripts.
- Raw source snapshots and ingestion run records should be modeled explicitly before processing into `catalog_v1`.
- Static HTML parsing should use a real parser such as Cheerio instead of ad hoc string splitting.
- PDF work should start with a deterministic PDF generated from known content, then parse the extracted text into a controlled intermediate shape. It should not claim general PDF table support.
- Playwright should be deferred until a real source requires JavaScript rendering.

Remaining uncertainty:

- The exact PDF parser package should be selected during implementation after checking Node 24 and ESM compatibility. `pdfjs-dist` is the leading candidate because PDF.js has official Node examples, but a very small parser wrapper should isolate the dependency.
- Whether the generated PDF binary should be committed or built during tests needs a user decision. The recommended first path is deterministic generation during tests and smoke runs, with optional checked-in fixture only if review ergonomics suffer.
- Whether raw snapshots live in `ingestion_*` collections or are folded into catalog v1 is a model decision. This plan recommends separate ingestion collections.

## User Requests

- Stage 3 is finished; Stage 4 crawling should be planned next.
- Make careful decisions about workflow organization, testing, runtime environment, and content acquisition.
- Start with simple synthetic sources before real website crawling or real PDF processing.
- Build a custom HTML page containing a product table for a synthetic Hungarian shop, tentatively named `SimpleHtmlTableShop`, and query exactly those products.
- Build a similar PDF source for `SimplePdfShop` and process it the same way.
- Treat these as the first step of Stage 4, not as the final crawler architecture.
- Research Stage 4 deeply.
- Plan codebase guidelines carefully.
- Generate a plan file with open questions, possible issues, and necessary followups.

## Current Reality

- `catalog_v1` currently has compact processed collections:
  - `products`
  - `product_sources`
  - `product_tags`
  - `product_tag_assignments`
  - `stocks`
  - `source_record_processing_states`
  - `migration_ledger`
- `catalog_v1` intentionally does not store raw HTML, raw image bytes, or bulky source payloads in processed product documents.
- `source_record_processing_states` exists but there is no raw snapshot collection yet.
- `RecordOrigin.kind` already supports `crawler`, `processor`, `manual`, and `seed`.
- The current catalog repository can set up schema-validated catalog collections and run database smoke checks.
- Scripts are already thin entrypoints under `scripts/`.
- GitHub workflow precedent exists in `catalog-smoke.yml`: install dependencies, run checked-in scripts, typecheck, test, then smoke against MongoDB.
- No current Playwright dependency exists in the Node app package.
- Legacy crawler concepts exist in historical docs, but no new Stage 4 runtime code exists yet.
- Stage 4 runtime code now exists for:
  - `SimpleHtmlTableShop`
  - `penny_hu_offers`
  - `aldi-hu-offers`
  - `coop-hu-offers`
- The real-source crawlers currently write raw ingestion snapshots only; they do not yet process into catalog records.
- ALDI and COOP source parsers currently cast richer, source-specific parsed rows into `ParsedShopProductRow`, which is a signal that the ingestion row contract has drifted from real crawler needs.
- There is still no `SimplePdfShop`, no Lidl PDF ingestion, and no processor pipeline.
- `docs/ingestion.md`, `.github/workflows/*-ingestion.yml`, `scripts/README.md`, and `.agents/learnings/crawler-source-research.md` should be treated as live context for implemented source status.

## Intended Direction

Stage 4 introduces an ingestion layer next to the catalog layer:

```text
synthetic source fixture
  -> source adapter
  -> raw ingestion snapshot
  -> source-specific deterministic processor
  -> catalog_v1 products/product_sources/stocks/processing states
  -> admin/operator query
```

This keeps raw source truth separate from compact catalog query data and gives real sources a safer path later.

## Codebase Guidelines For Stage 4

- Put reusable ingestion contracts, parsers, processors, and persistence adapters under `packages/kamra-api-server/src/ingestion/`.
- Keep `packages/kamra-api-server/src/catalog/` focused on catalog records and app-facing product queries.
- Keep manually runnable entrypoints in `scripts/`, for example ingestion smoke, source ingestion, and processing commands.
- Keep workflow files in `.github/workflows/` as thin orchestration around `npm` scripts.
- Do not add crawler logic to API routes or user-facing request handlers.
- Do not put raw HTML or PDF bytes into processed catalog collections.
- Preserve raw snapshots in ingestion-owned collections with source name, run id, captured time, content type, content hash/fingerprint, source URL or fixture id, parser version, and retained payload metadata.
- Give each crawl run an operator-friendly id based on workflow name, source name, and crawl date, for example `synthetic-html-table-shop:simple_html_table_shop:2026-06-23`.
- Make crawled content removable by crawl run id with a locally runnable script during the MVP phase.
- Make repeated same-day crawls idempotent for the same source record so retrying a workflow does not blindly duplicate or rewrite raw snapshots.
- Keep price observations separate from source product identity in the crawler output contract. Products are relatively stable; prices are observations over time and must remain capable of historical tracking.
- Support multiple prices for the same source product/location when the source exposes them, including base/shelf price, normal dated offer price, coupon price, and loyalty/card price. Do not silently collapse Clubcard-like prices into the default price.
- Keep source-local identifiers such as ALDI `Cikkszám`, Tesco item identifiers, or brochure/viewer ids on source/shop records or source metadata, not as canonical product ids. Promote GTIN or other common national identifiers to canonical identity only when the source provides them clearly.
- Treat conservative merging as a processor rule: merge across shops by GTIN/common code first, by exact normalized name only when it is a 100% match, and otherwise create separate source-linked products or merge candidates.
- Treat the crawler output as a shop-specific raw/normalized contract between crawler and processor. Crawlers may keep source-specific parsing details, but each adapter should produce a stable parsed-row shape that its processor can validate.
- Use strict schema validation for new ingestion collections where practical, matching the Stage 3 MongoDB style.
- Use Result-style parser and processor outcomes for expected failures such as missing columns, unknown unit text, parse misses, duplicate rows, unsupported PDF layout, or disabled source.
- Use exceptions only for unexpected infrastructure faults.
- Keep source adapters isolated:
  - `simple-html-table-shop` should parse static HTML only.
  - `simple-pdf-shop` should parse PDF text only.
  - real-source adapters should not share brittle fixture assumptions.
- Prefer deterministic source fingerprints so reprocessing is idempotent.
- Version adapters and processors explicitly, for example `SimpleHtmlTableShopAdapter` version `1.0.0` and `SimpleCatalogProductProcessor` version `1.0.0`.
- Store run records separately from snapshots so a run can report started/completed/failed status, input source, trigger kind, counts, and failure summaries.
- Treat fixture content as untrusted source data in parser tests even though it is synthetic.
- Keep product identity conservative: synthetic records can map directly to canonical products by configured product key, while real sources later should create merge candidates rather than silently merging uncertain products.
- Keep HUF pricing and `countryCode: "HU"` explicit.
- Model "infinite stock" as country-wide shop availability with a large or sentinel quantity only if the current `StockQuantity` contract can represent it cleanly. If not, record unlimited availability in raw/source metadata and use a normal active availability stock record with a documented quantity convention.
- Do not enable schedules until manual ingestion and processing are proven.
- Nightly synthetic ingestion may run against the Smoke environment only after the manually runnable scripts and ingestion tests are in place. Real-source schedules remain gated by source-policy review.
- Do not introduce Playwright until a real source needs JavaScript rendering.
- Do not introduce Python or .NET runtime paths for this first synthetic slice; TypeScript is the most consistent and lowest-friction default.

## Proposed Naming

- Source names:
  - `simple_html_table_shop`
  - `simple_pdf_shop`
- Display labels:
  - `SimpleHtmlTableShop`
  - `SimplePdfShop`
- Store brand keys:
  - `simple-html-table-shop`
  - `simple-pdf-shop`
- Country-wide location keys:
  - `shop:simple-html-table-shop:HU`
  - `shop:simple-pdf-shop:HU`
- Adapter names:
  - `SimpleHtmlTableShopAdapter`
  - `SimplePdfShopAdapter`
- Processor name:
  - `SyntheticShopCatalogProcessor`

## Scope

Included:

- Stage 4 ingestion architecture plan and code layout.
- New ingestion contracts for run metadata and raw snapshots.
- Synthetic HTML source fixture with a stable product table.
- Synthetic PDF source with equivalent product content.
- Static HTML parser.
- PDF generator/parser path for controlled synthetic content.
- Processor that maps synthetic parsed rows into existing `catalog_v1` products, product sources, and stock records.
- Processing state updates so the same snapshot is not repeatedly processed by the same processor version.
- Local scripts for ingesting and processing synthetic sources.
- Database smoke path for ingestion collections and synthetic source processing.
- Focused tests for parser output, snapshot fingerprinting, processor output, and idempotency.
- A manually dispatchable GitHub Actions workflow after local scripts pass.
- Admin/operator visibility for latest ingestion runs and synthetic processed output, scoped as a later step inside this plan.
- Model revisit for products, source products, stocks, and price observations based on current raw crawler data.
- Tesco offers crawler using a configurable location tag, initially `tesco-szupermarket-zirc`.
- Source-specific processors for each crawled shop so parser quirks and promotion semantics remain isolated.
- Compact product/shop-offer table UI showing connected source offers and prices.

## Non-Goals

- No additional live retailer crawling without source-policy and source-method review.
- No production crawler schedule enablement before raw-to-processed behavior and disable paths are reviewed.
- No CAPTCHA, authentication, account-specific pricing, geolocation bypass, or anti-bot handling.
- No broad real-world PDF table extraction support.
- No product merge automation for uncertain real retailer records.
- No Playwright browser dependency unless a later approved step needs it.
- No public product lookup expansion beyond what is needed to inspect Stage 4 output.
- No architecture shift away from serverless-first and GitHub Actions ingestion.

## Assumptions

- The Stage 3 `catalog_v1` processed contract remains the target for queryable products during Stage 4.
- Synthetic shops can safely use direct configured product identity because the content is controlled.
- HUF prices can be represented with `MoneyAmount.amount` as a number and `currencyCode: "HUF"`.
- Synthetic shop stock is country-wide first, with `regionCode` still absent from current stock location contracts.
- The current MongoDB smoke user can create new collections in `kamra_smoke`.
- New parser dependencies can be added after explicit implementation approval.

## Open Questions

- What processed model should represent multiple prices per shop/location: a new `price_observations` collection, a `prices` array under stock/source offer records, or both historical observations plus current-collated values?
- Should source products and stock/offers be split more explicitly so source-local identifiers do not bloat canonical products?
- Should Tesco Clubcard prices be stored as a `loyalty_card` price observation with `programName: "Clubcard"` and the normal price as a separate base or offer observation?
- Should offer validity windows live on price observations, stock records, or source-offer records?
- How should stock location records represent country-wide, store-format, and exact store-scope offers when a source only exposes partial location scope?
- Should `raw_snapshots` and `ingestion_runs` stay as `ingestion_raw_snapshots` and `ingestion_runs`? Current implementation already uses those names.
- Should ingestion collection schemas be part of a new `ingestion/v1` artifact, or should Stage 4 create a broader `pipeline/v1` contract that includes raw, run, and processing concepts?
- Should the synthetic PDF be committed as a small binary fixture, generated during tests, or both?
- How should "infinite stock" be represented in the existing `StockQuantity` model: large finite number, `packageCount: null` plus a documented quantity, or a Stage 4 model extension?
- Should same-day repeated crawls skip an already captured source record by default, or should they append a new snapshot when the content hash changed within the same day?
- Should synthetic products use the same product names as Stage 3 seeds for continuity, or use a new product set to prove source-product creation from intake?
- Should the first admin visibility step be API-only smoke output, a `site-admin` UI view, or a minimal extension of the current product lookup review page?
- Should ingestion jobs write directly to the app database for the internal environment, or first write only to `kamra_smoke` until the pipeline is proven?
- Should processor output overwrite matching synthetic records on each run, or preserve price observations as history from the first Stage 4 slice?
- What is the minimum useful price-history shape before Stage 5/6 household work needs it?
- Should Stage 4 add a first-class `price_observations` processed collection now, or retain price observations only in raw/normalized ingestion records until the processor step is approved?
- Should Lidl and SPAR brochure/PDF handling share one generic brochure discovery layer, or stay source-specific until the first two PDF sources prove repeated patterns?

## Side Suggestions

- Add a focused `docs/ingestion.md` after the first implementation step lands. It should document source adapter anatomy, raw snapshot rules, processor versioning, and how to run synthetic ingestion locally.
- Add a small source review checklist file under `.agents/plans/` or `docs/` before the first real shop, based on `docs/crawler-policy.md`.
- Consider adding a fixture contract that both HTML and PDF sources are generated from, so parser tests can prove that different acquisition methods produce the same normalized rows.
- Consider adding a `price_observations` collection in a later Stage 4 step if the current `stocks.price` field is not enough to preserve price history cleanly.
- Keep batching as a planned followup: source adapters should be able to discover already captured same-day source records and skip them, which lets a future workflow retry or batch a source without recrawling everything.
- Consider adding `site-admin/ingestion` UI once run records exist, rather than expanding the current product lookup screen too far.

## Steering Notes

- The user explicitly wants synthetic HTML and PDF sources first, before real web crawling and real PDF processing.
- This plan treats those synthetic sources as production-shaped pipeline exercises, not throwaway demos.
- The recommendation is to prove the shared pipeline with TypeScript and static fixtures before considering Playwright, source-specific browser automation, or non-TypeScript tooling.
- Real crawler source policy review remains required before any external shop is enabled.

## Implementation Steps

### Step 1: Define Ingestion Contracts And Synthetic Source Fixture Model

Status: Completed for the initial synthetic shape; needs revision for real-source row drift and multiple price kinds.

- Goal: Add versioned ingestion contracts for runs, raw snapshots, parsed product rows, source definitions, and source processing outcomes.
- Include crawl-run identity, same-day source-record idempotency, cleanup-by-run expectations, and separate price observations in the parsed source row contract.
- Files likely affected:
  - `packages/kamra-api-server/src/ingestion/v1/contracts.ts`
  - `packages/kamra-api-server/src/ingestion/v1/schemas.ts`
  - `packages/kamra-api-server/src/ingestion/v1/validation.ts`
  - `packages/kamra-api-server/src/ingestion/v1/contracts.test.ts`
  - `packages/kamra-api-server/src/ingestion/README.md`
- Validation:
  - `npm test -- packages/kamra-api-server/src/ingestion`
  - `npm run typecheck`
- Commit message idea:
  - `Add stage 4 ingestion contracts`

### Step 2: Add Mongo Persistence For Ingestion Runs And Raw Snapshots

Status: Partially completed. Collections, indexes, idempotent writes, and cleanup exist; strict Mongo JSON schema validation remains open.

- Goal: Create ingestion repositories that set up schema-validated collections, indexes, and idempotent raw snapshot writes.
- Files likely affected:
  - `packages/kamra-api-server/src/ingestion/current/mongo-ingestion-repository.ts`
  - `packages/kamra-api-server/src/ingestion/current/mongo-ingestion-repository.test.ts`
  - `scripts/ingestion-smoke.ts`
  - `package.json`
- Validation:
  - `npm test -- packages/kamra-api-server/src/ingestion`
  - `npm run smoke:ingestion` against `kamra_smoke`
  - `npm run typecheck`
- Commit message idea:
  - `Add ingestion persistence smoke path`

### Step 3: Implement SimpleHtmlTableShop

Status: Completed.

- Goal: Add a synthetic HTML table fixture and a parser that produces normalized product rows from exactly the table content.
- Files likely affected:
  - `packages/kamra-api-server/src/ingestion/sources/simple-html-table-shop/source.ts`
  - `packages/kamra-api-server/src/ingestion/sources/simple-html-table-shop/fixture.html`
  - `packages/kamra-api-server/src/ingestion/sources/simple-html-table-shop/parser.test.ts`
  - `package.json` for a parser dependency such as `cheerio`
- Validation:
  - Parser tests verify row count, product keys, names, package sizes, prices, HUF currency, and country code.
  - Snapshot/fingerprint tests prove stable content produces stable ids.
  - `npm run typecheck`
- Commit message idea:
  - `Add synthetic HTML shop parser`

### Step 4: Revisit Product, Source Product, Stock, And Price Models

Status: Completed for the first processor-ready slice on 2026-07-01.

Decision:

- Add processed `price_observations` for historical/source prices.
- Add processed `product_source_identifiers` for retailer-local ids and future GTIN/common ids.
- Keep `stocks.price` as a compact current/collated convenience.
- Avoid changing existing non-empty validated collection shapes until a privileged migration/rebuild path exists, because the current Atlas user cannot run `collMod`.

- Goal: Adjust catalog and ingestion contracts before adding more crawlers so current and future sources can represent multiple shops, locations, stock scopes, identifiers, and simultaneous price kinds without lossy casts.
- Include:
  - multiple price observations per source product/location
  - promotion/loyalty/coupon price kind
  - validity windows per price observation
  - source-local item ids separate from canonical product identity
  - optional GTIN/common product codes when source-provided
  - conservative cross-shop merge rules
  - seed data and database smoke updates
- Files likely affected:
  - `packages/kamra-api-server/src/catalog/v1/contracts.ts`
  - `packages/kamra-api-server/src/catalog/v1/fixtures.ts`
  - `packages/kamra-api-server/src/catalog/v1/schemas.ts`
  - `packages/kamra-api-server/src/catalog/v1/generated/catalog-schemas.json`
  - `packages/kamra-api-server/src/ingestion/v1/contracts.ts`
  - source parser tests where casts currently hide shape drift
  - `scripts/seed.ts` or catalog smoke fixtures if needed
  - documentation in `docs/ingestion.md` and `packages/kamra-api-server/src/catalog/README.md`
- Validation:
  - `npm run contracts:catalog`
  - `npm test -- packages/kamra-api-server/src/catalog packages/kamra-api-server/src/ingestion`
  - `npm run typecheck`
  - smoke/seed against the configured database after user-approved environment check
- Commit message idea:
  - `Extend catalog model for source offer prices`

### Step 5: Implement Tesco Zirc Offers Crawler

- Goal: Add a source-specific Tesco crawler for `https://www.tesco.hu/akciok/akcios-termekek/<locationTag>` with `locationTag` configured separately from the base offers URL.
- Initial source configuration:
  - base URL: `https://www.tesco.hu/akciok/akcios-termekek`
  - initial location tag: `tesco-szupermarket-zirc`
- Include:
  - normal/base price and Clubcard price as separate price observations when both appear
  - source URL and source record id
  - source-local identifiers if exposed
  - GTIN/common identifiers only when explicitly exposed
  - location/store-format metadata from the configured tag
- Validation:
  - parser tests from saved visible-text/HTML fixtures
  - `npm run tesco:ingest` local/smoke path
  - workflow remains manually dispatchable and Smoke-scoped first
- Commit message idea:
  - `Add Tesco Zirc offers ingestion`

### Step 6: Implement Source-Specific Processors

- Goal: Process pending snapshots for each crawled shop into catalog/source offer records while preserving source semantics.
- Include processors for:
  - `simple_html_table_shop`
  - `penny_hu_offers`
  - `aldi-hu-offers`
  - `coop-hu-offers`
  - `tesco-hu-offers` after the crawler lands
- Processing rules:
  - merge by GTIN/common code when present
  - merge by exact normalized name only when it is a complete match
  - otherwise create separate products or merge candidates
  - keep normal, offer, coupon, and loyalty/card prices distinct
  - update `source_record_processing_states`
- Validation:
  - snapshot-style processor tests per source
  - idempotency tests for same snapshot and processor version
  - processor-version reprocessing test
  - smoke path that proves raw-to-catalog output
- Commit message idea:
  - `Process crawled offers into catalog records`

### Step 7: Add Compact Product Offer Table UI

- Goal: Extend the product inspection surface so admins can see all products and connected shop offers/prices in a compact table.
- Include:
  - source/shop name
  - source product name
  - location/scope label
  - normal/offer/loyalty prices
  - validity window
  - observed time
  - processing/source status
- Keep it in `src/app/site-admin/` or the existing product lookup/admin surface according to current app routing boundaries.
- Validation:
  - API route tests if a new route is added
  - frontend build
  - local UI check
- Commit message idea:
  - `Show processed shop offers in admin product table`

### Step 8: Implement SimplePdfShop And Brochure/PDF Foundation

- Goal: Add deterministic synthetic PDF generation and parsing that produces the same normalized row contract as the HTML source.
- Files likely affected:
  - `packages/kamra-api-server/src/ingestion/sources/simple-pdf-shop/source.ts`
  - `packages/kamra-api-server/src/ingestion/sources/simple-pdf-shop/pdf-fixture.ts`
  - `packages/kamra-api-server/src/ingestion/sources/simple-pdf-shop/parser.test.ts`
  - `package.json` for PDF generation/parsing dependencies, likely `pdfkit` plus `pdfjs-dist` if compatibility checks pass
- Validation:
  - PDF generation test proves deterministic enough for parser use.
  - Parser tests verify row count and equivalence with expected rows.
  - Failure tests cover unsupported layout or missing required labels.
  - `npm run typecheck`
- Commit message idea:
  - `Add synthetic PDF shop parser`

### Step 9: Add Lidl Brochure/PDF Ingestion

- Goal: Discover current Lidl flyers from `https://www.lidl.hu/c/szorolap/s10013623`, download allowed brochure/PDF content when technically and policy appropriate, and parse product offer text through the PDF pipeline.
- 2026-07-01 quick check: the page lists current/upcoming flyer links such as 27th-week and 26th-week brochures; a later implementation pass must inspect the linked viewer/download behavior directly before coding.
- Validation:
  - source-review checklist entry
  - saved flyer fixture or deterministic sample for parser tests
  - local/smoke ingestion path
- Commit message idea:
  - `Add Lidl brochure ingestion`

### Step 10: Revisit SPAR Brochure Source

- Goal: Evaluate `https://www.spar.hu/ajanlatok` as a brochure/PDF source before using the older `akcioterv` page.
- 2026-07-01 quick check: `spar.hu/ajanlatok` lists downloadable and viewable PDF brochures for SPAR, INTERSPAR, SPAR market, City SPAR, and special catalogues, so this is likely a better future source than the minimal `akcioterv` content.
- Commit message idea:
  - `Document SPAR brochure ingestion path`

### Step 11: Add Local Orchestration Scripts

- Goal: Add local scripts that can ingest one source, process pending snapshots, and print run summaries without requiring GitHub Actions.
- Files likely affected:
  - `scripts/ingest-synthetic-source.ts`
  - `scripts/process-ingestion.ts`
  - `scripts/ingestion-smoke.ts`
  - `scripts/remove-crawled-content.ts`
  - `package.json`
- Validation:
  - `npm run ingest:synthetic -- --source simple_html_table_shop`
  - `npm run ingest:synthetic -- --source simple_pdf_shop`
  - `npm run process:ingestion`
  - `npm run crawl:remove -- --crawl-run-id=<workflow:source:yyyy-mm-dd>`
  - `npm run smoke:ingestion`
  - `npm run smoke:catalog`
- Commit message idea:
  - `Add local synthetic ingestion scripts`

### Step 12: Add Manual GitHub Actions Workflow

- Goal: Add a manually dispatchable workflow for synthetic ingestion and processing against a configured environment. Once tests and local scripts exist, allow a Smoke-only nightly schedule for synthetic sources.
- Files likely affected:
  - `.github/workflows/synthetic-ingestion.yml`
  - `docs/tech-ops.md` if environment/secret names change
- Validation:
  - Workflow has `workflow_dispatch` first, with nightly Smoke scheduling allowed after the initial synthetic script path is testable.
  - Workflow uses `permissions: contents: read`.
  - Workflow accepts a source choice input.
  - Workflow shells into `npm` scripts only.
  - Workflow uses existing MongoDB secret/variable names.
- Commit message idea:
  - `Add manual synthetic ingestion workflow`

### Step 13: Add Minimal Operator Visibility

- Goal: Expose latest ingestion runs and processing failures to an admin/operator without mixing this into household workflows.
- Files likely affected:
  - `packages/kamra-api-server/src/http/routes/ingestion-routes.ts`
  - `packages/kamra-api-server/src/http/app-handler.ts`
  - `api/admin/ingestion/runs.ts` or another approved thin route structure
  - `src/app/site-admin/` if UI is included in this step
  - relevant nested `AGENTS.md` files under `src/`
- Validation:
  - Route tests for admin-only access.
  - UI build if frontend is touched.
  - Manual admin check locally.
- Commit message idea:
  - `Expose synthetic ingestion runs to admins`

## Validation Plan

Local validation:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run contracts:catalog`
- `npm run smoke:ingestion`
- `npm run smoke:catalog`
- Source-specific script runs for both synthetic shops.

Targeted tests:

- Contract validation tests for ingestion records.
- Parser tests for HTML and PDF source rows.
- Parser failure tests for missing/renamed columns.
- Snapshot-style processor output tests.
- Idempotency tests for duplicate snapshots.
- Processor-version reprocessing test.
- Mongo smoke test for collection creation, indexes, snapshot insert, processing-state update, and catalog query output.

Workflow validation:

- Manual dispatch against `Smoke` environment first.
- Verify logs do not print secrets or raw bulky payloads.
- Verify summary reports source, run id, captured snapshot count, processed count, skipped count, failed count, and target database name.

Manual review:

- Confirm processed synthetic products appear in the existing catalog review surface or the new operator visibility route.
- Confirm synthetic sources are clearly labeled and cannot be mistaken for real retailer data.

## Risks

- Raw snapshot model could be too narrow for real sources.
  - Mitigation: keep raw payload metadata flexible, preserve source content hashes, and avoid promoting source-specific fields too early.
- Synthetic sources could become toy code that real crawlers cannot reuse.
  - Mitigation: force them through the same run, snapshot, parser, processor, and smoke boundaries intended for real sources.
- PDF extraction can be brittle because PDFs do not expose a table DOM.
  - Mitigation: restrict first PDF to controlled synthetic layout and document that general PDF processing remains followup work.
- Infinite stock does not map cleanly to current `StockQuantity`.
  - Mitigation: decide the convention before implementation or add a small approved model extension.
- Adding parser dependencies can increase install/build risk.
  - Mitigation: isolate each dependency behind a tiny source parser wrapper and verify Node 24 ESM compatibility before committing.
- Workflow secrets can leak through logs if scripts are careless.
  - Mitigation: keep logs structured, summarize counts only, and follow GitHub least-privilege and secret-handling guidance.
- Scheduled ingestion could create source or cost risk if enabled too early.
  - Mitigation: manual dispatch only until real-source policy and volume are approved.
- Catalog v1 may need a price-history collection sooner than expected.
  - Mitigation: preserve raw snapshots and origins so a later backfill can create price observations without recrawling synthetic or real sources.

## Followups Before Real Shops

- Pick the first real source only after source-policy review.
- Record source URL, robots.txt result, known terms, request volume, user agent, retained raw fields, promoted fields, and disable path.
- Decide acquisition method per real source: static fetch, public API/feed, PDF, Playwright/browser automation, or no crawl.
- Add source-level feature flags or allowlists before live network calls.
- Add conservative rate limiting and retry behavior before any external source.
- Add admin takedown/disable notes for each enabled source.
- Decide whether real-source records create merge candidates instead of direct canonical products.
- Revisit database network exposure and runner access before scheduled production ingestion.

## Approval Checkpoint

Implementation should not begin until the user approves this plan or asks for revisions.
