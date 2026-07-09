# Stage 5 Household Stock Foundation

## Session

- Date: 2026-07-09
- Plan: `.agents/plans/2026-07-08-stage-5-household-stock-foundation-plan.md`
- Branch: unknown
- Current objective: Stage 5 is complete. The seeded user can sign in, see low-stock pulse data, manage custom household stock with minimum limits, and the household concept is documented for Stage 6 and post-MVP planning.

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
- Item: Merged the signed-in home stock views into a two-panel pulse/editor layout with a priority-ordered scrollable stock table, shopping-scale preview, and add/edit editor mode.
- Item: Added optional GTIN/source URL/source name household stock fields through contracts, validation, repository mapping, frontend service types, and the home editor additional-details section.
- Item: Documented the Stage 5 shopping-list scale preview levels as non-persistent placeholders ahead of Stage 6 generation.
- Item: Revalidated and modernized Hungarian UI copy, including the household scale labels, route/admin wording, and awkward literal translations.
- Item: Refined the pulse header into three columns with a shorter custom vertical shopping-scale slider, level tick marks, playful level hints, and a full-size shopping-list action.
- Item: Moved the shopping-list coming-soon notification into the household stock service so the home component uses the shared household toast path instead of owning a one-off placeholder method.
- Item: Removed the app shell's separate login/logout message lane so auth, household, and page actions now all use the same global toast host.
- Item: Added an admin-only demo household reseed API that uses the existing stable demo seed service and leaves unrelated users intact.
- Item: Reworked the health/admin page into a four-card utility layout with demo reseed, database maintenance, future feature-flag placeholders, and a reserved block.
- Item: Renamed the health/dev-admin surface to an admin dashboard, moved catalog modifier actions into their own maintenance card, and hid admin-only navigation/content from non-admin users without logging them out on unauthorized dashboard requests.
- Item: Hardened admin dashboard route-response handling so non-JSON or malformed health responses now surface as route errors instead of false browser-reachability failures, and updated the global toast host to use dedicated dark-theme text colors with readable contrast.
- Item: Switched dark-theme toasts from the temporary light card treatment to a proper dark panel surface with light text so the shared toast host now matches the overall dark theme.
- Item: Simplified the home pulse shopping-list action button so it now uses the shared quiet surface styling instead of a glossy gradient highlight, especially in dark mode.
- Item: Added quick minus/input/plus controls for the household stock minimum limit editor.
- Item: Added `docs/household.md` as the durable household stock concept, current-state, operations, Stage 6, and post-MVP reference.
- Item: Updated architecture, tech-ops, script, package README, Stage 5 plan, and MVP roadmap docs to mark Stage 5 complete and point future work toward Stage 6 shopping-list generation.

## Changed Files

