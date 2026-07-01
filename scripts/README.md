# Scripts

## Purpose

This folder contains manually runnable local and workflow entrypoints.

Scripts should stay thin. Reusable logic belongs in `packages/`, and workflow YAML should call npm scripts instead of duplicating business logic.

## Current Scripts

### `local-api.ts`

Starts the local Node API runner and delegates to the shared server handler.

Command:

```powershell
npm run dev:api
```

Writes data only when API routes do so.

### `seed.ts`

Runs approved seed definitions.

Command:

```powershell
npm run seed
```

Data-writing script. Check seed docs and environment before running outside local/smoke databases.

### `catalog-smoke.ts`

Checks current catalog collection setup against MongoDB.

Command:

```powershell
npm run smoke:catalog
```

May create missing catalog collections and indexes in the configured database. Use Smoke/local databases unless intentionally validating another environment.

### `generate-catalog-schemas.ts`

Regenerates catalog schema artifacts.

Command:

```powershell
npm run contracts:catalog
```

Repository-write script. Review generated diffs before committing.

### `ingest-synthetic-source.ts`

Ingests the synthetic `SimpleHtmlTableShop` fixture into ingestion collections.

Command:

```powershell
npm run synthetic:ingest
```

Data-writing script. Uses same-day idempotency for the same source record.

### `ingest-penny-offers.ts`

Fetches `https://www.penny.hu/ajanlatok`, parses the public Nuxt product payload, and writes one raw ingestion snapshot.

Command:

```powershell
npm run penny:ingest
```

Experimental data-writing script. Use for local/smoke research only until PENNY source policy, schedule, and production safety are explicitly approved.

It is experimental because the crawler is still a source-research crawler, not because we identified a legal issue. Keep treating it as subject to source-policy and terms review before any broader rollout.

### `ingest-aldi-offers.ts`

Fetches `https://www.aldi.hu/szuper-akciok-mindennap`, parses rendered public offer-page text, and writes one raw ingestion snapshot.

Command:

```powershell
npm run aldi:ingest
```

Experimental data-writing script. ALDI can expose source-local `Cikkszám` item numbers, validity windows, and unit-price text while some rows lack a primary shelf price. Downstream processing must keep those semantics explicit.

### `ingest-coop-offers.ts`

Fetches `https://www.coop.hu/akcios-termekek/`, parses rendered public offer-page text, and writes one raw ingestion snapshot.

Command:

```powershell
npm run coop:ingest
```

Experimental data-writing script. COOP rows can include coupon, loyalty, purchase-condition, or store-scope notes. Downstream processing must keep coupon/loyalty prices separate from default prices.

### `remove-crawled-content.ts`

Deletes ingestion run and raw snapshot records for one crawl run id.

Command:

```powershell
npm run crawl:remove -- --crawl-run-id=synthetic-html-table-shop:simple_html_table_shop:2026-06-23
```

Destructive maintenance script. It removes ingestion records for the given run id. It does not remove processed catalog records.

## Environment

Mongo-backed scripts require:

- `MONGODB_URI`
- `MONGODB_DB_NAME`

Optional:

- `MONGODB_DNS_SERVERS`

Local development usually reads these from `.env.local` through `--env-file-if-exists=.env.local`.
