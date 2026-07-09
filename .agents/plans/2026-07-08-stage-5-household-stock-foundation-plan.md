# Stage 5 Household Stock Foundation Plan

Status: Completed on 2026-07-09

## Objective

Implement the first user-facing household stock foundation so signed-in users can create or access a household, maintain household stock items, and link those items to catalog products when useful.

This stage should turn the Stage 4 product pipeline into household value without treating shop/source stock as user-owned household inventory.

Closeout:

- Durable behavior documentation lives in `docs/household.md`.
- Roadmap status is updated in `.agents/plans/initial-mvp-roadmap.md`.
- Remaining shopping-list generation, notices, expiry, mobile, and catalog-linking enhancements are deferred to Stage 6, Stage 8, or post-MVP followups.

## Context Read

- `AGENTS.md`
- `.agents/plan-template.md`
- `.agents/plans/initial-mvp-roadmap.md`
- `.agents/plans/2026-06-23-stage-4-synthetic-crawler-intake-plan.md`
- `.agents/plans/2026-07-03-stage-4-manual-product-gateway-plan.md`
- `docs/ingestion.md`
- `packages/kamra-api-server/src/catalog/v1/contracts.ts`
- `packages/kamra-api-server/src/catalog/current/mongo-catalog-repository.ts` through targeted search
- `packages/kamra-api-server/src/http/routes/` through targeted search
- `packages/kamra-api-server/src/http/app-handler.ts`
- `packages/kamra-api-server/src/http/routes/auth-routes.ts`
- `src/app/product-lookup/product-catalog.component.ts` through current-session context
- `src/app/home.component.ts`
- `src/app/dev-admin/admin-dashboard.component.ts`
- `src/app/app.routes.ts`
- `src/app/household/` current filesystem state

## Research Gate

Not required before drafting. Stage 5 is an internal product/domain slice using the existing Angular, Vercel function, MongoDB, and TypeScript stack.

Use a short research gate only if a later implementation step introduces external invitations, email delivery, OAuth/social login, barcode scanning, or notification channels.

## User Requests

- Validate Stage 4 completion apart from skipped shops.
- Finish remaining Stage 4 items that are small enough to complete now.
- Document Stage 4 completion.
- Create the Stage 5 plan.
- A household may have multiple users.
- Household stocks can be created from custom household-local products, including generic names such as `liszt`, so users do not need to find a catalog product before tracking household stock.
- Add future planning notes for connecting household-local generic products to catalog products later, including creating reusable generic catalog products from household-local products.
- Add a reseedable demo household seed with `userA` and `userB` both belonging to `household1`.
- Seed Hungarian-nature household stock examples with current levels around, below, above, far above, and at zero relative to their minimum limits.
- Add a `Reseed demo household` action to the current health/admin menu view.
- Rework the health view into a four-rectangle admin page: seed/reseed actions, database health/validation, future feature toggles, and one empty reserved section.
- On the home page, a logged-in user should see real household stock data similar to the current fake home content.
- Home should show a `low soon` category for items around or below stock limits and an all-stock block.
- Stock entries should open a modal for managing stock, adding new household-local products with zero stock, editing the unit text, and quickly adjusting the minimum level with minus/input/plus controls.
- Add future notes for showing stock value and a shopping-list block with generation and actions such as `push to mobile`.
- Add a visible shopping-list generation placeholder on the home pulse with three preview levels: `Business as usual` includes below-limit and at-limit items, `Keep it chill` also includes low-soon items, and `Stock 'em up!` includes all tracked stock rows.
- Add a post-MVP note for a mobile app focused on shopping list management and invoice reading.
- Each household stock row should carry the date the stock was created/acquired, separate from audit metadata.
- Seeded stock rows should include realistic acquisition dates and initial amounts, for example buying 1 kg of bread two days ago and having 0.2 kg left now.
- Plan future consumption-rate analysis from acquisition date, starting amount, current amount, and later manual stock corrections.
- Consumption, limits, and low-stock prediction should be group-aware because concrete products such as `Pilos tej` and `Mizo tej` may both satisfy one household `tej` need.
- Keep future room for tag/group-based household limits where stocks connect to product groups or tags; generic household products can map 1:1 to their group at first.
- Manual user stock updates are the source of truth and should recalculate any projected consumption later, rather than predictions overwriting user-entered stock levels.

