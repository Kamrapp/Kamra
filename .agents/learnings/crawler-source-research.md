# Crawler Source Research

## Purpose

Capture durable source-acquisition lessons for Kamra crawling work so Stage 4 and later real-source planning can reload the findings without repeating the same research.

This note complements:

- `docs/crawler-policy.md` for source safety and operational guardrails.
- `.agents/learnings/crawler-pipeline-patterns.md` for reusable pipeline architecture lessons.
- `.agents/plans/mvp/2026-06-23-stage-4-synthetic-crawler-intake-plan.md` for the current Stage 4 implementation plan.

## Acquisition Preference

Use the lowest-risk source path that still preserves product, price, unit-price, validity, and source identity.

1. Official documented API, feed, sitemap, or explicit permission.
2. Public static HTML offer pages with enough product and price text to parse deterministically.
3. Sitemap-assisted discovery of public offer/category pages.
4. PDF or brochure download with text extraction.
5. Browser automation for JavaScript-rendered public pages.
6. Internal storefront APIs exposed by public apps, only after source-policy and terms review.

Do not treat robots.txt as permission. It is one input to the source review, alongside terms, request volume, user agent, retained data, and disable/takedown path.

## Stage 4 Synthetic Source Lessons

Stage 4 should prove the crawler pipeline with controlled sources before live retailer crawling.

- Start with `SimpleHtmlTableShop`: a synthetic Hungarian shop page containing a stable HTML product table, HUF pricing, country-wide availability, and effectively infinite stock.
- Add `SimplePdfShop`: a synthetic PDF with equivalent product and price content.
- Route both through production-shaped boundaries: source adapter, raw snapshot, parser, normalized rows, processor, catalog writes, processing state, and operator-visible run summary.
- Keep live network crawling out of the first implementation slice.
- Use static HTML parsing for the HTML fixture; do not add Playwright until a real source requires rendering.
- Treat PDF parsing as document parsing, not table-DOM extraction. The first PDF should use a deterministic controlled layout and should not imply general PDF support.
- Keep workflow YAML thin and manually dispatched first. Schedules should come only after manual ingestion, policy review, and disable paths are proven.
- Preserve raw snapshots outside processed catalog collections. Processed catalog records should stay compact and traceable back to source snapshots.

## Real Source Implementation Notes

Implementation update date: 2026-07-01.

Assumption for these notes: the PENNY, ALDI, and COOP crawlers currently run successfully against their target public pages. Recheck current MongoDB run counts and row samples before using them as model-proof data.

The implemented real-source crawlers follow the same conservative acquisition pattern:

- Fetch one public offer page per retailer run.
- Use Playwright/Chromium for acquisition where rendered text is needed, but do not log in, emulate account-specific behavior, bypass geolocation, or call private storefront APIs.
- Store a raw snapshot for the fetched source page and keep parsed product rows traceable to that snapshot.
- Use a stable crawl-run identity derived from source name, workflow name, and crawl date.
- Use source-specific parser names and parser versions so parser behavior can be audited later.
- Keep scheduled GitHub workflows manually triggerable and retry-bounded.

Important data-model side note: these crawlers are offer-page crawlers, not full product-catalog crawlers. They only see what each retailer publishes on the selected offer page at crawl time. They do not infer missing products, store-local prices, stock, or every-day shelf prices.

## Real Hungarian Retailer Research

Initial research date: 2026-06-23.
Implementation notes added: 2026-06-26.

These findings are scouting and implementation notes, not legal/source approvals. Before enabling any source beyond development or low-volume manual runs, perform the checklist in `docs/crawler-policy.md`.

### PENNY Hungary

- Main candidate path: `https://www.penny.hu/ajanlatok`
- Brochure path: `https://www.penny.hu/reklamujsag`
- Robots path checked: `https://www.penny.hu/robots.txt`
- Implemented source:
  - Source name: `penny-hu-offers`
  - Acquisition method: rendered/public offer page fetch through Playwright.
  - Raw snapshot shape: one source-page snapshot per crawl day, keyed as the offers page snapshot and containing the fetched HTML payload plus parsed rows.
