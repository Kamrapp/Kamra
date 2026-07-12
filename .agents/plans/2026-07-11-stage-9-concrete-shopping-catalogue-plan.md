# Stage 9 Concrete Shopping And Catalogue Connection Plan

Status: In implementation (user-approved 2026-07-12). Execute one commit-sized slice at a time; manual/browser closeout remains tracked centrally.

## Objective And Classification

Extend the completed Stage 8 Home shopping experience with a concrete, single-shop Shopping Trip and the Shop Product/Price Observation/Ingestion review circle. Stage 8 already lets household users generate/edit/mark/finalize shopping lists and create Product-owned Stock Batches. Stage 9 adds shop selection, package/price matching, resumable trip state, finalized-trip purchase snapshots, and asynchronous admin review of unknown or changed product/price facts without making catalogue approval a prerequisite for household stock.

This stage contains the concrete shopping and catalogue work **after** the basic user loop. The required first slice is one manually administered Shop Market, a concrete Product/price choice or explicit unresolved line, a resumable Shopping Trip, and a finalized-trip ingestion submission. Reuse the existing Product/Batch command for household stock effects; do not duplicate or regress the Stage 8 Home finalization path. It deliberately excludes multi-shop optimization, receipt/OCR, sophisticated recommendation ranking, a complete catalogue-management suite, and infrastructure that has not earned its place through the first loop.

## Already complete before Stage 9

- Household Product Groups and Product-owned Stock Batches are the Home hierarchy.
- Product and Group target policies generate v2 Shopping Needs with the household-configured grouped-target behavior.
- Home generation exposes those needs in the existing editable shopping-list workspace.
- Users can edit planned/purchased quantities, mark bought lines, and finalize them.
- Finalization creates or reuses Household Products and acquires Product-owned Stock Batches transactionally, including Group impulse purchases.
- Household stock does not wait for catalogue or admin review.

Stage 9 must preserve these guarantees and only add the shop/trip/price/review context around them.

## Dependencies

- Stage 8 Product Groups with optional Group/Product target policies, reusable Household Product anchors, Product Concept hierarchy, Product Attribute filters, Product-owned Stock Batches, Stock Movement history, idempotent command protocol, household permissions, Shopping Needs, structured logging, and feature-toggle foundation are complete.
- Stage 8 user-side implementation is complete; manual/browser closeout remains tracked in the shared checklist. The Home compatibility list uses v2 Product Group data whenever it exists, while the old generator remains only as a compatibility fallback for households without v2 Products.
- Current ingestion/crawler review remains available; Stage 9 extends it rather than creating an unrelated moderation system.

Stage 9 treats `Household Product` as the reusable concrete household identity. A Purchase creates a new Stock Batch for that Household Product (or creates a manual Household Product first); the batch retains its own acquisition/expiry and immutable snapshot and automatically contributes through its Product Group membership. Stage 9 must not collapse Product identity, Household Product identity, an owner’s target policy, or Stock Batch history into one line item.

## Decision Boundary

The product decisions are fixed: one manually selected Shop Market and planned date per Shopping Trip; deterministic repeated-single-SKU selection; user overrides and unresolved/no-price states; append-only Price Observations; manual review before a shared catalogue change; no receipt/OCR, mixed-SKU, or multi-market optimizer.

The implementation must still choose the smallest representation that supports those decisions. Do not introduce a separate Shop Chain aggregate, generalized Ingestion Source administration, broad promotion workflow, or a public catalogue API merely because later stages may use them. Add a local seam only when a real configured market/source relationship or current Stage 9 command cannot otherwise be represented clearly.

## Repository Reality And Required Corrections

- `household_shops` is currently a country-labelled shopping helper containing `sourceNames` and `storeBrandKeys`; it is not a first-class catalogue/admin identity.
- Legacy `ProductSourceRecord` is effectively a Shop Product representation, but `sourceName`, retailer identity, ingestion method, and shop identity are conflated. Stage 9 writes only the final `ShopProduct` name/model; legacy terminology is confined to migration adapters.
- Ingestion v1 is hard-coded to Hungary/HUF in several contracts and validators.
- Catalogue `PriceObservationRecord` is product/source/location-specific and supports multiple price kinds plus validity dates, which is a useful base.
- Catalogue hydration currently keeps only the latest observation per price kind by `observedAt`; it does not determine applicability for a shopping date, validate currency/country, or expose stale/no-price reasoning.
- Crawl-review acceptance currently deletes existing price observations for the source product before writing the accepted candidate. That destroys history and must be replaced before prices drive plans.
- Product list output can show several source rows and latest per-kind values, but there is no manual product create route, manual shop-product association, manual price-observation workflow, applicable-price service, or price-history/correction relationship.
- The Home compatibility list intentionally stores its editable display shell in the existing shopping-list collection, but v2 Product/Batch commands own generation and stock finalization. Stage 9 should introduce distinct Trip/Trip Item/Purchase snapshots and retire this compatibility shell only after the new trip path is proven.

