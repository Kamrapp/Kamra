# Stage 4 Extension: Manual Product Gateway Plan

Status: Draft plan for review

## Objective

Insert a manual product gateway before Stage 5 so crawled rows do not move directly into the catalog when source parsing is noisy or uncertain.

The gateway should let an admin review crawled rows one product at a time, inspect raw crawl context, edit the generated product candidate through normal fields or JSON, accept good candidates into the real catalog, or decline bad rows without writing products. The same product editor should also open from the Products view for existing catalog products, including update and delete actions.

## Context Read

- `AGENTS.md`
- `.agents/plan-template.md`
- `.agents/plans/initial-mvp-roadmap.md`
- `.agents/plans/2026-06-23-stage-4-synthetic-crawler-intake-plan.md`
- `docs/architecture.md` through targeted search results
- `docs/crawler-policy.md` through targeted search results
- `packages/kamra-api-server/src/ingestion/v1/contracts.ts`
- `packages/kamra-api-server/src/catalog/v1/contracts.ts`
- `packages/kamra-api-server/src/http/routes/ingestion-routes.ts`
- `src/app/site-admin/ingestion-admin.component.ts`
- `src/app/site-admin/ingestion-admin.service.ts` through targeted search results
- `src/app/product-lookup/product-catalog.component.ts` through current-session context

## Research Gate

Not needed before drafting this plan. This is an internal workflow and data-model adjustment using the existing Angular, MongoDB, and TypeScript stack.

A short implementation-time check of Angular form patterns and MongoDB write semantics may be useful, but no external standards or vendor behavior needs to decide the plan.

## User Requests

- Add a manual gateway before Stage 5 because crawled source content currently produces bad product names such as `50g`, `1,5% zsírtartalom`, or promotion text.
- The Crawl UI should list crawl snapshots that have not been processed yet.
- Admins should manually check each product-like crawled item before it is moved into the catalog.
- For each crawled item, generate the product-like processed content that would be written to the database, including prices and crawler-derived data.
- Show raw crawl context from the crawled row.
- Allow editing the temporary product candidate through normal UI fields.
- Also allow a text-based JSON edit field so an agent can copy, adjust, and paste candidate data back.
- Accepting a candidate should write it to the real database and mark that crawled item processed.
- Declining a candidate should mark that crawled item processed but not write a product.
- A crawl snapshot should count as processed only after all of its items have been accepted or declined.
- Do not edit raw crawled entries; edit only product candidates and existing catalog products.
- Reuse the same editor for existing products.
- The Products view should have an edit button in the first column.
- Existing product edit should support deletion, including connected records such as stocks and prices.
- Make the review flow simple and fast, close to "accept or adjust then accept" one-by-one review.
- Start by generating a Stage 4 extension plan file.

## Discovery Questions

The user settled the main implementation decisions after the first draft: conservative matching is reused, existing matches must be visible in the editor, product deletion may hard-delete catalog records, decline uses a reason dropdown, candidate JSON is full-document editing, products need validation state, current existing products should default to unvalidated, and nightly processing should keep updating already validated products.

## User Decisions

- Raw crawl entries should not be edited.
- Row-level crawl items need their own processed/declined state.
- Manual review is required before moving noisy crawler output into catalog products.
- Existing products should use the same editor component and support deletion.
- Accepted crawl rows should reuse the current conservative matching rules. The editor must clearly mark when a candidate matched an existing product so the reviewer can avoid accidental merges.
- Existing product deletion may hard-delete catalog-side records for now.
- Declining a row should collect a reason through a dropdown.
- The JSON editor should accept full candidate JSON for v1, not partial patch snippets.
- The nightly processor should continue to run. It may automatically merge/update rows that confidently match already validated existing products; only new product candidates or uncertain matches need manual validation.
- Products need validation state so automated processing can tell which catalog products are trusted.
- Existing products should default to unvalidated because the current catalog already contains bad crawler-created product names.
- Automated matching must not use loose product-name-only matching. Safe automatic matches are GTIN/common identifier, retailer/source product keys, or similarly strong source identifiers. Name may be used only together with source context as a weak/manual-review signal, not as a standalone auto-merge signal.
- Automated processing must not freely change canonical product identity fields such as product name. Canonical name/category/measurement changes require validation.
- Concurrency safeguards can be documented as a limitation for now because only one admin uses the app.
- Review acceptance state should survive catalog product deletion.
- Declined items should be filterable and reopenable/reaccepted from the review UI.
- Products should support an "invalidate" action in addition to edit and delete, so an admin can quickly mark bad products untrusted without fixing them immediately.

