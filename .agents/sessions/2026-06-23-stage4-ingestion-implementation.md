# Stage 4 Ingestion Implementation Session

## Status

Initial testable slice implemented; PENNY, ALDI, and COOP raw ingestion added; Stage 4 plan is being revised for model and processor work.

## Current Goal

Continue Stage 4 from raw ingestion toward processed catalog output. The immediate next work is to revisit product/source/stock/price models before adding Tesco, processor pipelines, PDF/brochure ingestion, and compact product-offer UI.

## Decisions Captured

- Crawl run ids should be operator-friendly and based on workflow name, source name, and crawl date.
- MVP cleanup should be possible with one local script by crawl run id.
- Re-running the same crawl on the same day should not blindly duplicate or rewrite raw snapshots for the same source record.
- Crawler output should keep price observations separate from source product identity.
- A later processor pipeline will convert crawled/normalized source rows into real catalog records.
- Batching and partial source crawling are followups, but same-day idempotency is useful now.
- Real-source parser output has outgrown the first synthetic `ParsedShopProductRow` shape. Update the ingestion and catalog contracts before adding more sources.
- Multiple concurrent prices must remain separate: base/shelf price, dated offer price, coupon price, and Clubcard-like loyalty price.
- Source-local shop identifiers belong on source/shop records or stock/offer metadata, not on canonical products. GTIN/common codes may be promoted to canonical identity when clearly provided.
- Cross-shop product merging should be conservative: GTIN/common code first, exact normalized name only when it is a complete match, otherwise keep records separate or create future merge candidates.

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
- Additional landed work since the first handoff:
  - `scripts/ingest-aldi-offers.ts`
  - `scripts/ingest-coop-offers.ts`
  - `.github/workflows/aldi-ingestion.yml`
  - `.github/workflows/coop-ingestion.yml`
  - `packages/kamra-api-server/src/ingestion/sources/aldi-hu-offers/source.ts`
  - `packages/kamra-api-server/src/ingestion/sources/coop-hu-offers/source.ts`
  - `docs/ingestion.md`
  - root `README.md`

## Next Validation

- Query current MongoDB ingestion data to inspect raw row shapes and source counts.
- Update catalog/ingestion models for multiple source locations and multiple prices per source product/location.
- Regenerate catalog schema artifacts and update seed/demo content.
- Run seed/smoke against the configured database after confirming the target environment.
- Add Tesco crawler with configurable `locationTag`, initially `tesco-szupermarket-zirc`.
- Add source-specific processors into catalog records.
- Add compact UI for products with connected shop offers/prices.

## Validation Completed

- `npm test -- packages/kamra-api-server/src/ingestion` passed.
- `npx tsc -p tsconfig.api.json --noEmit` passed.
- Both commands emitted npm cache log warnings because the sandbox could not write npm logs under the user profile, but the checks completed successfully.
- User validated `npm run synthetic:ingest` against MongoDB successfully on 2026-06-23. It inserted crawl run `synthetic-html-table-shop:simple_html_table_shop:2026-06-23` with 3 parsed rows.
- User validated `npm run crawl:remove -- --crawl-run-id=synthetic-html-table-shop:simple_html_table_shop:2026-06-23` successfully on 2026-06-23. It removed 1 run and 1 snapshot.
- `npm run penny:ingest` passed locally on 2026-06-23. It fetched `https://www.penny.hu/ajanlatok`, inserted crawl run `penny-hu-offers:penny_hu_offers:2026-06-23`, parsed 20 rows, and wrote snapshot `penny_hu_offers:offers-page-0:2026-06-23`.
- The PENNY `experimental` labeling is an approval-state note, not a legal-issue finding; source-policy and terms review still apply before any wider rollout.
- ALDI and COOP raw ingestion scripts/workflows are present as of the 2026-07-01 documentation sync. Revalidate current run counts against MongoDB before using them for model decisions.
- 2026-07-01 quick source check found Lidl's brochure page listing current/upcoming flyer links, Tesco's Zirc supermarket URL as the planned simpler next source, and SPAR's `ajanlatok` page listing viewable/downloadable brochures.

## Known Followups

- Add strict Mongo JSON schema validation for ingestion collections.
- Add `SimplePdfShop`.
- Add processor pipeline from ingestion snapshots into catalog records.
- Add Tesco Zirc crawler before Lidl PDF if model work lands cleanly.
- Add Lidl brochure/PDF ingestion after the PDF pipeline is in place.
- Revisit SPAR through `https://www.spar.hu/ajanlatok` brochures rather than prioritizing the older `akcioterv` content.
- Extend admin UI with a compact table of products, connected shop offers, source locations, price kinds, and validity windows.
- Review and harden the PENNY parser before treating it as production source crawling.
- Decide whether processed price history needs a dedicated `price_observations` collection.
- Decide whether changed same-day source content should append a new snapshot or update existing same-day snapshot metadata.
