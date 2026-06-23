# Ingestion

## Purpose

Kamra ingestion collects source-shop product and price observations outside user-facing request handlers.

The Stage 4 implementation currently proves this with `SimpleHtmlTableShop`, a synthetic Hungarian shop source. It is intentionally small, but it uses the same shape planned for real crawlers:

```text
source content -> parser -> raw snapshot -> later processor -> catalog records
```

## Current Scope

Implemented:

- synthetic HTML source fixture
- first experimental PENNY Hungary offers source
- parsed source rows with product identity, stock availability, and separate price observations
- `ingestion_runs`
- `ingestion_raw_snapshots`
- same-day source-record idempotency
- cleanup by crawl run id
- manual and nightly Smoke workflow for synthetic ingestion

Not implemented yet:

- `SimplePdfShop`
- processing snapshots into catalog products/stocks
- dedicated processed price-history collection
- production-approved real shop crawling
- strict Mongo JSON schema validation for ingestion collections

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

Products may stay stable while prices change over time. The crawler should therefore emit a stable `sourceProductKey` plus one or more `priceObservations`. The later processor decides how observations become catalog stock prices or a dedicated price-history collection.

## Local Commands

All commands require `MONGODB_URI` and `MONGODB_DB_NAME`, usually through `.env.local`.

Run synthetic ingestion:

```powershell
npm run synthetic:ingest
```

Run experimental PENNY offers ingestion:

```powershell
npm run penny:ingest
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

`experimental` here means the PENNY crawler is working and locally verified, but it is not yet approved as a production crawler schedule. It is not a statement that we found a legal issue; it is a reminder that the source policy, terms, retention, and operational risk review still apply before broadening its use.

## Penny Workflow

`.github/workflows/penny-ingestion.yml` runs the Penny offers crawler against the `Smoke` environment.

Triggers:

- `workflow_dispatch`
- nightly schedule at `02:29 UTC`

The workflow installs dependencies, typechecks API/scripts, runs ingestion tests, then runs `npm run penny:ingest`.

This workflow writes ingestion data to the configured Smoke database. Keep it in the same approval bucket as the source note in `docs/crawler-policy.md` before considering any production-like environment or wider schedule.

## Safety Notes

- Do not run crawlers from API routes or user-facing handlers.
- Treat `npm run penny:ingest` as experimental source research. It fetches the public PENNY offers page and writes raw ingestion data, but it is not production-approved crawling yet.
- Do not enable real retailer crawlers from a scheduled workflow without source-policy review.
- Do not assume ingestion snapshots are canonical products.
- Cleanup by crawl run id removes ingestion runs and raw snapshots for that run id only; it does not remove future processed catalog records.
- Treat real source content as untrusted data even when fetched from a known retailer.

## Related Docs

- `docs/crawler-policy.md`
- `.agents/learnings/crawler-source-research.md`
- `.agents/learnings/crawler-pipeline-patterns.md`
- `.agents/plans/2026-06-23-stage-4-synthetic-crawler-intake-plan.md`