## Current Reality

- Raw snapshots live in `ingestion_raw_snapshots`.
- Each raw snapshot contains `parsedRows: ParsedShopProductRow[]`.
- Current processing is snapshot-level:
  - `/api/admin/ingestion/process-snapshot` processes a whole snapshot.
  - `processSourceOfferSnapshot(snapshot)` writes a full `CatalogV1SeedDataset`.
  - `source_record_processing_states` tracks one state per source record fingerprint, processor name, and processor version.
- The processing workflow can currently process all pending raw snapshots or source-filtered snapshots.
- The Crawl UI lists snapshots and preview rows, and can trigger snapshot processing.
- The Products view lists processed catalog products and source offers.
- Product candidates are implicit inside processor output today. There is no first-class "candidate generated from one crawled row" model.
- There is no product validation/trust field, row-level review state, candidate JSON editor, existing product update route, invalidation route, or catalog-product cascade delete route.

## Intended Direction

Replace direct admin-triggered snapshot processing with a reviewed row gateway:

```text
raw ingestion snapshot
  -> parsed crawl row
  -> deterministic product candidate
  -> manual review item
  -> existing validated product match: nightly processor may update/link automatically
  -> new or uncertain product: manual review item
  -> accept: write catalog records and mark row accepted
  -> decline with reason: mark row declined without catalog writes
  -> snapshot processed only when every row is accepted or declined
```

Raw snapshots remain immutable source truth. Manual changes live in review-state records and catalog records.

Automated processing should become split-path rather than fully disabled:

- confident matches to already validated products can continue through nightly processing so price/source observations stay fresh
- new products, weak matches, and malformed candidates are held as pending review items
- accepted manual candidates become validated enough for future nightly runs to update them automatically
- existing products default to unvalidated until explicitly accepted/validated by an admin
- automated updates should update source offers, identifiers, prices, and stocks, but should not change canonical product identity fields unless the product goes through validation

## Scope

Included:

- Product validation/trust state on catalog products.
- Backfill/default behavior that marks existing products unvalidated.
- Row-level manual review state for crawled rows.
- Product candidate generation from one `ParsedShopProductRow`.
- Admin API to list pending review rows and selected snapshot review progress.
- Admin API to update a candidate draft from structured fields or JSON.
- Admin API to accept or decline one review item.
- Catalog write path for one accepted candidate.
- Processor routing that automatically updates already validated products only on strong identifier/source-key matches and queues new/uncertain products for review.
- UI indication when a candidate matched an existing product.
- Snapshot-level progress derived from row review states.
- Crawl UI changes to open a one-by-one product review popover.
- Shared product editor component for candidate review and existing catalog products.
- Products table edit button in the first column.
- Existing product update route.
- Existing product invalidate/validate route or update action.
- Existing product delete route with cascade cleanup for catalog-side connected records.
- Decline reason dropdown for crawl-row review.
- Documentation updates after implementation.

## Non-Goals

- No automatic correction of crawler parser bugs in this plan.
- No editing of raw snapshot rows or raw payload text.
- No broad product merge workflow.
- No household stock migration, because Stage 5 is not implemented yet.
- No public/non-admin product editing.
- No multi-admin conflict system beyond simple documentation and later followup; this is a known limitation while only one admin uses the app.
- No advanced undo history beyond raw snapshots and audit metadata.
- No generic moderation queue framework beyond the Stage 4 crawl-product gateway.

## Assumptions

- Manual review state should be stored separately from raw snapshots, not embedded into immutable raw snapshot documents.
- A review item can be identified by `snapshotId`, row index, row fingerprint, source name, and processor/candidate-builder version.
- Candidate generation should reuse current source-offer processor logic instead of creating a second mapper.
- Matching should reuse current conservative rules and should surface matched existing products in the editor.
- Automatic matching must be based on GTIN/common identifiers, retailer/source product keys, or equivalent strong source identifiers. Name-only matching is not allowed for automatic processing.
- Accepting a row should be idempotent: retrying the accept route should not duplicate product sources, identifiers, prices, or stocks.
- Declined rows should remain traceable to the raw snapshot and reviewer decision.
- Declined rows can be found through review-status filters and reopened/reaccepted if needed.
- Product deletion should hard-delete catalog query records connected to the product while preserving raw snapshots and ingestion history.
- Product deletion should not delete review records; accepted review items should tolerate missing/deleted product references.
- Existing products should default to unvalidated during the migration/backfill, then become validated through manual accept/validate actions.
- Automated processing may update source/product-source/price/stock data for validated products, but canonical product identity edits require manual validation.
- The first version can require admin login and does not need a separate permission role.

