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
