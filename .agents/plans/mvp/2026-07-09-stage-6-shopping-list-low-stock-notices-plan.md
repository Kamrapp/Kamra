# Stage 6 Shopping List And Low-Stock Notices Plan

Status: Implemented, browser verification pending

## Objective

Turn the Stage 5 household stock pulse into a deterministic shopping-list, low-stock notice, and purchased-item feedback loop.

By the end of Stage 6, a signed-in household member should be able to generate a shopping list from the selected household's stock rows, understand why each item was included, edit planned and purchased amounts, save observed prices, tick purchased items, update or create household stock from purchased items through an explicit stock-update action, keep unmatched household-local needs visible, and see simple in-app low-stock notices without depending on external notification channels or store optimization.

## Context Read

- `AGENTS.md`
- `.agents/planning-workflow.md`
- `.agents/plan-template.md`
- `.agents/coding-guidelines.md`
- `.agents/plans/mvp/initial-mvp-roadmap.md`
- `.agents/plans/README.md`
- `.agents/sessions/mvp/2026-07-09-stage-5-household-stock-foundation.md`
- `docs/household.md`
- `packages/kamra-api-server/src/household/README.md`
- `packages/kamra-api-server/src/household/v1/contracts.ts`
- `packages/kamra-api-server/src/household/v1/schemas.ts`
- `packages/kamra-api-server/src/household/v1/validation.ts`
- `packages/kamra-api-server/src/household/current/stock-status.ts`
- `packages/kamra-api-server/src/household/current/mongo-household-repository.ts`
- `packages/kamra-api-server/src/http/routes/household-routes.ts`
- `src/app/household/household-stock.service.ts`
- `packages/kamra-api-server/src/catalog/README.md`
- `packages/kamra-api-server/src/catalog/v1/contracts.ts`
- `packages/kamra-api-server/src/ingestion/processing/source-offer-processor.ts`

## Research Gate

Not needed before drafting this plan.

Reason:

- Stage 6 is mostly internal product logic over already-owned household data.
- No external notification provider, payment provider, source crawler rule, or current vendor behavior is being selected.
- Accessibility and broader notification-channel choices should be revisited when Stage 8 or post-MVP notification work starts.

## User Requests

- Create the plan for Stage 6.
- Incorporate the user's Stage 6 planning decisions about generated-list persistence, route shape, check-off behavior, stock updates, new household-stock creation from list items, editable list amounts, editable prices, and future-safe price observations.
- Incorporate the max-target shopping quantity rule: use per-stock ideal max limit when set, otherwise use `minLimit * household.defaultCalculatedMaxLimitMultiplier`, with household multiplier defaulting to `2`.
- Include a minimal household management page shell in Stage 6 and add a button next to the home pulse's active-household dropdown to navigate there.
- Resolve the household-only price observation bridge by storing custom household purchase price observations in a separate structure, to be converted into catalog `PriceObservationRecord` only during a later merge/promotion workflow.
- Resolve purchased-stock application by separating item check-off from stock updates: checked items gray out and remain editable; a separate shopping-list action updates household stocks from purchased items.
- Add optional generic shop selection for shopping lists, with seeded country-level shops such as `Lidl Hungary`, `PENNY Hungary`, `ALDI Hungary`, and `COOP Hungary`.
- Incorporate Stage 6 UX decisions: compact expandable in-store rows, one-line quick add, editable stock-application date beside the update button, exact quantities, and a full scrollable list instead of top-three urgency truncation.

Relevant previously approved direction:

- Stage 6 should build on Stage 5 household stock rows and shopping-scale preview levels.
- Shopping-list generation should use deterministic core logic that is easy to test outside UI and server adapters.
- Missing catalog products and unknown unit/package situations must remain explicit instead of being hidden.

## Discovery Questions

No blocking questions were asked before drafting because the roadmap and `docs/household.md` already define the main direction.

Questions that can still be steered before approval:

- Should "Stock 'em up!" include all steady items exactly as candidates, or only steady items with a positive minimum limit?

## User Decisions

