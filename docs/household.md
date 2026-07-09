# Household Stock Concept

## Purpose

Household stock is Kamra's user-owned pantry model.

It is intentionally separate from catalog, crawler, source, and store stock. Store/source stock describes observed retailer availability or offers. Household stock describes what a household believes it has at home, what minimum level it wants to keep, and what should later become shopping-list demand.

Stage 5 makes this loop real enough for a signed-in user to log in, see a low-stock pulse on the home page, add custom household items, adjust amounts and minimum limits, and reset stable demo data from the admin dashboard.

## Current Stage 5 State

Implemented runtime surfaces:

- Angular home page shows a signed-in household pulse backed by real household API data.
- Users can create a first household.
- Users can select among households they belong to.
- Users can add, edit, and archive household stock rows.
- The stock editor supports current amount, minimum limit, unit, stocked date, optional initial amount, stock group key, GTIN, source name, source URL, and note.
- Minimum limit has direct input plus quick minus/plus controls.
- Stock rows are sorted by priority: below limit, at limit, low soon, then steady.
- The home pulse shopping scale previews how many items would be included at three levels, but does not generate a persisted shopping list yet.
- Admin dashboard exposes a demo household reseed action and separates read-only health checks from modifying maintenance actions.

Implemented API surfaces:

- `GET /api/households`
- `POST /api/households`
- `GET /api/household/items?householdId=...`
- `POST /api/household/items`
- `PATCH /api/household/items`
- `DELETE /api/household/items?householdId=...&id=...`
- `POST /api/admin/dashboard/reseed-demo-household`

Core package area:

- `packages/kamra-api-server/src/household/v1/` contains versioned contracts, schemas, and validation.
- `packages/kamra-api-server/src/household/current/` contains current repository, stock status, and demo seed logic.
- `src/app/household/household-stock.service.ts` is the frontend API/service boundary.
- `src/app/home.component.ts` currently owns the signed-in household pulse and stock editor UI.

## Domain Concepts

### Household

A household is the user-facing boundary for shared pantry state.

Current fields include:

- `id`
- `name`
- `status`
- creation and update audit fields

For Stage 5, creating a household also creates an owner membership for the current user. The data model supports multiple households per user, and the UI already exposes a selected-household dropdown.

### Household Membership

A membership connects a user to a household.

Current roles:

- `owner`
- `member`

Current statuses:

- `active`
- `removed`

Membership checks are enforced server-side before household stock data is read or mutated. Frontend visibility is not treated as an authorization boundary.

### Household-Local Product

A household-local product is the household's own tracked product concept.

This is the required Stage 5 path. A user can track `tej`, `liszt`, `pelenka`, or any other local/generic item without first finding a catalog product.

Current fields include:

- `displayName`
- `stockGroupKey`
- optional `catalogProductId`
- optional `catalogProductNameSnapshot`
- optional `gtin`
- optional `sourceName`
- optional `sourceProductUrl`
- status and audit fields

Catalog links are optional enrichment. They should not become a prerequisite for pantry tracking.

### Household Stock Item

A household stock item is the editable pantry row.

Current fields include:

- `displayName`
- `householdProductId`
- optional catalog link fields
- `stockGroupKey`
- `currentAmount`
- `initialAmount`
- `minLimit`
- `stockedAt`
- `unit`
- optional `note`
- optional GTIN/source fields
- status and audit fields

`currentAmount` is the user's source of truth. Later forecasts can use current amount, initial amount, stocked date, and manual correction history, but forecasts must not overwrite user-entered stock truth.

`stockedAt` is the visible acquisition or stock-start date. `createdAt` remains audit metadata.

### Stock Group Key

`stockGroupKey` is the stable anchor for group-aware logic.

Stage 5 usually maps one generic household-local product to one group key. Later, multiple concrete products can satisfy the same group. For example, `Pilos tej` and `Mizo tej` may both count toward a household's `tej` need.

Group-aware planning matters because low-stock prediction and shopping-list demand should eventually reason about needs, not only isolated rows.

## Stock Status

The API returns a deterministic `stockStatus` for each active stock item.

Current statuses:

- `below_limit`
- `at_limit`
- `low_soon`
- `steady`

The current threshold is intentionally simple. It is good enough to order the pulse and preview demand, while leaving more nuanced prediction for Stage 6 and Stage 8.

## Shopping Scale Preview

Stage 5 includes a non-persistent preview of shopping-list scope.

Current levels:

