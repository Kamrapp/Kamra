# Stage 4 Ingestion Implementation Session

## Status

Initial testable slice implemented; PENNY, ALDI, and COOP raw ingestion added; Stage 4 plan finalized for processor pipeline next.

## Current Goal

Wrap this session and continue next time from `.agents/plans/mvp/2026-06-23-stage-4-synthetic-crawler-intake-plan.md`. The immediate next implementation step is the source-specific processor pipeline, followed by local processing scripts and compact product-offer UI.

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
- Model decision on 2026-07-01: use dedicated catalog collections for processed `price_observations` and `product_source_identifiers`. Keep old `stocks.price` as an optional current/collated convenience and avoid changing existing validated `product_sources`/`stocks` document shapes until a privileged migration path exists.
- Atlas `kamra_dev` user cannot run `collMod`, so schema changes to non-empty validated collections must either use new collections, a privileged migration, or a deliberate collection rebuild plan.
- Tesco decision on 2026-07-01: no documented public Tesco Hungary product/offers API or feed was found. The Zirc location-tagged offers page returned HTTP 403 from the crawler runner. Defer Tesco live product crawling; later revisit only as catalogue/PDF work or with explicit API/permission.

## Changed Files In This Session

- `.agents/plans/mvp/2026-06-23-stage-4-synthetic-crawler-intake-plan.md`
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

## Next Session Bootstrap

- Load `AGENTS.md`.
- Load `.agents/plans/mvp/2026-06-23-stage-4-synthetic-crawler-intake-plan.md`.
- Treat this session note and `.agents/learnings/crawler-source-research.md` as optional only if a detail is missing from the plan.
- Start with plan Step 5: source-specific processors for `simple_html_table_shop`, `penny_hu_offers`, `aldi-hu-offers`, and `coop-hu-offers`.
- Do not add Tesco/Lidl/SPAR crawlers before the processor pipeline and compact processed-offer UI land.

## Validation Completed

- `npm test -- packages/kamra-api-server/src/ingestion` passed.
- `npx tsc -p tsconfig.api.json --noEmit` passed.
- Both commands emitted npm cache log warnings because the sandbox could not write npm logs under the user profile, but the checks completed successfully.
- User validated `npm run synthetic:ingest` against MongoDB successfully on 2026-06-23. It inserted crawl run `synthetic-html-table-shop:simple_html_table_shop:2026-06-23` with 3 parsed rows.
- User validated `npm run crawl:remove -- --crawl-run-id=synthetic-html-table-shop:simple_html_table_shop:2026-06-23` successfully on 2026-06-23. It removed 1 run and 1 snapshot.
- `npm run penny:ingest` passed locally on 2026-06-23. It fetched `https://www.penny.hu/ajanlatok`, inserted crawl run `penny-hu-offers:penny_hu_offers:2026-06-23`, parsed 20 rows, and wrote snapshot `penny_hu_offers:offers-page-0:2026-06-23`.
- The PENNY `experimental` labeling is an approval-state note, not a legal-issue finding; source-policy and terms review still apply before any wider rollout.
- ALDI and COOP raw ingestion scripts/workflows are present as of the 2026-07-01 documentation sync. Revalidate current run counts against MongoDB before using them for model decisions.
- 2026-07-01 quick source check found Lidl's brochure page listing current/upcoming flyer links, SPAR's `ajanlatok` page listing viewable/downloadable brochures, and Tesco's Zirc supermarket URL as initially interesting but later deferred after the 403/API-feed check.
- 2026-07-01 Mongo query against `kamra_dev` found raw ingestion snapshots for `penny_hu_offers`, `aldi-hu-offers`, `coop-hu-offers`, and one older `coop-offers` source name. Latest sample rows confirmed PENNY uses `priceObservations`, while ALDI/COOP used richer flattened source-specific fields.
- 2026-07-01 model validation completed:
  - `npm run contracts:catalog`
  - `npm test -- packages/kamra-api-server/src/catalog packages/kamra-api-server/src/ingestion`
  - `npx tsc -p tsconfig.api.json --noEmit`
  - `npm run smoke:catalog`
  - `npm run seed`
  - final `npm run smoke:catalog`
- Final `kamra_dev` catalog smoke counts included `price_observations: 2` and `product_source_identifiers: 3`.
- 2026-07-01 Tesco check:
  - `https://www.tesco.hu/akciok/akcios-termekek/tesco-szupermarket-zirc` returned HTTP 403 from the crawler runner.
  - Public search and official-page checks did not find a documented Tesco Hungary product/offers API or feed.
  - `https://www.tesco.hu/akciok/katalogusok` lists catalogues with online viewing/download affordances, so Tesco is a later catalogue/PDF candidate.

## Known Followups

- Add strict Mongo JSON schema validation for ingestion collections.
- Add `SimplePdfShop`.
- Add processor pipeline from ingestion snapshots into catalog records.
- Add Lidl brochure/PDF ingestion after the PDF pipeline is in place.
- Revisit SPAR through `https://www.spar.hu/ajanlatok` brochures rather than prioritizing the older `akcioterv` content.
- Revisit Tesco only as catalogue/PDF work or with explicit API/permission.
- Extend admin UI with a compact table of products, connected shop offers, source locations, price kinds, and validity windows.
- Review and harden the PENNY parser before treating it as production source crawling.
- Decide whether changed same-day source content should append a new snapshot or update existing same-day snapshot metadata.