- Persisted generated lists should store both stable item ids and display snapshots.
- The API should expose separate preview and create operations, while reusing shared generator/core logic as much as is meaningful.
- Suggested shopping quantities should target an ideal maximum, not just the shortage to minimum.
- Each stock item should support an optional ideal max limit.
- Each household should store a default calculated max-limit multiplier, defaulting to `2`, used when a stock item has no ideal max limit.
- Stage 6 should include shopping-list check-off state.
- Ticking purchased shopping-list items should not update household stock by itself.
- The separate stock-update action should increase existing household stock or create new household stock rows when the list item is not yet tracked at home.
- Shopping-list item amounts should remain editable at any time before stock update because the household may buy more or less than originally planned.
- Shopping-list item prices should be editable and saved because observed prices may differ at purchase time.
- Saved shopping-list prices should feed proper price-observation data with future catalog merging in mind.
- Household-only/custom item prices should be stored as separate household purchase price observation objects, not as catalog `PriceObservationRecord` records.
- Household custom price observations should carry enough matching hints for later merge/promotion, including item name snapshot, optional GTIN, optional source/product-source identifiers when known, optional shop id, and observed price data.
- Catalog content should remain detached from household content in Stage 6; household and shopping-list functionality should become complete independently from crawler/catalog pricing.
- A later merge workflow can convert household custom price observations into real catalog price observations after product/source identity is resolved.
- Low-stock notices can be generated through the shopping-list route first instead of bloating the household stock page response.
- Shopping-list lines should have a simple checkmark at the beginning. Ticked lines gray out but remain in the list and stay editable.
- Changing a shopping-list line amount should save/update that amount immediately.
- Updating household stock from shopping-list purchases should happen through a separate button in the shopping-list block.
- If the stock-update button is pressed while some list entries are not ticked, show a confirmation popup.
- The confirmation popup should offer "tick everything and update stocks", "update only ticked items", and "cancel" when the feature toggle `allowAutoTickingAllShoppingListEntries` is enabled.
- `allowAutoTickingAllShoppingListEntries` should default to enabled.
- If `allowAutoTickingAllShoppingListEntries` is disabled, the popup should still appear but only confirm updating stocks from ticked items or cancel.
- Completing the stock update should add purchased amounts to existing household stock or create stock rows for list-only items.
- Generic country-level shops should be managed separately from households and catalog products.
- Stage 6 should seed generic shops for the current crawler/source set, including PENNY Hungary, ALDI Hungary, COOP Hungary, and Lidl Hungary.
- Crawled/source data should be connectable to these generic shops where current source identity already supports it.
- A shopping list should optionally reference one generic shop selected from a dropdown of existing shops.
- A shopping list may also have no shop selected, because users may shop somewhere not yet represented in Kamra.
- A household should eventually support a favourite shop that defaults new shopping lists, but Stage 6 should keep the favourite empty until the household management page owns settings.
- Household management should get a minimal page shell in Stage 6, but inviting members, renaming households, and editing household settings can stay deferred.
- The home pulse should include a small navigation button next to the active-household dropdown that opens the household management page for the selected household.
- Shopping-list UI should default to a compact in-store checklist layout.
- Price and extra details should be expandable per shopping-list row on tap/click.
- Shopping-list UI should include a one-line quick-add row for impulse/manual purchases.
- When applying purchased items to household stock, the stock-application date should default to the current date/list date.
- The stock-application date should be shown next to the stock-update button and be editable there, avoiding a separate popup for date selection.
- Generated and stored quantities should remain exact in Stage 6, with no nice-rounding behavior.
- Low-stock/shopping-list display should keep the full scrollable list instead of showing only a top-three urgent preview.

## Current Reality

- Household stock exists under `packages/kamra-api-server/src/household/`.
- The server returns active household stock rows with deterministic `stockStatus` values: `below_limit`, `at_limit`, `low_soon`, and `steady`.
- The home page already sorts stock rows by priority and includes a three-level shopping-scale preview:
  - `Business as usual`: below-limit and at-limit rows.
  - `Keep it chill`: below-limit, at-limit, and low-soon rows.
  - `Stock 'em up!`: every tracked active row.
- The shopping-list action still shows a coming-soon toast.
- Household-local products can exist without catalog links. This must remain a first-class path.
- Optional product metadata exists on household rows: catalog snapshot, GTIN, source name, source URL, stock group key, and note.
- Household stock rows do not yet have an ideal max limit.
- Household records do not yet store a default calculated max-limit multiplier.
- The API currently has household list and stock CRUD routes, but no shopping-list route or collection.
- There is not yet a dedicated household management page for rename, invites, or household-level settings.
- The catalog model already has `price_observations`, but `PriceObservationRecord` currently requires catalog `productId` and `productSourceId`, so household-only items need an intentional bridge instead of ad hoc price fields.
- There is not yet a generic shops collection or source-to-shop seed.
- Shopping lists do not yet have an optional shop reference.
- There is no feature toggle yet for allowing "auto-tick all" when finalizing a partially checked shopping list.
- The home page and admin dashboard additions are putting pressure on Angular bundle and component CSS budgets. Stage 6 should avoid broad UI bloat where practical.

## Intended Direction

Stage 6 should make shopping-list generation a reusable household domain capability, not a UI-only calculation.

Stage 6 should also become the first safe feedback loop from real household shopping behavior into Kamra's data model:

- generated need
- editable shopping-list line
- ticked or unticked state
- explicit stock update from bought lines
- household stock update or stock-row creation
- household custom price observation capture that can later support catalog merging and product intelligence

The intended layering is:

- pure generator in `packages/kamra-api-server/src/household/current/`
- versioned contracts and validation in `packages/kamra-api-server/src/household/v1/`
- membership-checked API route slice under `/api/household/...`
- household custom purchase price observations for household-only items
- generic shop records that shopping lists and crawler/source records can reference where identity is known
- catalog price-observation integration only for catalog-linked cases where a catalog/source identity already exists
- thin Vercel function adapters only if new route files are needed
- Angular service boundary in `src/app/household/`
- home page UI that consumes the route output without duplicating generation rules

## Scope

Included:

- Define shopping-scale contract values matching the Stage 5 UI levels.
- Define shopping-list item reason codes and a stable generated-list response shape.
- Add a pure generator that accepts household stock rows plus shopping scale and returns ordered list candidates.
- Add an optional ideal max limit to household stock rows.
- Add a household-level default calculated max-limit multiplier with a default value of `2`.
- Use `idealMaxLimit - currentAmount` when an item ideal max limit is set, otherwise use `(minLimit * household.defaultCalculatedMaxLimitMultiplier) - currentAmount` for suggested buy amount.
- Clamp suggested buy amounts so already-over-target rows do not produce negative purchase suggestions.
- Preserve catalog-linked and household-local-only rows in the generated output.
- Make unit/package uncertainty explicit in the generated output.
- Add focused tests for all scale levels, status inclusion, priority ordering, below-minimum quantity math, zero minimum limits, unknown catalog links, and unmatched household-local rows.
- Add a membership-checked preview route so the frontend can request generated output from the server.
- Add a membership-checked create route that persists a generated shopping-list snapshot after the output shape is stable.
- Store both stable source ids and display snapshots on persisted shopping-list lines.
- Add shopping-list line editing for planned amount, purchased amount, unit, ticked state, and observed price.
- Allow manual list lines that are not generated from existing household stock.
- Add checkmark/ticked state to shopping-list lines; ticked lines remain visible, gray out, and remain editable.
- Save line amount changes immediately.
- Add a separate "update stocks per purchased items" action that applies purchased quantities to household stock.
- Show the stock-application date next to the stock-update action, default it to the current date/list date, and allow inline editing before applying stock updates.
- For partially unticked lists, show the required confirmation popup before stock update.
- Add `allowAutoTickingAllShoppingListEntries`, defaulting to enabled, to control whether the popup can offer the "tick everything and update stocks" path.
- On stock update, add purchased amounts to existing household stock rows or create new household stock rows for not-yet-household-stock items.
- Store household-only/custom item price observations in a separate household purchase price observation structure with fields suitable for later catalog conversion.
- Save catalog-linked observed prices as catalog price observations only when the catalog product/source identity is already available and unambiguous.
- Add a generic shop model and seed generic shops for the current crawler/source set.
- Let shopping lists optionally reference one generic shop selected from existing shops.
- Keep shopping-list shop selection optional; `none` is valid.
- Add a household favourite-shop field but keep it empty and non-editable in Stage 6; document that the household management page should own it later.
- Add simple in-app low-stock notices based on the same generation output.
- Keep the shopping list as a full scrollable list, not a top-three urgent-only notice.
- Replace the Stage 5 coming-soon toast with the real generation flow.
- Add a minimal household management page shell and route.
- Add a home pulse button next to the active-household dropdown that navigates to the selected household management page.
- Document that future household management should include invite people, rename household, and subtle editing for the default calculated max-limit multiplier.
- Update English and Hungarian translations.
- Update `docs/household.md`, the household package README, and the roadmap/session notes as needed.

## Non-Goals

- External push, email, SMS, or scheduled notifications.
- Expiry dates, buy-before buffers, or consumption-rate forecasting. Those belong to Stage 8.
- Full household management behavior such as invitations, member administration, rename flow, or editable household settings.
- Store selection, route optimization, or price optimization.
- Automatic product matching against the catalog.
- Automatic global merging of household-local products into canonical catalog products without review.
- Converting household custom price observations into catalog `PriceObservationRecord` records.
- Full shop/address management or location-specific store selection.
- Required shop selection for shopping lists.
- Barcode scanning.
- Receipt or invoice import.
- Public registration, invitations, or external alpha access.
- Cross-household sharing.
- Completed-list analytics.
- Solving the existing Angular bundle and component CSS budget warnings except where Stage 6 changes naturally reduce them.

## Assumptions

- Shopping scale values will be stable internal strings, probably `business_as_usual`, `keep_it_chill`, and `stock_em_up`.
- Generated list output should include both a machine-readable `reasonCode` and a short UI-ready explanation key or summary.
- Exact purchasable package quantities are not reliable yet. Stage 6 should calculate a clear target amount from household stock thresholds and mark package/unit uncertainty without inventing package math.
- Suggested buy amount should use the item's `idealMaxLimit` when set.
- If `idealMaxLimit` is unset, suggested buy amount should use `minLimit * household.defaultCalculatedMaxLimitMultiplier`.
- The household default calculated max-limit multiplier should default to `2` for every household.
- If the calculated target is less than or equal to current amount, the suggested buy amount should be `0` while the reason can still explain broad-restock inclusion when the shopping scale includes the row.
- Stage 6 quantities should stay exact internally and in shopping-list editing. Do not introduce nice-rounding or package rounding yet.
- Persisted generated lists should be snapshots. Later stock edits should not silently rewrite older generated-list records.
- Persisted shopping-list lines should keep stable references where available: household stock item id, household product id, stock group key, catalog product id, source/product-source ids when present, plus display snapshots.
- Check-off should be a simple ticked/unticked state. Ticked lines gray out but remain visible and editable.
- Ticking a line should not immediately update household stock.
- Applying purchased list items to household stock should be explicit, button-driven, and idempotent. Re-clicking or reloading must not repeatedly add the same purchased amount.
- If a list has unticked entries when the user applies stock updates, the app must ask for confirmation. With `allowAutoTickingAllShoppingListEntries = true`, the popup can offer to tick all entries and update stock. With it disabled, the popup can only confirm updating ticked entries or cancel.
- Price capture should prefer separate household custom purchase price observations for household-only items. These observations should later be convertible into catalog `PriceObservationRecord` records during a merge/promotion workflow.
- Catalog `price_observations` should be written only for items already linked to a catalog product/source identity.
- Generic shops are country-level or source-level anchors such as `Lidl Hungary`; they are not address-specific shop branches in Stage 6.
- Shopping-list shop selection is optional, and missing shop means the observed price cannot be tracked for a specific shop yet.
- Household favourite shop should exist as an eventual setting but default to empty in Stage 6.
- Stock application should carry an editable `stockedAt`/application date that defaults to current date/list date.
- The full generated shopping list should remain visible in a scrollable list so users can prevent tomorrow's near-urgent items, not only today's top urgent items.
- Shopping-list prices are observations, not authoritative current catalog truth.
- Admin users should not bypass household membership for user-facing shopping-list routes.