- Observed shape:
  - The offers page exposes product names, package sizes, validity dates, current prices, old prices, and unit prices in page text.
  - The brochure page links current and upcoming weekly flyers.
  - The fetched robots file only exposed a sitemap line during the research pass.
- Data currently crawled/promoted:
  - Product display name / raw name from the public offers page.
  - Current offer price text and numeric HUF price where parseable.
  - Unit-price text where exposed.
  - Valid-from and valid-to dates where exposed.
  - Source URL, source name, source record identity, observation timestamp, country code `HU`, and currency `HUF`.
  - Parser/source metadata sufficient to trace rows back to the raw snapshot.
  - Old/original price only if the page exposes it and the parser promotes it; otherwise do not assume it exists downstream.
- Missing or intentionally not crawled:
  - No full PENNY product catalog.
  - No store-specific availability, stock, quantity limits, or regional price variation.
  - No customer/account-specific prices.
  - No brochure/PDF extraction yet.
  - No images or category taxonomy treated as durable catalog fields.
  - No guarantee that the parsed “old price” is the legal previous lowest price; treat it as retailer-presented page text only.
- Limitations:
  - The crawler tracks the current published offer-page state at crawl time. It is not a price-history source by itself unless snapshots are retained and compared over time.
  - If the public page changes layout, rows should fail conservatively rather than produce guessed prices.
  - The source gives good first coverage, but only for current offers, not normal shelf pricing.
- Recommendation:
  - Best first real static/public-page crawler candidate.
  - Continue using the public offers page before considering flyers.
  - Still record terms, final robots result, request volume, and disable path before enabling regular production schedules.

### ALDI Hungary

- Main candidate path: `https://www.aldi.hu/szuper-akciok-mindennap`
- Brochure path: `https://www.aldi.hu/online-akcios-ujsag`
- Storefront path observed: `https://shop.aldi.hu/`
- Implemented source:
  - Source name: `aldi-hu-offers`
  - Acquisition method: rendered/public offer page fetch through Playwright.
  - Raw snapshot shape: rendered HTML and visible body text retained together so parser failures can be debugged from the same captured source page.
- Observed shape:
  - The static offers page exposes product listings, validity windows, unit prices, and `Cikkszám` item numbers.
  - The item numbers are useful source-product keys.
  - The online brochure page links current and upcoming brochures through the ALDI flyer viewer.
  - `shop.aldi.hu` is a Roksh-powered Angular storefront. Its public JavaScript bundle references product-list, search, product-detail, provider, and session endpoints hosted under Roksh-related domains.
- Data currently crawled/promoted:
  - Product display name / raw name from visible page text.
  - ALDI `Cikkszám` item numbers where present, used as source-product identity inputs.
  - Valid-from and valid-to dates from visible validity windows.
  - Unit-price text where present.
  - Current offer price only when a primary shelf price is exposed in parseable visible text.
  - Source URL, source name, source record identity, observation timestamp, country code `HU`, and currency `HUF`.
  - Parser metadata and raw text snippets for later debugging.
- Missing or intentionally not crawled:
  - No call to `shop.aldi.hu` / Roksh product-list, search, session, provider, or product-detail APIs.
  - No account-specific, location-specific, delivery-specific, or availability-specific data.
  - No full online-shop catalog.
  - No brochure/flyer extraction.
  - No original/old price unless it appears as parseable page text and is explicitly supported by the parser.
  - No product images or rich category hierarchy promoted as stable catalog fields.
- Limitations:
  - ALDI is useful for validity windows, unit prices, and item numbers, but the primary shelf price is not always reliably exposed in visible page text.
  - Rows may therefore have a product name, item number, validity, and unit-price text while `priceText` / `priceValue` remains null.
  - This source should not be used alone for “cheapest current product” comparisons unless rows without primary prices are filtered or separately handled.
  - Item numbers help identity, but they are retailer-local identifiers, not canonical product IDs across shops.
