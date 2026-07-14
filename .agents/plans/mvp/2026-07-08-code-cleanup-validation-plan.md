# Code Cleanup And Validation Plan

Status: Implemented

## Objective

Validate the current codebase and reduce clutter through behavior-preserving cleanup only: extract reusable components where they reduce visible complexity, move complex decisions into named helper functions, and keep the app/API behavior unchanged.

## Context Read

- `AGENTS.md`
- `.agents/planning-workflow.md`
- `.agents/coding-guidelines.md`
- `src/app/AGENTS.md`
- `src/app/site-admin/AGENTS.md`
- `package.json`
- `src/app/app.component.ts`
- `src/app/product-lookup/product-catalog.component.ts`
- `src/app/site-admin/ingestion-admin.component.ts`
- `src/styles.css`
- `src/app/home.component.ts`
- `src/app/health-check.component.ts`
- `src/app/shared/product-editor-dialog.component.ts`
- `src/app/shared/resizable-table.component.ts`
- `src/app/shared/toast-host.component.ts`
- `packages/kamra-api-server/src/http/routes/ingestion-routes.ts`

Validation already run:

- `npm run test` passed: 23 files, 104 tests
- `npm run typecheck` passed
- `npm run lint` passed
- `npm run build` passed with one existing Angular style budget warning for `src/app/app.component.ts` component CSS: 8.77 kB, 773 bytes over the 8.00 kB budget

Final validation after implementation:

- `npm run test` passed: 23 files, 104 tests
- `npm run typecheck` passed
- `npm run lint` passed
- `npm run build` passed without the previous app component style budget warning

Final validation after CSS token cleanup:

- `npm run test` passed: 23 files, 104 tests
- `npm run typecheck` passed
- `npm run lint` passed
- `npm run build` passed

## Research Gate

Not needed. This is an internal behavior-preserving cleanup pass using current repository conventions.

## User Requests

- Validate all existing code.
- Make adjustments to reduce clutter.
- Extract reusable component(s) where useful.
- Rewrite complex decisions into separate checked functions.
- Do not change behavior.

## Current Reality

- The repository validates cleanly except for the app-shell CSS budget warning during build.
- Largest maintainability hotspots by line count:
  - `packages/kamra-api-server/src/http/app-handler.test.ts`: 1715 lines
  - `packages/kamra-api-server/src/catalog/current/mongo-catalog-repository.ts`: 1064 lines
  - `src/app/app.component.ts`: 970 lines and CSS budget warning
  - `src/app/product-lookup/product-catalog.component.ts`: 757 lines
  - `src/app/site-admin/ingestion-admin.component.ts`: 686 lines
  - `packages/kamra-api-server/src/http/routes/ingestion-routes.ts`: 660 lines
- Current app shell owns page rail rendering, login UI, navigation, route-title mapping, and a large style block.
- Product catalog and ingestion admin share table/action patterns but keep view-specific state and data loading locally.
- Ingestion routes already have helper functions, but route handlers still mix auth/config/repository setup, query parsing, response shaping, and review decision logic.

## Intended Direction

Make the code easier to scan without changing runtime behavior:

- separate reusable UI surfaces from page-specific state
- name decision checks so route handlers read as a sequence of validated steps
- keep validation at least as strong as the current baseline
- avoid broad architectural changes, data-shape changes, or UI redesign

## Scope

Included:

- Behavior-preserving extraction from `AppComponent` into one or more small shared shell components.
- Focused extraction of repeated table/action-control UI where it clearly reduces duplicate component markup or styles.
- Refactor complex route decisions in ingestion routes into typed helper functions.
- Add or adjust focused tests only when a helper extraction changes a protected route contract or makes an edge case easier to express.
- Run full validation after each implemented slice.
- Centralize repeated CSS basics and theme-dependent values into semantic variables in `src/styles.css`.

## Non-Goals

- No product behavior changes.
- No visual redesign.
- No crawler/parser changes.
- No schema, contract, or database migration changes.
- No broad rewrite of catalog persistence, fake Mongo support, or large test suite structure in this pass.
- No moving roadmap stages or changing Stage 4 requirements.

## Assumptions

- The current crawl accepted-item toggle and acceptance filtering behavior are runtime truth.
- The Angular app shell can be split without changing route behavior or authentication flow.
- CSS budget warning can be removed by moving shell sub-surface styles into extracted components rather than weakening budgets.

## Open Questions

- Should Step 2 target the product catalog table, the ingestion table, or only a tiny shared action-button/control component first?

Recommended default: keep Step 2 narrow and extract only the shared table action control if Step 1 already provides enough clutter reduction.

## Implementation Steps

### Step 1: Extract App Shell Rail Rendering

- Goal: Move page rail section rendering and its styles out of `AppComponent` so the app shell is smaller and the CSS budget warning is resolved without changing layout or behavior.
- Files likely affected:
  - `src/app/app.component.ts`
  - new `src/app/shared/page-rail-outlet.component.ts` or similarly named shared shell component
  - possibly `src/app/shared/page-rail.service.ts` only if types need export cleanup
- Validation:
  - `npm run typecheck`
  - `npm run build`
  - manual diff review for unchanged route labels and rail action wiring
- Commit message idea: `Extract app rail shell component`

### Step 2: Extract One Small Reusable Frontend Control

- Goal: Reduce duplicated table/action markup or checkbox/toggle markup where the current product and ingestion screens repeat the same UI pattern.
- Files likely affected:
  - `src/app/shared/`
  - `src/app/product-lookup/product-catalog.component.ts`
  - `src/app/site-admin/ingestion-admin.component.ts`
- Validation:
  - `npm run typecheck`
  - `npm run build`
  - optional focused manual browser check if the changed control is visible in both screens
- Commit message idea: `Extract shared admin table control`

### Step 3: Simplify Ingestion Route Decisions

- Goal: Keep route behavior identical while moving parse/auth/repository/read-model decisions into named helpers so handlers read more linearly.
- Files likely affected:
  - `packages/kamra-api-server/src/http/routes/ingestion-routes.ts`
  - `packages/kamra-api-server/src/http/app-handler.test.ts` only if existing tests need small fixture helpers or a focused assertion for unchanged behavior
- Validation:
  - `npm run test -- packages/kamra-api-server/src/http/app-handler.test.ts`
  - `npm run typecheck`
  - `npm run lint`
- Commit message idea: `Simplify ingestion route helpers`

### Step 4: Centralize Shared CSS Tokens

- Goal: Separate foundational UI frame tokens from theme color values and replace repeated component formulas for radius, borders, shadows, control surfaces, rows, and status colors with semantic variables.
- Files likely affected:
  - `src/styles.css`
  - shell and shared Angular components with repeated CSS recipes
- Validation:
  - `npm run test`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- Commit message idea: `Centralize UI frame CSS tokens`

## Validation Plan

Before implementation:

- Already complete: `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`

After each approved step:

- Run the step-specific commands listed above.
- Run full `npm run test`, `npm run typecheck`, `npm run lint`, and `npm run build` before calling the cleanup pass complete.

## Risks

- Refactors can subtly change Angular template behavior through event binding or signal dependencies.
  - Mitigation: keep extracted components presentational, pass callbacks through existing data structures, and run build/typecheck.
- CSS extraction can change specificity or responsive layout.
  - Mitigation: move styles with their markup, avoid selector renames unless required, and inspect the resulting diff.
- Backend helper extraction can accidentally change error codes or response shape.
  - Mitigation: keep existing route tests green and add focused assertions only where needed.

## Approval Checkpoint

Implementation should not begin until the user approves this plan or selects a narrower first step.
