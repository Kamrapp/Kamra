# Kamra Vertical-Slice Map

Status: Initial Stage 11 inventory. This is a locality guide, not permission to move every file.

The detailed implementation and move boundaries are in
[the Stage 11 plan](../.agents/plans/2026-07-13-stage-11-vertical-slice-locality-plan.md).

## Current capability ownership

| Capability               | Backend domain                                                                                           | HTTP adapters                                             | Frontend owner                                                                               | Main persistence                                                  | Integration focus                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------ |
| Household stock          | `packages/kamra-api-server/src/household/current/`, `household/v1/`, `household/v2/`                     | `packages/kamra-api-server/src/http/routes/household*.ts` | `src/app/household/`                                                                         | household/product-group/product/batch collections                 | Product Group → Product → Batch writes and grouped read      |
| Shopping                 | `packages/kamra-api-server/src/household/v2/` shopping contracts, matcher, trip, and completion services | `household-v2-routes.ts`                                  | `src/app/household/household-shopping-trip-panel.component.ts` and `household-v2.service.ts` | Shopping Needs, Trips, Shop Markets/Products, Prices, Submissions | Trip completion, retry, and Product-owned Batch side effects |
| Catalogue                | `packages/kamra-api-server/src/catalog/`                                                                 | `catalog-routes.ts` and ingestion review routes           | `src/app/product-lookup/`, `src/app/site-admin/`                                             | products, sources, identifiers, prices                            | Review/acceptance and derived catalogue shape                |
| Ingestion                | `packages/kamra-api-server/src/ingestion/`                                                               | `ingestion-routes.ts` and processing scripts              | `src/app/site-admin/ingestion-admin*`                                                        | runs, raw snapshots, processing states, review items              | Raw snapshot → review/catalogue boundary                     |
| Feature flags            | `packages/kamra-api-server/src/feature-toggles/` plus household flag compatibility contracts             | `admin-dashboard-route.ts`, household routes              | `src/app/dev-admin/admin-feature-flags-card.component.ts` and `admin-dashboard.component.ts` | feature flag overrides and audits                                 | Registry → schema/route → persistence → dependent response   |
| Site administration      | `packages/kamra-api-server/src/http/routes/stage9-admin-routes.ts` and admin routes                      | mixed `http/routes/` admin files                          | `src/app/site-admin/`                                                                        | shop market/product/price/submission data                         | Admin authorization and explicit failure states              |
| Developer administration | `packages/kamra-api-server/src/database-maintenance/`, health, logging                                   | dashboard/maintenance/health routes                       | `src/app/dev-admin/`                                                                         | maintenance ledgers, audits, diagnostics                          | Admin-only maintenance and operational contracts             |

## Intended Stage 11 direction

The first reorganization target is route ownership and feature-flag presentation. Existing domain
directories are already useful and should not be flattened. New vertical-slice directories should
be introduced only when contracts, policy, persistence, adapters, and tests move together or when a
small route/UI cluster has a clear owner.

Integration tests belong beside the capability they protect or in the shared integration harness
when the assertion intentionally crosses capabilities. Unit tests remain beside pure rules and
repositories.

## Test selection target

- `npm test` — all unit and deterministic integration tests.
- `npm run test:integration` — only deterministic cross-layer integration tests.
- `npm run smoke:catalog` / `npm run smoke:transactions` — configured existing smokes.
- Future Stage 11 configured integration smoke — only for persistence/schema/maintenance/API
  changes and only against an approved disposable database.
- `scripts/stage11-mvp-manual-test.md` — the single integrated UI, visual, two-user, configured,
  and operator runbook after Stage 11 implementation.