- Recommendation:
  - Good second real public-page crawler candidate.
  - Prefer `szuper-akciok-mindennap` before brochure or storefront API work.
  - Treat the Roksh storefront endpoints as internal public-app APIs, not as an officially open API, unless documentation or permission is found.
  - Do not emulate authenticated, private, geolocation-bypassing, or account-specific behavior.

### COOP Hungary

- Candidate path: `https://www.coop.hu/akcios-termekek/`
- Implemented source:
  - Source name: `coop-hu-offers`
  - Acquisition method: rendered/public offer page fetch through Playwright.
  - Raw snapshot shape: rendered HTML and visible body text retained together because the page contains sequential product text and cookie/banner/navigation noise.
- Observed shape:
  - The page exposes highlighted weekly offers with validity dates, product text, prices, unit prices, and coupon-specific sections.
  - The data volume and structure are smaller and noisier than PENNY or ALDI.
  - COOP currently renders offer data as sequential visible-text lines rather than one compact product row:
    - product name
    - primary price, for example `369 Ft/db`
    - unit price, for example `1 845 Ft/kg`
    - optional purchase condition
    - optional `KUPONOS ÁR!`
    - optional coupon price and coupon unit price
    - optional store-scope or club-card note
- Data currently crawled/promoted:
  - Product display name / raw name from sequential visible text.
  - Primary current offer price text and numeric HUF price where the next line after the product name is parseable as a price.
  - Unit-price text where the following line is parseable as a non-`db` unit price.
  - Valid-from and valid-to dates from the active offer validity window.
  - Coupon price text when a `KUPONOS ÁR!` block is detected.
  - Free-text notes/description for purchase conditions, COOP Klub requirements, or store-scope restrictions where visible.
  - Raw text snippet per parsed offer in metadata because COOP rows are noisy and need inspectability.
  - Source URL, source name, source record identity, observation timestamp, country code `HU`, and currency `HUF`.
- Missing or intentionally not crawled:
  - No full COOP product catalog.
  - No reliable store-level availability. COOP notes may say an offer is valid only in certain COOP store types, but the crawler does not resolve this into exact store coverage.
  - No account-specific Coop Klub entitlement verification.
  - No images, brochure parsing, or deep promotion pages.
  - No original/old price tracking unless visible and explicitly parser-supported later.
  - No guarantee that coupon prices are directly comparable to normal offer prices, because they may require coupons, loyalty membership, minimum quantity, or specific store formats.
- Limitations:
  - COOP is a useful backup/proof source, but not a rich coverage source.
  - Parsed rows may include coupon-related notes that require downstream filtering before price comparison.
  - Coupon price is metadata, not the default `priceText`, to avoid silently mixing normal offer prices and loyalty/coupon prices.
  - Store-scope restrictions are text-only today; downstream logic must not treat every COOP row as nationally valid without checking notes.
  - Because the page is noisy, parser changes should be regression-tested against saved visible-text fixtures.
- Recommendation:
  - Useful backup or small proof source.
  - Not the first source if the goal is rich product/price coverage.
  - Keep COOP in the source set for diversity, but down-rank it in confidence until store-scope and coupon semantics are modeled.

### SPAR Hungary

- Older candidate path: `https://www.spar.hu/akcioterv`
- Preferred current candidate path: `https://www.spar.hu/ajanlatok`
- Quick check date: 2026-07-01.
- Observed shape:
  - The older `akcioterv` page exposes limited offer text, product names, package or unit information, unit prices, and some promotion details.
  - The `ajanlatok` page lists many viewable/downloadable brochures for SPAR, INTERSPAR, SPAR market, City SPAR, and special catalogues.
  - On 2026-07-01 it listed current and upcoming PDFs with validity windows such as 06.25-07.01 and 07.02-07.08.
  - The page includes both "Mutasd PDF-ben" viewer links and "Letöltés" download links through `szorolap.spar.hu`.
- Recommendation:
  - Prefer the `ajanlatok` brochure/PDF path over the older `akcioterv` content.
  - Defer implementation until the PDF/brochure pipeline is proven with simpler sources.
  - Preserve brochure title, validity, flyer type/store format, viewer/download URL, content hash, and parser version.