## Current Reality

- Stage 4 is complete for the current source set and manual gateway as of 2026-07-08.
- SPAR and Tesco remain skipped/deferred and are not Stage 4 completion blockers.
- The catalog model contains `stocks` with `StockLocationKind` values including `household`, but current household stock is fixture/prototype-shaped and not a real user household workflow.
- Product lookup already exposes `householdStockCount`, but there is no user-facing household stock page.
- `src/app/household/` exists as the intended frontend area, but there is no implemented household module yet.
- Existing API/auth work supports signed-in users, admin roles, persisted user profile preferences, and route-level authorization patterns.
- Catalog/source stock and household-owned stock need separate authorization and update paths.

## Intended Direction

Stage 5 should introduce household-owned state beside the catalog:

```text
signed-in user
  -> household membership
  -> household-local products
  -> household stock items
  -> optional catalog product link later
  -> current amount and minimum limit
  -> later shopping list and low-stock notices
```

Household stock may reuse small shared concepts such as quantity/unit values, but it should not reuse crawler/source stock writes directly. Source stock describes retailer availability or offer state; household stock describes a user's pantry state and must be protected by household membership.

The first user value should come from household-local, possibly generic product entries. A household can track `liszt`, `tej`, `vegyes lekvarok`, or `pelenka` immediately, even when no specific catalog product exists yet. Catalog linking is an enhancement path, not a precondition for tracking.

Stage 5 should also preserve enough stock history to support later consumption-rate estimates. It should record when stock was created or acquired and, for seeded/demo rows, the starting amount used to derive the current amount. Forecasting itself stays out of Stage 5, but the data model should avoid assuming that one stock row always equals one future planning limit.

## Scope

Included:

- Household records with owner/member metadata.
- Minimal household membership records.
- Multiple users can belong to the same household.
- Household-local product records for custom or generic household products.
- Authenticated API routes for listing households available to the current user.
- Authenticated API route to create a first household.
- Authenticated API routes for household stock item create, list, update, and delete.
- Household stock item fields:
  - `id`
  - `householdId`
  - `householdProductId`
  - `displayName`
  - optional `catalogProductId`
  - optional `catalogProductNameSnapshot`
  - `stockGroupKey`
  - `currentAmount`
  - `initialAmount`
  - `minLimit`
  - `stockedAt`
  - `unit`
  - optional `note`
  - audit fields for created/updated actor and time
- UI under `src/app/household/` for selecting/creating a household and maintaining item state.
- Support unmatched manual household-local products so users are not blocked by catalog coverage.
- Persist optional catalog link fields for later use; do not require a catalog product picker in the first Stage 5 implementation.
- Logged-in home page content backed by real household stock data.
- `Low soon` home block for items at or near their minimum limits.
- All-stock home block with item click/edit behavior.
- Household stock modal for adding local products, editing unit text, editing current amount, and changing minimum limits through minus/input/plus controls.
- A home pulse shopping-scale preview that changes the displayed candidate purchase count without generating or persisting a shopping list yet.
- Manual current-amount updates treated as authoritative stock truth.
- Reseedable demo household data for local/demo testing.
- Admin health view update with seed/reseed actions, database health/validation, future feature toggles, and one reserved empty block.
- Route/repository tests for user isolation and item CRUD.
- Documentation updates for household model, API behavior, and validation.

## Non-Goals