## Open Questions

- N/A for the currently asked UX refinements; the remaining open product detail is whether `Stock 'em up!` includes every steady item or only steady items with a positive target.

## Side Suggestions

- Extract the home-page household UI into smaller components if Stage 6 makes `home.component.ts` noticeably harder to maintain.
- Add a tiny "why this is here" affordance for generated rows so reason codes become user trust, not just internal metadata.
- Consider naming the persisted object a "shopping trip" instead of only "shopping list" if purchase prices and stock application become the dominant behavior.
- Consider a tiny "last bought" hint on generated lines after the first completed list exists, if it can be derived without extra workflow complexity.
- Keep any "top urgent" summary as a possible later companion, not a Stage 6 replacement for the full scrollable shopping list.

## Steering Notes

- This plan chooses the stronger MVP interpretation: implement pure generation first, then add a small persisted snapshot flow.
- User steering expanded Stage 6 to include the first usable in-store loop: editable amounts, check-off, purchased-item stock application, not-yet-stocked item creation, and price capture.
- User steering settled household-only purchase prices as separate household custom price observation records, not forced catalog `PriceObservationRecord` records.
- User steering settled stock application as an explicit shopping-list-level action, separate from ticking individual items.
- User steering introduced optional generic shop selection for shopping lists and future household favourite-shop behavior.
- User steering accepted compact expandable list rows, quick-add manual row, exact quantities, editable stock-application date beside the update action, and a full scrollable list instead of top-three urgent truncation.
- If implementation quality drops because persistence, stock-update, or price-observation integration becomes too large, finish the preview/generation slice plus the smallest coherent persisted-list slice, leave the problematic part explicitly open in the session file, and ask for a Stage 6 split instead of forcing a messy collection shape.
- Catalog matching remains optional enrichment only. A household-local item with no catalog link should still be generated, displayed, and persisted.
- Price observations from shopping-list use must be future-proofed for later catalog merging. Do not hide them inside UI-only state or household notes.

## Continuation Refinement Plan

The 2026-07-10 refinement request expands Stage 6 with UX polish, product access changes, an About page, and a larger household/shopping layout refactor. Implement these as separate commits in this order so review can stay clean and rollback stays cheap.

### Refinement Commit 1: About Page And Shell Button

- Goal: Add the About page first, plus the bottom-right navigation button in the app shell/right panel.
- Files likely affected:
  - `src/app/app.routes.ts`
  - `src/app/about/` or another appropriate app-level page location
  - app shell/navigation component files
  - `src/app/i18n/en.json`
  - `src/app/i18n/hu.json`
  - `ftpcontent/index.html` if the public root-domain copy or app URL appears there
- Requirements:
  - Add a customer-facing, visually polished, single-view About page.
  - Use a strong Kamra visual/image treatment similar in spirit to the existing logo card, with supporting content instead of a marketing-only landing page.
  - Explain the main promise for real users: assisted household management, consumption tracking, generated shopping plans, and eventually optimized pricing/shop choice.
  - Add a short humble history note: the idea was born in Hungary from two friends wanting price checking and household planning to be less tedious around weekends, newsletters, and shopping planning.
  - Keep the history note human and modest: this is a random hobby project, not a grand startup claim.
  - Add a separate concise technical section for curious collaborators or recruiters.
  - Mention the stack and infra at a high level: Angular frontend, Node/shared server logic, serverless/Vercel function entrypoints, Render or equivalent hosted runtime pieces where applicable, MongoDB/NoSQL persistence, GitHub workflows, and cron-style ingestion workflows.
  - Explain that crawler/product-management and household/shopping modules are deliberately detached for rapid learning and development, while careful planning keeps them converging into one coherent service.
  - Link `https://github.com/Kamrapp/Kamra` without directly asking for random public contributions.
  - Update primary app URL references to `https://kamrapp.hu`; mention `https://api-kamrapp.vercel.com` and `https://project-qn32z.vercel.app/` only as minor fallback/direct-access details.
  - Add a bottom-right shell button such as "About the Kamra project"; keep it visually related to the existing floating user card, but anchored low on the right side.
- Validation:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- Commit message idea:
  - `Add Kamra about page`

### Refinement Commit 2: Session Navigation And Read-Only Product Access