## Stage 9 Domain Model

### Shop and shop market

Start with one `ShopMarket` aggregate for the selected country-specific market. It needs a stable id, display name, country, currency, status, and bounded source/provenance metadata. A separate `ShopChain` aggregate is justified only when multiple active markets must share and administratively edit a stable chain identity; physical branches remain post-MVP.

- `ShopMarket`: stable direct identity with normalized display/aliases inside one country, default currency, status, audit metadata, and an optional bounded chain label for display/provenance.

Price Observations, Shop Products, and Shopping Trips reference `shopMarketId`, not only a chain name. This prevents Hungarian evidence from being treated as valid in another country. A unique normalized alias within country prevents accidental duplicates. Physical branches, addresses, and branch stock are post-MVP.

Keep existing source metadata/provenance on Shop Products and Price Observations in the first slice. Extract a dedicated `IngestionSource` record only when more than one active source needs independent lifecycle or review management for the same market. Source type must never define shop identity.

Do not hard-code a marketing list of “supported” shops. Migration/seed creates active Hungarian markets only for real configured sources that survive the Stage 10 data-quality check (currently candidates include Lidl, PENNY, ALDI, and COOP; synthetic sources remain visibly synthetic). SPAR, Tesco, Auchan, or another chain can be created through admin and enabled when manual/source data exists, but the UI/docs must not imply crawler or price coverage merely because the chain record exists.

### Shop Product

Create the final `shop_products` collection and `ShopProduct` contracts. Migrate deterministic legacy `product_sources` records or rebuild them from preserved Crawl Snapshots; do not perpetuate the ambiguous name in new Stage 9 code:

- strong catalogue `productId` and `shopMarketId`
- retailer/source identifiers and source-local name/page
- status and last-confirmed/price-checked timestamps
- bounded source/provenance metadata

The same Product may have several Shop Products. One Shop Product may receive Price Observations from several source/provenance records; introduce separate Ingestion Source identities only when their independent lifecycle matters.

### Price observations and corrections

Keep price observations append-only. Extend semantics where needed:

- price kind distinguishes at least `base`, `offer`, `coupon`, `loyalty_card`, and `purchase_paid`; do not encode “old” price as current truth
- strong shop product, shop market, country, currency, observation timestamp, origin, and optional validity range
- optional `supersedesObservationId`/correction reason; correction appends a new observation and retires the erroneous one from applicable-price selection without deleting history
- normal shelf and offer prices from one submission are separate records linked by the same submission/observation-group id; offer validity applies only to the offer and never leaks onto the base price
- shopping trip lines preserve the exact selected price observation ids and immutable price/package calculation snapshot

Applicable-price service inputs: shop market, shop product, shopping date, pricing eligibility (ordinary/loyalty/coupon where supported). It:

1. excludes invalid/superseded observations and mismatched market/currency;
2. accepts dated prices only when the shopping date is within inclusive validity dates;
3. selects the eligible offer over base only when its conditions are understood;
4. uses deterministic observed/created/id tie-breaking;
5. labels base observations stale after a documented threshold rather than pretending they are current;
6. returns an explainable `applicable | stale | future | expired | no_price | conditional_only` result.

Stage 9 does not add charts or a full timeline UI. It provides enough paged history and correction context for admin review and shopping decisions.

### Shopping Trip and Trip Items

Create a distinct `household_shopping_trips` aggregate from Stage 8 Shopping Need snapshots.

Trip states:

- `draft`: imported Shopping Needs can still change
- `matching`: a synchronous/retryable translation command is in progress; operation receipt prevents duplication
- `ready`: Shop Market chosen and every Trip Item is selected, skipped, or explicitly unresolved
- `in_progress`: user is shopping
- `partially_processed`: at least one result recorded, with remaining lines unresolved
- `completed`: every Trip Item has a terminal result and stock/ingestion side effects are committed
- `cancelled`: no further normal mutation; history remains