- No shopping list generation in Stage 5; that is Stage 6.
- Stage 5 may expose a non-persistent shopping-scale preview only; clicking generate should remain a placeholder until Stage 6 implements list creation.
- No low-stock notice engine beyond storing `currentAmount` and `minLimit`.
- No expiry dates or buy-before buffer logic; that is Stage 8.
- No public registration expansion.
- No email invitations, magic links, Google login, or social auth.
- No complex household roles beyond owner/member unless implementation discovers a blocking need.
- No barcode scanning.
- No automatic catalog matching from freeform household-local names.
- No required catalog product-picker UI in Stage 5.
- No bulk import/export.
- No store/source stock editing from household pages.
- No stock monetary value calculation yet.
- No automatic consumption-rate forecasting yet.
- No group/tag-based limit migration yet.
- No `push to mobile` shopping-list action yet.
- No mobile app implementation in Stage 5.

## Assumptions

- A user can own at least one household.
- A household can have multiple active user memberships.
- For the first implementation, creating a household makes the current user the owner/member.
- Admin users should use the same household workflow as normal users when testing household stock.
- Product links are optional because the catalog will remain incomplete and noisy during MVP development.
- Household-local products are the source of truth for Stage 5 stock rows; catalog products are optional links.
- Every household-local product should carry a stable stock group key, even when the first generic products map 1:1 to their group.
- `stockedAt` means the household/user-visible creation or acquisition date for the stock amount, while `createdAt` remains audit metadata for the database record.
- User-entered `currentAmount` is authoritative; later consumption forecasts must recalculate from manual updates rather than overriding them.
- Quantity comparison in Stage 5 can remain simple: preserve number plus unit, and do not try to normalize ambiguous package sizes yet.
- Household authorization belongs in the server routes/repository layer, not only in the Angular UI.
- Existing theme and localization controls should keep working without becoming Stage 5 scope.

## Proposed Data Shape

New collections:

- `households`
- `household_memberships`
- `household_local_products`
- `household_stock_items`

Draft records:

```ts
interface HouseholdRecord {
  createdAt: string;
  createdByUserId: string;
  id: string;
  name: string;
  status: "active" | "archived";
  updatedAt: string;
}

interface HouseholdMembershipRecord {
  createdAt: string;
  householdId: string;
  id: string;
  role: "owner" | "member";
  status: "active" | "removed";
  updatedAt: string;
  userId: string;
}

interface HouseholdLocalProductRecord {
  catalogProductId?: string | null;
  catalogProductNameSnapshot?: string | null;
  createdAt: string;
  createdByUserId: string;
  displayName: string;
  householdId: string;
  id: string;
  status: "active" | "archived";
  updatedAt: string;
  updatedByUserId: string;
}

interface HouseholdStockItemRecord {
  createdAt: string;
  createdByUserId: string;
  currentAmount: number;
  householdId: string;
  householdProductId: string;
  id: string;
  minLimit: number;
  note?: string | null;
  status: "active" | "archived";
  unit: string;
  updatedAt: string;
  updatedByUserId: string;
}
```

Future product-linking direction:

- household-local products may later link to concrete catalog products
- household-local generic products may later link to catalog-generic products
- useful household-local products may later be promoted into shared generic catalog products after admin review
- linking or promotion must preserve household history and should not rewrite past stock entries silently

## Demo Seed

Add a manually runnable and admin-triggerable reseed path that deletes and recreates the demo household data. It should be safe to run repeatedly so the demo can be reset after experiments.

Seed users:

- `userA`
- `userB`

Seed household:

- `household1`, with `userA` and `userB` as active members

Seed household-local products and stock levels:

| Product label | Unit | Minimum | Current | Scenario |
| --- | --- | ---: | ---: | --- |
| Kenyer | kg | 0.5 | 0.2 | below limit |
| Tej | l | 2 | 1.8 | just below limit |
| Vegyes lekvarok | uveg | 3 | 4 | just above limit |
| Pelenka | db | 40 | 0 | zero stock |
| Alma | kg | 0.4 | 1.2 | way above limit |
| Repa | kg | 0.2 | 0.25 | just above limit |
| Mososzer | l | 1 | 0.3 | below limit |
| WC papir | tekercs | 8 | 16 | above limit |
| Tojas | db | 6 | 5 | just below limit |
| Rizs | kg | 1 | 0 | zero stock |
| Cukor | kg | 1 | 2.5 | way above limit |
| Tusfurdo | flakon | 1 | 1 | at limit |

