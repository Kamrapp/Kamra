# Stage 4 Ingestion Implementation Session

## Status

Initial testable slice implemented; experimental PENNY offers crawler in progress.

## Current Goal

Move Stage 4 from planning toward a testable synthetic ingestion slice while preserving a handoff point.

## Decisions Captured

- Crawl run ids should be operator-friendly and based on workflow name, source name, and crawl date.
- MVP cleanup should be possible with one local script by crawl run id.
- Re-running the same crawl on the same day should not blindly duplicate or rewrite raw snapshots for the same source record.
- Crawler output should keep price observations separate from source product identity.
- A later processor pipeline will convert crawled/normalized source rows into real catalog records.
- Batching and partial source crawling are followups, but same-day idempotency is useful now.

## Changed Files In This Session

- `.agents/plans/2026-06-23-stage-4-synthetic-crawler-intake-plan.md`
- `.agents/learnings/crawler-source-research.md`
- `docs/crawler-policy.md`
- `packages/kamra-api-server/src/ingestion/v1/contracts.ts`
- `packages/kamra-api-server/src/ingestion/v1/run-identity.ts`
- `packages/kamra-api-server/src/ingestion/sources/simple-html-table-shop/source.ts`
- `packages/kamra-api-server/src/ingestion/sources/simple-html-table-shop/source.test.ts`
- `packages/kamra-api-server/src/ingestion/current/mongo-ingestion-repository.ts`
- `scripts/ingest-synthetic-source.ts`
- `scripts/remove-crawled-content.ts`
- `.github/workflows/synthetic-ingestion.yml`
- `package.json`

## Next Validation

- Optional: run `npm run synthetic:ingest` against a configured MongoDB environment.
- Optional: run `npm run crawl:remove -- --crawl-run-id=synthetic-html-table-shop:simple_html_table_shop:<yyyy-mm-dd>` after a smoke ingestion to verify cleanup against MongoDB.
- Optional: run cleanup for PENNY test data with `npm run crawl:remove -- --crawl-run-id=penny-hu-offers:penny_hu_offers:2026-06-23`.

## Validation Completed

- `npm test -- packages/kamra-api-server/src/ingestion` passed.
- `npx tsc -p tsconfig.api.json --noEmit` passed.
- Both commands emitted npm cache log warnings because the sandbox could not write npm logs under the user profile, but the checks completed successfully.
- User validated `npm run synthetic:ingest` against MongoDB successfully on 2026-06-23. It inserted crawl run `synthetic-html-table-shop:simple_html_table_shop:2026-06-23` with 3 parsed rows.
- User validated `npm run crawl:remove -- --crawl-run-id=synthetic-html-table-shop:simple_html_table_shop:2026-06-23` successfully on 2026-06-23. It removed 1 run and 1 snapshot.
- `npm run penny:ingest` passed locally on 2026-06-23. It fetched `https://www.penny.hu/ajanlatok`, inserted crawl run `penny-hu-offers:penny_hu_offers:2026-06-23`, parsed 20 rows, and wrote snapshot `penny_hu_offers:offers-page-0:2026-06-23`.

## Known Followups

- Add strict Mongo JSON schema validation for ingestion collections.
- Add `SimplePdfShop`.
- Add processor pipeline from ingestion snapshots into catalog records.
- Review and harden the PENNY parser before treating it as production source crawling.
- Decide whether processed price history needs a dedicated `price_observations` collection.
- Decide whether changed same-day source content should append a new snapshot or update existing same-day snapshot metadata.
