# Finalize Stage 2 Plan

Status: Draft

## Objective

Finish Stage 2 as a small, stable serverless foundation without reopening broader MVP scope.

The target end state is:

- Vercel home page remains visible
- seeded admin user can log in
- MongoDB health check passes locally and on Vercel
- authenticated user identity is role-driven instead of hard-coded admin-first
- health remains admin-only
- app chrome uses a fixed header and scrollable content area so route changes do not jump the page
- Stage 2 has one small read-only PR validation workflow
- docs and session notes clearly separate finished Stage 2 work from deferred followups

## Context Read

- `AGENTS.md`
- `.agents/planning-workflow.md`
- `.agents/plan-template.md`
- `.agents/plans/README.md`
- `.agents/plans/initial-mvp-roadmap.md`
- `.agents/plans/2026-06-22-stage-2-serverless-foundation-plan.md`
- `.agents/plans/2026-06-22-home-health-navigation-fix-plan.md`
- `.agents/plans/2026-06-22-health-checklist-errors-plan.md`
- `.agents/plans/2026-06-22-user-token-login-health-guard-plan.md`
- `.agents/plans/2026-06-22-admin-token-login-health-guard-plan.md`
- `.agents/sessions/2026-06-22-stage-2-serverless-foundation.md`
- `.agents/sessions/2026-06-22-user-token-login-health-guard.md`
- `docs/architecture.md`
- `docs/tech-ops.md`
- `docs/codebase-analysis.md`
- `docs/database-environments.md`
- `src/AGENTS.md`
- `api/AGENTS.md`
- `packages/kamra-api-server/AGENTS.md`
- targeted reads of `src/app/app.component.ts`, `src/app/auth.service.ts`, `packages/kamra-api-server/src/http/app-handler.ts`, and `packages/kamra-api-server/src/auth/user-auth.ts`
- `.github/workflows` listing
- `package.json`

## Research Gate

Not needed for this planning pass.

This plan finalizes known local/Vercel/MongoDB behavior from the current repository state and session handoffs. It does not choose a new platform, auth provider, MongoDB networking product, crawler source, or external standard.

## User Requests

- Plan the remaining Stage 2 fixes using yesterday's handoff notes.
- Compare the handoff notes against the original Stage 2 roadmap and Stage 2 plans.
- Keep this as planning and documentation only; do not implement application code.
- Split the leftover work into one-shot, lower-token agentic items.
- Keep the Stage 2 completion remainder small enough for roughly one execution session.
- For the frontend, prioritize fixed app chrome with a fixed header and later footer, and make internals scrollable instead of letting content growth shift the page.
- Add a separate followups document next to the initial MVP roadmap.
- Add the future floating mini-menu idea to followups.
- Move non-relevant MVP items out of the main roadmap and categorize followups with added value, effort, complexity, and priority.
- Extend general documentation so future agents understand this roadmap/followup split.

## User Decisions

- The current deployed state is accepted as merged working baseline: home page visible on Vercel, seeded admin login works, and MongoDB health passes after DNS adjustment.
- The floating mini-menu idea is deferred to followups, not part of Stage 2 completion.
- Stage 2 should be finalized by simplifying and deferring lower-value work rather than expanding scope.

## Current Reality

- Stage 2 app code exists and has been merged.
- The local package scripts include `lint`, `typecheck`, `test`, `build`, `seed`, and dev runners.
- `.github/workflows` still contains only legacy `auto_push_*` workflows; the Stage 2 read-only app check from the original plan is not present.
- Auth currently uses browser-persisted signed tokens.
- Frontend and backend auth types currently model authenticated users as `role: "admin"` only.
- `authorizeUser()` currently both authenticates and requires admin role, so `/api/admin/me` cannot represent a non-admin active user.
- Health is server-side protected and should remain admin-only.
- The health report has moved toward `database`, but the handoff still calls out lingering `database` versus `mongodb` naming risk.
- The app shell currently renders the header, routed content, login message, and menu in one grid that can shift between routes.
- The login success/failure message is inline layout content rather than toast-like fixed feedback.
- Git status remains blocked in the sandbox by the safe-directory ownership warning.
- Atlas network access was previously documented as a temporary broad allowlist compromise. The user reports the DNS addition now lets the MongoDB health check pass.

## Gap Reconciliation

From the latest session handoff:

- fix hard-coded admin role assumptions in auth payloads and user documents
- keep health admin-only while making general login user-based
- re-run the full browser login-to-health flow after clearing local API port collisions
- resolve `database` versus `mongodb` health naming
- pin the header and make the routed body scroll instead of letting route content shift the page
- replace login success dialog or inline layout movement with toast-style feedback
- clean up the stale admin-named auth plan

