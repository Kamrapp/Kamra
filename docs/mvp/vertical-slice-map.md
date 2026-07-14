# Kamra Vertical-Slice Map

Status: Archived Stage 11 implementation map. This remains a locality guide, not permission to move every file.

The detailed implementation and move boundaries are in
[the Stage 11 plan](../../.agents/plans/mvp/2026-07-13-stage-11-vertical-slice-locality-plan.md).

## Current capability ownership

| Capability               | Backend domain                                                                                           | HTTP adapters                                         | Frontend owner                                                                               | Main persistence                                                  | Integration focus                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------ |
| Household stock          | `packages/kamra-api-server/src/household/current/`, `household/v1/`, `household/v2/`                     | `http/routes/household/` and `household-v2-routes.ts` | `src/app/household/`                                                                         | household/product-group/product/batch collections                 | Product Group → Product → Batch writes and grouped read      |
| Shopping                 | `packages/kamra-api-server/src/household/v2/` shopping contracts, matcher, trip, and completion services | `http/routes/household-v2-routes.ts`                  | `src/app/household/household-shopping-trip-panel.component.ts` and `household-v2.service.ts` | Shopping Needs, Trips, Shop Markets/Products, Prices, Submissions | Trip completion, retry, and Product-owned Batch side effects |
| Catalogue                | `packages/kamra-api-server/src/catalog/`                                                                 | `http/routes/catalog/`                                | `src/app/product-lookup/`, `src/app/site-admin/`                                             | products, sources, identifiers, prices                            | Review/acceptance and derived catalogue shape                |
| Ingestion                | `packages/kamra-api-server/src/ingestion/`                                                               | `http/routes/ingestion/` and processing scripts       | `src/app/site-admin/ingestion-admin*`                                                        | runs, raw snapshots, processing states, review items              | Raw snapshot → review/catalogue boundary                     |
| Feature flags            | `packages/kamra-api-server/src/feature-toggles/` plus household flag compatibility contracts             | `http/routes/admin/` and `http/routes/household/`     | `src/app/dev-admin/feature-flags/` and `admin-dashboard.component.ts`                        | feature flag overrides and audits                                 | Registry → schema/route → persistence → dependent response   |
| Site administration      | `packages/kamra-api-server/src/http/routes/stage9-admin-routes.ts` and admin services                    | `http/routes/admin/`                                  | `src/app/site-admin/` and `src/app/site-admin/stage9-pricing/`                               | shop market/product/price/submission data                         | Admin authorization and explicit failure states              |
| Developer administration | `packages/kamra-api-server/src/database-maintenance/`, health, logging                                   | `http/routes/admin/`, `observability/`                | `src/app/dev-admin/`                                                                         | maintenance ledgers, audits, diagnostics                          | Admin-only maintenance and operational contracts             |

## Intended Stage 11 direction

The first reorganization targets are now complete: route ownership is visible through capability
bundle indexes, ordinary feature flags render from registry metadata, and the obvious frontend
feature clusters have owner barrels. Existing domain directories are already useful and should not
be flattened. New vertical-slice directories should be introduced only when contracts, policy,
persistence, adapters, and tests move together or when a small route/UI cluster has a clear owner.

Integration tests belong beside the capability they protect or in the shared integration harness
when the assertion intentionally crosses capabilities. Unit tests remain beside pure rules and
repositories.

## Test selection target

- `npm run mvp:preflight` — the bundled local release checks; it has no MongoDB dependency.
- `npm test` — all unit and deterministic integration tests; this is the normal app-check command.
- `npm run test:integration` — only deterministic cross-layer integration tests.
- `npm run smoke:demo-household` — read-only validation of the seeded household fixture against an
  approved disposable database.
- `npm run seed:demo-household` / `npm run teardown:demo-household -- --confirm=demo-household` —
  guarded household-only fixture reset/cleanup for repeated manual sessions.
- `npm run smoke:catalog` / `npm run smoke:transactions` — configured existing smokes.
- The catalog and transaction workflows are the configured MongoDB signals. Their path filters
  cover catalog/schema changes and household transaction/persistence/maintenance changes without
  requiring private configuration for ordinary pull requests. Both use the `Smoke` environment.
- `scripts/mvp/stage11-mvp-manual-test.md` — the archived integrated UI, visual, two-user, configured,
  and operator runbook after Stage 11 implementation.

The local integration harness uses an explicit fake database and a deliberately limited transaction
lifecycle. It proves route/auth/repository/schema wiring and persisted side effects, but it does not
pretend to prove MongoDB isolation or rollback. Use the configured transaction smoke for that.
