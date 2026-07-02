# Stage 4 Synthetic Crawler Intake Plan

Status: Active implementation plan

## Objective

Plan Stage 4 crawler intake around controlled sources first, then extend into reviewed real-source offer crawlers:

- `SimpleHtmlTableShop`: a synthetic Hungarian shop page with a stable HTML product table, HUF prices, country-wide availability, and effectively infinite stock.
- `SimplePdfShop`: a synthetic Hungarian shop PDF with similar product and price content.
- real Hungarian retailer offer sources, currently PENNY, ALDI, and COOP raw ingestion.
- processed catalog pipeline and compact product-offer UI before more live retailer acquisition.
- Lidl brochure/PDF ingestion after the synthetic PDF path is proven.
- SPAR and Tesco brochure/catalogue work moved out of Stage 4 and into end-of-MVP expansion, after current crawled shops have supported product and household feature work.

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
- Tesco Hungary has no documented public product/offers API/feed found as of 2026-07-01. The location-tagged offers page returned HTTP 403 from the crawler runner, so live Tesco crawling is deferred. The public catalog page may be revisited later as brochure/PDF-style work.

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
  - `product_source_identifiers`
  - `price_observations`
  - `product_tags`
  - `product_tag_assignments`
  - `stocks`
  - `source_record_processing_states`
  - `migration_ledger`
- `catalog_v1` intentionally does not store raw HTML, raw image bytes, or bulky source payloads in processed product documents.
- `source_record_processing_states`, `price_observations`, and `product_source_identifiers` exist as the processor target surface.
- `ingestion_runs` and `ingestion_raw_snapshots` exist and currently store raw crawler output.
- `RecordOrigin.kind` already supports `crawler`, `processor`, `manual`, and `seed`.
- The current catalog repository can set up schema-validated catalog collections and run database smoke checks.
- Scripts are already thin entrypoints under `scripts/`.
- GitHub workflow precedent exists in `catalog-smoke.yml`: install dependencies, run checked-in scripts, typecheck, test, then smoke against MongoDB.
- No current Playwright dependency exists in the Node app package.
- Legacy crawler concepts exist in historical docs, but no new Stage 4 runtime code exists yet.
- Stage 4 runtime code now exists for:
  - `SimpleHtmlTableShop`
  - `SimplePdfShop`
  - `penny_hu_offers`
  - `aldi-hu-offers`
  - `coop-hu-offers`
  - `lidl-hu-brochure`
- The source crawlers write raw ingestion snapshots that can now be processed into catalog records.
- ALDI and COOP source parsers previously cast richer, source-specific parsed rows into `ParsedShopProductRow`; the ingestion row contract has been loosened so those rows are now first-class.
- The processor pipeline and compact processed-offer UI exist for the current raw crawler data.
- There is still no manual processing workflow or dedicated crawl-run admin view.
- SPAR PDF ingestion and Tesco catalog/PDF ingestion are explicitly out of Stage 4 scope and should be revisited near the end of the MVP.
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
- Keep source-local identifiers such as ALDI `Cikkszám`, retailer item identifiers, or brochure/viewer ids on source/shop records or source metadata, not as canonical product ids. Promote GTIN or other common national identifiers to canonical identity only when the source provides them clearly.
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
- Model "infinite stock" as country-wide shop availability with `StockQuantity.packageCount: null` and clear documentation. Do not use a large finite number as a sentinel.
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
- Source-specific processors for each crawled shop so parser quirks and promotion semantics remain isolated.
- Compact product/shop-offer table UI showing connected source offers and prices.
- Lidl brochure/PDF acquisition.
- Deferred end-of-MVP source notes for SPAR and Tesco brochure/PDF acquisition.

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

## Settled Decisions