- Path: `.agents/sessions/2026-07-09-stage-5-household-stock-foundation.md`
- Path: `.agents/plans/2026-07-08-stage-5-household-stock-foundation-plan.md`
- Path: `.agents/plans/initial-mvp-roadmap.md`
- Path: `docs/architecture.md`
- Path: `docs/household.md`
- Path: `docs/tech-ops.md`
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
- Path: `packages/kamra-api-server/src/http/routes/admin-dashboard-route.ts`
- Path: `api/admin/dashboard/health.ts`
- Path: `api/admin/dashboard/upgrade-catalog-validators.ts`
- Path: `api/admin/dashboard/backfill-unvalidated-products.ts`
- Path: `api/admin/dashboard/reseed-demo-household.ts`
- Path: `src/app/household/household-stock.service.ts`
- Path: `src/app/home.component.ts`
- Path: `src/app/dev-admin/admin-dashboard.component.ts`
- Path: `src/app/app.component.ts`
- Path: `src/app/app.routes.ts`
- Path: `src/app/shared/toast-host.component.ts`
- Path: `src/app/home.component.ts`
- Path: `src/styles.css`
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
- Ran: `npm test -- packages/kamra-api-server/src/http/app-handler.test.ts packages/kamra-api-server/src/household`
- Result: passed after the home pulse/editor merge; 6 test files and 41 tests passed
- Ran: `npm run typecheck`
- Result: passed after the home pulse/editor merge
- Ran: `npm run lint`
- Result: passed after the home pulse/editor merge
- Ran: `npm run build`
- Result: passed after the home pulse/editor merge; Angular reported an initial bundle size of 512.23 kB
- Ran: locale parity check for `src/app/i18n/en.json` and `src/app/i18n/hu.json`
- Result: passed after Hungarian copy and shopping-scale hint updates; both locales contain 331 leaf keys
- Ran: `npm run typecheck`
- Result: passed after the slider/header and translation updates
- Ran: `npm run lint`
- Result: passed after the slider/header and translation updates
- Ran: `npm run build`
- Result: passed after the slider/header and translation updates; Angular reported an initial bundle size of 516.25 kB and a component CSS budget warning for `home.component.ts` at 10.20 kB against an 8.00 kB budget
- Ran: `npm run typecheck`
- Result: passed after moving the shopping-list placeholder toast into the household stock service
- Ran: `npm run lint`
- Result: passed after moving the shopping-list placeholder toast into the household stock service
- Ran: `npm run typecheck`
- Result: passed after unifying auth and page notifications onto the global toast host
- Ran: `npm run lint`
- Result: passed after unifying auth and page notifications onto the global toast host
- Ran: `npm run build`
- Result: passed after unifying auth and page notifications onto the global toast host; Angular reported an initial bundle size of 514.49 kB
- Ran: `npm test -- packages/kamra-api-server/src/http/app-handler.test.ts`
- Result: passed after adding the admin demo-household reseed route; 1 test file and 36 tests passed
- Ran: `npm run typecheck`
- Result: passed after the admin demo-household route and four-card health page rework
- Ran: `npm run lint`
- Result: passed after the admin demo-household route and four-card health page rework
- Ran: `npm run build`
- Result: passed after the admin demo-household route and four-card health page rework; Angular reported an initial bundle size of 521.32 kB
- Ran: `npm test -- packages/kamra-api-server/src/http/app-handler.test.ts`
- Result: passed after the admin dashboard route rename and access-guard fix; 1 test file and 36 tests passed
- Ran: `npm run typecheck`
- Result: passed after the admin dashboard route rename and access-guard fix
- Ran: `npm run lint`
- Result: passed after the admin dashboard route rename and access-guard fix
- Ran: `npm run build`
- Result: passed after the admin dashboard route rename and access-guard fix; Angular reported an initial bundle size of 522.92 kB
- Ran: locale parity check for `src/app/i18n/en.json` and `src/app/i18n/hu.json`
- Result: passed after the admin dashboard translation updates; both locales contain 354 leaf keys
- Ran: `npm run typecheck`
- Result: passed after the admin dashboard route-response handling and toast contrast updates
- Ran: `npm run lint`
- Result: passed after the admin dashboard route-response handling and toast contrast updates
- Ran: `npm run build`
- Result: passed after the admin dashboard route-response handling and toast contrast updates; Angular reported an initial bundle size of 524.30 kB
- Ran: `npm run lint`
- Result: passed after the dark-theme toast surface correction
- Ran: `npm run build`
- Result: passed after the dark-theme toast surface correction; Angular reported an initial bundle size of 524.41 kB
- Ran: `npm run lint`
- Result: passed after simplifying the shopping-list action button styling
- Ran: `npm run build`
- Result: passed after simplifying the shopping-list action button styling; Angular reported an initial bundle size of 524.83 kB
- Ran: `npm run typecheck`
- Result: passed for final Stage 5 closeout
- Ran: `npm test`
- Result: passed for final Stage 5 closeout; 28 test files and 122 tests passed
- Ran: `npm run lint`
- Result: passed for final Stage 5 closeout
- Ran: `npm run build`
- Result: passed for final Stage 5 closeout; Angular reported an initial bundle size of 526.20 kB
- Ran: locale parity check for `src/app/i18n/en.json` and `src/app/i18n/hu.json`
- Result: passed for final Stage 5 closeout; both locales contain 356 leaf keys

## Decisions

