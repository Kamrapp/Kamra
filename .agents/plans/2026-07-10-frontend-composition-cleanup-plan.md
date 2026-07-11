# Frontend Composition And Styling Cleanup Plan

Status: Proposed

## Objective

Reduce the size and cognitive load of the current Angular UI before Stage 8 by turning genuine page blocks into standalone components that own their markup, styles, and local presentation logic. Page classes should become orchestration shells, not the same monolith split across separate HTML and CSS files. Preserve current behavior and visual hierarchy unless a small, clearly beneficial correction is discovered during manual comparison.

This is a frontend-focused refactor plan. It intentionally does not change household expiry/buffer behavior, backend routes/contracts, or the unrelated server-side working-tree changes.

## Context Read

- `AGENTS.md`
- `.agents/planning-workflow.md`
- `.agents/coding-guidelines.md`
- `.agents/plan-template.md`
- `.agents/plans/initial-mvp-roadmap.md`
- `.agents/plans/2026-07-08-code-cleanup-validation-plan.md`
- `.agents/plans/2026-07-10-stage-7-controlled-alpha-access-plan.md`
- `src/AGENTS.md`
- `src/app/AGENTS.md`
- `src/app/site-admin/AGENTS.md`
- `package.json`, `angular.json`, `src/styles.css`
- All current Angular page components and their page services under `src/app/`

## Research Gate

Not needed. This is internal Angular composition and CSS cleanup using existing standalone-component conventions. No framework is being selected or added. Any future framework evaluation should be a separate, user-approved design decision with a migration plan.

## User Requests

- Perform a major cleanup before planning Stage 8.
- Investigate oversized UI page services and TypeScript files.
- Identify useful inner components that can become standalone components and be invoked by page containers.
- Identify CSS that can move to global styles to reduce component-specific styling.
- Preserve current visuals unless simplification has high value with minimal or improved visual change.
- Organize the code to make a later UI-framework decision easier, without preparing or adopting a framework now.

## Current Reality

The standalone Angular pattern is already established and should be extended, not replaced. Shared components already exist for page-rail rendering, resizable tables, table icon actions, toasts, and product editing.

The main frontend size hotspots are:

| Area | Current file | Lines | Main responsibilities mixed together |
| --- | --- | ---: | --- |
| Household home | `src/app/home.component.ts` | 1,564 | authenticated and preview layouts, household loading, stock editor, shopping-scale state, page rail, large inline template and CSS |
| Shopping list | `src/app/household/household-shopping-list.component.ts` | 1,224 | list lifecycle, quick add, item editing, completion confirmation, derived line state, inline template and CSS |
| Developer admin | `src/app/dev-admin/admin-dashboard.component.ts` | 1,125 | all HTTP calls, response decoding, health state, feature flags, alpha-user form, UI, inline CSS |
| Ingestion admin | `src/app/site-admin/ingestion-admin.component.ts` | 930 | snapshot and row-table rendering, filtering, selection, review actions, inline CSS |
| Product lookup | `src/app/product-lookup/product-catalog.component.ts` | 909 | filter UI, virtualized row markup, dialog orchestration, pagination and loading state, inline CSS |
| App shell | `src/app/app.component.ts` | 825 | shell layout, login/preferences UI, radial navigation, route title mapping, inline CSS |

The page services are also carrying local API DTOs, result unions, authorization headers, URL construction, transport, error decoding, and toast behavior in one file:

- `src/app/household/household-stock.service.ts` (661 lines)
- `src/app/site-admin/ingestion-admin.service.ts` (542 lines)
- `src/app/product-lookup/product-catalog.service.ts` (349 lines)

`src/styles.css` already contains theme tokens and a small global UI foundation (`.page-shell`, panel cards, buttons, tokens). Repetition remains in feature components for form fields, icon-only controls, muted/error copy, state panels, table rows, and responsive grid recipes. Global styling should remain class-based and token-driven; broad element selectors would make later framework adoption harder, not easier.

No frontend component test suite currently exists. Existing validation is typecheck, lint, build, server/unit tests, and manual browser verification.

## Re-evaluation Decisions

The initial version was intentionally broad. A second pass against the actual signal ownership and the `ResizableTableComponent` content-projection boundary narrows it as follows:

1. Do not add a shared authenticated-request service. It would hide only a small amount of repeated `fetch` plumbing while adding a cross-cutting abstraction around otherwise clear domain services.
2. Do not extract product-catalog or ingestion table rows into standalone components. Their markup is projected through `ResizableTableComponent`; a component host plus encapsulated styles would complicate the direct row structure, grid sizing, virtual-scroll layout, and accessibility for little reduction in page logic.
3. Do not split every feature service's DTOs into separate model files. Create a feature-local model file only when a newly extracted child needs a shared type or a public contract becomes genuinely hard to scan.
4. Keep extracted minor components' logic, template, and styles together when that gives them a clear standalone ownership boundary. For the remaining page/container components that are still large after minor extraction, companion `.html` and `.css` files are now allowed when they reduce scanning and editing cost without inventing another ownership layer.
5. Create a standalone component only for a complete UI responsibility with its own markup, styles, and local presentation logic. If an extraction needs a large callback bag or mutable parent draft, redesign the boundary or retain that block in the page container.

These decisions take precedence over any earlier, broader wording in this plan.

## Intended Direction

- Keep route/page components as thin containers that own feature state, loading, mutation calls, and page-rail integration.
- Extract feature-local standalone view components with explicit `input()` and `output()` contracts. Do not move mutable application state into a new global store.
- Each extracted component owns its logic, inline template, and inline styles in one `.component.ts` file. This repository's cleanup convention intentionally optimizes for one maintainable component unit rather than three synchronized files.
- Keep CSS with the component that owns its visual structure. Promote only stable, cross-feature primitives to `src/styles.css`.
- Retain existing feature services and their explicit domain result handling; create a feature service only where a page currently has no such boundary.
- Keep existing global design tokens and visual language. Do not adopt Bootstrap, Material, Tailwind, or another framework in this cleanup.

## Scope

- Frontend-only composition, style, and service organization under `src/app/` and `src/styles.css`.
- Explicit component extraction for the largest presentational blocks listed below.
- Real standalone component extraction for the page blocks listed below, including their logic and styles.
- Feature-local view-model extraction only where a child component needs a stable shared contract.
- A focused `dev-admin` service because the current dashboard directly owns all of its HTTP transport.
- Targeted manual visual comparisons and normal repository validation.
- Small documentation update only if folder-level usage or validation guidance changes materially.

## Non-Goals

- Stage 8 expiry, buffer, notification, stock, or shopping-list behavior.
- API route, database, authorization, data-contract, or localization-key changes.
- Replacing Angular or adding a CSS/component framework.
- A generic CRUD/repository abstraction or shared authenticated-request service.
- Redesigning the radial navigation, table virtualization, or application theme.
- Splitting a component into separate `.ts`, `.html`, and `.css` files.
- Extracting product or ingestion table rows through the existing content-projected `ResizableTableComponent`.
- Changing the unrelated modified backend files:
  - `packages/kamra-api-server/src/household/current/mongo-household-repository.ts`
  - `packages/kamra-api-server/src/http/routes/auth-routes.ts`

## Component Extraction Map

### App Shell

Keep `AppComponent` responsible for router lifecycle, current-page title, and composing the shell. Extract:

- `shared/shell-account-panel.component.ts`: login form, signed-in identity, theme selector, language selector; emits login/logout and preference events rather than injecting routing logic.
- `shared/radial-navigation.component.ts`: menu rendering/open state and navigation-item inputs. The shell supplies already-role-filtered menu items and closes it on navigation.
- Optionally extract the static left/right rail card markup only if the first two extractions leave enough repeated layout code to justify it. Do not create a generic card renderer.

### Household Home

Keep `HomeComponent` as the authenticated household container: data loading, selected household/item state, mutations, shopping-scale mapping, and page-rail synchronization. Extract:

- `household/household-stock-panel.component.ts`: household selector, stock table/list, selected-row state, and item selection/add-to-shopping-list events.
- `household/household-stock-editor.component.ts`: create/edit form, local additional-details disclosure, and save/archive/create events using an explicit normalized draft input/output contract.
- `household/household-preview-workspace.component.ts`: anonymous preview stock panel/editor and demo shopping-list composition. This isolates static preview markup from signed-in functionality.

Before creating either stock child, define the required display/event payload in one feature-local type file. Do not pass a mutable parent draft or a broad callback bag into a child. If that contract is not concise, keep the markup in `HomeComponent` until a sounder ownership boundary is identified.

### Household Shopping List

Keep `HouseholdShoppingListComponent` as the list-lifecycle container and public API used by `HomeComponent`. Extract:

- `household/shopping-list-overview.component.ts`: owns active/purchased line rendering, purchased-section collapse, line detail disclosure, and line-level display actions. It receives the current list and emits typed line/toggle/detail intents; it does not call the API.
- `household/shopping-list-completion-panel.component.ts`: completion choices and confirmation presentation, with a typed confirmation input and explicit confirm/cancel outputs.