Use accent-free stable ids and units where that keeps scripts and fixtures simple. UI labels should use natural Hungarian text where appropriate, for example `Kenyér`, `Vegyes lekvárok`, `Répa`, `Mosószer`, `WC papír`, `Tojás`, and `Tusfürdő`.

## Revalidation Notes

Revalidated on 2026-07-08 for execution by a smaller-budget implementation agent.

The plan is executable sequentially if implementation follows these constraints:

- Treat each implementation step as one commit-sized unit.
- Do not start the next step while the current step has failing validation.
- Keep household-local products as the required product path; catalog linking fields are structural future-proofing only.
- Keep demo reseed scoped to stable demo ids only: `userA`, `userB`, `household1`, and the seeded household-local products/items.
- Keep the health/admin rework on a focused admin-dashboard surface under `src/app/dev-admin/` so the dev-admin boundary stays explicit.
- Prefer deterministic domain helpers for low-soon classification and demo seed data so frontend and API code do not duplicate business decisions.
- Use placeholder empty/loading data on new UI paths so the page does not blink or collapse during API reloads.
- Add or update nearby docs whenever a new package area, route group, or data-writing script/route is introduced.

Quality gates for every code step:

- Step-specific tests must pass before broad validation.
- `npm run typecheck` must pass after backend or contract changes.
- `npm run build` must pass after frontend changes.
- `npm test` and `npm run lint` should run before marking the whole stage complete, and sooner when shared behavior changes.
- If a step cannot finish within one agent budget, create/update a session handoff with completed files, failing validation, and the next smallest action.

Budget-agent context rule:

- Every implementation session should read `AGENTS.md`, this plan, and only the files named in the active step plus immediate adjacent tests.
- Use `rg` to discover exact route/component/helper names instead of loading broad directories.
- Do not revisit Stage 4 crawler docs unless household implementation unexpectedly touches ingestion or catalog-source stock.

Sequential dependency rule:

1. Contracts and deterministic helpers before persistence.
2. Persistence and demo seed before routes.
3. User-facing routes before frontend service/UI.
4. Admin reseed route before health page button.
5. Logged-in home read view before modal write UI.
6. Documentation and roadmap closeout last.

## Implementation Steps

### Step 1: Add Household Contracts And Deterministic Helpers

- Goal: Define versioned household, membership, household-local product, stock item, request/response DTO, validation helpers, and low-soon classification logic without adding persistence or routes yet.
- Files likely affected:
  - `packages/kamra-api-server/src/household/v1/contracts.ts`
  - `packages/kamra-api-server/src/household/v1/schemas.ts`
  - `packages/kamra-api-server/src/household/v1/validation.ts`
  - `packages/kamra-api-server/src/household/current/stock-status.ts` or equivalent small domain helper
  - `packages/kamra-api-server/src/household/README.md`
- Required outputs:
  - record contracts for `households`, `household_memberships`, `household_local_products`, and `household_stock_items`
  - request/response contracts for household list/create and stock item list/create/update/delete
  - one deterministic helper for classifying stock rows as below limit, at limit, low soon, or steady
  - no database writes and no frontend changes
- Validation:
  - contract/validation tests for required fields, multi-user membership, household-local products, units, item amounts, and statuses
  - low-soon helper tests covering zero, below, at, just above, and far above minimum
  - `npm run typecheck`
- Stop criteria:
  - stop after this step if route or repository design needs new fields not covered by the contracts
- Commit message idea:
  - `Add household stock contracts`

### Step 2: Add Household Repository And Demo Seed Service