- Goal: Fix cross-page access behavior before touching the household layout.
- Files likely affected:
  - `src/app/auth.service.ts`
  - app shell/navigation component files
  - `src/app/product-lookup/product-catalog.service.ts`
  - `src/app/product-lookup/product-catalog.component.ts`
  - `packages/kamra-api-server/src/http/routes/catalog-routes.ts`
  - `packages/kamra-api-server/src/http/app-handler.test.ts`
  - `src/app/i18n/en.json`
  - `src/app/i18n/hu.json`
- Requirements:
  - After logout, navigate back to `/` so users are not stranded on admin, ingestion, or other disabled pages.
  - Allow every signed-in user to view products and offer/source data needed for read-only product browsing.
  - Keep product editing, validation, invalidation, deletion, and review/admin operations admin-only.
  - If a basic user tries an edit-only action, show a clear toast that editing requires admin access.
  - Avoid weakening admin-only ingestion/review routes while opening product browsing.
- Validation:
  - focused catalog route tests for signed-in basic browsing and admin-only mutation
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- Commit message idea:
  - `Allow read-only product browsing`

### Refinement Commit 3: Small Household And Shopping Fixes

- Goal: Fix isolated household/shopping UI defects before the larger layout refactor.
- Files likely affected:
  - `src/app/home.component.ts`
  - `src/app/household/household-shopping-list.component.ts`
  - `src/app/household/household-stock.service.ts`
  - `src/app/i18n/en.json`
  - `src/app/i18n/hu.json`
- Requirements:
  - Fix the logged-out fake pulse content collision; the logged-out home view should look like the signed-in household pulse, using disabled interactions and minimal hardcoded data.
  - Make the "Manage household" navigation a proper button-style control that grows to fit text, with no underlined link treatment.
  - Keep "Current scale: ..." synchronized with the selected top-level shopping scale.
  - Ensure `Bought` starts at zero for generated shopping-list lines.
  - When a line is ticked and bought amount is zero, automatically set bought amount to the current planned amount.
  - When `allowAutoTickingAllShoppingListEntries` is disabled, make `Update only ticked items` the primary confirmation action.
  - Keep `Tick everything and update stock` as the primary confirmation action when the feature toggle is enabled.
  - Add a light/dark compatible faded red destructive button style family.
  - Use that reddish style for the confirmation close/cancel button and other destructive actions introduced later.
- Validation:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- Commit message idea:
  - `Polish household shopping controls`

### Refinement Commit 4: Household Shopping Layout Refactor

- Goal: Rework the main household page into the requested two-row workspace with a compact middle control band and separated shopping finalization actions.
- Files likely affected:
  - `src/app/home.component.ts`
  - `src/app/household/household-shopping-list.component.ts`
  - potentially new focused household components if the split improves maintainability
  - `src/app/household/household-stock.service.ts`
  - `packages/kamra-api-server/src/http/routes/household-routes.ts` if cancel/delete requires a new endpoint
  - `packages/kamra-api-server/src/household/current/mongo-household-repository.ts` if active-list cancellation needs repository support
  - `packages/kamra-api-server/src/http/app-handler.test.ts`
  - `src/app/i18n/en.json`
  - `src/app/i18n/hu.json`
- Requirements:
  - Main household page layout:
    - Top row: household stock overview/table on the left and stock editing on the right.
    - Middle compact band: shopping level selector, covered-item pulse/count, big generate-list icon button, and a vertical button stack for regenerate, refresh, and cancel shopping list.
    - Bottom row: shopping-list overview on the left and list-to-stock/finalization actions on the right.
  - Move the current top-row generation controls into the new middle band.
  - Extend the level selector with a fourth green bottom-most `Start fresh` entry and explanatory subtitle. This creates an empty shopping list meant to be built manually.
  - Highlight stock rows that would be included by the selected shopping level.
  - Add a final stock-table column with an add icon for adding that stock item to the current shopping list.
  - Disable row-level add-to-list when no shopping list exists and expose a hover/title note that a list must be generated first.
  - Keep generate/regenerate/refresh/cancel controls compact and same-width within their section.
  - Add cancel shopping-list behavior from the middle band and top/right area as a reddish action.
  - In the shopping-list overview, automatically order unticked rows first.
  - Move ticked rows to the end and group them into one collapsible purchased section.
  - Keep the active unticked list visually shrinking as items are ticked.
  - Move "Apply to stock on", "Update stocks per purchased items", and the confirmation choices into the right-side shopping finalization block.
  - Add a large upload-receipt button in that right-side block. Keep it inactive for Stage 6 and show a toast that receipt upload is coming soon.
  - Preserve compact expandable shopping-list rows and manual quick add.
  - Preserve optional shop selection, observed price editing, exact quantities, and membership rules.
- Validation:
  - focused backend tests if cancel/list mutation endpoints change
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - browser/manual check of desktop and mobile layout
- Commit message idea:
  - `Refine household shopping workspace`

### Refinement Commit 5: Stage 6 Documentation And Final Verification

- Goal: Close Stage 6 with documentation that matches the implemented behavior and the added About/product-access refinements.
- Files likely affected:
  - `docs/household.md`
  - `docs/architecture.md`
  - `.agents/plans/mvp/initial-mvp-roadmap.md`
  - `.agents/plans/mvp/2026-07-09-stage-6-shopping-list-low-stock-notices-plan.md`
  - `.agents/sessions/<current-session>.md`
