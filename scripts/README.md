# Scripts

## Purpose

This folder contains manually runnable local and workflow entrypoints.

Scripts should stay thin. Reusable logic belongs in `packages/`, and workflow YAML should call npm scripts instead of duplicating business logic.

## Current Scripts

### `local-api.ts`

Starts the shared Node API server and delegates to the shared server handler.

Command:

```powershell
npm run dev:api
```

Writes data only when API routes do so.

Production-style command:

```powershell
npm run start:api
```

`npm run start:api` is the local compiled-server command and reads `.env.local` when present.

Render should use:

```powershell
npm run start:api:render
```

The same server entrypoint supports both local development and the Render-hosted API service. It listens on `PORT` and `HOST` when set, and defaults to `3000` on `0.0.0.0`.

### `generate-public-config.ts`

Generates the browser-safe frontend config module from environment variables.

Commands:

```powershell
npm run generate:public-config
npm run build:web
npm run dev:web
```

Repository-write script. It updates `src/app/generated-public-config.ts` with the current `API_BASE_URL` value. Leave `API_BASE_URL` empty for same-origin local development and Vercel preview fallback.

### `seed.ts`

Runs approved seed definitions.

Command:

```powershell
npm run seed
```

Data-writing script. Check seed docs and environment before running outside local/smoke databases.

Current registered seeds include the admin identity, catalog v1 sample data, and the demo household reset seed.

Demo household seeding uses `SEED_DEMO_HOUSEHOLD_PASSWORD`. If the value is missing, `npm run seed` will prompt before running that optional seed.
The current demo login identifiers are `usera` and `userb`, matching the auth layer's lowercase login normalization.
Admins can also reset the same stable dataset from `/admin/dashboard`, which calls `POST /api/admin/dashboard/reseed-demo-household`.

### `catalog-smoke.ts`

Checks current catalog collection setup against MongoDB.

Command:

```powershell
npm run smoke:catalog
```

May create missing catalog collections and indexes in the configured database. Use Smoke/local databases unless intentionally validating another environment.

### `transaction-smoke.ts`

Proves that the configured MongoDB topology supports the transaction behavior required by Stage 8. It intentionally aborts one transaction to verify rollback, commits a second transaction, verifies both outcomes, and removes its temporary documents.

Command:

```powershell
npm run smoke:transactions
```

The script refuses database names other than `kamra_dev`, `kamra_test`, or `kamra_smoke`. Use a disposable/local or smoke database; it does not run against production-named databases.

### `stage8-demo-manual-test.md`

Repeatable manual test script for the seeded `usera` demo household. It covers Product Groups, Products, Batches, expiry-before-acquisition, the permissive/default expired-item policy, corrections, discard, and the remaining Stage 8 browser checks.

Use it after `npm run seed` and only against a disposable local/demo database. Reseeding resets the demo household data.

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

### `ingest-synthetic-pdf-source.ts`

Generates the synthetic `SimplePdfShop` PDF, extracts its text, parses product rows, and writes one PDF-backed raw ingestion snapshot.

Command:

```powershell
npm run synthetic:pdf:ingest
```

Data-writing script. Uses same-day idempotency for the same source record. Stores extracted PDF text in the ingestion payload and hashes the generated PDF bytes.

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

### `ingest-lidl-brochures.ts`

Fetches `https://www.lidl.hu/c/szorolap/s10013623`, discovers public food brochure entries, downloads their PDF files, extracts page text, and writes one raw ingestion snapshot per food brochure.

Command:

```powershell
npm run lidl:ingest
```

Experimental data-writing script. It ignores Nonfood brochures, keeps Lidl item numbers source-local, and only emits prices where the PDF text parser can identify a nearby offer price without guessing.

### `process-ingestion.ts`

Processes raw ingestion snapshots into catalog products, product sources, source identifiers, price observations, availability stocks, and source processing states.

Command:

```powershell
npm run process:ingestion
```

Useful filters:

```powershell
npm run process:ingestion -- --source=penny_hu_offers --limit=10
npm run process:ingestion -- --source=coop-hu-offers --reprocess
```

Data-writing script. It skips snapshots already processed by the same processor version unless `--reprocess` is passed. It keeps coupon/loyalty prices as separate price observations and leaves shop availability stock prices empty for now.

### `validate-processed-ingestion.ts`

Validates that raw ingestion snapshots have processed catalog-side states for the current source-offer processor version, then prints source-level catalog counts.

Command:

```powershell
npm run validate:processed-ingestion
```

Read-only MongoDB validation script. Use it after processing snapshots to confirm catalog-side products, product sources, price observations, and processing states exist for the crawled sources.

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
- `API_BASE_URL`
- `CORS_ALLOWED_ORIGINS`
- `CORS_ALLOWED_ORIGIN_PATTERNS`

Local development usually reads these from `.env.local` through `--env-file-if-exists=.env.local`.