### Lidl Hungary

- Main site: `https://www.lidl.hu/`
- Offer path checked: `https://www.lidl.hu/c/akcioink-csutortoktol/a10096929`
- Brochure path checked: `https://www.lidl.hu/c/szorolap/s10013623`
- Robots path checked: `https://www.lidl.hu/robots.txt`
- Implemented source:
  - Source name: `lidl-hu-brochure`
  - Acquisition method: public brochure index discovery, Lidl leaflet viewer API metadata, public PDF download, PDF.js text extraction.
  - Raw snapshot shape: one snapshot per food brochure PDF per crawl day, keyed by brochure slug and retaining extracted page text plus brochure metadata.
- Observed shape:
  - The site exposes clear offer and brochure navigation.
  - The brochure page lists current and upcoming flyers.
  - On 2026-07-01 the brochure page listed current/upcoming flyer links including "Akciós újság" and "Nonfood kínálatunk" entries for weeks 26 and 27.
  - On 2026-07-02 the public leaflet viewer API returned `pdfUrl`, flyer validity, page metadata, and related flyer metadata.
  - The PDF text is extractable but noisy: product names, prices, item numbers, validity labels, and boilerplate are interleaved.
  - The offer page did not expose product offer details cleanly in the fetched static text during the research pass; it looked more client-rendered or data-backed.
  - Robots disallowed some search/assets/numeric paths, but the checked offer and brochure paths were not obviously blocked from the fetched robots text.
- Data currently crawled/promoted:
  - Food brochure PDF metadata, including flyer id, slug, title, source URL, PDF URL, and validity window.
  - Lidl retailer item numbers as source-local identifiers where the parser can anchor a row.
  - Product-like display names reconstructed from nearby PDF text.
  - Package/unit-price label where a nearby package line exposes it.
  - Offer price observations only when the parser can identify a nearby price without guessing.
  - Source page number and raw nearby PDF text in row metadata/crawl context.
- Missing or intentionally not crawled:
  - Nonfood brochure PDFs are ignored for now.
  - Online-only pages or non-page metadata are ignored.
  - No product image ingestion.
  - No exact layout-coordinate parsing yet.
  - No guarantee that every item-number row is a clean product offer; review/noise filtering remains needed.
- Limitations:
  - The first parser prioritizes recall and traceability over perfect commercial semantics.
  - Many rows become product/source records without price observations because the nearby PDF text does not expose a confidently parseable price.
  - Item numbers are retailer-local, not cross-shop product identifiers.
- Recommendation:
  - Keep Lidl as a source-specific PDF/brochure crawler.
  - Review processed Lidl rows in admin UI before relying on them for price comparison.
  - Improve parser confidence with layout-aware extraction or page-image/OCR review only after the operator view makes noise easy to inspect.

### Tesco Hungary

- Candidate base path: `https://www.tesco.hu/akciok/akcios-termekek`
- Initial location URL: `https://www.tesco.hu/akciok/akcios-termekek/tesco-szupermarket-zirc`
- Quick check date: 2026-07-01.
- Catalog path checked: `https://www.tesco.hu/akciok/katalogusok`
- API/feed check date: 2026-07-01.
- Findings:
  - No documented public Tesco Hungary product/offers API or feed was found.
  - The location-tagged offers page returned HTTP 403 from the crawler runner.
  - The Tesco Hungary homepage and catalog page expose public catalogue/leaflet navigation.
  - The catalog page lists current/upcoming hypermarket and supermarket leaflets with online viewing and download affordances.
  - `bevasarlas.tesco.hu` is an online grocery application, but no public API documentation was found. Treat app endpoints as internal/public-app APIs unless Tesco documents or permits them.
- Recommendation:
  - Defer Tesco live product crawling.
  - Do not attempt header, IP, geolocation, or browser-fingerprint bypasses for the 403.
  - Revisit Tesco later as a brochure/PDF/catalogue source if the public catalogue media can be fetched normally or if Tesco provides permission/API documentation.
  - If Tesco returns later, keep Clubcard prices as `loyalty_card` observations with `programName: "Clubcard"` rather than default prices.