- Requirements:
  - Document the implemented household shopping workflow, `Start fresh`, cancel-list behavior, ticked-row grouping, finalization block, receipt-upload placeholder, and read-only product access.
  - Document the About page content intent and URL changes.
  - Keep the stage boundary clear: receipt upload/import, full optimization, and rich household management remain future work.
  - Update the session handoff with validation results and any manual browser findings.
- Validation:
  - final Stage 6 validation set from this plan
  - browser/manual verification of logged-out home, logged-in household flow, product browsing as a basic user, logout redirect, About page, and admin feature toggler
- Commit message idea:
  - `Document Stage 6 refinements`

## Implementation Steps

### Step 1: Contracts, Shops, And Pure Generator

- Goal: Define the shopping-scale, max-target quantity rule, generic shop records, generated-list, persisted-list, checkmark line state, editable amount, and household custom price-observation contracts without API or UI coupling.
- Files likely affected:
  - `packages/kamra-api-server/src/household/v1/contracts.ts`
  - `packages/kamra-api-server/src/household/v1/validation.ts`
  - `packages/kamra-api-server/src/household/current/shopping-list.ts`
  - `packages/kamra-api-server/src/household/current/shopping-list.test.ts`
  - `packages/kamra-api-server/src/household/README.md`
- Notes:
  - Persisted line snapshots should include stable ids plus display snapshots.
  - Generated lines should carry reason codes, stock values, unit, max-target quantity, suggested buy amount, catalog hints, and uncertainty flags.
  - The pure generator should use per-stock `idealMaxLimit` first, then `minLimit * household.defaultCalculatedMaxLimitMultiplier`, defaulting the multiplier to `2`.
  - Editable/persisted lines should support a simple ticked state, with amount remaining editable after ticking.
  - Define a separate household custom purchase price observation contract for household-only/custom items.
  - Define generic shop contracts that can represent country-level shops such as `Lidl Hungary` without a specific address.
- Validation:
  - `npm test -- packages/kamra-api-server/src/household/current`
  - `npm run typecheck`
- Commit message idea:
  - `Add household shopping list generator`

### Step 2: Persistence Shape, Shop Seed, And Repository Support

- Goal: Add household threshold fields, generic shop persistence/seed data, custom household price observations, and a persisted generated-list snapshot model with editable line state and amount/price fields after the generated output shape is tested.
- Files likely affected:
  - `packages/kamra-api-server/src/household/v1/contracts.ts`
  - `packages/kamra-api-server/src/household/v1/schemas.ts`
  - `packages/kamra-api-server/src/household/v1/validation.ts`
  - `packages/kamra-api-server/src/household/current/mongo-household-repository.ts`
  - `packages/kamra-api-server/src/household/current/mongo-household-repository.test.ts`
  - `packages/kamra-api-server/src/seeds/`
- Notes:
  - Add household `defaultCalculatedMaxLimitMultiplier` with default `2` for new, existing, and seeded households.
  - Add household `favouriteShopId` as optional/empty for now, without editing UI in Stage 6.
  - Add optional stock item `idealMaxLimit`.
  - Add generic shop collection/schema/indexes if no suitable collection already exists.
  - Seed generic shops matching current crawler/source set: PENNY Hungary, ALDI Hungary, COOP Hungary, and Lidl Hungary. Synthetic test shops can stay clearly marked as synthetic if included.
  - Connect current crawler/source identities to generic shops where source identity is already deterministic.
  - Add household shopping-list collection schemas and indexes.
  - Add household custom purchase price observation schema/indexes separate from catalog `price_observations`.
  - Keep generated-list records as snapshots with schema/version metadata.
  - Store stable references where available: household id, stock item id, household product id, stock group key, catalog product id, source/product-source ids, and display snapshots.
  - Store editable planned amount, purchased amount, unit, ticked state, optional shop id, and observed price fields.
  - Allow manual list lines that are not generated from existing stock.
- Validation:
  - `npm test -- packages/kamra-api-server/src/household`
  - `npm run typecheck`
- Commit message idea:
  - `Persist generated household shopping lists`

### Step 3: Completion And Price Observation Core

- Goal: Add deterministic stock-update logic that applies purchased shopping-list lines to household stock and captures purchase prices in future-proof observation paths.
- Files likely affected:
  - `packages/kamra-api-server/src/household/current/shopping-list-completion.ts`
  - `packages/kamra-api-server/src/household/current/shopping-list-completion.test.ts`
  - `packages/kamra-api-server/src/household/current/mongo-household-repository.ts`
- Notes:
  - Ticking an item should only mark it as ticked and gray it out in the UI; it must not update household stock by itself.
  - The stock update operation should be a separate explicit list-level action.
  - If unticked entries remain, the stock update operation must require confirmation.
  - With `allowAutoTickingAllShoppingListEntries = true`, confirmation can tick every remaining item and update all lines, update only already ticked lines, or cancel.
  - With `allowAutoTickingAllShoppingListEntries = false`, confirmation can only update already ticked lines or cancel.
  - Updating stocks from an existing stock-backed line should add purchased amount once, not replace current stock silently.
  - Updating stocks from a list-only line should create a household-local product/stock row when no household stock exists yet.
  - Saving a line with custom/household-only price data should record a household custom purchase price observation with enough identity to support later catalog merging.
  - Catalog `price_observations` should only be written when the shopping-list line is already linked to a catalog product/source identity.
  - The stock update operation must be idempotent so retries do not duplicate stock additions or price observations.