## Settled Decisions

- Accept/review should reuse the current conservative matching rules instead of always creating new products.
- The editor must show existing-product matches clearly before acceptance.
- Existing product deletion can hard-delete catalog-side records for now.
- Decline should use a reason dropdown.
- Candidate JSON editing accepts a full candidate document for v1.
- Nightly processing remains useful: it should automatically update/link rows that confidently match already validated products, while queueing new and uncertain rows for review.
- Products have explicit validation state.
- Existing products default to unvalidated.
- Product-name-only matching is not safe for automation. Use strong identifiers/source keys for automatic updates; use source-scoped names only as a manual-review signal.
- Canonical product name/category/measurement changes require validation.
- Concurrency is documented as a limitation for now because there is only one admin.
- Accepted review records survive product deletion.
- Declined review items are filterable and can be reopened/reaccepted.
- Products can be invalidated without immediate edit or delete.

## Open Questions

- Should accepted/declined review decisions also record an optional free-text reviewer note?
  - Recommended: add optional notes alongside the decline reason because they are cheap and useful for parser followups.
- Should price observations be editable in the first UI slice, or only product/source fields plus candidate JSON?
  - Recommended: normal fields for the core product/source identity and price list shown read-only at first, with JSON as the complete escape hatch.

## Side Suggestions

- Add keyboard shortcuts later: accept, decline, next, previous, focus JSON.
- Add a candidate diff preview later when editing an existing product.
- Add a cleanup script for deleting accepted catalog output created by one snapshot if review logic changes during development.

## Steering Notes

- This plan supersedes the Stage 4 assumption that a whole snapshot can be processed directly from the Crawl UI once the source parser runs.
- Workflow/manual script processing should be redesigned rather than removed: existing validated products may still be updated automatically on strong matches, but new or uncertain product creation should route through row-level review until parsers are trustworthy enough to bypass it.
- SPAR and Tesco remain deferred. This plan is about quality-gating current crawled data before Stage 5, not expanding sources.

## Proposed Data Shape

Extend `ProductRecord` with validation/trust state:

- `validationStatus`: `unvalidated`, `validated`, `invalid`
- `validatedAt`
- `validatedBy`
- `invalidatedAt`
- `invalidatedBy`
- `validationNote`

Initial migration/backfill rule:

- Existing products without a validation field default to `unvalidated`.
- Accepted crawl candidates should create or mark products as `validated`.
- Existing products can be manually validated or invalidated from the product editor.
- Invalid products should be excluded from automatic nightly update targets and, unless explicitly included by filter, from normal product lookup/review flows that need trusted data.

Add a new review collection, likely under the ingestion area because it gates raw rows before catalog writes:

- `ingestion_product_review_items`

Candidate fields:

- `id`
- `snapshotId`
- `rowIndex`
- `rowFingerprint`
- `sourceName`
- `sourceRecordId`
- `sourceProductKey`
- `capturedAt`
- `candidateBuilderName`
- `candidateBuilderVersion`
- `candidate`
- `candidateMatch`: no match, strong matched existing product id/name/reason, or uncertain match candidates
- `rawRowPreview`
- `status`: `pending`, `accepted`, `declined`, `failed`, `stale`
- `decision`: reviewer id/name, action, decline reason, optional note, decidedAt
- `acceptedCatalogProductId`
- `acceptedCatalogProductDeletedAt`
- `createdAt`
- `updatedAt`

Candidate model:

- canonical product draft:
  - name
  - brandName
  - kind
  - measurements
  - primaryCategoryKey
  - normalizedName preview
- source product draft:
  - sourceName
  - storeBrandKey
  - sourceProductKey
  - sourceProductName
  - productPageUrl
  - category label
  - identifiers
- offer/price draft:
  - price observations with kind, amount, currency, validity, unit price label, program name
  - country-wide stock/current price when safe