Keep quick-add and list lifecycle in the parent. The overview child owns only line presentation and local disclosure state; the parent remains the single owner of stock-update rules and persistence.

This preserves the parent methods currently used by the page rail (`generateShoppingList`, `reloadShoppingList`, `cancelShoppingList`) and avoids breaking the `ViewChild` contract in `HomeComponent`.

### Developer Admin

Create `dev-admin/admin-dashboard.service.ts` to own all admin-dashboard request construction, authorization headers, response parsing, stable result unions, and transport failures. Keep localized presentation decisions and toast wiring in the dashboard component. Add `admin-dashboard.models.ts` only for types genuinely shared by the service and extracted cards.

Then extract the independent admin surfaces:

- `dev-admin/admin-health-card.component.ts`: health report/check rendering and the run action.
- `dev-admin/admin-feature-flags-card.component.ts`: feature-flag listing and toggle request events.
- `dev-admin/admin-alpha-access-card.component.ts`: alpha-user form, create action, and creation outcome.
- Keep one-off maintenance actions in the dashboard container until their markup proves large enough to warrant an `admin-maintenance-card`.

This is the highest-value service cleanup because the page currently bypasses the feature-service pattern used by product, ingestion, and household features.

### Product Lookup And Site Administration

Extract whole table surfaces rather than individual projected rows:

- `product-lookup/product-catalog-filter-bar.component.ts`: owns the filter controls and their local selection presentation; emits compact filter changes.
- `product-lookup/product-catalog-table.component.ts`: owns the resizable table, virtualized row rendering, row formatting, scroll/load-more event, and edit intent. It receives products, columns, and display state; the page retains fetching and selection orchestration.
- `site-admin/ingestion-snapshot-table.component.ts`: owns snapshot-table rendering, virtualization, scroll/load-more event, and snapshot selection intent.
- `site-admin/ingestion-detail-table.component.ts`: owns parsed-row table rendering and review intent for the selected snapshot.

Do not put a child component around each projected row. The table-level component remains the direct owner of the `ResizableTableComponent` content projection, grid sizing, and virtual-scroll structure.

If a proposed table-level contract becomes a callback bag, leave the corresponding table in the page and extract only the filter bar.

## Service And Type Cleanup

1. Create `dev-admin/admin-dashboard.service.ts`; it is the only page currently mixing its own HTTP transport with UI state.
   - Preserve current request methods, URLs, headers, payloads, status handling, and error text.
   - Return typed feature results rather than leaking `Response` into the dashboard.
   - Keep toasts and localized presentation decisions in the dashboard container.

2. Leave `household-stock.service.ts`, `ingestion-admin.service.ts`, and `product-catalog.service.ts` as feature-owned transport boundaries. Their result unions make expected failures explicit and are more valuable than shaving line count through a shared helper.

3. Add a feature-local model file only when a new standalone child needs a type that would otherwise import a parent component or service implementation. Update imports explicitly; do not add a broad model barrel or re-export-only churn.

## CSS Cleanup Rules

Move only these stable primitives into `src/styles.css`, using existing theme tokens and prefixed class names:

- `.ui-form-field` / `.ui-form-control` for consistent label, input, select, and textarea treatment.
- `.ui-icon-button` for accessible compact icon-only controls, including stable square sizing and disabled state.
- `.ui-status-copy` and `.ui-error-copy` for muted/status/error text treatments.
- `.ui-state-panel` for the repeated empty/loading/error panel frame.
- `.ui-split-fields` / `.ui-action-row` only after confirming the existing grid/action rules match without page-specific overrides.

Keep local to each feature component:

- page and workspace layout grids
- stock/shopping/admin/catalog/ingestion table column templates, virtualized row structure, and responsive breakpoints
- visual states tied to domain meaning (stock priority, accepted snapshot, ticked purchase, health failure)
- radial-menu geometry and page-rail-specific layout
- dialog-specific layout and JSON review display

When a real child is extracted, move its relevant markup, CSS, and presentation logic together into the child `.component.ts` file and preserve selector behavior during the first move. Consolidate duplicates only after a visual check.

## Implementation Steps

### Step 1: Establish Baseline And Extract The App Shell

- Goal: Record the frontend validation baseline, then extract the account/preferences and radial-navigation blocks as real standalone components. The parent retains auth, toast, routing, role filtering, and preference persistence.
- Files likely affected:
  - `src/app/app.component.ts`
  - `src/app/shared/shell-account-panel.component.ts` (new, with inline template/styles)
  - `src/app/shared/radial-navigation.component.ts` (new, with inline template/styles)