- Validation:
  - `npm test -- packages/kamra-api-server/src/household`
  - `npm run typecheck`
- Commit message idea:
  - `Apply purchased shopping list items to stock`

### Step 4: Membership-Checked API Routes

- Goal: Expose preview/create/read/update/stock-update routes behind the same user membership rules as household stock.
- Proposed route shape:
  - `POST /api/household/shopping-list/preview`
  - `POST /api/household/shopping-lists`
  - `GET /api/household/shopping-lists/latest?householdId=...`
  - `PATCH /api/household/shopping-lists`
  - `POST /api/household/shopping-lists/update-stocks`
  - `GET /api/shops`
- Files likely affected:
  - `packages/kamra-api-server/src/http/routes/household-routes.ts`
  - `packages/kamra-api-server/src/http/app-handler.ts`
  - `packages/kamra-api-server/src/http/app-handler.test.ts`
  - `api/household/shopping-list/preview.ts`
  - `api/household/shopping-lists.ts`
  - `api/household/shopping-lists/update-stocks.ts`
  - `api/shops.ts`
- Notes:
  - Preview and create must stay separate route operations.
  - Preview and create must call the same generator.
  - Update should support amount, unit, ticked state, manual line details, optional shop id, and observed price edits.
  - Stock update should be explicit, list-level, confirmation-aware, and idempotent.
  - Shop listing can be public to signed-in users and should return generic shops, not address-specific locations.
- Validation:
  - `npm test -- packages/kamra-api-server/src/http/app-handler.test.ts`
  - `npm run typecheck`
- Commit message idea:
  - `Expose household shopping list routes`

### Step 5: Frontend Service, Home UI Flow, And Household Page Shell

- Goal: Replace the coming-soon toast with real list generation, keep the pulse scale as the input, show a usable shopping list with editable line amounts, prices, ticked state, optional shop selection, low-stock notices, and add the minimal household management page entrypoint.
- Files likely affected:
  - `src/app/app.routes.ts`
  - `src/app/household/household-stock.service.ts`
  - `src/app/household/household-management.component.ts`
  - `src/app/home.component.ts`
  - `src/app/i18n/en.json`
  - `src/app/i18n/hu.json`
- Notes:
  - Default the shopping-list block to a compact in-store checklist layout.
  - Keep price/details expandable per row instead of always visible.
  - Add a one-line quick-add row for impulse/manual purchases.
  - Generated list UI should let users adjust planned/purchased amount at any time, including after ticking.
  - Preserve exact quantities; do not round generated or edited amounts into "nice" display quantities.
  - Price fields should be optional and clearly an observed purchase price, not a guaranteed catalog price.
  - Ticked items should gray out but remain visible and editable.
  - Add an "update stocks per purchased items" button in the shopping-list block.
  - Show the stock-application date next to the stock-update button, defaulted to current date/list date, and make it editable inline.
  - If not every item is ticked, show the confirmation popup described in the decisions before updating household stock.
  - List-only items should be addable and then become household stock when stocks are updated from purchased items.
  - Add a shop dropdown with `none` as a valid selection.
  - Keep the list scrollable and complete; do not replace it with a top-three urgent-only view.
  - The stock editor should expose optional `idealMaxLimit` if doing so remains compact; if the UI gets noisy, keep the field in additional details and document the tradeoff.
  - Add a subtle household management navigation button beside the active-household dropdown in the pulse block.
  - The household management page can be a small shell showing current household identity and future sections for invite people, rename household, and max-limit multiplier settings; editing those settings is deferred.
  - Keep the UI compact; extract smaller components if the home component becomes hard to reason about.
- Validation:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - locale parity check for `src/app/i18n/en.json` and `src/app/i18n/hu.json`
- Commit message idea:
  - `Show generated household shopping lists`

### Step 6: Documentation And Closeout

- Goal: Document Stage 6 behavior, current limits, validation, and next-stage boundaries.
- Files likely affected:
  - `docs/household.md`
  - `docs/architecture.md`
  - `.agents/plans/mvp/initial-mvp-roadmap.md`
  - `.agents/plans/mvp/2026-07-09-stage-6-shopping-list-low-stock-notices-plan.md`
  - `.agents/sessions/<current-session>.md`
- Validation:
  - Review docs for consistency with implemented route names and UI labels.
  - Document the max-target quantity rule, `idealMaxLimit`, and `defaultCalculatedMaxLimitMultiplier`.
  - Document generic shops, optional shopping-list shop selection, and future household favourite-shop ownership.
  - Document household custom purchase price observations and their later conversion into catalog price observations.
  - Document that the household management page must later own invite people, rename household, and subtle household default multiplier editing.
  - Re-run the final Stage 6 validation set from this plan.
- Commit message idea:
  - `Document household shopping list foundation`

## Validation Plan

Minimum final validation:

```powershell
npm test -- packages/kamra-api-server/src/household
npm test -- packages/kamra-api-server/src/http/app-handler.test.ts
npm run typecheck
npm run lint
npm run build
```