From the original Stage 2 roadmap and foundation plan:

- Vercel frontend and thin API adapter foundation is already present
- MongoDB health connectivity is now reportedly passing after DNS configuration
- seeded admin identity and bootstrap login are present
- local/shared server handler boundaries are present
- missing item: small read-only PR checks for the current app slice
- still needs documentation closure around the accepted Atlas/DNS/network posture

Items deliberately deferred to `mvp-followups.md`:

- floating mini-menu navigation
- Google sign-in and richer auth-provider work
- full invitation and expiry email workflow
- crawler expansion beyond the first useful source
- OpenAPI/JSON Schema generation
- dependency update automation
- PR-branch autofix or writeback
- mobile/PWA, barcode scanning, route optimization, and advanced recommendations

## Intended Direction

- Treat this as a final tightening pass, not a redesign.
- Keep token auth for Stage 2, but make identity and authorization semantics correct enough for later users.
- Keep admin as an authorization role, not the default identity model.
- Make app layout predictable before adding richer feature pages.
- Add only the smallest CI check that validates the current app surface without secrets or writeback.
- Move product, UX, repo automation, auth-provider, and expansion ideas that are not required for the first household/product MVP into `mvp-followups.md`.

## Scope

- Fix user-auth naming and role semantics.
- Keep health admin-only while allowing `/api/admin/me` or its immediate equivalent to return the current authenticated user from the token.
- Stabilize the frontend shell with fixed header, reserved future footer area if useful, and scrollable routed content.
- Convert login feedback into non-layout-shifting toast/status feedback.
- Normalize health naming around platform-neutral `database` while keeping compatibility only if already needed by tests or current UI.
- Re-run a full local login-to-health validation from a clean dev process.
- Add one read-only Stage 2 app check workflow for install, lint, typecheck, test, and build.
- Update docs/session notes to reflect the completed Stage 2 state and remaining followups.
- Mark or supersede stale plan naming so future agents do not resume the wrong `admin`-framed auth plan.

## Non-Goals

- Public registration.
- Google sign-in.
- Floating radial or semicircle mini-menu implementation.
- Household management.
- Product ingestion, crawler expansion, or product schema work.
- Email provider setup.
- Whitelist invitation/expiry email automation.
- Password reset or refresh-token architecture.
- OpenAPI or JSON Schema generation.
- Dependency update bots.
- PR-branch writeback or autofix automation.
- Paid networking changes or static egress work unless the user explicitly reopens that decision.
- Broad visual redesign beyond layout stability and login feedback.

## Assumptions

- The seeded admin user remains the only required Stage 2 user.
- Future non-admin users should be possible in the auth model, but no non-admin UI or route is implemented in this stage.
- Token auth remains acceptable for the Stage 2 bootstrap after the user's earlier steering.
- The small CI workflow can use existing package scripts and should not need MongoDB secrets.
- Vercel deployed validation may be manual if the execution agent cannot access Vercel configuration or production secrets.

## Open Questions

- Should the current `0.0.0.0/0` Atlas allowlist be accepted as a documented Stage 2 free-tier compromise for now, or treated as a blocker before calling Stage 2 stable?
- Should `/api/admin/me` be kept for now as a current-user endpoint with admin naming, or should it be renamed in a later auth cleanup once more user roles exist?

These do not block the implementation plan. If unresolved, document the chosen temporary posture in the final session handoff.

## Steering Notes

- The original Stage 2 plan was intentionally broad and implementation consumed multiple long sessions. This finalization plan compresses the remaining work into a small set of commit-sized items.
- Original Stage 2 items already completed or validated by the user are not reopened.
- Missing CI remains in scope because it was part of the original Stage 2 foundation and is small if limited to read-only package checks.
- Floating mini-menus are useful product UX direction, but they are explicitly deferred to followups.

## Implementation Steps

### Step 1

- Goal: correct auth role semantics without changing the login mechanism.
- Files likely affected:
  - `packages/kamra-api-server/src/auth/user-auth.ts`
  - `packages/kamra-api-server/src/auth/user-token.ts`
  - `packages/kamra-api-server/src/http/app-handler.ts`
  - `packages/kamra-api-server/src/auth/*.test.ts`
  - `packages/kamra-api-server/src/http/app-handler.test.ts`
  - `src/app/auth.service.ts`
- Validation:
  - any active user with a valid password can authenticate using the role stored in MongoDB
  - disabled users and invalid credentials still fail closed
  - health still rejects unauthenticated and non-admin tokens
  - current-user response no longer depends on a hard-coded admin role
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
- Commit message idea: `fix: make user auth role driven`

