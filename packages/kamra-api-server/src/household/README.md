# Household Contracts

This package area will hold Kamra's household-owned stock model.

Durable product and operations context lives in `docs/household.md`.

## Layout

- `v1/` contains the versioned household collections, DTOs, and validation helpers.
- `v2/` contains the Stage 8 final domain contracts, validators, classification, allocation, and aggregation helpers. Persistence and routes must use these contracts after the controlled cutover.
- `current/` contains small deterministic domain helpers that should stay stable across route and UI work.

## Model Notes

- Household data is user-owned and separate from catalog/source stock.
- Household-local products are the required path for Stage 5; catalog links are optional future enrichment.
- Household-local products should carry a stable `stockGroupKey` so future group-aware limits and consumption logic have a consistent anchor.
- Household stock rows keep `stockedAt` and amount history for later forecasting, while manual stock edits remain the source of truth.
- The low-soon classifier is intentionally deterministic so the API and UI can share the same threshold later.
- Stage 6 shopping-list generation lives in `current/shopping-list.ts` as a pure helper so the API and UI can reuse the same inclusion, ordering, and target-amount rules.
- Shopping-list target amount uses `idealMaxLimit` when a stock row has one; otherwise it falls back to `minLimit * household.defaultCalculatedMaxLimitMultiplier`, with the household multiplier defaulting to `2`.
- Missing catalog or source linkage should stay explicit in shopping-list output through uncertainty flags instead of hiding household-local items.
- Household invitations are a small no-email membership slice: an owner creates a pending email
  invitation, an existing account can accept it, and invited registration claims pending invitations.
  Email delivery, expiry, revocation, and broad member administration remain outside the MVP.

The current household workspace uses Product Groups, Household Products, and Stock Batches. Product
Groups and Products may own target policies; Batches belong to Products and provide the physical
quantity/date history. The older `v1` household collections remain migration input or compatibility
surfaces where explicitly noted.