Trip Item planning states:

- `unresolved`: generic Trip Item, no usable selection/Price Observation
- `selected`: concrete shop product plus calculation snapshot
- `skipped`: intentionally excluded

Trip Item result states:

- `pending`
- `bought`
- `not_bought`

State transition functions reject impossible combinations. Do not retain independent booleans that can say a Trip Item is both skipped and bought.

Each Trip Item preserves:

- Stage 8 Shopping Need target-policy owner (`product_group` or `household_product`), policy/shortage snapshot, and any historical classification reason snapshot
- required normalized quantity/unit
- selected Shop Product/Product and direct/effective match explanation
- package measurement, repeated package count, normalized unit price where calculable, expected applicable package price, and line total snapshot
- staleness/validity/conditional warnings
- actual product, quantity, paid price, optional normal shelf/offer observations, expiry splits, and result state
- created batch/movement ids and optional ingestion submission id after processing

## Matching And Fallback Algorithm

Stage 9 uses one manually selected `ShopMarket` and one planned shopping date.

For each non-skipped Shopping Need imported as a Trip Item:

1. Prefer active Shop Products for the Household Product already selected or linked by the user. Product Concepts may later suggest compatible alternatives, but Stage 9 does not infer Product Group membership or rewrite target-policy ownership from a classification match.
2. Require a package measurement convertible to the Shopping Need unit for automatic calculation. Products with unknown/incompatible package quantity remain manual candidates.
3. Evaluate applicable price and staleness for the shopping date.
4. For each priced candidate, calculate repeated units of one SKU: `packageCount = ceil(requiredQuantity / packageQuantity)` and expected total. Mixed-SKU/package optimization is deferred.
5. Choose the lowest expected total; tie-break by lower excess quantity, preferred product, fresher observation, then stable ids.
6. Store the explanation and calculation snapshot.

Fallbacks are first-class:

- user may replace any automatic choice with another market product
- manual search exposes matching and non-matching candidates with reasons
- no match may remain unresolved/generic and unpriced
- no applicable price may retain a chosen product with `no_price` and no expected total
- stale base price may be selected only with a visible warning/confirmation
- expired offer is never treated as current; a future offer applies only if the planned date is inside its range
- conditional coupon/loyalty prices are not default unless the user explicitly opts into the condition
- user may skip and later restore a Trip Item

The MVP does not compare multiple shops or choose a route.

## Manual Trip Completion

- The Shopping Trip is saved after each Trip Item result so it can be resumed.
- A bought Trip Item can change actual Product, quantity, package count, actual paid price, optional normal shelf price, optional offer price/validity, and one or more expiry Stock Batch splits.
- An unplanned purchase can be added with the same bounded fields.
- Unknown/manual product information creates household stock immediately using snapshots; catalogue review is asynchronous.
- Completing a bought Trip Item records Purchase/Purchase Item and finalized shop/price facts, then reuses the already-proven Product-owned Batch command. It also creates a structured Ingestion Submission whenever user-entered Product/shelf/offer facts could affect shared catalogue data. A new Batch inherits its Product Group automatically; it does not create a Stock Allocation. Even a known matched Product's user-entered price remains unvalidated until review; it is not selected as an authoritative applicable price immediately.
- Repeating the same operation returns the original result. Different content under the same operation id conflicts. Partial failure rolls back the Trip Item transaction.
- Correcting a completed trip uses explicit correction/reversal commands; it never edits movements or purchase history in place.

## Purchase Ingestion

Reuse the ingestion/review pattern but add a typed structured submission path rather than storing arbitrary private form bodies.

Submission includes only available bounded facts: shop market, names/brand/package, quantities/units, base and offer observations, offer dates, observed date, chosen catalogue/shop-product match, qualified seeded/custom concept and attribute refs, localized/default label snapshots plus source locale, source kind, sanitized original structured input, validation state, and opaque purchase/household references needed for traceability.

Rules:

- Household stock creation never waits for admin review.
- Submission is `pending`, `accepted`, `corrected`, or `rejected`; review changes catalogue links/future matching, never historical purchase/batch snapshots.
- Admin may link to existing product/shop product, create the minimum new product/shop product, correct structured fields, merge duplicate submissions, or reject.
- Household custom classification mapping/promotion is deliberately deferred. Review may preserve the submitted snapshot and link/create the minimum Product or Shop Product without making the user label globally authoritative.
- Missing translations do not block review. Admin chooses a canonical default label/locale and may add known translations; automated translation and a rich localization-management surface remain post-MVP.
- An accepted review appends price observations where appropriate; it never deletes existing history.
- Authorization keeps ordinary users within their household. Site admins can review submissions, but UI/logs avoid unnecessary household notes or identity data.

## Minimum Admin And User UX

### Site admin

- Manage the active country-specific Shop Markets, aliases, status, and bounded source metadata needed for the current sources.
- Create a minimal Product, associate it with a Shop Market as a Shop Product, and append/correct Price Observations.
- Review shopping submissions alongside crawler candidates using shared candidate/decision primitives where sound.
- Preserve custom concept/attribute suggestions as historical evidence without treating user labels as globally authoritative.
- See current applicable price, warnings, and a small paged observation list; no chart required.
- Archive rather than hard-delete Products/Shop Products/Shop Markets referenced by history.

### Household user

- Select one shop market and planned date.
- Translate, inspect, override, skip, or leave every Shopping Need/Trip Item unresolved.
  - See package size/count, normalized unit price where calculable, expected line total, validity/staleness, and why a product matched.
- Use a responsive in-progress list and resume manual completion.
- Record actual results, unplanned purchases, prices, products, and expiries without admin blocking.
- Receive clear loading, empty, no-match, no-price, stale, partial-success, conflict, and retry states.

## Data Model And Migration Strategy

Register stable maintenance entries before changing populated collections:

- `shop-market-foundation`: validator action creates the direct Shop Market and compatible Shop Product fields; migration maps each valid legacy `household_shops` country/brand grouping to a market, preserves bounded source metadata, and reports ambiguous duplicates for operator resolution. A separate chain/source collection is a later migration only when the active data proves it necessary.
- `price-observation-applicability`: validator action adds correction/status/market fields; migration backfills market references from source/location evidence where deterministic, preserves every observation, and marks unresolved scope rather than guessing. It must remove the destructive crawl-accept replacement behavior before cutover.
- `shopping-trip-foundation`: creates Shopping Trip, Trip Item, Purchase, Purchase Item, Ingestion Submission, operation, and required audit/index collections. Existing completed/archived legacy shopping lists remain historical; active Stage 8 Shopping Needs are imported by an explicit idempotent trip-create command rather than bulk reinterpreted as Purchases.

Validator and data completion are tracked independently. Migrations are idempotent and report scanned/created/updated/skipped/conflict counts. No Price Observation, completed legacy list, Purchase snapshot, or Stock Batch is physically deleted. The Stage 9 cutover does not dual-write the legacy completion path; after verification it is disabled and retained only as tested read compatibility until Stage 10 removal.

### Final persistence and API names

New Stage 9 persistence starts with `shop_markets`, `shop_products`, `price_observations`, `household_shopping_trips`, `household_purchases`, `ingestion_submissions`, and existing operation/audit collections. Add `shop_chains` or `ingestion_sources` only when the current data/commands need their independent identity. Trip Items and Purchase Items may be embedded in their owning aggregate for MVP atomicity; if document bounds require separate collections, implementation must pause and update this plan rather than choose ad hoc.

The resource surface is:

- `/api/admin/shop-markets`; add chain/source administration routes only if their separate identities are introduced by an approved later slice
- `/api/admin/products`, `/api/admin/shop-products`, `/api/admin/price-observations`
- `/api/households/{householdId}/shopping-trips` plus explicit match/start/item-result/complete/cancel/correct commands
- `/api/admin/ingestion-submissions` plus explicit link/create/correct/reject commands

Do not introduce `/product-sources`, `/shopping-lists`, `/requirements`, or `/shopping-completion` aliases for new clients. Exact command suffixes and status/error codes are locked in Step 4 contract snapshots before Angular implementation.

## Ordered Implementation And Commit Boundaries

Execution rule for budget-focused implementation models: complete one numbered step only, use the final vocabulary in `docs/domain-language.md`, and inspect only the owning slices listed below plus their nearest `AGENTS.md`/README. Add focused domain/state tests where behavior is non-trivial or high risk; do not add scaffolding that only restates framework behavior. Run focused tests, typecheck, and lint for every step; run build and the configured database smoke for every schema/transaction step. Never add multi-market optimization, hidden fallback matching, destructive Price Observation replacement, automatic Product Candidate promotion, or a generalized shop/source framework before the direct one-market path proves it necessary. Stop and revise the plan if a required transaction is unsupported, a legacy record cannot map without inventing identity, or an operation cannot be made idempotent.