### Step 2

- Goal: stabilize frontend app chrome and login feedback.
- Files likely affected:
  - `src/app/app.component.ts`
  - `src/app/home.component.ts`
  - `src/app/health-check.component.ts`
  - `src/styles.css`
- Validation:
  - header remains pinned while switching between home and health routes
  - routed content scrolls inside the available page body instead of resizing the whole shell unpredictably
  - login success or failure feedback does not move the header or main content
  - mobile layout remains usable with the login controls and menu
  - browser smoke check for home, login, and health route
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
- Commit message idea: `fix: stabilize app shell layout`

### Step 3

- Goal: finish health naming and end-to-end validation.
- Files likely affected:
  - `packages/kamra-api-server/src/health/get-health-report.ts`
  - `packages/kamra-api-server/src/health/get-health-report.test.ts`
  - `packages/kamra-api-server/src/http/app-handler.ts`
  - `src/app/health-check.component.ts`
  - `docs/tech-ops.md`
- Validation:
  - primary health check naming is `database`
  - any `mongodb` compatibility alias is either intentionally documented as temporary or removed if no caller needs it
  - connection errors remain sanitized
  - local seeded-admin login can open the health route and see the passing database check
  - unauthenticated health content remains hidden
  - deployed health validation is recorded if the executor has access
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
- Commit message idea: `fix: finalize database health reporting`

### Step 4

- Goal: add a minimal read-only Stage 2 app check.
- Files likely affected:
  - `.github/workflows/stage-2-app-checks.yml`
  - possibly `docs/tech-ops.md`
- Validation:
  - workflow runs on pull requests and pushes to the main development branch pattern used by the repo
  - workflow uses Node 24
  - workflow runs `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`
  - workflow does not require Vercel, Atlas, or seed secrets
  - workflow permissions are read-only and do not write back to branches
- Commit message idea: `ci: add stage 2 app checks`

### Step 5

- Goal: close Stage 2 documentation and handoff state.
- Files likely affected:
  - `.agents/sessions/2026-06-22-stage-2-serverless-foundation.md`
  - `.agents/sessions/2026-06-22-user-token-login-health-guard.md`
  - `.agents/plans/2026-06-22-admin-token-login-health-guard-plan.md`
  - `.agents/plans/2026-06-22-user-token-login-health-guard-plan.md`
  - `.agents/plans/2026-06-22-stage-2-serverless-foundation-plan.md`
  - `.agents/plans/initial-mvp-roadmap.md`
  - `.agents/plans/mvp-followups.md`
  - `docs/tech-ops.md`
- Validation:
  - stale `admin`-framed plan is marked superseded or clearly redirected
  - final session notes list completed validation and remaining followups
  - roadmap marks Stage 2 as ready for review or complete only after validation is actually done
  - non-MVP ideas remain in `mvp-followups.md`, not scattered through handoffs
- Commit message idea: `docs: close stage 2 finalization`

## Validation Plan

Minimum local validation for the execution session:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run seed` only against the intended configured database
- start fresh local dev processes, avoiding stale port `3000` watchers
- browser smoke: home page, login as seeded admin, health route, logout, unauthorized health placeholder

Hosted validation when accessible:

- Vercel home page loads
- seeded admin login succeeds
- authenticated `/health` page reports database healthy
- unauthenticated health content is blocked
- no secrets or raw connection errors are exposed

Documentation validation:

- roadmap and followups agree on what belongs inside the first MVP
- Stage 2 plan/session files do not leave contradictory next steps
- Atlas DNS and network posture are documented without secret values

## Risks

- The auth cleanup could accidentally expand into a full role model.
  - Mitigation: allow only the role values already needed now; do not add user management UI.
- Layout fixes can become visual redesign.
  - Mitigation: restrict the pass to stable header/body/footer structure, scroll behavior, and toast feedback.
- CI could grow into platform validation.
  - Mitigation: keep it secret-free and script-based; deployed checks stay manual or separately planned.
- Atlas broad network access may still be temporary.
  - Mitigation: document the exact current posture and add a high-priority followup if it is not solved during execution.
- Git safe-directory ownership may still block commit prep in the sandbox.
  - Mitigation: executor should ask for targeted approval or user-side fix before staging/committing, not work around it destructively.

## Approval Checkpoint

Implementation should not begin until the user approves this plan.

Recommended execution style: run Steps 1-4 as small commits in one session if validation remains smooth, then do Step 5 as the closing docs commit. Stop after any step if validation fails or the change starts pulling in broader architecture decisions.