- origin:
  - raw snapshot id
  - source record id
  - source URL
  - capturedAt

Match confidence values:

- `strong_identifier`: GTIN/common identifier or equivalent shared identifier
- `strong_source_key`: retailer/source product key for the same source
- `source_scoped_name`: name plus source context, review-only signal
- `name_only`: review-only signal, never automatic
- `none`

Initial decline reasons:

- `bad_name`
- `bad_price`
- `duplicate`
- `non_product`
- `online_only`
- `unsupported_layout`
- `other`

## Implementation Steps

### Step 1: Add Review Contracts And Candidate Builder

- Goal: Introduce product validation state, a versioned product intake candidate shape, and row-level review record shape without changing raw snapshots.
- Files likely affected:
  - `packages/kamra-api-server/src/catalog/v1/contracts.ts`
  - `packages/kamra-api-server/src/catalog/v1/schemas.ts`
  - `packages/kamra-api-server/src/ingestion/v1/contracts.ts`
  - `packages/kamra-api-server/src/ingestion/v1/schemas.ts`
  - `packages/kamra-api-server/src/ingestion/processing/source-offer-candidate.ts`
  - `packages/kamra-api-server/src/ingestion/processing/source-offer-processor.ts`
  - `packages/kamra-api-server/src/ingestion/README.md`
- Validation:
  - product validation-status contract/schema tests
  - candidate builder tests for known good and noisy rows
  - schema/contract generation or validation tests if existing pattern applies
  - `npm run typecheck`
- Commit message idea:
  - `Add product validation and intake review contracts`

### Step 2: Add Validation Backfill And Review Persistence

- Goal: Default existing products to unvalidated and store one review item per parsed row, with idempotent creation from snapshots and status transitions for pending, accepted, declined, failed, and stale.
- Files likely affected:
  - `packages/kamra-api-server/src/catalog/current/mongo-catalog-repository.ts`
  - `packages/kamra-api-server/src/ingestion/current/mongo-ingestion-repository.ts`
  - `packages/kamra-api-server/src/ingestion/current/mongo-ingestion-repository.test.ts`
  - migration or setup/backfill script if needed
  - `packages/kamra-api-server/src/ingestion/v1/contracts.ts`
  - `packages/kamra-api-server/src/ingestion/v1/schemas.ts`
- Validation:
  - existing products without validation state are treated as unvalidated
  - repository tests for idempotent review item creation
  - status transition tests
  - snapshot progress count tests
  - `npm test -- packages/kamra-api-server/src/ingestion`
- Commit message idea:
  - `Backfill product validation and review state`

### Step 3: Add Review And Candidate Admin APIs

- Goal: Expose admin-only routes to prepare/list/retrieve/update/accept/decline review items.
- Proposed routes:
  - `GET /api/admin/ingestion/review-items`
  - `GET /api/admin/ingestion/review-item?id=...`
  - `POST /api/admin/ingestion/prepare-review-items`
  - `PATCH /api/admin/ingestion/review-item`
  - `POST /api/admin/ingestion/review-item/accept`
  - `POST /api/admin/ingestion/review-item/decline`
- Files likely affected:
  - `packages/kamra-api-server/src/http/routes/ingestion-routes.ts`
  - `packages/kamra-api-server/src/http/app-handler.ts`
  - `packages/kamra-api-server/src/http/app-handler.test.ts`
  - `api/admin/ingestion/*.ts`
  - `packages/kamra-api-server/src/catalog/current/mongo-catalog-repository.ts`
- Validation:
  - route tests for auth, not configured, not found, invalid JSON, candidate validation, accept, and decline
  - `npm test -- packages/kamra-api-server/src/http/app-handler.test.ts`
  - `npm run typecheck`
- Commit message idea:
  - `Add admin product review item API`

### Step 4: Write Accepted Candidates To Catalog One Row At A Time

- Goal: Refactor current processor write logic so accepting one candidate writes product, source product, identifiers, price observations, stock, and processing/review state idempotently, using the same conservative matching rules as automated processing and marking accepted products validated.
- Files likely affected:
  - `packages/kamra-api-server/src/ingestion/processing/source-offer-processor.ts`
  - `packages/kamra-api-server/src/catalog/current/mongo-catalog-repository.ts`
  - `packages/kamra-api-server/src/catalog/current/mongo-catalog-repository.test.ts`
  - `packages/kamra-api-server/src/catalog/v1/contracts.ts` if minor audit fields are needed