Implementation ownership map:

- shops/catalog: direct `ShopMarket`, `ShopProduct`, `PriceObservation`, applicability service, and the smallest site-admin UI; separate `ShopChain`/`IngestionSource` only when earned
- shopping: `ShoppingTrip`, `ShoppingTripItem`, matcher, state machine, completion commands, and household Shopping UX
- ingestion: minimum `IngestionSubmission`/review path and Product Candidate reuse where it already fits; no separate source registry or promotion adapter before current evidence needs it
- household: only the Stage 8 Product/Group/Batch/Movement commands invoked by purchase conversion; do not duplicate them in shopping
- database maintenance: validator action, idempotent data action, reconciliation, operator text; route handlers remain thin dispatchers

### Step 1 - Direct shop-market foundation

- Add the direct Shop Market contract, validator, repository, admin API/UI, uniqueness, migration from `household_shops`, and widen hard-coded HU/HUF ingestion boundaries only where the market contract requires it while keeping existing source adapters explicit.
- Likely files: catalog/shop contracts and repository slices, database-maintenance registry/actions, site-admin shop-market components/services, locale files, focused tests/docs.
- Acceptance: duplicates cannot create the same active market; disabled markets cannot start new trips; historical references render. Add a separate chain/source entity only if a current record cannot be modeled without ambiguity.
- Commit: `feat: add country-specific shop market`

### Step 2 - Correct price-observation history and applicability

- Stop destructive observation replacement; add correction/supersession semantics and pure applicable-price service.
- Likely files: catalog Price Observation contracts/repository/domain service, crawl-review acceptance path, maintenance validator/data action, admin history/correction UI, tests.
- Acceptance: base and offer coexist, validity is inclusive/date-correct, overlapping observations resolve deterministically, stale/no-price/conditional states are explicit, shopping-date snapshots remain stable.
- Commit: `fix: preserve and evaluate price observations`

### Step 3 - Minimum product, shop-product, and price administration

- Add narrow admin create/associate/append/correct/archive workflows needed to supply a match manually.
- Likely files: catalog admin routes/services/repository, site-admin product/Shop Product/Price Observation forms, i18n, audit tests.
- Acceptance: admin can make one valid product available/priced in one market without crawler/database editing; history is not overwritten; authorization/audit pass.
- Commit: `feat: add minimum catalog price administration`

### Step 4 - Shopping-trip contracts and state machine

- Add Shopping Trip/Trip Item schemas, transition helpers, operation receipts, persistence indexes, and Stage 8 Shopping Need import.
- Likely files: new shopping domain/contracts/repository/route slice, database-maintenance action, contract/state/repository tests, shopping README.
- Acceptance: impossible states/transitions fail explicitly; one demand snapshot creates/reuses one draft trip idempotently; cancellation/history work.
- Commit: `feat: define resumable shopping trips`

### Step 5 - One-shop matcher and expected-price calculator

- Implement hierarchy-aware candidates, package normalization, applicable price selection, repeated-single-SKU calculation, deterministic cheapest selection, explanations, and fallbacks.
- Likely files: shopping matcher/calculator domain modules, catalog query interface, fixtures and pure tests; no Angular changes.
- Acceptance: matches/price/package/stale/no-price/conditional/tie cases pass; no multi-shop or mixed-SKU optimizer appears.
- Commit: `feat: match shopping needs to shop products`

### Step 6 - Concrete planning UI

- Add shop/date selection, match progress, selected/unresolved/skipped rows, override/search, explanation, and totals.
- Likely files: household shopping components/services, shared/parity contracts, locale files, focused browser/component tests.
- Acceptance: every automatic decision is replaceable; unresolved/unpriced lines remain usable; responsive/loading/empty/error/conflict states work in both locales.
- Commit: `feat: add concrete shopping plan workspace`

### Step 7 - Resumable manual completion and atomic stock conversion