## Implemented Real Source Order

After the synthetic sources are implemented and reviewed, the current real-source sequence is:

1. PENNY public offers page: strongest first source for parseable current offers.
2. ALDI public offers page: useful second source, especially for validity windows, unit prices, and item numbers, but primary price coverage may be incomplete.
3. COOP public offers page: small/noisy backup source, useful for source diversity and parser hardening.
4. Processor pipeline for existing PENNY/ALDI/COOP snapshots before adding more sources.
5. Compact processed-offer UI so crawled prices can be reviewed before broader acquisition.
6. Lidl public brochure/PDF ingestion: implemented as first source-specific PDF source; needs admin review and parser-noise improvements before price comparisons rely on it.
7. Revisit SPAR through `spar.hu/ajanlatok` brochures after current data supports product/household feature work.
8. Revisit Tesco as catalogue/PDF work only if public catalogue media or explicit API/permission is available.

## Cross-Source Comparison Caveats

The first three real crawlers do not yet produce fully equivalent commercial truth.

- PENNY, ALDI, and COOP are all current-offer-page sources. They do not represent complete shop catalogs.
- Price comparability is uneven:
  - PENNY generally exposes current offer prices and unit prices.
  - ALDI may expose unit prices and item numbers while missing primary visible shelf price in some rows.
  - COOP exposes normal offer prices and sometimes coupon prices, but coupon prices may require loyalty/coupon conditions.
- Unit prices are text fields first. They should not be used for numeric comparisons until a normalized unit-price parser exists.
- Validity windows are source-page validity windows, not a guarantee that every individual item is available in every physical store.
- `sourceRecordId` values are source-local, not cross-retailer product IDs.
- Product names are retailer text, not canonical product names. Matching needs a later normalization/entity-resolution stage.
- Original/old prices are incomplete and retailer-dependent. Do not build savings claims until old-price semantics are explicitly modeled.
- Loyalty/card prices such as Tesco Clubcard and coupon prices such as COOP coupon offers are not default prices. Store them as separate price observations with eligibility metadata.
- Store-specific or location-tagged offers should remain tied to the source location/scope; do not silently promote them to country-wide availability.
- No crawler currently captures inventory, stock, replacement products, store-specific assortment, delivery availability, basket constraints, images, nutrition data, allergens, or legal product detail pages.
- Retained raw snapshots allow reprocessing after parser improvements, but downstream catalog rows should stay compact and explicitly versioned by parser/source.

## Source Review Checklist Extension

For each candidate real source, record:

- Source name and exact URLs.
- Acquisition method: static HTML, rendered HTML, sitemap, PDF, documented API, public-app API, or browser automation.
- Why this method is preferred over lower-risk alternatives.
- Robots.txt result and date checked.
- Known terms, restrictions, or unresolved legal/policy questions.
- Expected request volume, schedule, and cache/fingerprint behavior.
- User agent and source identification strategy.
- Raw snapshot retention shape and fields promoted into catalog records.
- Parser version, source adapter version, and deterministic fingerprint strategy.
- Failure behavior when layout changes, access is denied, redirects appear, cookie banners dominate visible text, or expected fields disappear.
- Nullability contract for missing current price, old price, unit price, validity, coupon price, and item/source identifiers.
- Whether coupon, loyalty, quantity, or store-format restrictions are default prices, metadata-only prices, or excluded.
- Feature flag, allowlist, rollback, and takedown path.

## Followups

- Update this note when a source is approved, rejected, disabled, or materially changes.
- Add links to source-specific plans or session notes once real-source work starts.
- Add saved HTML/visible-text fixtures for PENNY, ALDI, and COOP so parser regressions can be tested without live crawling.
- Add parser contract tests covering missing primary price, missing unit price, coupon-only price, multi-item purchase conditions, and changed validity-window formats.
- Keep shop-specific implementation details in source adapters; keep this file focused on source selection and durable acquisition lessons.