- `Business as usual`: includes below-limit and at-limit rows.
- `Keep it chill`: includes below-limit, at-limit, and low-soon rows.
- `Stock 'em up!`: includes every tracked stock row.

Clicking the shopping-list action currently shows a coming-soon toast. Stage 6 should turn this preview into real list generation and persistence.

## Demo Household

The demo household seed is repeatable and scoped to stable demo ids.

Seeded users:

- `usera`
- `userb`

The identifiers are lowercase because the current auth layer normalizes login identifiers to lowercase.

Seeded household:

- `household1`
- name: `Hungarian nature household`
- `usera` is the owner
- `userb` is a member

Seeded stock examples:

| Product | Current | Minimum | Unit | Scenario |
| --- | ---: | ---: | --- | --- |
| Kenyer | 0.2 | 0.5 | kg | below limit |
| Tej | 1.8 | 2 | l | below limit |
| Vegyes lekvarok | 4 | 3 | uveg | steady |
| Pelenka | 0 | 40 | db | below limit |
| Alma | 1.2 | 0.4 | kg | steady |
| Repa | 0.22 | 0.2 | kg | low soon |
| Mososzer | 0.3 | 1 | l | below limit |
| WC papir | 9 | 8 | tekercs | low soon |
| Tojas | 5 | 6 | db | below limit |
| Rizs | 0 | 1 | kg | below limit |
| Cukor | 2.5 | 1 | kg | steady |
| Tusfurdo | 1 | 1 | flakon | at limit |

The UI displays natural Hungarian labels with accents where the locale and font support them.

Reseed paths:

- `npm run seed` can run the optional `demo_household` seed.
- Admin dashboard can call `POST /api/admin/dashboard/reseed-demo-household`.

Required environment variable:

- `SEED_DEMO_HOUSEHOLD_PASSWORD`

The reseed operation deletes and recreates only the stable demo users and `household1` household data. It must not remove unrelated users or households.

## Authorization Boundaries

Household data is private to active household members.

Rules:

- unauthenticated requests fail
- users can list only households they belong to
- users can read stock only for households where they have an active membership
- users can create, update, and archive stock only through membership-checked routes
- admin status does not bypass normal household membership for user-facing household routes
- demo reseeding is admin-only and explicit

The admin dashboard is a developer/operator surface. Normal users should not see its content or navigation.

## Operational Notes

Collection setup creates missing household collections, indexes, and validators.

Existing non-empty household collections are not destructively recreated during normal setup. Shape changes that need existing collection validator changes should use an explicit maintenance or migration path rather than silently rewriting production collections.

Use the current validation set before marking household changes complete:

```powershell
npm test -- packages/kamra-api-server/src/household
npm test -- packages/kamra-api-server/src/http/app-handler.test.ts
npm run typecheck
npm run lint
npm run build
```

## Known Stage 5 Limits

Stage 5 deliberately does not implement:

- real shopping-list generation
- persisted shopping lists
- notices beyond the home pulse
- expiry dates
- buy-before buffers
- automatic consumption-rate forecasting
- product catalog linking UI
- generic-product promotion into shared catalog records
- invitations or external household onboarding
- barcode scanning
- mobile app behavior
- route optimization or store-choice optimization

These are not defects in the Stage 5 foundation; they are the next product layers.

## Stage 6 Direction

Stage 6 should introduce deterministic shopping-list generation from household stock.

Recommended shape:

- keep a pure core function that accepts household stock rows and a shopping scale
- return explicit needed items with reason codes
- preserve unmatched household-local items instead of hiding them
- make unit uncertainty visible
- avoid catalog matching as a prerequisite
- persist generated lists only after the deterministic output shape is stable

Initial reason codes might include:

- below minimum
- at minimum
- low soon
- included by broad restock scale

The frontend should be able to explain why each item was included.

## Future And Post-MVP Ideas

Near-future after Stage 6:

- catalog product picker or search-based linking for household-local products
- shared generic catalog products promoted from useful household-local patterns after admin review
- group-aware limits where several concrete products satisfy one need
- consumption-rate estimates from stocked date, initial amount, current amount, and manual corrections
- simple in-app low-stock notices
- product value estimates when catalog links and price observations are trustworthy

Stage 8 and beyond:

- expiry dates
- buy-before buffers
- safety stock preferences
- explainable run-out predictions
- notification channels beyond in-app display

Post-MVP:

- mobile or installable PWA flow focused on in-store list use
- invoice or receipt reading to update stock after shopping
- barcode scanning for faster add/update flows
- route or shop optimization once price and store data are reliable
- household habit baselines for commonly missing staples
