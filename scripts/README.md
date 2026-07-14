# Scripts

## Purpose

This folder contains manually runnable local and workflow entrypoints.

Scripts should stay thin. Reusable logic belongs in `packages/`, and workflow YAML should call npm scripts instead of duplicating business logic.

### Browser smoke check

The Chromium smoke opens the anonymous application shell and verifies the browser title plus visible
top-left Kamra branding. It is intentionally not an implementation or interaction test: stable
behavior belongs in focused logic/coordination specs, configured MongoDB behavior belongs in smoke
scripts, and subjective browser evidence belongs in the active manual runbook.

Install the local browser once, then run:

```powershell
npx playwright install chromium
npm run test:browser
```

The `Browser Smoke` GitHub workflow installs Chromium in CI when browser-facing source, harness, or
configuration paths change. It runs for non-draft pull requests and for pushes to `master` or
`master_dev`; feature-branch pushes do not duplicate the pull-request run.

Playwright starts `scripts/playwright-web-server.mjs` instead of the regular `dev:web` npm command.
The helper generates the browser config and launches Angular directly. Its companion teardown
records and terminates that direct child before Playwright closes the shell, preventing a Windows
dev-server orphan when the runner cannot terminate the nested npm process itself.

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

### Docker runtime entrypoints

The root `Dockerfile` builds the Angular app and API with Node 24, then starts
`scripts/container-server.ts` from the compiled output. That server serves the compiled Angular
assets and delegates `/api/*` requests to the same shared Node adapter used by local and Vercel
entrypoints.

`scripts/container-bootstrap.ts` is called by the container entrypoint only when
`KAMRA_AUTO_SEED=1`. It checks the configured `seed_ledger` records before importing the normal seed
runner, so ordinary restarts do not reseed the demo household. Use the root Compose workflow and
`.env.docker.example` for local setup; do not point automatic bootstrap at a shared or production
database.

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

### Focused demo household commands

Use these when repeating household/browser checks without reseeding the catalogue or admin data:

```powershell
$env:SEED_DEMO_HOUSEHOLD_PASSWORD = "your-local-demo-password"
npm run seed:demo-household
npm run smoke:demo-household
```

`seed:demo-household` refreshes only the reserved `household1` fixture and its `usera`/`userb`
accounts. It requires the disposable database guard, the password environment variable, and the
current household validators. If it reports a stale validator, run the
`household-group-shopping-policy-v1` validator action in Database maintenance against the same
configured database; do not use only `Mark as complete`, which records acknowledgement without
changing MongoDB.

After the test session, remove only that household fixture with the explicit confirmation:

```powershell
npm run teardown:demo-household -- --confirm=demo-household
```

The teardown is refused without the exact confirmation and only permits `kamra_dev`, `kamra_test`,
or `kamra_smoke`. It does not delete shared catalogue, market, or price data.

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

### `shopping-trip-smoke.ts`

Exercises one real MongoDB Shopping Trip journey through the shared application handler: active
market matching, bought and not-bought completion, persisted purchase facts, concurrent identical
completion requests, concurrent non-idempotent admin reviews, and the resulting single-winner
conflicts. It creates one uniquely prefixed temporary household and removes only that household
and its run-scoped market, Shop Product, and Price Observation records in `finally`.

Command:

```powershell
npm run smoke:shopping-trip
```

The script refuses database names other than `kamra_dev`, `kamra_test`, or `kamra_smoke`. Use a
disposable/local or Smoke database. It does not change validators, maintenance acknowledgements,
catalogue records, archive data, or repair data. Cleanup failure fails the command rather than
reporting a false pass.

### `demo-household-smoke.ts`

Read-only validation of the seeded `household1` V2 fixture. It checks household defaults, required
Product Groups and Products, target/no-target coverage, expired/future/no-expiry batches, multiple
batches, unassigned Products, and the invariant that every available Batch has a Product owner.

Command:

```powershell
npm run smoke:demo-household
```

Run it after `npm run seed` against `kamra_dev`, `kamra_test`, or `kamra_smoke`. It refuses other
database names and never writes data.

### `mvp-preflight.ts`

Runs the repeatable local release checks in one command: deterministic integration tests, the full
test suite, formatting, lint, typecheck, web build, and API build. It does not need MongoDB and does
not replace the configured MongoDB smokes or browser evidence.

Command:

```powershell
npm run mvp:preflight
```

### Automated validation levels

- `npm run mvp:preflight` is the convenient local bundle for the repeatable checks.
- `npm test` runs the complete unit and deterministic integration suite used by the normal app
  checks.
- `npm run test:integration` reruns only the cross-layer handler scenarios when working inside a
  capability seam.
- `npm run smoke:catalog` and `npm run smoke:transactions` require the configured `Smoke`
  environment or an explicitly approved disposable MongoDB database. They provide signals that a
  fake database cannot: current validators/index setup and real transaction support.

### `stage11-mvp-manual-test.md`

