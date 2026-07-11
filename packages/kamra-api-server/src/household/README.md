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

Stage 8 uses `v2` vocabulary: Stock Targets are demand policies, Stock Batches are physical acquisitions, and Stock Allocations are the only source of aggregate stock. `v1` remains migration input only while the cutover is in progress.
