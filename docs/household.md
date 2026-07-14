# Household Stock Concept

## Purpose

Household stock is Kamra's user-owned pantry model.

It is intentionally separate from catalog, crawler, source, and store stock. Store/source stock describes observed retailer availability or offers. Household stock describes what a household believes it has at home, what minimum level it wants to keep, and what should later become shopping-list demand.

The closed MVP makes the complete basic user loop real: a signed-in household member can manage
Product Groups, Products, and Batches, generate/edit a Shopping list, mark purchases, and finalize
purchased lines back into Product-owned household stock. Phase 1 redesigns shop matching, price
evidence, receipt reconciliation, and admin review around that accepted loop.

## Approved Stage 8 Model

The Stage 6 sections below describe the legacy one-row runtime and are retained as historical implementation context. They are not the final household model.

Stage 8 replaces that row with three ownership layers:

- A **Product Group** is a household-owned, optionally nested group of Products. It may have an optional target policy with a tracking unit, minimum, and desired restock quantity.
- A **Household Product** is a reusable concrete or generic manual product. It belongs to zero or one direct Product Group and may have its own optional target policy.
- A **Stock Batch** is a physical acquisition beneath one Product. It owns quantity, stocked-at date, expiry, and history. New Batches automatically count with their Product's Group; they are never independently assigned to a separate target during normal use.

Current quantities are derived from Batches. A Product contributes to its direct Group and ancestor Groups once. Target policies are optional properties of Products and Groups—not standalone stock records. Product Concepts remain separate classification/tagging vocabulary and are not the household stock hierarchy.

When both a Product/child Group and its parent Group have targets, shopping planning works bottom-up: fulfil the specific target first, then generate only the parent’s remaining shortage. This prevents the same white-bread quantity from being proposed twice for `White bread` and `Bread`.

The allocation-based v2 workspace is an interim migration state. Its `Stock Target` and
`Stock Allocation` data are retained as history/migration input until the Product Group cutover
reconciles each Product to one Group or reports it for explicit resolution. See
[domain language](./domain-language.md) and the archived Stage 8 plan under `.agents/plans/mvp/` for
the migration history.

## Current User-Side State

Implemented runtime surfaces:

- Angular home page shows a signed-in household pulse backed by real household API data.
- Users can create a first household.
- Users can select among households they belong to.
- Users can add, edit, and archive household stock rows.
- The stock editor supports current amount, minimum limit, unit, stocked date, optional initial amount, stock group key, GTIN, source name, source URL, and note.
- Minimum limit has direct input plus quick minus/plus controls.
- Stock rows are sorted by priority: below limit, at limit, low soon, then steady.
- Signed-in users can browse products read-only even when they are not admins; product edits remain admin-only.
- The home workspace is split into stock overview plus editor, a compact shopping control band, and a shopping-list workspace with separate finalization actions.
- Shopping lists are persisted, can be regenerated, refreshed, cancelled, or started empty through the `Start fresh` scale.
- Generated shopping-list rows start with `Bought = 0`; ticking a zero-bought row copies the planned amount into bought automatically.
- Shopping-list rows are grouped into unticked rows first and a collapsible purchased section at the end.
- Users can manually add rows to a shopping list, edit generated lines, mark purchased amounts, and finalize purchased lines back into Product-owned v2 Stock Batches. A purchased Group impulse line creates a manual Household Product under its Group first.
- Receipt upload, list-first shop matching, catalogue prices, and admin evidence review are required
  Phase 1 work; their integrated acceptance is deferred until the redesign stabilizes.
- Logged-out home preview mirrors the signed-in household workspace with disabled controls and minimal fake data.
- Admin dashboard exposes a demo household reseed action and separates read-only health checks from modifying maintenance actions.
- Admin dashboard exposes the database-backed `allowAutoTickingAllShoppingListEntries` household feature toggle.
- Controlled alpha onboarding creates one new empty household for each explicitly created alpha user; it does not reuse or alter the demo household.

Implemented API surfaces:

- `GET /api/households`
- `POST /api/households`
- `GET /api/household/items?householdId=...`
- `POST /api/household/items`
- `PATCH /api/household/items`
- `DELETE /api/household/items?householdId=...&id=...`
- `POST /api/household/shopping-list/preview`
- `POST /api/household/shopping-lists`
- `PATCH /api/household/shopping-lists`
- `GET /api/household/shopping-lists/latest?householdId=...`
- `POST /api/household/shopping-lists/update-stocks`
- `GET /api/admin/dashboard/feature-flags`
- `PATCH /api/admin/dashboard/feature-flags`
- `POST /api/admin/dashboard/reseed-demo-household`
- `POST /api/admin/alpha-users`

Core package area:

- `packages/kamra-api-server/src/household/v1/` contains versioned contracts, schemas, and validation.
- `packages/kamra-api-server/src/household/current/` contains current repository, stock status, and demo seed logic.
- `src/app/household/household-stock.service.ts` is the frontend API/service boundary.
- `src/app/home.component.ts` owns the signed-in household pulse, stock overview, and shopping control band UI.
- `src/app/household/household-shopping-list.component.ts` owns the shopping-list overview plus finalization workspace.

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

## Shopping Workspace

Stage 6 turns the old shopping-scale preview into a persisted shopping workspace.

Current levels:

- `Start fresh`: creates an empty shopping list for manual building.
- `Business as usual`: includes below-limit and at-limit rows.
- `Keep it chill`: includes below-limit, at-limit, and low-soon rows.
- `Stock 'em up!'`: includes every tracked stock row.

Current behavior:

- stock rows covered by the active level are highlighted in the stock table
- each stock row can be added one-by-one to the active shopping list once a list exists
- generated rows start unticked with bought amount set to `0`
- unticked rows stay at the top while ticked rows move into a collapsible purchased section
- applying purchased items may require confirmation when unticked rows remain
- the `allowAutoTickingAllShoppingListEntries` feature toggle decides whether `Tick everything and update stock` is available during partial completion
- cancelling a shopping list archives it out of the active household view
- receipt upload remains visible as a future placeholder, not a working import flow

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

| Product         | Current | Minimum | Unit    | Scenario    |
| --------------- | ------: | ------: | ------- | ----------- |
| Kenyer          |     0.2 |     0.5 | kg      | below limit |
| Tej             |     1.8 |       2 | l       | below limit |
| Vegyes lekvarok |       4 |       3 | uveg    | steady      |
| Pelenka         |       0 |      40 | db      | below limit |
| Alma            |     1.2 |     0.4 | kg      | steady      |
| Repa            |    0.22 |     0.2 | kg      | low soon    |
| Mososzer        |     0.3 |       1 | l       | below limit |
| WC papir        |       9 |       8 | tekercs | low soon    |
| Tojas           |       5 |       6 | db      | below limit |
| Rizs            |       0 |       1 | kg      | below limit |
| Cukor           |     2.5 |       1 | kg      | steady      |
| Tusfurdo        |       1 |       1 | flakon  | at limit    |

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

## Closed MVP household boundary

The household-side MVP closed on 2026-07-14. It includes Product Group/Product/Batch management,
target policies, expiry behavior, Shopping-list generation/editing, persisted purchased rows, row
discard/rename behavior, both cancellation paths, and finalization into Product-owned stock.

The following remain outside that closed scope:

- receipt parsing or automatic receipt-to-stock import
- route or store optimization
- richer notice feeds beyond the current household pulse and shopping workflow
- automatic consumption-rate forecasting
- product catalog linking UI inside the household editor
- invitations or external household onboarding
- barcode scanning
- mobile-specific shopping ergonomics

Expiry dates, expiry inclusion settings, and buy-before behavior are part of the closed MVP
household model.

The separate Shopping Trip/pricing/ingestion and crawl acceptance checks were transferred to Phase 1
because those workflows will change. They are not missing prerequisites for the accepted basic Home
Shopping-list loop and are not claimed as passed MVP evidence.

## Phase 1 household usability direction

Phase 1 keeps the Shopping list as the household interface. Selecting a shop starts a lightweight
session; bought marks are captured automatically; receipt reconciliation may add/correct purchases,
amounts, identifiers, and prices; finishing applies stock and leaves unpurchased rows on the list.
Trip persistence can remain when it provides useful transaction history, but it must not dictate a
parallel UI.

The same phase adds compact search/suggestions over global Products from household editing. Ranking
may use identifiers, names, Product Concepts, Product Groups, tags, and prior household choices, but
weak suggestions remain explicit and correctable. Confirmed receipt/shop evidence may create price
observations and links; uncertain shared facts require review.

See `.agents/plans/phase-1-usability-completion-plan.md` for the sequential stages and
`scripts/phase1-manual-test.md` for the deferred integrated acceptance.

## Later ideas outside Phase 1

The following earlier ideas are now required Phase 1 work rather than future ideas: Product search-
based household linking, admin-reviewed catalogue facts from shopping, and receipt-to-price
reconciliation.

The core follow-up immediately after Phase 1 is household price intelligence. Kamra should estimate
the cost of the current Shopping list from sufficiently fresh applicable Price Observations and let
the household configure how strongly it values discounts, preferred shops, compatible substitutes,
convenience, and additional shop visits. It may suggest an alternative Product or a shop with a
current discount, but must explain compatibility, price freshness, offer conditions, and expected
savings and must not change the list without confirmation.

Still later:

- consumption-rate estimates from stocked date, initial amount, current amount, and manual corrections
- simple in-app low-stock notices
- safety stock preferences
- explainable run-out predictions
- notification channels beyond in-app display

- mobile or installable PWA flow focused on in-store list use
- barcode scanning for faster add/update flows
- broader route or shop optimization after the price-focused household step is reliable
- household habit baselines for commonly missing staples
