# Frontend Composition Cleanup Session

## Session

- Date: 2026-07-10
- Plan: `.agents/plans/mvp/2026-07-10-frontend-composition-cleanup-plan.md`
- Branch: `dev/bg/frontend-refact`
- Current objective: Implement the approved frontend composition cleanup in small, validated steps before Stage 8.

## Completed

- Item: Re-evaluated and narrowed the cleanup plan to safe, high-value boundaries.
- Item: An attempted “externalize every page template/style” implementation was reverted at the user's direction because it reduced file size without reducing ownership complexity.
- Item: Plan revised to require real standalone block components owning their own HTML, CSS, and presentation logic.
- Item: Restarted implementation with Step 1: shell account/preferences and radial navigation extraction.
- Item: Corrected the file-boundary rule: extracted components keep inline template/styles in their single `.component.ts`; no companion HTML/CSS files are part of this cleanup.
- Item: Created the shell account/preferences and radial-navigation standalone components with local logic and styles.
- Item: Completed Step 1 shell extraction and validated it with tests, typecheck, lint, and production build.
- Item: Completed Step 2 preview extraction and validated it.
- Item: Extracted the authenticated household stock panel into a single-file standalone component; the page retains loading, mutation, and page-rail ownership.
- Item: Extracted the authenticated household stock editor into a single-file standalone component with a normalized draft input/output contract; the page retains API calls and mutation state.
- Item: Started Step 3 by extracting the shopping-list completion confirmation panel into a single-file standalone component with typed confirm/cancel outputs.
- Item: Extracted the developer-admin health report card into a single-file standalone component; dashboard transport, auth, localized errors, and toasts remain in the page.
- Item: Extracted the developer-admin feature-flags card into a single-file standalone component with typed toggle/save events.
- Item: Extracted the developer-admin alpha-access card into a single-file standalone component with typed form and action events.
- Item: Extracted the product catalog filter bar into a single-file standalone component; catalog filtering/debounce and table virtualization remain in the page.
- Item: Extracted the ingestion snapshot table into a single-file standalone component with local virtualization, row formatting, selection output, and scroll output.
- Item: Reviewed the extracted CSS against `src/styles.css`; no new global primitive was promoted because the remaining recipes are domain-specific or have different responsive behavior.
- Item: Extended scope with a feature-local admin transport service that centralizes authenticated URL construction, network failure handling, and response payload decoding while leaving page policy and UI state in the dashboard.
- Item: Added a root-provided browser logger facade and migrated shell, admin, catalog, and ingestion callers to dependency injection while preserving existing forwarding behavior.
- Item: Extended `docs/logging.md` with injectable frontend logging, event naming, bounded-context, secret-safety, and failure-isolation conventions.
- Item: User explicitly expanded the cleanup rule to allow companion `.html`/`.css` files after useful minor component extraction.
- Item: Extracted `ShoppingListLineComponent` with local disclosure state, line formatting helpers, inline styles, and a discriminated edit-intent output.
- Item: Externalized the remaining `HouseholdShoppingListComponent` template and styles into companion `.html`/`.css` files after the line extraction.
- Item: Extracted `DatabaseMaintenanceEntryComponent` with local row actions, details disclosure, finished-state presentation, and responsive row styles.
- Item: Externalized the remaining database-maintenance container template/styles and removed row-specific CSS from the parent.
- Item: Externalized `HomeComponent` into companion files after the household block extractions and reduced its CSS to the actual page-container layout only.
- Item: Externalized the remaining developer-admin dashboard shell template/styles after its health, flags, alpha, and maintenance boundaries were extracted.
- Item: Externalized the product-catalog page template/styles after the filter-bar boundary was extracted; virtualized table rows remain in the page by design.
- Item: Externalized the ingestion-admin page template/styles after the snapshot-table boundary was extracted; selected detail/review rows remain in the page by design.
- Item: Review fix: restored the original login draft behavior by clearing the shell password only after successful login or logout, not after failed attempts.
- Item: Review fix: restored the project-note/about rail card's missing styling and bottom anchoring after shell CSS extraction.
- Item: Reviewed the refact branch for additional contract, companion-file, CSS ownership, DI, transport, logging, and event-wiring regressions; no further concrete defects were found.
- Item: Deployment review found missing Vercel wrappers for shared admin/domain routes; added `api/[...path].ts` as a thin catch-all adapter to keep the shared dispatcher reachable on Vercel.