The single live manual verification runbook for the complete Stage 8–11 MVP journey. It covers
the seeded `usera` demo household, two-user access, Product Groups/Products/Batches, shopping and
trip completion, admin ingestion/pricing review, maintenance/archive operations, visual checks,
and the final evidence/waiver review.

Use it after the implementation slices are complete and update its operator notes in place while
testing. This is the repository's only manual acceptance document.

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

### `repair-lidl-brochure-rows.ts`

Plans a bounded repair of historical Lidl brochure `parsedRows` after the parser's repeated same-page
identity fix. The default is read-only and only selects the previous parser version (`0.1.0`):

```powershell
npm run repair:lidl-brochure
npm run repair:lidl-brochure -- --snapshot-id=lidl-hu-brochure:akcios-ujsag-26-het-2026:2026-07-02 --limit=1
```

The command reparses the preserved payload, reports before/after row and duplicate-identity counts,
and never changes data unless all three safety arguments are present:

```powershell
npm run repair:lidl-brochure -- --apply --target=kamra_dev --operator=admin@example.test --limit=50
```

Apply mode updates only `parsedRows` and the parser version, requires the expected source/parser/version
and content hash to still match, and leaves the payload and content hash unchanged. Export and verify
the Crawl Snapshot archive first; review the dry-run report and any correction overlays before applying.
The operation is not a general ingestion repair and does not promote catalog data.

### `validate-processed-ingestion.ts`

Validates that raw ingestion snapshots have processed catalog-side states for the current source-offer processor version, then prints source-level catalog counts.

Command:

```powershell
npm run validate:processed-ingestion
```

Read-only MongoDB validation script. Use it after processing snapshots to confirm catalog-side products, product sources, price observations, and processing states exist for the crawled sources. It fails closed when a newly captured snapshot is still pending and logs the bounded snapshot ids that need processing; it does not process or mutate data itself.

### `audit-ingestion-quality.ts`

Runs the bounded, read-only Crawl Snapshot quality audit. It reports source/run identity problems, malformed parsed rows, duplicate row identities, invalid prices/date ranges, identifier issues, and snapshots without a matching run. It never changes MongoDB and emits only a bounded issue list.

Command:

```powershell
npm run audit:ingestion-quality
npm run audit:ingestion-quality -- --issue-limit=1000
```

Correction overlays are a separate reviewed JSONL concern. They must reference a snapshot id, row index, source fingerprint, reviewer, tool version, reason, and only normalized fields allowed by `ingestion-correction-overlay-v1`; they must never contain or rewrite raw payload text. After review, process a selected snapshot set with `--reprocess --overlay-file=<path>`; the processor verifies the current row fingerprint before applying the overlay to an in-memory snapshot copy.

The audit and archive traversal use MongoDB's always-present `_id` index instead of an unindexed
application-id sort, so populated environments stay within MongoDB's memory limit without requiring a
maintenance action first.

### `remove-crawled-content.ts`

Deletes ingestion run and raw snapshot records for one crawl run id.

Command:

```powershell
npm run crawl:remove -- --crawl-run-id=synthetic-html-table-shop:simple_html_table_shop:2026-06-23
```

Destructive maintenance script. It removes ingestion records for the given run id. It does not remove processed catalog records.

### `export-crawl-archive.ts`

Exports the raw `ingestion_runs` and `ingestion_raw_snapshots` collections into a verified, gzip-compressed JSONL archive. The export is read-only, uses stable JSON key ordering, records counts and uncompressed SHA-256 checksums in `manifest.json`, and refuses to write into a non-empty output directory.

Command:

```powershell
npm run crawl:export
npm run crawl:export -- --output=.artifacts/crawl-archives/dev-2026-07-13
```

Import a verified archive into a clean or disposable target with a dry run first. The importer
reads only `ingestion_runs` and `ingestion_raw_snapshots`, verifies the manifest/checksums, skips
identical stable records, and reports identity/content conflicts without overwriting. It never
imports derived Products or Price Observations. Apply requires the explicit configured database
name and is refused when conflicts exist:

```bash
npm run crawl:import -- --archive=.artifacts/crawl-archives/dev-2026-07-13
npm run crawl:import -- --archive=.artifacts/crawl-archives/dev-2026-07-13 --apply --target=kamra_clean
```

The default output is under `.artifacts/crawl-archives/`, which is ignored by Git. Treat archives as operational data: keep them outside the repository when they contain real crawl payloads, protect them from public distribution, and never use this command with an `--apply` or mutation mode because none exists.

### `maintenance-alpha-domain-language.ts`

Previews or applies the final Product Group cutover by composing the existing idempotent household migrations in this order: stock foundation, Household Product anchors, then Product Groups. It preserves legacy household collections and never touches raw Crawl Snapshot collections.

Preview is the default:

```powershell
npm run maintenance:alpha-domain-language -- --dry-run
```

Applying requires an exact database confirmation and an operator identity:

```powershell
npm run maintenance:alpha-domain-language -- --apply --target=kamra_dev --operator=admin@example.test
```

Run the archive export first. Review the reported Product Group conflicts before considering the cutover complete. The admin database-maintenance page invokes the same core actions and tracks validator and migration completion independently.

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
