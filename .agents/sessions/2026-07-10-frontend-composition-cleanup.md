# Frontend Composition Cleanup Session

## Session

- Date: 2026-07-10
- Plan: `.agents/plans/2026-07-10-frontend-composition-cleanup-plan.md`
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

## Changed Files

- Path: `.agents/plans/2026-07-10-frontend-composition-cleanup-plan.md`
  - Re-evaluated plan; no runtime behavior change.
- Path: `.agents/sessions/2026-07-10-frontend-composition-cleanup.md`
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

## Validation

- Ran: Repository inspection and plan consistency checks.
- Result: Existing Angular standalone patterns and content-projected table boundary confirmed.
- Ran: `git diff --check` for the changed source files.
- Result: No whitespace errors.
- Ran: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test`, and `git diff --check` after the preview and stock-panel slices.
- Result: Passed; `git diff --check` reports only normal CRLF normalization warnings.
- Result: Household composition step passed `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test` (31 files / 153 tests).
- Result: The editor child uses an explicit normalized draft contract; no companion HTML/CSS files were added.

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
  - Impact: Automated checks will catch compile regressions; final manual checks must cover login/logout, preferences, keyboard navigation, role visibility, route changes, and menu reset.
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
- Issue: Existing working-tree/index state may include user-owned plan or backend changes.
  - Impact: Do not revert, stage, or mix unrelated files into cleanup changes.

## Roadmap Or Plan Updates

- Needed: No roadmap change yet; Stage 8 remains next after cleanup and final manual verification.
- Status: Cleanup plan approved for implementation by the user's latest request.

## Next Step

Step 2 household composition is ready to commit. After the commit, begin Step 3 with the shopping-list presentation boundary, keeping `HouseholdShoppingListComponent` as the lifecycle facade.

## Notes For Future Agent

- Keep the “possible breakage” list current after every implementation action. The user will manually test all listed entries at the end.
- The prior temporary externalization is not part of the current codebase and must not be treated as completed work.
- Stop an extraction when its input/output contract becomes a callback bag or requires mutable parent state.
- Do not extract rows behind `ResizableTableComponent` content projection.
- Do not touch unrelated backend files.
