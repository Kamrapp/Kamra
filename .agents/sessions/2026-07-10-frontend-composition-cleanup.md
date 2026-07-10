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

## Changed Files

- Path: `.agents/plans/2026-07-10-frontend-composition-cleanup-plan.md`
  - Re-evaluated plan; no runtime behavior change.
- Path: `.agents/sessions/2026-07-10-frontend-composition-cleanup.md`
  - This handoff record.
- Path: `src/app/`
  - Runtime files are back to their pre-refactor state after the user reverted the bookkeeping-only split.

## Validation

- Ran: Repository inspection and plan consistency checks.
- Result: Existing Angular standalone patterns and content-projected table boundary confirmed.
- Ran: `git diff --check` for the changed source files.
- Result: No whitespace errors.
- Not run: frontend refactor validation after the restart.
- Reason: No new runtime refactor has been applied since the revert. The earlier temporary externalization passed automated checks but is no longer present.

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
- Issue: Existing working-tree/index state may include user-owned plan or backend changes.
  - Impact: Do not revert, stage, or mix unrelated files into cleanup changes.

## Roadmap Or Plan Updates

- Needed: No roadmap change yet; Stage 8 remains next after cleanup and final manual verification.
- Status: Cleanup plan approved for implementation by the user's latest request.

## Next Step

Complete Step 1: extract the shell account/preferences surface and radial navigation as real standalone components, then run focused validation before proceeding to household blocks.

## Notes For Future Agent

- Keep the “possible breakage” list current after every implementation action. The user will manually test all listed entries at the end.
- The prior temporary externalization is not part of the current codebase and must not be treated as completed work.
- Stop an extraction when its input/output contract becomes a callback bag or requires mutable parent state.
- Do not extract rows behind `ResizableTableComponent` content projection.
- Do not touch unrelated backend files.
