# Ingestion

## Purpose

Kamra ingestion collects source-shop product and price observations outside user-facing request handlers.

The Stage 4 implementation currently proves this with `SimpleHtmlTableShop`, `SimplePdfShop`, plus experimental PENNY, ALDI, COOP, and Lidl Hungary crawlers. The synthetic sources are intentionally small, but they use the same raw snapshot/run shape planned for real crawlers:

```text
source content -> parser -> raw snapshot -> later processor -> catalog records
```

## Current Scope

Implemented:

- synthetic HTML source fixture
- synthetic PDF source fixture, generator, and parser
- first experimental PENNY Hungary offers source
- experimental ALDI Hungary offers source
- experimental COOP Hungary offers source
- experimental Lidl Hungary brochure/PDF source
- parsed source rows with product identity, stock availability, and separate price observations
- `ingestion_runs`
- `ingestion_raw_snapshots`
- processed `price_observations` catalog collection for historical/source price records
- processed `product_source_identifiers` catalog collection for retailer-local ids and future GTIN/common ids
- processing snapshots into catalog products, product sources, stocks, identifiers, prices, and processing states
- same-day source-record idempotency
- admin crawl snapshot browsing with paged/virtualized loading
- crawl source filtering in the admin left rail
- default hiding of accepted crawl rows and accepted-complete crawls, with a `Show accepted items` toggle
- manual review editor for crawl products before catalog writes
- acceptance preview that tells the operator whether a crawl product will create a new catalog product or merge into an existing one before executing
- cleanup by crawl run id
- manual and nightly Smoke workflow for synthetic ingestion
- manually dispatchable workflows for PENNY, ALDI, and COOP

Not implemented yet:

- production-approved real shop crawling
- strict Mongo JSON schema validation for ingestion collections
- strict validation for richer real-source parsed rows

## Run Identity

Crawl run ids are operator-readable:

```text
<workflow-name>:<source-name>:<yyyy-mm-dd>
```

Example:

```text
synthetic-html-table-shop:simple_html_table_shop:2026-06-23
```

The id is stored on both run records and raw snapshots, and it is the cleanup handle during the MVP phase.

## Idempotency

The current ingestion repository treats this tuple as unique:

```text
sourceName + sourceRecordId + crawlDate
```

Running the same synthetic crawl more than once on the same day skips the already captured source record instead of duplicating or blindly rewriting it.

This is deliberately simple. A later batching design can decide whether changed same-day content should append a new snapshot, update metadata, or use a finer batch id.

## Price Observations

Crawler output keeps price observations separate from source product identity.

Products may stay stable while prices change over time. The crawler should therefore emit a stable source identity plus one or more price observations. Processors write historical/source prices into catalog `price_observations`.

The catalog model now has a dedicated `price_observations` collection. `stocks.price` remains a compact current/collated value for query convenience; it is not the full price history.

Crawler rows can expose identifiers through `productIdentifiers`. Retailer-local item ids should be written to `product_source_identifiers` during processing. GTIN or other common identifiers may use the same collection, but only when the source clearly exposes them. Existing snapshots may still carry older source-local ids in metadata only, so processors should read both shapes during the transition.

## Local Commands

All commands require `MONGODB_URI` and `MONGODB_DB_NAME`, usually through `.env.local`.

Run synthetic ingestion:

```powershell
npm run synthetic:ingest
```

Run synthetic PDF ingestion:

```powershell
npm run synthetic:pdf:ingest
```

Run experimental PENNY offers ingestion:

```powershell
npm run penny:ingest
```

Run experimental ALDI offers ingestion:

```powershell
npm run aldi:ingest
```

Run experimental COOP offers ingestion:

```powershell
npm run coop:ingest
```

Run experimental Lidl brochure ingestion:

```powershell
npm run lidl:ingest
```

Process all pending raw ingestion snapshots:

```powershell
npm run process:ingestion
```

Remove crawled content for one crawl run:

```powershell
npm run crawl:remove -- --crawl-run-id=synthetic-html-table-shop:simple_html_table_shop:2026-06-23
```

Run tests for ingestion code:

```powershell
npm test -- packages/kamra-api-server/src/ingestion
```

Typecheck API and scripts:

```powershell
npx tsc -p tsconfig.api.json --noEmit
```

## Workflow

`.github/workflows/synthetic-ingestion.yml` runs the synthetic ingestion path against the `Smoke` environment.

Triggers:

- `workflow_dispatch`
- nightly schedule at `02:17 UTC`

The workflow installs dependencies, typechecks API/scripts, runs ingestion tests, then runs `npm run synthetic:ingest`.

This workflow writes ingestion data to the configured Smoke database. It should not be pointed at production-like data until the source, schedule, retention, and cleanup behavior are explicitly reviewed.

`SimplePdfShop` currently has a local script but no workflow. It generates a deterministic synthetic PDF with `pdf-lib`, extracts text with PDF.js, parses the extracted rows into the same normalized crawler row shape as the HTML synthetic source, and stores extracted text as the snapshot payload while hashing the PDF bytes. The committed `fixture.pdf` is for visual review and parser regression tests; the runtime script regenerates PDF bytes so the generator path is also covered.

`experimental` here means the PENNY crawler is working and locally verified, but it is not yet approved as a production crawler schedule. It is not a statement that we found a legal issue; it is a reminder that the source policy, terms, retention, and operational risk review still apply before broadening its use.

## Processing Workflow

`.github/workflows/process-ingestion.yml` processes raw ingestion snapshots into catalog records against the configured `Dev` environment.

Triggers:

- `workflow_dispatch`
- nightly schedule

Manual inputs:

- `source`: `all`, `simple_html_table_shop`, `simple_pdf_shop`, `penny_hu_offers`, `aldi-hu-offers`, `coop-hu-offers`, or `lidl-hu-brochure`
- `limit`: maximum raw snapshots to inspect
- `reprocess`: whether to reprocess snapshots already marked processed by the current processor version

The workflow installs dependencies, typechecks API/scripts, runs ingestion tests, runs `npm run process:ingestion`, and then runs `npm run validate:processed-ingestion`.

## Manual Crawl Review UI

The site-admin ingestion page is the current operator surface for Stage 4 manual supervision.

Current behavior:

- crawl snapshots load by page and render through virtualized rows so the admin page does not load every snapshot at once
- the left rail includes crawl-source filters populated from available snapshot sources
- accepted review items are hidden by default
- enabling `Show accepted items` includes accepted rows and their parent snapshots again
- when every review item for a crawl snapshot has been accepted, that crawl snapshot is hidden by default as completed review work
- selecting a crawl snapshot shows parsed source rows and opens the shared product editor for the chosen row
- accepting a review item first previews whether the action will create a new catalog product or merge into an existing product, with the reason such as matching identifier evidence
- accepted rows are removed from the default crawl view after the write succeeds
- declined rows remain review history but do not create catalog product data

The UI is intentionally operator-focused. It is not a customer product lookup surface, and raw source content should still be treated as untrusted until reviewed or processed.

## Penny Workflow

`.github/workflows/penny-ingestion.yml` runs the Penny offers crawler against the configured `Dev` environment.

Triggers:

- `workflow_dispatch`
- nightly schedule at `02:29 UTC`

The workflow installs dependencies, typechecks API/scripts, runs ingestion tests, then runs `npm run penny:ingest`.

This workflow writes ingestion data to the configured Smoke database. Keep it in the same approval bucket as the source note in `docs/crawler-policy.md` before considering any production-like environment or wider schedule.

## ALDI Workflow

`.github/workflows/aldi-ingestion.yml` runs the ALDI offers crawler against the configured `Dev` environment.

Triggers:

- `workflow_dispatch`
- nightly schedule

The workflow installs dependencies, typechecks API/scripts, runs ingestion tests, then runs `npm run aldi:ingest`.

ALDI rows may include source-local `Cikkszám` item numbers in `productIdentifiers` and visible validity or unit-price text while missing a primary shelf price. Downstream processors must keep those identifiers source-local and must not treat unit price as a product price.

## COOP Workflow

`.github/workflows/coop-ingestion.yml` runs the COOP offers crawler against the configured `Dev` environment.

Triggers:

- `workflow_dispatch`
- nightly schedule

The workflow installs dependencies, typechecks API/scripts, runs ingestion tests, then runs `npm run coop:ingest`.

COOP rows can include coupon or loyalty-style price observations and store-scope notes. Processors must keep coupon/loyalty prices separate from default prices and must not assume every COOP offer is nationally valid.

## Lidl Brochure Script

`npm run lidl:ingest` discovers public brochure links from `https://www.lidl.hu/c/szorolap/s10013623`, resolves flyer metadata through the Lidl leaflet viewer API, ignores Nonfood brochures, downloads the current food PDF brochures, extracts page text with PDF.js, and stores one raw snapshot per brochure.

`.github/workflows/lidl-ingestion.yml` runs the Lidl brochure crawler against the configured `Dev` environment.

Triggers:

- `workflow_dispatch`
- nightly schedule

The workflow installs dependencies, typechecks API/scripts, runs ingestion tests, then runs `npm run lidl:ingest`.

Lidl PDF text is noisy: prices, product names, item numbers, validity labels, and page boilerplate are interleaved. The parser emits rows anchored by Lidl item numbers, filters obvious brochure noise, and only writes price observations when a nearby offer price is clear. Rows without confident prices are still retained as source rows for later parser improvement.

## Next Planned Sources

- Do not add more live retailer crawlers before the Lidl brochure/PDF output is reviewed.
- Tesco Hungary live product crawling is deferred. No documented public Tesco Hungary product/offers API or feed was found, and `https://www.tesco.hu/akciok/akcios-termekek/tesco-szupermarket-zirc` returned HTTP 403 from the crawler runner.
- Tesco may be revisited later through `https://www.tesco.hu/akciok/katalogusok` as brochure/catalogue work if public catalogue media can be fetched normally or if Tesco provides permission/API documentation.
- SPAR Hungary should be revisited through `https://www.spar.hu/ajanlatok`, which lists viewable/downloadable brochures, rather than prioritizing the older minimal `akcioterv` page.

## Safety Notes

- Do not run crawlers from API routes or user-facing handlers.
- Treat `npm run penny:ingest`, `npm run aldi:ingest`, `npm run coop:ingest`, and `npm run lidl:ingest` as experimental source research. They fetch public offer pages or brochures and write raw ingestion data, but they are not production-approved crawling yet.
- Do not enable real retailer crawlers from a scheduled workflow without source-policy review.
- Do not assume ingestion snapshots are canonical products.
- Do not collapse normal, offer, coupon, or loyalty/card prices into one field when a source exposes them separately.
- Cleanup by crawl run id removes ingestion runs and raw snapshots for that run id only; it does not remove future processed catalog records.
- Treat real source content as untrusted data even when fetched from a known retailer.

## Related Docs

- `docs/crawler-policy.md`
- `.agents/learnings/crawler-source-research.md`
- `.agents/learnings/crawler-pipeline-patterns.md`
- `.agents/plans/2026-06-23-stage-4-synthetic-crawler-intake-plan.md`
