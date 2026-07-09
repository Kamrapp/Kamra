# Household Contracts

This package area will hold Kamra's household-owned stock model.

## Layout

- `v1/` contains the versioned household collections, DTOs, and validation helpers.
- `current/` contains small deterministic domain helpers that should stay stable across route and UI work.

## Model Notes

- Household data is user-owned and separate from catalog/source stock.
- Household-local products are the required path for Stage 5; catalog links are optional future enrichment.
- Household-local products should carry a stable `stockGroupKey` so future group-aware limits and consumption logic have a consistent anchor.
- Household stock rows keep `stockedAt` and amount history for later forecasting, while manual stock edits remain the source of truth.
- The low-soon classifier is intentionally deterministic so the API and UI can share the same threshold later.
