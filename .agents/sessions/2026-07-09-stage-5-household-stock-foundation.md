# Stage 5 Household Stock Foundation

## Session

- Date: 2026-07-09
- Plan: `.agents/plans/2026-07-08-stage-5-household-stock-foundation-plan.md`
- Branch: unknown
- Current objective: Implement Stage 5 household stock foundation, starting with contracts and deterministic helpers.

## Completed

- Item: Loaded the Stage 5 plan and relevant package/frontend workflow instructions.
- Item: Inspected existing catalog, ingestion, auth, health, and route patterns for consistency.
- Item: Added the household v1 contracts, schemas, validators, stock-status helper, package README, and initial tests.
- Item: Added the household Mongo repository, demo reseed service, and demo seed runner registration.
- Item: Validated the household slice with `npm test -- packages/kamra-api-server/src/household` and `npm run typecheck`.
- Item: Added `SEED_DEMO_HOUSEHOLD_PASSWORD` to `.env.example` and documented the demo household seed in ops/script docs.
- Item: Reviewed pending Stage 5 changes for maintainability; removed unsafe stock product-id updates, aligned household setup with the catalog validator setup boundary, and reduced demo seed magic strings.

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
- Not run: `npm run build`
- Reason: targeted tests, full typecheck, and lint passed for this backend/docs cleanup; no frontend build-impacting changes were made

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
- Issue: The user-facing household API routes and frontend household screens are not implemented yet.
- Impact: Stage 5 still needs the route, home page, modal, health/admin, and docs slices before it is fully complete.

## Roadmap Or Plan Updates

- Needed: no
- Status: none

## Next Step

Implement the household API routes next, starting with user-facing household list/stock endpoints and then the admin demo reseed route.

## Notes For Future Agent

The household package area now exists under `packages/kamra-api-server/src/household/` with contracts, schemas, validators, stock status helpers, Mongo repository tests, and demo reseed support. The next Stage 5 slice should build API routes on top of this package surface.