- Goal: Persist households, memberships, household-local products, and household stock items with indexes and strict new-collection validators, plus a reseedable demo household service that is not exposed through HTTP yet.
- Files likely affected:
  - `packages/kamra-api-server/src/household/current/mongo-household-repository.ts`
  - `packages/kamra-api-server/src/household/current/demo-household-seed.ts`
  - `packages/kamra-api-server/src/household/current/mongo-household-repository.test.ts`
  - local setup/smoke script only if needed
  - `scripts/README.md` if a manually runnable reseed script is added
- Required outputs:
  - strict validators and indexes for new household collections
  - repository methods for user household list/create, member checks, stock list, stock create/update/archive, and local product create/update/archive as needed by the routes
  - demo reseed service that deletes and recreates only stable demo ids: `userA`, `userB`, `household1`, and the seeded household-local products/items
  - demo users created through the existing user/auth repository conventions, without introducing production credentials
- Validation:
  - creates collections with validators and indexes
  - supports multiple users in one household
  - reseeds `household1`, `userA`, `userB`, local products, and stock levels repeatably
  - reseed does not delete non-demo household/user data
  - lists only active memberships/items
  - update/archive preserves household isolation
  - `npm test -- packages/kamra-api-server/src/household`
  - `npm run typecheck`
- Stop criteria:
  - stop after this step if existing user repository APIs cannot create demo users cleanly; record the needed auth-repository extension before adding routes
- Commit message idea:
  - `Persist household stock records`

### Step 3: Add User-Facing Household API Routes

- Goal: Expose household, household-local product, and stock item operations behind current-user membership checks.
- Files likely affected:
  - `packages/kamra-api-server/src/http/routes/household-routes.ts`
  - `packages/kamra-api-server/src/http/app-handler.ts`
  - `packages/kamra-api-server/src/http/app-handler.test.ts`
- Proposed routes:
  - `GET /api/households`
  - `POST /api/households`
  - `GET /api/household/items?householdId=...`
  - `POST /api/household/items`
  - `PATCH /api/household/items`
  - `DELETE /api/household/items?id=...&householdId=...`
- Required behavior:
  - creating a stock item can create a household-local product without a catalog product
  - stock item responses include the local product display name, optional catalog link snapshot, and stock-status classification from the deterministic helper
  - deletion archives the stock item instead of hard-deleting it
  - all routes fail closed when the user is unauthenticated or not a household member
- Validation:
  - unauthenticated requests fail
  - users cannot read or mutate households they do not belong to
  - owner-created household is visible to that user
  - multiple members can read and mutate the same household stock according to membership
  - item create/update/delete works for a member
  - adding an item can create a household-local product without a catalog product
  - malformed amounts/units are rejected
  - `npm test -- packages/kamra-api-server/src/http/app-handler.test.ts`
  - `npm run typecheck`
- Stop criteria:
  - stop after this step if API response shapes are too broad for the first UI; narrow them before frontend work
- Commit message idea:
  - `Add household stock API`

### Step 4: Add Admin Demo Reseed API

- Goal: Expose the demo reseed service through an explicit admin-only route, still without changing the health page UI.
- Files likely affected:
  - `packages/kamra-api-server/src/http/routes/household-routes.ts` or a small admin/demo route file if clearer
  - `packages/kamra-api-server/src/http/app-handler.ts`
  - `packages/kamra-api-server/src/http/app-handler.test.ts`
- Proposed route:
  - `POST /api/admin/dashboard/reseed-demo-household`
- Required behavior:
  - route requires the existing admin role check pattern; do not add ad hoc username/email checks
  - route returns counts for recreated users, household, memberships, local products, and stock items
  - route logs the major reseed action without logging secrets
- Validation:
  - unauthenticated request fails
  - non-admin request fails
  - admin request reseeds only demo ids
  - repeated admin request produces the same demo state
  - `npm test -- packages/kamra-api-server/src/http/app-handler.test.ts`
  - `npm run typecheck`
- Commit message idea:
  - `Add demo household reseed API`