- Validation:
  - accept route integration tests
  - idempotent accept retry test
  - decline does not write catalog records
  - accepted candidate can intentionally attach to a clearly displayed existing product match
  - accepted candidate marks product validated
  - snapshot becomes processed only when every review item is accepted or declined
- Commit message idea:
  - `Promote reviewed crawl rows into catalog`

### Step 5: Redesign Automated Processor Routing

- Goal: Keep nightly/manual processing useful while preventing unreviewed new products from entering the catalog.
- Behavior:
  - rows that confidently match existing validated products by GTIN/common identifier, source product key, or equivalent strong identifier can update product sources, identifiers, prices, and stocks automatically
  - rows that would create a new product become pending review items
  - rows with uncertain matches become pending review items with match candidates shown in the editor
  - name-only matches are never automatic
  - source-scoped names may be surfaced as review hints, not automatic merges
  - canonical product name/category/measurement are not overwritten by automated processing
  - invalid products are not automatic update targets
  - declined rows stay skipped unless reopened from the review UI
  - accepted rows become eligible for future automated updates
- Files likely affected:
  - `packages/kamra-api-server/src/ingestion/processing/source-offer-processor.ts`
  - `scripts/process-ingestion.ts`
  - `.github/workflows/process-ingestion.yml`
  - `packages/kamra-api-server/src/catalog/current/mongo-catalog-repository.ts`
  - processing tests
- Validation:
  - existing-product matched row updates automatically
  - unvalidated or invalid matched product does not update automatically
  - name-only match is queued for review instead of automatic update
  - new-product row creates or updates a pending review item
  - uncertain-match row creates a pending review item
  - accepted row is updated automatically by a later processor run
  - declined row is not retried without being reopened
- Commit message idea:
  - `Route new crawled products through review`

### Step 6: Build Shared Product Editor Component

- Goal: Add a reusable admin product editor that supports candidate mode and existing product mode.
- UI behavior:
  - main fields on the left
  - raw crawl context and source data visible in candidate mode
  - existing product match shown prominently when the candidate is linked or likely linked
  - JSON editor on the right with parse/apply validation
  - decline opens a reason dropdown before submitting
  - clear accept/save/delete/decline/validate/invalidate actions where mode-appropriate
  - compact one-by-one review flow with next item loading
- Files likely affected:
  - `src/app/shared/product-editor.component.ts` or `src/app/site-admin/product-editor/`
  - `src/app/site-admin/ingestion-admin.component.ts`
  - `src/app/site-admin/ingestion-admin.service.ts`
  - `src/app/shared/resizable-table.component.ts` only if needed for layout consistency
- Validation:
  - `npm run typecheck`
  - `npm run build`
  - manual UI check with at least one pending crawl row
- Commit message idea:
  - `Add reusable admin product editor`

### Step 7: Wire Crawl Review UX

- Goal: Make the Crawl UI list pending snapshots/review counts and open the editor as a fast row-by-row review popover.
- Include:
  - only unprocessed or not-fully-reviewed snapshots by default
  - filters and counts for pending, accepted, declined, failed, stale
  - row review button
  - next pending item after accept or decline
  - raw context visible for debugging parser mistakes
  - matched existing product visible before accepting
  - decline reason dropdown
  - accepted/declined rows visible through filters
  - declined rows can be reopened/reaccepted from the editor
- Files likely affected:
  - `src/app/site-admin/ingestion-admin.component.ts`
  - `src/app/site-admin/ingestion-admin.service.ts`
  - `packages/kamra-api-server/src/http/routes/ingestion-routes.ts`
- Validation:
  - `npm run build`
  - manual UI check: prepare review items, accept one, decline one, verify counts
- Commit message idea:
  - `Review crawl products before processing`

### Step 8: Add Existing Product Edit And Delete

- Goal: Open the same editor from the Products table and support saving, validating, invalidating, or deleting existing catalog products.
- Include:
  - edit button in first column
  - product detail load route
  - product update route
  - product validate/invalidate action
  - product delete route
  - cascade delete catalog records:
    - product_sources
    - product_source_identifiers
    - price_observations
    - stocks
    - product_tag_assignments
    - product record itself
  - preserve ingestion raw snapshots and review records
  - preserve accepted review item state even if the linked product is later deleted