- Offer validity windows live on price observations for the MVP. Stocks remain current availability records, and source-offer details stay in raw/source records where needed.
- Stock location scope stays country-wide for current crawled offers. Use country-level, no-address shop anchors for now, while keeping the model open for later specific store/address records.
- Keep ingestion run and raw snapshot contracts under `ingestion/v1` for Stage 4. Do not introduce a broader `pipeline/v1` namespace until raw/run/processing concepts become shared across more than ingestion.
- Use both synthetic PDF fixture strategies: commit one small generated PDF fixture after visual review, and keep a deterministic generator with tests for runtime-generated PDFs. The committed fixture protects crawler tests from generator regressions; generator tests protect the fixture tool.
- Represent unlimited shop stock with `StockQuantity.packageCount: null` and documentation. Do not use a large finite placeholder.
- Same-day repeated crawls should append a new raw snapshot when the content hash changes. This preserves weekly turn-time changes or mid-day source updates.
- Synthetic products may continue using the existing Stage 3-style product set unless Step 8 implementation reveals a concrete parser or identity reason to introduce new names.
- Ingestion jobs write to the real configured app database, using separate ingestion/catalog collections and environment separation, not a temporary `kamra_smoke`-only path.
- Processor output preserves price history when prices change. Reprocessing the same snapshot and processor version should remain idempotent.
- The minimum price-history shape before household work is current-price visibility across shops; deeper historical views are deferred.
- Processors may write current/collated `stocks.price` from the latest usable default price observation when this reduces query cost and does not hide coupon, loyalty, or other restricted prices.
- Lidl and future SPAR brochure/PDF handling stay source-specific. Avoid a generic brochure discovery layer until repeated patterns justify it.

## Step 11 Implementation Notes

- Step 11 should add a `site-admin` crawl-run view, not only API smoke output. The initial UI should list crawl runs/snapshots, open each entry into a detail flyout, show parsed crawl rows below crawl header data, and allow manual operator actions such as process-state changes and row data edits where safely scoped.
- Step 11 should also extend the API so an admin can trigger processing for one crawl snapshot by id, then expose that action as a button in the crawl detail view.
- The crawl detail view may need shop/source-specific row rendering because raw row contracts differ. Keep the first version generic where possible, but do not force all shops into a lossy shared table.

## Side Suggestions

- Add a small source review checklist file under `.agents/plans/` or `docs/` before the first real shop, based on `docs/crawler-policy.md`.
- Consider adding a fixture contract that both HTML and PDF sources are generated from, so parser tests can prove that different acquisition methods produce the same normalized rows.
- Keep batching as a planned followup: source adapters should be able to discover already captured same-day source records and skip them, which lets a future workflow retry or batch a source without recrawling everything.
- Keep crawl-run/operator UI in `site-admin/ingestion` rather than expanding the product lookup screen too far.

## Steering Notes

- The user explicitly wants synthetic HTML and PDF sources first, before real web crawling and real PDF processing.
- This plan treats those synthetic sources as production-shaped pipeline exercises, not throwaway demos.
- The recommendation is to prove the shared pipeline with TypeScript and static fixtures before considering Playwright, source-specific browser automation, or non-TypeScript tooling.
- Real crawler source policy review remains required before any external shop is enabled.

## Implementation Steps

### Step 1: Define Ingestion Contracts And Synthetic Source Fixture Model

Status: Completed for the current processor-ready shape.

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

### Step 5: Implement Source-Specific Processors

Status: Completed for the current source set.

- Goal: Process pending snapshots for each crawled shop into catalog/source offer records while preserving source semantics.
- Include processors for:
  - `simple_html_table_shop`
  - `penny_hu_offers`
  - `aldi-hu-offers`
  - `coop-hu-offers`
- Processing rules:
  - write `product_sources`, `product_source_identifiers`, `price_observations`, and processing states
  - keep `stocks.price` as an optional current/collated value only when the processor can choose a current default price without hiding coupon or loyalty semantics
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

### Step 6: Add Local Processor Orchestration Scripts

Status: Completed for local processing and validation.

- Goal: Add local scripts that process pending snapshots and print source-aware summaries without requiring GitHub Actions.
- Files likely affected:
  - `scripts/process-ingestion.ts`
  - `scripts/README.md`
  - `package.json`
- Validation:
  - `npm run process:ingestion`
  - source filter option, for example `npm run process:ingestion -- --source penny_hu_offers`
  - idempotency check by rerunning the same processor version
  - `npm run smoke:catalog`
- Commit message idea:
  - `Add ingestion processing script`

### Step 7: Add Processed Offer API And Compact Product Offer Table UI