- Decision: Start with Step 1 contract/helper work before persistence or routes.
- Reason: the plan makes contracts and deterministic status logic the first dependency for later slices.
- Decision: Keep household stock history fields and optional catalog snapshot fields in the record contract now so later persistence and UI steps do not need to reshape them.
- Reason: the stage plan explicitly calls for acquisition history and future catalog-linking room.
- Decision: Store demo household users as lowercased login keys so they remain compatible with the auth layer's email normalization.
- Reason: the current auth flow normalizes login identifiers to lowercase before lookup.
- Decision: Keep Stage 5 shopping-list generation as a placeholder toast while allowing the home pulse count to preview three inclusion levels.
- Reason: this supports the intended shopping-list shape without pretending generation/persistence exists before Stage 6.
- Decision: Group the dev-admin runtime checks and modifier actions under `/admin/dashboard` and `/api/admin/dashboard/*`, while keeping `/health` as a frontend redirect only.
- Reason: this makes the admin surface read more intentionally, keeps the Vercel/API routing explicit, and avoids leaving the old health naming mixed with broader admin tooling.
- Decision: Keep unauthorized admin dashboard requests in place and show admin-access errors instead of logging the current user out.
- Reason: admin-only access failures are not the same thing as an invalid end-user session, and logging out `usera` was both confusing and incorrect.
- Decision: Close Stage 5 with a home-page side editor and quick minimum-limit controls instead of introducing a separate modal.
- Reason: the implemented two-panel home workspace covers the planned add/edit/archive flow while preserving the requested layout direction.

## Open Issues

- Issue: The later persistence step may still want small contract refinements for route payloads.
- Impact: if that happens, the plan will need an explicit follow-up before route work starts.
- Issue: Demo users are stored as lowercase login keys (`usera`, `userb`) even though the plan names them `userA` and `userB`.
- Impact: this keeps auth compatible today; ops/script docs now note the lowercase identifiers, and later UI copy should do the same if it displays demo credentials.
- Issue: Shopping-list generation is still a placeholder toast; the scale only changes the displayed candidate item count in the pulse.
- Impact: Stage 6 still needs real list generation, persistence, and downstream actions.
- Issue: The Angular production build initial bundle is now 526.20 kB.
- Impact: the build still succeeds, but the home/dashboard additions may deserve a later trim pass if bundle budget pressure becomes distracting.
- Issue: `src/app/home.component.ts` component styles now exceed the Angular component CSS budget at 10.20 kB against an 8.00 kB budget.
- Impact: the build still succeeds, but the home page should be a candidate for CSS extraction or simplification if the warning becomes noisy.
- Issue: The dashboard health check still depends on the local/shared API actually being reachable at `/api/admin/dashboard/health`; if the local API server is not running, the browser-reachability toast is still the expected result.
- Impact: the UI now distinguishes malformed route responses from network failures correctly, but local run instructions still matter for successful checks.

## Roadmap Or Plan Updates

- Needed: yes
- Status: updated `.agents/plans/initial-mvp-roadmap.md` to mark Stage 5 complete and make Stage 6 the next recommended planning target.

## Next Step

Plan Stage 6 shopping-list generation from `docs/household.md`, especially the stock status model, shopping-scale preview levels, and requirement that unmatched household-local needs remain visible.

## Notes For Future Agent

Stage 5 is closed. The household package area now exists under `packages/kamra-api-server/src/household/` with contracts, schemas, validators, stock status helpers, Mongo repository tests, demo reseed support, and user-facing HTTP routes. The home page now consumes the new API through `src/app/household/household-stock.service.ts` and shows a real priority-ordered household stock pulse plus merged add/edit custom stock editing for signed-in household members, including quick minimum-limit controls. The pulse shopping scale is currently UI-only: `Business as usual` counts below-limit/at-limit rows, `Keep it chill` adds low-soon rows, and `Stock 'em up!` counts every tracked row. Shell auth feedback and page feedback now flow through the shared global toast host. The old health screen is now an admin dashboard under `/admin/dashboard`, backed by `/api/admin/dashboard/*`, with a dedicated read-only health-check card, a separate maintenance card for modifier actions, and role-based menu/page guarding. Final closeout validation passed: `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`, and locale parity.