### Step 5: Add Frontend Household Service And View Models

- Goal: Add typed Angular access to the household routes with stable empty/loading placeholders, without redesigning the home page yet.
- Files likely affected:
  - `src/app/household/household-stock.service.ts`
  - `src/app/household/household-stock.models.ts` if useful
  - `src/app/shared/api-errors.ts` only if existing error helpers need a small extension
  - `src/app/i18n/en.json`
  - `src/app/i18n/hu.json`
- Required outputs:
  - service methods for household list/create and stock item list/create/update/delete
  - frontend model for household stock rows with local product display name, unit, current amount, minimum limit, status, and optional catalog link snapshot
  - reusable empty/default data objects so consuming components keep layout stable during loading
  - no visible UI change beyond any harmless translation additions
- Validation:
  - `npm run typecheck`
  - `npm run build`
- Commit message idea:
  - `Add household stock frontend service`

### Step 6: Replace Logged-In Home Placeholder With Read-Only Stock Overview

- Goal: Show real household stock data on the home page for signed-in users before adding write controls.
- Files likely affected:
  - `src/app/home.component.ts`
  - `src/app/household/household-stock.service.ts` if small read-model adjustments are needed
  - `src/app/i18n/en.json`
  - `src/app/i18n/hu.json`
- Required behavior:
  - signed-out users keep the current public/placeholder home experience
  - signed-in users with no household see a stable empty state
  - signed-in users with household data see a `Low soon` block and an all-stock block
  - low-soon grouping uses the stock-status value returned by the API, not a second unrelated frontend rule
  - loading and refresh states keep default placeholder lists instead of collapsing the page
- Validation:
  - `npm run typecheck`
  - `npm run build`
  - manual browser check for signed-out home, signed-in empty household, and signed-in demo household
- Commit message idea:
  - `Show household stock on home`

### Step 7: Add Household Stock Modal And Write UI

- Goal: Let the signed-in user manage household stock from the home/all-stock view.
- Files likely affected:
  - `src/app/household/household-stock-editor.component.ts` or equivalent focused component
  - `src/app/household/household-stock.service.ts`
  - `src/app/home.component.ts`
  - `src/app/i18n/en.json`
  - `src/app/i18n/hu.json`
- Required behavior:
  - clicking a stock item opens a modal editor
  - modal editor supports adding a household-local product with zero stock
  - modal editor supports current amount, unit text, note, and minimum limit edits
  - minimum limit has minus/input/plus controls for quick adjustment
  - current amount remains directly editable enough for demo use
  - archived/deleted items disappear from default stock blocks
  - catalog product search/linking is not required in this step
- Validation:
  - `npm run typecheck`
  - `npm run build`
  - manual browser check for add zero-stock local product, edit unit, edit current amount, edit minimum through minus/input/plus, archive/delete, and refresh
- Commit message idea:
  - `Add household stock UI`

### Step 8: Rework Health/Admin Utility View

- Goal: Make demo reseeding and validation tools easier to find without mixing them into the user household page.
- Files likely affected:
  - `src/app/dev-admin/admin-dashboard.component.ts`
  - admin API service for demo reseed
  - `src/app/i18n/en.json`
  - `src/app/i18n/hu.json`
- UI behavior:
  - four equal or near-equal rectangles
  - seed/reseed section with `Reseed demo household` and existing seed-like actions
  - database health/validation section with current healthcheck behavior
  - feature toggles section with disabled or placeholder toggle rows for later feature flag management
  - reserved empty section for future admin utilities
- Validation:
  - admin-only reseed action
  - current healthcheck still works
  - existing seed-like behavior remains available
  - feature toggle placeholders do not imply working backend flags yet
  - `npm run typecheck`
  - `npm run build`
- Commit message idea:
  - `Add demo household reseed controls`

### Step 9: Document Stage 5 Behavior And Closeout