Status: Completed for compact processed product/source/price review. Dedicated crawl-run visibility remains Step 11.

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
- API should join compact product/source/price observation data without returning raw snapshot payloads.
- Validation:
  - API route tests if a new route is added
  - frontend build
  - local UI check
- Commit message idea:
  - `Show processed shop offers in admin product table`

### Step 8: Implement SimplePdfShop And Brochure/PDF Foundation

Status: Completed.

- Goal: Add deterministic synthetic PDF generation and parsing that produces the same normalized row contract as the HTML source.
- Include both a generated runtime PDF path and a small committed PDF fixture after visual review.
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

Status: Completed for first experimental source-specific ingestion and processing.

- Goal: Discover current Lidl flyers from `https://www.lidl.hu/c/szorolap/s10013623`, download allowed brochure/PDF content when technically and policy appropriate, and parse product offer text through the PDF pipeline.
- Keep Lidl source-specific. Do not introduce a generic brochure discovery abstraction yet.
- 2026-07-02 implementation note: the public brochure index listed current and previous food/nonfood flyers. The source resolves food flyers through the public Lidl leaflet viewer API, ignores Nonfood flyers, downloads the PDF files, extracts PDF text, and emits rows anchored by Lidl item numbers. The first parser is intentionally conservative: it records many source rows and only creates price observations where a nearby offer price is clear.
- Validation:
  - source-review checklist entry
  - saved flyer fixture or deterministic sample for parser tests
  - local/smoke ingestion path
- Commit message idea:
  - `Add Lidl brochure ingestion`

### Deferred End-Of-MVP Source Expansion: SPAR And Tesco

Status: Moved out of Stage 4.

- SPAR and Tesco are no longer active Stage 4 implementation steps.
- Revisit them near the end of the MVP, after current crawled-shop data has supported product lookup, household stock, and shopping-list/notice features.
- SPAR future note: evaluate `https://www.spar.hu/ajanlatok` as a brochure/PDF source before using the older `akcioterv` page. The page lists downloadable and viewable PDF brochures for SPAR, INTERSPAR, SPAR market, City SPAR, and special catalogues.
- Tesco future note: treat Tesco as a brochure/PDF/catalogue source through `https://www.tesco.hu/akciok/katalogusok` unless Tesco documents or grants a product/offers API/feed. Do not retry the location-tagged product page with header/IP/geolocation bypasses.

### Step 10: Add Manual Processing Workflow

Status: Completed.

- Goal: Add a manually dispatchable workflow for processing pending snapshots against a configured environment. Once tests and local scripts exist, allow a Smoke/Dev-only schedule for processors if desired.
- 2026-07-02 implementation note: `.github/workflows/process-ingestion.yml` runs against `Dev`, defaults to all pending raw snapshots, supports source-specific dispatch for every current crawled source including `lidl-hu-brochure`, accepts `limit` and `reprocess`, and validates processed output after processing.
- Files likely affected:
  - `.github/workflows/process-ingestion.yml`
  - `docs/tech-ops.md` if environment/secret names change
- Validation:
  - Workflow has `workflow_dispatch` first.
  - Workflow uses `permissions: contents: read`.
  - Workflow accepts optional source and processor inputs.
  - Workflow shells into `npm` scripts only.
  - Workflow uses existing MongoDB secret/variable names.
- Commit message idea:
  - `Add manual ingestion processing workflow`

### Step 11: Add Minimal Operator Visibility

- Goal: Expose latest ingestion runs, crawl snapshots, parsed rows, processing failures, and manual crawl processing actions to an admin/operator without mixing this into household workflows.
- Include:
  - a `site-admin` crawl-run/snapshot table
  - a detail flyout for one crawl entry
  - crawl header data plus parsed crawl rows
  - admin controls to manually change process state where safe
  - initial row-edit affordances for source row data such as corrected names, scoped so raw source truth remains traceable
  - API support and a UI button to process exactly one crawl snapshot by id
  - source/shop-aware row presentation where contracts differ
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

Current next approved direction: continue with Step 10 manual processing workflow and Step 11 focused operator visibility/UI improvements. SPAR and Tesco are moved out of Stage 4 and should be revisited near the end of the MVP after product and household feature work can use the already crawled shops.
