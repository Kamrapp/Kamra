# src/app AGENTS.md

## Purpose

This folder contains Angular application code grouped by product concern.

## Structure

- `product-lookup/`: product search, catalog browsing, price-checking, and future public or role-gated arukereso-style views.
- `household/`: household membership, household stock, shopping lists, low-stock notices, and expiry workflows.
- `site-admin/`: product merge review, source-product maintenance, stock staleness, and ingestion/operator screens.
- `dev-admin/`: health checks, diagnostics, database smoke status, seed status, and developer/admin troubleshooting.

Keep shared shell, routing, auth, and logging files in `src/app/` only when they are genuinely cross-cutting. New functional pages should live in the matching concern folder.