Additional required checks:

- Verify locale parity for `src/app/i18n/en.json` and `src/app/i18n/hu.json`.
- Manually verify with seeded `usera`:
  - login succeeds
  - demo household stock loads
  - `Business as usual` includes below-limit and at-limit rows
  - `Keep it chill` also includes low-soon rows
  - `Stock 'em up!` includes steady rows
  - unmatched household-local rows remain visible
  - generated reasons are understandable
  - non-members cannot generate lists for another household
  - latest generated list can be read back
  - later stock edits do not mutate the stored generated-list snapshot
  - generated list lines can be edited before stock update
  - manual list-only lines can be added
  - quick-add row creates manual shopping-list lines
  - ticking a line grays it out but does not update household stock
  - ticked lines remain editable, and amount changes save immediately
  - stock update from purchased items increases existing household stock once
  - stock update from purchased list-only lines creates household stock
  - stock-application date defaults to current date/list date and can be edited inline before applying stock updates
  - repeated stock-update requests do not duplicate stock increments
  - stock update with unticked lines shows the required confirmation popup
  - `allowAutoTickingAllShoppingListEntries = true` exposes the "tick everything and update stocks" option
  - `allowAutoTickingAllShoppingListEntries = false` removes the "tick everything" option but still confirms partial update
  - observed price fields can be saved and read back
  - linked-product prices produce or queue proper catalog price-observation data when identity is already available
  - household-only purchase prices are stored as separate household custom price observations
  - generic shops are listed from the seeded shop set
  - shopping lists can be saved with a selected generic shop or with no shop selected
  - shopping-list rows are compact by default and expose price/details by expansion
  - quantities remain exact in UI and stored data
  - low-stock/shopping-list area remains a full scrollable list, not a top-three urgent-only summary
  - logged-out home uses the same household pulse shape with disabled controls and readable sample rows
  - manage-household navigation looks like a button, fits its text, and navigates to the household page
  - product browsing works for a basic signed-in user
  - product edit/mutation actions remain blocked for basic users with a clear toast
  - changing the shopping scale updates all related labels and inclusion highlights
  - `Start fresh` creates an empty list suitable for manual building
  - stock rows included by the current scale are highlighted
  - row-level add-to-list is disabled with a helpful note until a list exists
  - row-level add-to-list adds one stock item to an existing shopping list
  - generated shopping-list rows start with `Bought = 0`
  - ticking a row with zero bought amount sets bought amount to the planned amount
  - ticked rows move into the collapsed/expandable purchased group at the end
  - cancel shopping-list removes or archives the active list from the current shopping view
  - disabled auto-tick feature flag makes `Update only ticked items` the primary confirmation action
  - enabled auto-tick feature flag makes `Tick everything and update stock` the primary confirmation action
  - receipt upload button is visible but inactive and shows a coming-soon toast
  - logout redirects to the home route
  - About page renders well on desktop and mobile and uses `https://kamrapp.hu` as the primary app URL

## Risks

- Risk: The shopping-list item shape could become too large if it tries to solve package sizing, prices, catalog matching, and in-store behavior at once.
- Mitigation: keep Stage 6 item output focused on household need, reason, stock values, unit, optional catalog hints, and uncertainty flags.

- Risk: Persisted shopping-list collections may need schema changes soon after first implementation.
- Mitigation: keep persistence as a snapshot with explicit schema version and avoid pretending it is the final shopping-trip model.

- Risk: Completion can accidentally double-increment household stock if a request is retried or the user clicks twice.
- Mitigation: make stock update idempotent with durable line stock-application metadata and tests for repeated stock update.

- Risk: Household-only custom price observations can drift from the future catalog price-observation model.
- Mitigation: keep them separate but deliberately shaped for later conversion, with stable item name snapshots, optional GTIN/source hints, optional shop id, observed price, currency, and origin metadata.

- Risk: Automatically connecting household shopping to catalog/crawler data could pollute the main product dataset.
- Mitigation: do not create catalog records for household-only items in Stage 6; convert custom observations only through a later merge/review workflow.

- Risk: Shopping-list line editing plus stock updates could create confusing amount semantics.
- Mitigation: keep planned amount, purchased amount, and resulting stock delta separate in contracts and UI labels.

- Risk: The stock-update confirmation dialog could become annoying if it appears too often.
- Mitigation: keep it only for lists with unticked entries; make the action text explicit and feature-toggle only the "tick all" option, not the confirmation itself.

- Risk: Generic shops may be mistaken for exact physical branches.
- Mitigation: label them as country-level/generic shops such as `Lidl Hungary` and keep address-specific branch work out of Stage 6.

- Risk: The home component could become too large and harder to review.
- Mitigation: extract small UI helpers/components only when Stage 6 changes make the split obviously beneficial.

- Risk: Low-stock notices and shopping-list generation could drift if implemented separately.
- Mitigation: derive both from the same core generator and reason codes.

- Risk: Existing bundle and component CSS budget warnings could become noisier.
- Mitigation: avoid decorative UI expansion and consider a narrow component/style extraction if Stage 6 crosses another meaningful threshold.

## Approval Checkpoint

Implementation should not begin until the user approves this plan or asks for specific revisions.
