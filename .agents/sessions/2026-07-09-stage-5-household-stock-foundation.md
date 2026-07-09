# Stage 5 Household Stock Foundation

## Session

- Date: 2026-07-09
- Plan: `.agents/plans/2026-07-08-stage-5-household-stock-foundation-plan.md`
- Branch: unknown
- Current objective: Implement the first end-to-end Stage 5 household flow so a seeded user can sign in, see low-stock pulse data, and manage custom household stock with minimum limits.

## Completed

- Item: Loaded the Stage 5 plan and relevant package/frontend workflow instructions.
- Item: Inspected existing catalog, ingestion, auth, health, and route patterns for consistency.
- Item: Added the household v1 contracts, schemas, validators, stock-status helper, package README, and initial tests.
- Item: Added the household Mongo repository, demo reseed service, and demo seed runner registration.
- Item: Validated the household slice with `npm test -- packages/kamra-api-server/src/household` and `npm run typecheck`.
- Item: Added `SEED_DEMO_HOUSEHOLD_PASSWORD` to `.env.example` and documented the demo household seed in ops/script docs.
- Item: Reviewed pending Stage 5 changes for maintainability; removed unsafe stock product-id updates, aligned household setup with the catalog validator setup boundary, and reduced demo seed magic strings.
- Item: Added authenticated household API routes for household list/create and household stock list/create/update/archive.
- Item: Added a frontend household stock service and replaced the signed-in home placeholder with live household pulse and stock-management UI.
- Item: Validated the Stage 5 route + home slice with targeted route tests, full typecheck, lint, and a production build.

## Changed Files

- Path: `.agents/sessions/2026-07-09-stage-5-household-stock-foundation.md`
- Path: `packages/kamra-api-server/src/household/README.md`
- Path: `packages/kamra-api-server/src/household/current/stock-status.ts`
- Path: `packages/kamra-api-server/src/household/current/stock-status.test.ts`
- Path: `packages/kamra-api-server/src/household/v1/contracts.ts`
- Path: `packages/kamra-api-server/src/household/v1/contracts.test.ts`
- Path: `packages/kamra-api-server/src/household/v1/schemas.ts`
- Path: `packages/kamra-api-server/src/household/v1/validation.ts`
- Path: `packages/kamra-api-server/src/household/v1/validation.test.ts`
- Path: `packages/kamra-api-server/src/household/current/demo-household-seed.ts`
- Path: `packages/kamra-api-server/src/household/current/demo-household-seed.test.ts`
- Path: `packages/kamra-api-server/src/household/current/mongo-household-repository.ts`
- Path: `packages/kamra-api-server/src/household/current/mongo-household-repository.test.ts`
- Path: `packages/kamra-api-server/src/http/routes/household-routes.ts`
- Path: `packages/kamra-api-server/src/http/app-route-context.ts`
- Path: `packages/kamra-api-server/src/http/app-handler.ts`
- Path: `packages/kamra-api-server/src/http/app-handler.test.ts`
- Path: `src/app/household/household-stock.service.ts`
- Path: `src/app/home.component.ts`
- Path: `src/app/i18n/en.json`
- Path: `src/app/i18n/hu.json`
- Path: `scripts/README.md`
- Path: `scripts/seed.ts`
- Path: `.env.example`
- Path: `docs/tech-ops.md`

## Validation

- Ran: `npm test -- packages/kamra-api-server/src/household`
- Result: passed after pending review cleanup
- Ran: `npm run typecheck`
- Result: passed after pending review cleanup
- Ran: `npm run lint`
- Result: passed after pending review cleanup
- Ran: `npm test -- packages/kamra-api-server/src/http/app-handler.test.ts packages/kamra-api-server/src/household`
- Result: passed after household route + home slice
- Ran: `npm run typecheck`
- Result: passed after household route + home slice
- Ran: `npm run lint`
- Result: passed after household route + home slice
- Ran: `npm run build`
- Result: passed after household route + home slice; Angular build emitted a bundle-budget warning because the initial bundle reached 507.37 kB against a 500 kB budget

## Decisions

- Decision: Start with Step 1 contract/helper work before persistence or routes.
- Reason: the plan makes contracts and deterministic status logic the first dependency for later slices.
- Decision: Keep household stock history fields and optional catalog snapshot fields in the record contract now so later persistence and UI steps do not need to reshape them.
- Reason: the stage plan explicitly calls for acquisition history and future catalog-linking room.
- Decision: Store demo household users as lowercased login keys so they remain compatible with the auth layer's email normalization.
- Reason: the current auth flow normalizes login identifiers to lowercase before lookup.

## Open Issues

- Issue: The later persistence step may still want small contract refinements for route payloads.
- Impact: if that happens, the plan will need an explicit follow-up before route work starts.
- Issue: Demo users are stored as lowercase login keys (`usera`, `userb`) even though the plan names them `userA` and `userB`.
- Impact: this keeps auth compatible today; ops/script docs now note the lowercase identifiers, and later UI copy should do the same if it displays demo credentials.
- Issue: The home page now supports direct custom-stock management, but the plan’s richer dedicated modal flow is not implemented yet.
- Impact: the core user journey works now, but a later Stage 5 follow-up can still refine this into the planned modal/editor experience if desired.
- Issue: The admin demo reseed API and the health/admin page rework are still not implemented.
- Impact: Stage 5 still needs the admin reseed route/button and the four-panel health/admin layout before the full stage is complete.
- Issue: The Angular production build now exceeds the initial bundle budget by 7.37 kB.
- Impact: the build still succeeds, but the home/dashboard additions pushed the web bundle past the configured warning threshold and may deserve a later trim pass.

## Roadmap Or Plan Updates

- Needed: no
- Status: none

## Next Step

Implement the admin demo reseed API next, then rework the health/admin page to expose the reseed action and remaining validation tools.

## Notes For Future Agent

The household package area now exists under `packages/kamra-api-server/src/household/` with contracts, schemas, validators, stock status helpers, Mongo repository tests, demo reseed support, and user-facing HTTP routes. The home page now consumes the new API through `src/app/household/household-stock.service.ts` and shows a real low-stock pulse plus custom stock editing for signed-in household members.