## Changed Files

- Path: `.agents/plans/mvp/2026-07-10-frontend-composition-cleanup-plan.md`
  - Re-evaluated plan; no runtime behavior change.
- Path: `.agents/sessions/mvp/2026-07-10-frontend-composition-cleanup.md`
  - This handoff record.
- Path: `src/app/`
  - Runtime files are back to their pre-refactor state after the user reverted the bookkeeping-only split.
- Path: `src/app/shared/shell-account-panel.component.ts`
  - New single-file standalone account/preferences component.
- Path: `src/app/shared/radial-navigation.component.ts`
  - New single-file standalone radial navigation component.
- Path: `src/app/app.component.ts`
  - Composes the two shell components and retains auth, routing, toasts, role filtering, and preference persistence.
- Path: `src/app/household/household-preview-workspace.component.ts`
  - New single-file standalone anonymous household preview component with its own template, styles, and display helpers.
- Path: `src/app/home.component.ts`
  - Composes the preview, stock-panel, and stock-editor components while retaining household loading, mutations, shopping-list integration, and page-rail state.
- Path: `src/app/household/household-stock-panel.component.ts`
  - Owns household selection, stock rendering, local create-household form state, row presentation, and add-to-list affordances.
- Path: `src/app/household/household-stock-editor.component.ts`
  - Owns editor markup, inline styles, draft editing, additional-details disclosure, min-limit controls, and typed save/archive/create events.
- Path: `src/app/household/shopping-list-completion-panel.component.ts`
  - Owns confirmation prompt markup, mode-button presentation, localization, and primary-mode selection.
- Path: `src/app/household/household-shopping-list.component.ts`
  - Composes the completion panel while retaining shopping-list state, persistence, and lifecycle methods.
- Path: `src/app/dev-admin/admin-health-card.component.ts`
  - Owns health summary/report rendering, check status styling, error detail display, and the run-health output.
- Path: `src/app/dev-admin/admin-dashboard.component.ts`
  - Composes the health card and retains all admin request and authorization logic.
- Path: `src/app/dev-admin/admin-dashboard.service.ts`
  - Owns admin request URL/auth-header construction and shared API payload/error decoding.
- Path: `src/app/browser-logger.service.ts`
  - Provides the injectable browser logging seam and bounded environment metadata.
- Path: `src/app/app.component.ts`, `src/app/dev-admin/admin-dashboard.component.ts`, `src/app/product-lookup/product-catalog.component.ts`, `src/app/site-admin/ingestion-admin.component.ts`
  - Use the injected logger facade for structured operational events.
- Path: `docs/logging.md`
  - Documents the frontend logger seam and payload-safety rules.
- Path: `api/[...path].ts`, `api/AGENTS.md`
  - Expose and document the Vercel catch-all adapter for shared database-maintenance, alpha-access, ingestion, catalog, and household routes.
- Path: `src/app/household/shopping-list-line.component.ts`
  - Owns one shopping-list line's display/edit markup, local disclosure state, responsive line styles, uncertainty/reason localization, and typed change events.
- Path: `src/app/household/household-shopping-list.component.ts`
  - Composes the line child and retains list persistence, mutation rules, quick-add, completion, and lifecycle facade behavior; companion files now hold its list markup and styles.
- Path: `src/app/household/household-shopping-list.component.html`
  - Holds the shopping-list container template after minor line ownership was extracted.
- Path: `src/app/household/household-shopping-list.component.css`
  - Holds the unchanged parent-scoped list layout and responsive styles.
- Path: `src/app/dev-admin/database-maintenance-entry.component.ts`
  - Owns one maintenance entry's action buttons, completion labels, details tooltip state, and responsive row CSS.
- Path: `src/app/dev-admin/database-maintenance.component.ts`
  - Composes entry children and retains auth gating, loading, transport, entry grouping, and run-all state.
- Path: `src/app/dev-admin/database-maintenance.component.html`, `src/app/dev-admin/database-maintenance.component.css`
  - Hold the maintenance container markup and container/table framing styles after row extraction.
- Path: `src/app/home.component.html`, `src/app/home.component.css`
  - Hold the thin authenticated/anonymous composition template and the remaining workspace layout rules.
- Path: `src/app/home.component.ts`
  - Retains household loading, mutations, page-rail state, and child composition; removed stale stock/editor/list styling and the unused `FormsModule` import.
