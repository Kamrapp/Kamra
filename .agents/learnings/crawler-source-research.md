# Crawler Source Research

## Purpose

Capture durable source-acquisition lessons for Kamra crawling work so Stage 4 and later real-source planning can reload the findings without repeating the same research.

This note complements:

- `docs/crawler-policy.md` for source safety and operational guardrails.
- `.agents/learnings/crawler-pipeline-patterns.md` for reusable pipeline architecture lessons.
- `.agents/plans/2026-06-23-stage-4-synthetic-crawler-intake-plan.md` for the current Stage 4 implementation plan.

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

## Real Hungarian Retailer Research

Research date: 2026-06-23.

These findings are scouting notes, not source approvals. Before enabling any source, perform the checklist in `docs/crawler-policy.md`.

### PENNY Hungary

- Main candidate path: `https://www.penny.hu/ajanlatok`
- Brochure path: `https://www.penny.hu/reklamujsag`
- Robots path checked: `https://www.penny.hu/robots.txt`
- Observed shape:
  - The offers page exposes product names, package sizes, validity dates, current prices, old prices, and unit prices in page text.
  - The brochure page links current and upcoming weekly flyers.
  - The fetched robots file only exposed a sitemap line during the research pass.
- Recommendation:
  - Best first real static-HTML crawler candidate.
  - Use a conservative parser over the public offers page before considering flyers.
  - Still record terms, final robots result, request volume, and disable path before enabling.

### ALDI Hungary

- Main candidate path: `https://www.aldi.hu/szuper-akciok-mindennap`
- Brochure path: `https://www.aldi.hu/online-akcios-ujsag`
- Storefront path observed: `https://shop.aldi.hu/`
- Observed shape:
  - The static offers page exposes product listings, validity windows, unit prices, and `Cikkszám` item numbers.
  - The item numbers are useful source-product keys.
  - The online brochure page links current and upcoming brochures through the ALDI flyer viewer.
  - `shop.aldi.hu` is a Roksh-powered Angular storefront. Its public JavaScript bundle references product-list, search, product-detail, provider, and session endpoints hosted under Roksh-related domains.
- Recommendation:
  - Good second real static-HTML crawler candidate.
  - Prefer `szuper-akciok-mindennap` before brochure or storefront API work.
  - Treat the Roksh storefront endpoints as internal public-app APIs, not as an officially open API, unless documentation or permission is found.
  - Do not emulate authenticated, private, geolocation-bypassing, or account-specific behavior.

### COOP Hungary

- Candidate path: `https://www.coop.hu/akcios-termekek/`
- Observed shape:
  - The page exposes highlighted weekly offers with validity dates, product text, and prices.
  - The data volume and structure look smaller and noisier than PENNY or ALDI.
- Recommendation:
  - Useful backup or small proof source.
  - Not the first source if the goal is rich product/price coverage.

### SPAR Hungary

- Candidate path: `https://www.spar.hu/akcioterv`
- Observed shape:
  - The page exposes offer text, product names, package or unit information, unit prices, and some promotion details.
  - Extraction looked less consistently structured; some headline price information may be image-heavy or less direct.
- Recommendation:
  - Defer until the static HTML parser and PDF paths are proven.
  - Revisit with a browser/text extraction check before choosing as a real source.

### Lidl Hungary

- Main site: `https://www.lidl.hu/`
- Offer path checked: `https://www.lidl.hu/c/akcioink-csutortoktol/a10096929`
- Brochure path checked: `https://www.lidl.hu/c/szorolap/s10013623`
- Robots path checked: `https://www.lidl.hu/robots.txt`
- Observed shape:
  - The site exposes clear offer and brochure navigation.
  - The brochure page lists current and upcoming flyers.
  - The offer page did not expose product offer details cleanly in the fetched static text during the research pass; it looked more client-rendered or data-backed.
  - Robots disallowed some search/assets/numeric paths, but the checked offer and brochure paths were not obviously blocked from the fetched robots text.
- Recommendation:
  - Do not start here for the first real source.
  - Investigate PDF/brochure extraction, an official data path, or browser automation only after simpler HTML sources are done.

## First Real Source Recommendation

After the synthetic sources are implemented and reviewed:

1. Try PENNY static HTML offers first.
2. Try ALDI static HTML offers second.
3. Keep COOP as a small fallback.
4. Revisit SPAR after parser maturity improves.
5. Revisit Lidl when the project is ready for brochure parsing, browser automation, or source-specific API research.

## Source Review Checklist Extension

For each candidate real source, record:

- Source name and exact URLs.
- Acquisition method: static HTML, sitemap, PDF, documented API, public-app API, or browser automation.
- Why this method is preferred over lower-risk alternatives.
- Robots.txt result and date checked.
- Known terms, restrictions, or unresolved legal/policy questions.
- Expected request volume, schedule, and cache/fingerprint behavior.
- User agent and source identification strategy.
- Raw snapshot retention shape and fields promoted into catalog records.
- Parser version, source adapter version, and deterministic fingerprint strategy.
- Failure behavior when layout changes, access is denied, redirects appear, or expected fields disappear.
- Feature flag, allowlist, rollback, and takedown path.

## Followups

- Update this note when a source is approved, rejected, disabled, or materially changes.
- Add links to source-specific plans or session notes once real-source work starts.
- Keep shop-specific implementation details in source adapters; keep this file focused on source selection and lessons.