- Files likely affected:
  - `src/app/product-lookup/product-catalog.component.ts`
  - `src/app/product-lookup/product-catalog.service.ts`
  - shared product editor component
  - `packages/kamra-api-server/src/http/routes/catalog-routes.ts`
  - `packages/kamra-api-server/src/http/app-handler.test.ts`
  - `packages/kamra-api-server/src/catalog/current/mongo-catalog-repository.ts`
- Validation:
  - route tests for admin auth, update validation, validate/invalidate, delete cascade
  - invalidated products are excluded from trusted/automatic update paths
  - frontend build
  - manual UI check: edit product name, save, validate/invalidate, refresh, delete test product
- Commit message idea:
  - `Edit catalog products from product review`

### Step 9: Update Workflows And Documentation

- Goal: Make the Stage 4 plan and roadmap reflect the new manual gateway before Stage 5, and document how operators and nightly processing should use it.
- Files likely affected:
  - `.agents/plans/2026-06-23-stage-4-synthetic-crawler-intake-plan.md`
  - `.agents/plans/initial-mvp-roadmap.md`
  - `docs/ingestion.md`
  - `docs/frontend-ui.md`
  - `scripts/README.md` if scripts change
  - `.agents/sessions/2026-07-03-stage4-manual-product-gateway.md`
- Validation:
  - docs review
  - `npm run typecheck`
  - `npm run build`
- Commit message idea:
  - `Document manual product gateway workflow`

## Validation Plan

Automated validation:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- targeted API route tests for review item routes
- targeted ingestion repository tests
- targeted catalog repository tests for update/delete cascade
- `npm run build`

Manual validation:

- Load Crawl UI as admin.
- Prepare review items for a snapshot.
- Open first pending row.
- Confirm raw row context is visible.
- Edit candidate through fields.
- Copy candidate JSON, modify it, apply it, and see fields update.
- Accept one candidate and verify catalog product/source/price/stock records appear.
- Confirm accepted product is marked validated.
- Decline one row and verify no product records are written.
- Filter to declined rows and reopen/reaccept one.
- Confirm snapshot is not processed until all rows are accepted or declined.
- Open Products view.
- Edit an existing product through the shared editor.
- Invalidate a bad product and verify it is marked untrusted.
- Delete a test product and verify connected catalog-side records are removed.
- Confirm accepted review history survives after product deletion.

Data validation:

- Confirm raw snapshots are unchanged by review actions.
- Confirm accepted candidates retain origin references to snapshot/source row.
- Confirm declined rows remain auditable.
- Confirm existing products without validation state behave as unvalidated.
- Confirm nightly processing updates only validated strong matches.
- Confirm automated processing does not rewrite canonical product names.
- Confirm re-accepting an already accepted row is idempotent or rejected safely.

## Risks

- Review item state can drift from raw snapshots if parser versions change.
  - Mitigation: include row fingerprint and candidate-builder version; mark stale when fingerprint/version changes.
- Manual edits can create invalid catalog data.
  - Mitigation: validate candidate JSON and structured fields with the same server-side schema before saving.
- Existing direct snapshot processing can bypass the gateway if left unchanged.
  - Mitigation: redesign the processor route/script so it automatically updates only validated existing products and queues new or uncertain products for review.
- Product deletion can remove useful data accidentally.
  - Mitigation: admin-only route, explicit confirmation, raw snapshots preserved, and route tests for cascade scope.
- Existing unvalidated products can disappear from trusted flows until reviewed.
  - Mitigation: product filters should expose unvalidated/invalid products clearly so an admin can validate or fix them later.
- Lack of multi-admin concurrency protection can allow conflicting edits if more admins are added.
  - Mitigation: document the one-admin limitation now; add optimistic concurrency before broad admin access.
- Row-by-row review may be slow for large snapshots.
  - Mitigation: fast accept/decline controls and one-by-one next-item loading; batch approve can be a later feature after trust improves.
- Existing processors may need substantial refactoring.
  - Mitigation: first extract candidate generation from current processor, then reuse it from both manual gateway and any script path.

## Approval Checkpoint

Implementation should not begin until the user approves this updated plan. The remaining Open Questions are narrow UI/detail decisions and should not block the backend gateway shape if the recommended defaults are acceptable.