- Validation:
  - `npm run test`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - manual shell checks after the final cleanup: login/logout, theme/language switching, admin visibility, keyboard navigation, menu open/close, and narrow layout
- Commit message idea: `Extract shell account and navigation components`

### Step 2: Decompose Household Workspace

- Goal: Turn the anonymous preview, stock panel, and stock editor into real feature-local components with their own logic and styles while preserving parent-owned loading, mutations, and page-rail state.
- Files likely affected:
  - `src/app/home.component.ts`
  - `src/app/household/household-home.models.ts` (new only if contracts require it)
  - `src/app/household/household-preview-workspace.component.ts` (new, with inline template/styles)
  - `src/app/household/household-stock-panel.component.ts` (new, with inline template/styles)
  - `src/app/household/household-stock-editor.component.ts` (new, with inline template/styles)
- Validation:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - manual anonymous preview and authenticated household checks: select/create household, create/edit/archive stock item, add-to-list, and shopping-scale rail actions
- Commit message idea: `Extract household workspace components`

### Step 3: Decompose Shopping List And Developer Admin

- Goal: Give the shopping-list overview and completion surfaces their own presentation logic, then move direct developer-admin HTTP and independent admin cards behind real feature boundaries.
- Files likely affected:
  - `src/app/household/household-shopping-list.component.ts`
  - `src/app/household/shopping-list-overview.component.ts` (new, with inline template/styles)
  - `src/app/household/shopping-list-completion-panel.component.ts` (new, with inline template/styles)
  - `src/app/dev-admin/admin-dashboard.component.ts`
  - `src/app/dev-admin/admin-dashboard.service.ts` (new)
  - `src/app/dev-admin/admin-dashboard.models.ts` (new only if shared types require it)
  - `src/app/dev-admin/admin-health-card.component.ts` (new, with inline template/styles)
  - `src/app/dev-admin/admin-feature-flags-card.component.ts` (new, with inline template/styles)
  - `src/app/dev-admin/admin-alpha-access-card.component.ts` (new, with inline template/styles)
- Validation:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - manual shopping-list add/tick/edit/detail/complete/cancel checks and admin/non-admin health, feature-flag, alpha-user, reseed, maintenance, and unauthorized checks
- Commit message ideas: `Extract shopping list presentation components`; `Split developer admin service and cards`

### Step 4: Extract Whole Catalog And Ingestion Table Surfaces

- Goal: Extract table-level components that own their HTML, CSS, row-formatting logic, and scroll/selection intents without wrapping individual projected rows.
- Files likely affected:
  - `src/app/product-lookup/product-catalog.component.ts`
  - `src/app/product-lookup/product-catalog-filter-bar.component.ts` (new, with inline template/styles)
  - `src/app/product-lookup/product-catalog-table.component.ts` (new, with inline template/styles)
  - `src/app/site-admin/ingestion-admin.component.ts`
  - `src/app/site-admin/ingestion-snapshot-table.component.ts` (new, with inline template/styles)
  - `src/app/site-admin/ingestion-detail-table.component.ts` (new, with inline template/styles)
- Validation:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - manual product/ingestion checks: filters, source toggles, virtual scrolling, selection, editor dialog, review, accept, and decline
- Commit message idea: `Extract catalog and ingestion table surfaces`

### Step 5: Generalize Verified CSS Primitives

- Goal: Compare the extracted components, identify exact repeated recipes, and promote only verified primitives to global styles. Do not use this step to move monolithic CSS into separate files without ownership changes.
- Files likely affected:
  - `src/styles.css`
  - extracted component CSS files
  - `src/app/AGENTS.md` if the composition convention needs durable documentation
- Validation:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - manual light/dark and desktop/narrow comparison for every touched route
- Commit message idea: `Consolidate verified frontend style primitives`

### Step 6: Close With Full Validation And Manual-Test Handoff

- Goal: Run the complete automated suite, inspect the final component graph, and enrich the session handoff with every manual verification concern still requiring user execution.
- Files likely affected:
  - all touched frontend component files
  - `.agents/sessions/2026-07-10-frontend-composition-cleanup.md`
  - `.agents/plans/initial-mvp-roadmap.md` only to note the cleanup is completed before Stage 8, not to change Stage 8 scope
- Validation:
  - `npm run test`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - browser comparison at desktop and narrow-mobile sizes for each touched route, with light and dark themes
  - inspect the final diff to confirm no unrelated backend working-tree changes were included
- Commit message idea: `Validate frontend composition cleanup`

## Validation Plan