- Path: `src/app/dev-admin/admin-dashboard.component.html`, `src/app/dev-admin/admin-dashboard.component.css`
  - Hold the admin authorization shell, one-off reseed/maintenance composition, and page-level dashboard styles.
- Path: `src/app/dev-admin/admin-dashboard.component.ts`
  - Retains admin state, transport calls, authorization policy, logging, and child-card composition.
- Path: `src/app/product-lookup/product-catalog.component.html`, `src/app/product-lookup/product-catalog.component.css`
  - Hold the catalog page composition, virtualized table markup, editor host, and catalog-scoped styles.
- Path: `src/app/product-lookup/product-catalog.component.ts`
  - Retains catalog loading/filter orchestration, virtual row calculation, page-rail state, and product editor actions.
- Path: `src/app/site-admin/ingestion-admin.component.html`, `src/app/site-admin/ingestion-admin.component.css`
  - Hold the ingestion workspace, selected detail table, review dialog host, and page-scoped layout styles.
- Path: `src/app/site-admin/ingestion-admin.component.ts`
  - Retains ingestion loading/pagination, source filters, selected-snapshot state, review actions, page rail, and workspace resizing.
- Path: `src/app/dev-admin/admin-feature-flags-card.component.ts`
  - Owns the auto-tick flag presentation, disabled/loading behavior, save action, and local flag-card styles.
- Path: `src/app/dev-admin/admin-alpha-access-card.component.ts`
  - Owns controlled-alpha flag presentation, credential fields, save/create actions, and local form styles.
- Path: `src/app/product-lookup/product-catalog-filter-bar.component.ts`
  - Owns the catalog name-filter control, clear affordance, localization, and filter-bar styles.
- Path: `src/app/product-lookup/product-catalog.component.ts`
  - Composes the filter bar and retains filtering state, debounce, table projection, loading, and editor orchestration.
- Path: `src/app/site-admin/ingestion-snapshot-table.component.ts`
  - Owns the resizable snapshot table, virtual row window, snapshot row formatting, empty-state text, selection event, and scroll event.
- Path: `src/app/site-admin/ingestion-admin.component.ts`
  - Composes the snapshot table and retains pagination/loading, page-rail orchestration, workspace resize, selected detail rows, and review actions.
- Path: `src/styles.css`
  - No changes in this phase; existing global surface/button primitives were sufficient, and new global form/state classes were not justified by exact reuse.

## Validation