- Goal: Document household stock model and operational boundaries before moving into Stage 6.
- Files likely affected:
  - `docs/household.md` or nearest existing durable docs
  - `docs/tech-ops.md` only if a new manual script or operational command is added
  - `scripts/README.md` only if a new manual script is added
  - `.agents/plans/initial-mvp-roadmap.md`
  - `.agents/sessions/` if the stage pauses mid-work
- Validation:
  - docs explain that household stock is user-owned and separate from shop/source stock
  - docs explain household-local generic products and later catalog linking/promotion
  - docs document demo reseed behavior and seeded users/items
  - docs list validation commands and known followups
  - final validation has passed: `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`
- Commit message idea:
  - `Document household stock foundation`

## Validation Plan

Automated:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- targeted household contract/repository/route tests
- `npm run build`

Manual:

- Sign in as a user.
- Create a household.
- Add an unmatched item.
- Add a household-local generic product with zero stock.
- Confirm household-local products do not require catalog links.
- Change `currentAmount`, `minLimit`, and `unit`.
- Use minus/input/plus controls to change the minimum limit.
- Delete/archive an item.
- Reseed demo household data from the admin health page.
- Sign in or act as `userA` and `userB` and confirm both can see `household1`.
- Confirm low-soon and all-stock blocks show the expected seeded items.
- Confirm loading/empty placeholders keep the household page stable.
- Confirm another user cannot access the household or item routes.
- Confirm product lookup still behaves normally and source/catalog stock is not changed by household edits.

## Risks

- Household stock can blur with crawler/source stock.
  - Mitigation: use separate household collections and membership-checked routes; share only small value objects where useful.
- Product links can block useful manual stock entry if catalog coverage is incomplete.
  - Mitigation: make catalog product links optional and preserve a display-name snapshot.
- Household-local generic products can become duplicate or messy.
  - Mitigation: keep them household-scoped for Stage 5 and plan later admin-reviewed linking/promotion to catalog products.
- Unit comparisons can become misleading.
  - Mitigation: preserve explicit units and keep Stage 5 focused on data entry; deterministic low-stock comparison belongs in Stage 6.
- Authorization mistakes can expose household data.
  - Mitigation: route tests for cross-user denial and repository methods that always scope by household membership.
- Household creation can grow into invitation/onboarding scope.
  - Mitigation: owner-created household only for Stage 5; invitations stay deferred.
- Demo reseed could accidentally affect real user data.
  - Mitigation: use stable demo ids and make the route admin-only, explicit, and scoped to demo household/user ids only.

## Open Questions

- Should a user have exactly one default household in the MVP, or can the UI support multiple from the start?
  - Recommended: support multiple in the data model and API, but keep the first UI simple with a selected household dropdown.
- Should deletion hard-delete household stock items or archive them?
  - Recommended: archive items so later list/notice history has room, while the UI hides archived items by default.
- Should product linking search use the existing product list endpoint directly later?
  - Recommended: defer the picker from Stage 5; when promoted later, reuse existing product name filtering before creating a dedicated product-picker endpoint.
- How close to the minimum limit should an item be before it appears in `Low soon`?
  - Recommended: include items at or below the limit and items within roughly 20% above the limit, while keeping the threshold easy to adjust in Stage 6.

## Future Notes

- Household-local generic products should later be linkable to concrete catalog products.
- Household-local generic products should later be linkable to shared generic catalog products.
- Admins should later be able to create shared generic catalog products from useful household-local products.
- Stock cards should later show estimated value when price and product links make that meaningful.
- A shopping-list block should later support generating the list from low-stock items and managing actions such as `push to mobile`; the current home-pulse scale preview defines the first three intended inclusion levels: `Business as usual` for below/at-limit stock, `Keep it chill` for below/at/low-soon stock, and `Stock 'em up!` for all tracked rows.
- Post-MVP, plan a mobile app focused on shopping list management, in-store use, and invoice/receipt reading.

## Approval Checkpoint

Completed. Future work should start from Stage 6 planning rather than reopening this Stage 5 implementation plan unless a regression is found.