Run full validation before the first implementation commit and after Steps 1, 3, 5, and 6. Run the focused build/typecheck/lint checks after every commit-sized step.

Manual browser checks are required because no component-level UI test harness currently protects templates, CSS specificity, responsive composition, or signal/event wiring. Capture the exact routes and states checked in the implementation handoff. Do not add a broad Angular test framework merely for this cleanup; propose it separately if repeated UI regressions justify the maintenance cost.

## Risks

- Extracted components can acquire large, opaque input/output interfaces.
  - Mitigation: keep child components feature-local and presentational; if a contract becomes unwieldy, retain that block in the container rather than forcing extraction.
- Moving inline CSS can change Angular style encapsulation or selector precedence.
  - Mitigation: keep styles component-scoped in `.component.css` files first and preserve selectors before deduplication.
- A new dev-admin service can accidentally alter status handling or error wording.
  - Mitigation: preserve its existing request method/URL/body/status matrix, return typed feature results, and verify all admin flows manually.
- Content-projected table rows can regress if moved behind component hosts.
  - Mitigation: keep product and ingestion row markup colocated with the page that owns `ResizableTableComponent`, virtual scrolling, and grid sizing.
- Shopping-list extraction can break `HomeComponent`'s `ViewChild` interaction.
  - Mitigation: preserve `HouseholdShoppingListComponent` as the public lifecycle facade; only move presentational subtrees beneath it.
- Visual differences may be subtle across theme and viewport sizes.
  - Mitigation: manually compare light/dark and desktop/narrow layouts after each structural step before removing old CSS.

## Side Suggestions

- After this cleanup, use the resulting view boundaries as evidence for a separate framework evaluation only if a concrete need arises (accessible complex controls, data-grid functionality, or a component-maintenance burden). A framework should solve a measured problem, not become cleanup collateral.
- Consider adding a small Playwright visual-smoke suite after Stage 8 if the same responsive/UI regressions recur. This is not included here because the current request is code cleanup, not test-infrastructure expansion.

## Scope Extension: Standardization Follow-Up

The first implementation pass exposed two bounded standardization opportunities that are now included before cleanup closeout:

### Developer-Admin Transport Service

Create `src/app/dev-admin/admin-dashboard.service.ts` to own the developer-admin request boundary. The page currently repeats authenticated request construction, API error parsing, JSON payload decoding, and network-failure handling across health, reseed, validator, backfill, feature-flag, and alpha-user actions. The service should expose typed endpoint methods or a deliberately typed request result, preserve URLs, HTTP methods, headers, payloads, and status semantics, and leave authorization policy, localized UI messages, toasts, and page state in the dashboard.

Do not create a generic application-wide HTTP repository abstraction. This service is feature-local because the admin endpoint set and response contracts are specific and already large enough to justify one boundary.

### Injectable Browser Logging Facade

Add a root-provided `BrowserLoggerService` around the existing browser logging behavior. Preserve console output, `/api/log` forwarding, keepalive behavior, and failure isolation. Migrate feature callers to dependency injection so logging has one replaceable/testable seam. Keep payloads small and secret-free. The existing function may remain as a compatibility wrapper only if a bootstrap call requires it; otherwise remove it.

Update `docs/logging.md` with the frontend convention: inject the facade, use structured event names, include bounded operational context, never include tokens/passwords, and treat forwarding failure as non-fatal.

### Scope Extension Validation

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- targeted tests for the admin transport result handling and logger payload behavior where the existing test setup supports them
- manual admin authorization/error flows and representative browser log forwarding checks

Commit separately as `Standardize admin transport boundary`, `Add injectable browser logger`, and `Document frontend logging conventions` where the changes remain independently reviewable.

## Scope Extension: Companion Template And Style Files

The user has explicitly expanded the cleanup rule to permit external `.html` and `.css` files after useful minor component extraction. Apply this in a staged order:

1. Extract a meaningful minor component from a remaining monster first when the markup owns local state, presentation helpers, or a cohesive edit/display contract.
2. Reassess the parent. Only move the parent's remaining template and styles to companion files when the parent remains a substantial container and the move improves scanning without changing ownership or behavior.
3. Preserve Angular component-scoped CSS selectors and relative file names. Do not use companion files to hide a component that should have been split further.

Initial target: `household-shopping-list.component.ts`. Extract the shopping-line editor/display unit first, then externalize the remaining list container template/styles. Record every new companion file and manual visual risk in the session handoff.

## Approval Checkpoint

Implementation should not begin until the user approves this plan or explicitly selects a narrower first commit-sized step.