- Add in-progress/partial completion UI and transactional Trip/Purchase result processing with actual substitutions, quantities, prices, expiry splits, and unplanned purchases. Invoke the existing Product-owned Batch command for stock effects rather than creating a second household finalization path.
- Likely files: shopping trip completion domain/service/repository/routes/UI, Purchase contracts, household command adapter, transaction/idempotency tests.
- Acceptance: later-expiring purchase creates a new batch through the existing command; retries never duplicate; injected failures roll back; trip resumes after partial processing.
- Commit: `feat: process shopping trips and finalize purchase facts`

### Step 8 - Minimum purchase ingestion and review

- Add the smallest structured submission and admin review/link/create/correct/reject path needed for unknown purchases. Preserve snapshots and audit/log coverage; defer household-to-global classification mapping/promotion until real reviewed submissions demonstrate that it is needed.
- Likely files: ingestion submission/review slices, site-admin review UI, locale/audit/authorization tests.
- Acceptance: unknown purchase enters stock immediately; later catalogue/classification decision changes future links but not history; base/offer remain separate; missing translation falls back; no raw arbitrary payload or user label becomes authoritative without review.
- Commit: `feat: review purchase ingestion submissions`

### Step 9 - Full Stage 9 workflow verification and docs

- Refresh seeds with one active market and only the priced/unpriced/stale/offer/manual cases needed to exercise the loop; add a second market only when a concrete Stage 9 behavior needs it. Update domain/ops docs and remove replaced v1 shopping completion.
- Likely files: seed manifests/fixtures, scripts README, shopping/catalog/domain docs, compatibility removal tests.
- Acceptance: Alpha scenario through reusable validated purchase data passes without DB editing; full automated/manual validation passes.
- Commit: `docs: close concrete shopping workflow`

### Current implementation checkpoint (2026-07-12)

- Step 4 domain contracts/state machine and Step 5 deterministic matcher are implemented and tested.
- Trip persistence and authenticated create/list/update routes are implemented; the existing Home compatibility list remains intact until completion processing is proven.
- Shop Product and append-only Price Observation repositories/indexes are implemented with a separate maintenance registry entry.
- Remaining Stage 9 implementation is the admin market/product/price surface, Trip planning/completion UI, transactional Purchase and Ingestion Submission path, review actions, seed coverage, and compatibility retirement tests.

## Testing Strategy

Manual/browser acceptance is tracked centrally in `.agents/plans/stage8-10-manual-acceptance-checklist.md`, including the Stage 8 prerequisite and Stage 9 journey. This plan must not grow a competing checklist.

- Pure tests: price applicability, package math, matching explanations/ties, Shopping Trip/Trip Item transition tables, correction semantics.
- Contract/schema snapshots: Shop Market, Shop Product, Price Observation, Shopping Trip, Trip Item, Purchase, Ingestion Submission, plus Ingestion Source only if it was introduced.
- Repository/integration: history append, transaction rollback, idempotency, concurrent Trip Item processing, household isolation, admin boundaries, pagination/indexes.
- Browser: one-shop match/override/unresolved/skip, mobile in-progress use, partial resume, actual substitution, unknown purchase, admin review, repeat later trip.
- Date/currency: local shopping date boundaries, inclusive offer range, country/currency mismatch, stale threshold.
- Performance: bounded candidate and observation queries with realistic seeded volumes; no all-observation hydration for each product list.

## Explicit Deferrals

- Multi-shop/store-route optimization: high value, post-MVP; single-shop validates matching and price semantics first.
- Mixed-SKU/package combinatorial optimization: later; repeat one SKU deterministically in MVP.
- Receipt/barcode/OCR: high-priority post-MVP; manual completion proves the domain first.
- Full offer timeline/charts and bulk editing: high-priority post-MVP; paged admin history is sufficient.
- Automated substitution/recommendation ranking: later; MVP matching is deterministic, Product/need-compatible, and overrideable.
- Physical branches and branch stock: later; country-specific chain markets are sufficient.
- Automatic ingestion promotion: later; manual review protects catalogue trust.

## Stage 9 Acceptance

Stage 9 is complete when one user can choose a shop, turn generic demand into a priced or explicitly unresolved plan, shop from it, resume and finish manual results, create correct batches/history without duplicates, submit unknown facts for review, validate them administratively, and reuse the trusted result in a later trip without direct database editing.

## Approval Checkpoint

Stage 9 implementation is approved. Keep each slice independently testable and preserve the Stage 8 Home compatibility path until the Shopping Trip path has equivalent purchase-finalization coverage.