- Ran: Repository inspection and plan consistency checks.
- Result: Existing Angular standalone patterns and content-projected table boundary confirmed.
- Ran: `git diff --check` for the changed source files.
- Result: No whitespace errors.
- Ran: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test`, and `git diff --check` after the preview and stock-panel slices.
- Result: Passed; `git diff --check` reports only normal CRLF normalization warnings.
- Result: Household composition step passed `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test` (31 files / 153 tests).
- Result: The editor child uses an explicit normalized draft contract; no companion HTML/CSS files were added.
- Ran: `npm run typecheck`, `npm run lint`, and `npm run build:web` after the completion-panel extraction.
- Result: Passed; the full test suite remains the validation gate before closing Step 3.
- Ran: `npm run typecheck`, `npm run lint`, and `npm run build:web` after the admin health-card extraction.
- Result: Passed; full tests remain the validation gate before closing Step 3.
- Ran: `npm run typecheck`, `npm run lint`, and `npm run build:web` after the feature-flags extraction.
- Result: Passed; full tests remain the validation gate before closing Step 3.
- Ran: `npm run typecheck`, `npm run lint`, `npm run build:web`, and `npm run test` after the alpha-access extraction.
- Result: Passed; 31 test files and 153 tests passed.
- Ran: `npm run typecheck`, `npm run lint`, and `npm run build:web` after the catalog filter extraction.
- Result: Passed; the existing full test result remains green from the preceding admin slices.
- Ran: `npm run typecheck`, `npm run lint`, and `npm run build:web` after the snapshot-table extraction.
- Result: Initial check caught the page-rail call to the moved processing-label helper; the helper was deliberately retained in the page, and the rerun passed.
- CSS review: Compared repeated form, icon-button, state-panel, surface, and action-row recipes across extracted components.
- Result: Keep them local for now; their selectors carry feature-specific layout, disclosure, table, or status semantics. Existing `src/styles.css` primitives remain the only generalized layer.
- Ran: `npm run typecheck`, `npm run lint`, and `npm run build:web` after adding the admin transport service.
- Result: Passed; endpoint paths, methods, payloads, auth headers, status checks, and localized page messages remain behaviorally owned by the dashboard.
- Ran: `npm run typecheck`, `npm run lint`, and `npm run build:web` after migrating browser logging to the injectable facade.
- Result: Passed; console output, `/api/log` forwarding, keepalive, and non-fatal forwarding failures remain in the existing helper.
- Ran: Final scope-extension validation: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test`, and `git diff --check`.
- Result: Passed; 31 test files and 153 tests passed, with no diff whitespace errors.
- Ran: `npm run typecheck`, `npm run lint`, and `npm run build:web` after the shopping-line extraction.
- Result: Passed; the parent now receives one typed line-change union and no longer owns line disclosure state or display helpers.
- Ran: `npm run typecheck`, `npm run lint`, `npm run build:web`, and `npm run test` after externalizing the shopping-list parent.
- Result: Passed; 31 test files and 153 tests passed. Angular companion template/style loading is verified by the production build.
- Ran: `npm run typecheck`, `npm run lint`, `npm run build:web`, and `npm run test` after the maintenance-entry extraction and parent externalization.
- Result: Passed; 31 test files and 153 tests passed.
- Ran: `npm run typecheck`, `npm run lint`, `npm run build:web`, and `npm run test` after the home-container externalization.
- Result: Passed; 31 test files and 153 tests passed.
- Ran: `npm run typecheck`, `npm run lint`, `npm run build:web`, and `npm run test` after admin-dashboard externalization.
- Result: Passed; 31 test files and 153 tests passed.
- Ran: `npm run typecheck`, `npm run lint`, `npm run build:web`, and `npm run test` after catalog externalization.
- Result: Passed; 31 test files and 153 tests passed.
- Ran: `npm run typecheck`, `npm run lint`, `npm run build:web`, and `npm run test` after ingestion externalization.
- Result: Passed; 31 test files and 153 tests passed.
- Ran: Final companion-file phase validation: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test`, and `git diff --check`.
- Result: Passed; 31 test files and 153 tests passed, with a clean diff check.
- Ran: Post-Vercel-route-surface validation: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test`, and `git diff --check`.
- Result: Passed; 31 test files and 153 tests passed. The catch-all adapter is included in the API typecheck/build.
- Ran: Post-review validation after `Preserve failed login draft`: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test`, and `git diff --check`.
- Result: Passed; 31 test files and 153 tests passed.
- Ran: Post-shell-visual-fix validation: `npm run typecheck`, `npm run lint`, `npm run build:web`, and `npm run test`.
- Result: Passed; 31 test files and 153 tests passed.

## Decisions

- Decision: Do not split a monolith into same-component HTML/CSS files without extracting ownership.
- Reason: That only relocates code and makes maintenance harder.
- Decision: Do not create a shared authenticated API helper.
- Reason: The abstraction has low payoff and would add a cross-cutting layer around clear feature services.
- Decision: Keep product and ingestion table rows colocated with their resizable-table containers.
- Reason: Content projection, virtual scrolling, grid sizing, and accessibility make row-host extraction risky for little benefit.
- Decision: Each extracted block must own meaningful template, styles, and local presentation logic with a compact input/output boundary.
- Reason: The requested gain is manageable page composition, not lower line counts.
- Decision: `AppComponent` keeps auth, toasts, routing, role filtering, and preference persistence while shell children own their UI state and presentation.
- Reason: These are clear boundaries without moving application ownership into generic shell components.

## Open Issues

- Issue: Full manual browser verification is intentionally deferred until the structural cleanup is complete.
  - Impact: Possible broken focus flow, responsive layout, theme styling, route/menu behavior, signal wiring, and child input/output behavior must be recorded below as implementation proceeds.
- Issue: The revised extraction may expose contracts that are too broad for a safe child component.
  - Impact: Stop and keep that block in the page until its state can be represented by a named view model and deliberate events.
- Issue: Shell extraction can change login form timing, preference event handling, or radial menu reset behavior.
  - Impact: The failed-login password regression was fixed with an explicit parent reset token; final manual checks must still cover login/logout, preferences, keyboard navigation, role visibility, route changes, and menu reset.
- Issue: Shell extraction had removed `.about-rail-card`'s specific CSS while leaving its markup in `AppComponent`.
  - Impact: Fixed by restoring the original gradient, spacing, typography, hover state, and `margin-top: auto`; manually verify the project note sits at the bottom of the right rail across desktop and narrow layouts.
- Issue: The parent no longer owns the extracted auth/radial CSS, but final visual comparison is still pending.
  - Impact: Verify that the inline child styles preserve the previous shell appearance before considering the shell boundary closed.
- Issue: Final manual shell verification remains pending.
  - Impact: Verify login/logout, theme/language persistence, admin-only menu visibility, keyboard focus, route-change reset, and narrow-layout menu geometry at cleanup closeout.
- Issue: The preview workspace now owns duplicated stock/editor layout styles that still exist in `HomeComponent` for the authenticated path.
  - Impact: Later household extractions should either reuse the same child-level structure or promote verified primitives carefully so the preview and authenticated paths do not drift visually.
- Issue: Anonymous preview rendering has moved behind a component host.
  - Impact: Final manual checks should include preview grid placement, mobile overflow behavior, disabled control styling, shopping-list placement, and translation/theme consistency.
- Issue: The authenticated stock panel now owns the create-household form and stock-row presentation.
  - Impact: Final manual checks should cover empty-name warning, form reset timing, household picker selection, manage-household enablement, selected-row highlighting, loading/error/empty states, refresh behavior, and add-to-shopping-list button state.
- Issue: The authenticated stock editor now owns draft state and disclosure state, with the page receiving a typed save event.
  - Impact: Final manual checks should cover create/edit mode switching, save/create/archive actions, auto-generated stock-group keys, min-limit stepper behavior, additional-details reset, date persistence, validation warnings, and saving-state button disabling.
- Issue: Preview and authenticated stock/editor components still have intentionally separate local style recipes.
  - Impact: Do not generalize them until a later visual comparison confirms exact equivalence; compare light/dark themes and narrow layouts for spacing, controls, and panel framing.
- Issue: Shopping-list confirmation actions now render through a component host.
  - Impact: Final manual checks should verify confirmation appearance, allowed-mode ordering, primary-button emphasis, confirm action execution, and close/cancel behavior in both light and dark themes.
- Issue: The admin health report now renders through a component host.
  - Impact: Final manual checks should verify health loading/empty/success/degraded states, API/database status styling, database-name display, error code/details, run-button disabling, unauthorized behavior, and narrow-layout wrapping.
- Issue: The admin feature-flags card now renders through a component host.
  - Impact: Final manual checks should verify flag checkbox state, admin/read-only disabling, loading/save disabling, success/error message placement, and persistence after reload.
- Issue: The admin alpha-access card now renders through a component host.
  - Impact: Final manual checks should verify controlled-access toggle state, credential input retention/clearing, save/create button disabling, create success/error messaging, and non-admin access behavior.
- Issue: The catalog filter bar now renders through a component host.
  - Impact: Final manual checks should verify typing/debounce, clear-button visibility and behavior, filter persistence while paging/refreshing, narrow-width wrapping, and theme/input styling.
- Issue: Catalog rows remain intentionally in `ProductCatalogComponent`.
  - Impact: Keep virtual-scroll offsets, resizable-table column templates, row grid sizing, and edit-button behavior under manual review; do not wrap individual projected rows.
- Issue: The ingestion snapshot table now renders through a component host.
  - Impact: Final manual checks should verify snapshot virtualization, row selection/highlight, empty/loading/auth text, scroll-triggered pagination, resizable columns, processing labels, and narrow-layout overflow.
- Issue: The ingestion detail table remains in the page because review actions and selected-snapshot state are tightly coupled.
  - Impact: Keep review-button routing, row formatting, and selected-snapshot/detail-panel behavior under manual review; do not force the detail extraction without a compact contract.
- Issue: No component-level browser test harness exists for these new hosts.
  - Impact: Final manual testing must cover every listed route/state and both themes/viewports; automated checks cannot catch all focus, overflow, style-encapsulation, or event-wiring regressions.
- Issue: Admin transport is now behind a service seam, but endpoint-specific UI flows still need manual authorization/error verification.
  - Impact: Confirm unauthorized responses, network failures, malformed payloads, and successful health/reseed/validator/backfill/flag/alpha flows after the service change.
- Issue: Browser logs now gain a shared injected metadata seam.
  - Impact: Manually verify representative startup, catalog, ingestion, and admin events still reach the browser console and `/api/log`; confirm no tokens/passwords appear in payloads.
- Issue: The compatibility function remains available for non-injected/bootstrap-safe callers.
  - Impact: Keep any future direct use rare and documented; feature code should use `BrowserLoggerService`.
- Issue: The review did not include browser automation or live endpoint verification.
  - Impact: Manual testing remains required for visual layout, focus behavior, responsive overflow, auth/error flows, and `/api/log` forwarding.
- Issue: Vercel catch-all routing is now required for shared routes without dedicated wrappers.
  - Impact: Verify a deployed or preview Vercel request reaches `/api/admin/database-maintenance`, `/api/admin/alpha-users`, `/api/admin/ingestion/snapshots`, and representative catalog/household routes; confirm dedicated wrappers still take precedence for login, logging, identity, preferences, and dashboard endpoints.
- Issue: Shopping-list line markup/styles now render through a child component host.
  - Impact: Manually verify pending/purchased line layout, checkbox/amount/unit edits, detail disclosure, observed price fields, uncertainty text, read-only disabling, saving state, mobile stacking, and theme styling.
- Issue: The parent still has a large inline template/style block after the line extraction.
  - Impact: The next step is companion-file externalization only after reviewing that remaining parent responsibility; confirm relative template/style loading and unchanged component-scoped selectors.
- Issue: The shopping-list parent now uses relative companion file paths.
  - Impact: Manual checks should verify pending/purchased rendering, completion panel placement, quick-add, empty/loading/error states, responsive layout, theme variables, and that no styles leaked across child boundaries.
- Issue: Database maintenance rows now render through a child host and the parent uses companion files.
  - Impact: Manual checks should verify auth gating, active/finished grouping, validator/migration actions, mark-complete, run-all disabling, details hover/focus disclosure, mobile row stacking, and light/dark styling.
- Issue: `HomeComponent` no longer carries the former stock/editor/list CSS and now loads companion files.
  - Impact: Manually compare anonymous preview and authenticated household layouts at desktop/mobile and light/dark themes; verify stock panel/editor/list spacing, responsive columns, and page-rail alignment did not rely on the removed stale selectors.
- Issue: The admin dashboard shell now loads companion files.
  - Impact: Manually verify signed-out/loading/non-admin/admin branches, reseed and maintenance card placement, child-card grid behavior, light/dark styling, and narrow admin layout.
- Issue: The catalog page now loads companion files while keeping virtualized row markup in the external template.
  - Impact: Manually verify filter-bar placement, virtual scrolling/row offsets, resizable table columns, edit actions, empty/loading states, page-rail summaries, and narrow horizontal behavior.
- Issue: The ingestion page now loads companion files while keeping selected detail/review markup in the external template.
  - Impact: Manually verify source filters, snapshot selection, scroll pagination, workspace resizing, parsed-row review buttons, review dialog actions, accepted-item toggle, empty/loading/auth states, and narrow overflow.
- Issue: Existing working-tree/index state may include user-owned plan or backend changes.
  - Impact: Do not revert, stage, or mix unrelated files into cleanup changes.
- Issue: Two companion HTML files retained the closing inline Angular template delimiter (``,``) as visible text.
  - Cause: The earlier template extraction copied the string terminator and comma instead of stopping at the template body.
  - Fix: Removed the stale delimiter from `household-shopping-list.component.html` and `product-catalog.component.html`; a repository-wide HTML scan found no remaining standalone delimiter lines.
  - Impact: Manually verify the final closing content of both pages and confirm no literal backtick/comma text appears in the rendered view.

## Roadmap Or Plan Updates

- Needed: No roadmap change; Stage 8 remains next after cleanup and final manual verification.
- Status: Structural implementation and the requested companion-file phase are complete for the selected safe boundaries; manual verification remains open.

## Next Step

Companion-file phase is complete and validated. The stale HTML delimiter cleanup is ready to commit; then hand off the full manual checklist before Stage 8. Do not split smaller components or externalize additional files without a concrete maintenance gain.

## Notes For Future Agent

- Keep the “possible breakage” list current after every implementation action. The user will manually test all listed entries at the end.
- The prior temporary externalization is not part of the current codebase and must not be treated as completed work.
- Stop an extraction when its input/output contract becomes a callback bag or requires mutable parent state.
- Do not extract rows behind `ResizableTableComponent` content projection.
- Do not touch unrelated backend files.
