# Stage 7 Controlled Alpha Access And App Module Shell Plan

Status: Implemented

## Objective

Implement Stage 7 of the MVP roadmap as a controlled, admin-owned alpha access slice, while making the existing app shell visibly separate Kamra's four concern modules: product lookup, household management, site administration, and developer administration.

The implementation should be easy for agents to execute in small, reviewable units using budget-friendly model choices. This plan is not approval to add an OpenAI API runtime or autonomous agent workflow to Kamra.

## Context Read

- `AGENTS.md`
- `.agents/plans/initial-mvp-roadmap.md`
- `.agents/plan-template.md`
- `.agents/planning-workflow.md`
- `src/AGENTS.md`
- `src/app/AGENTS.md`
- `src/app/site-admin/AGENTS.md`
- `packages/kamra-api-server/AGENTS.md`
- `docs/architecture.md`
- `docs/tech-ops.md`
- `docs/household.md`
- `package.json`
- `src/app/app.routes.ts`
- `src/app/app.component.ts`
- `src/app/auth.service.ts`
- `src/app/dev-admin/admin-dashboard.component.ts`
- `src/app/home.component.ts`
- `packages/kamra-api-server/src/auth/user-auth.ts`
- `packages/kamra-api-server/src/auth/mongo-user-repository.ts`
- `packages/kamra-api-server/src/config/app-config.ts`
- `packages/kamra-api-server/src/http/routes/auth-routes.ts`
- `packages/kamra-api-server/src/http/routes/admin-dashboard-route.ts`
- `packages/kamra-api-server/src/http/routes/catalog-routes.ts`
- `packages/kamra-api-server/src/http/routes/household-routes.ts`

## Research Gate

Needed, narrowly, because the user explicitly asked for budget-friendly agentic model execution and model guidance/pricing changes over time.

Sources checked on 2026-07-10:

- OpenAI model guidance: `https://developers.openai.com/api/docs/guides/latest-model`
- OpenAI pricing: `https://developers.openai.com/api/docs/pricing`
- OpenAI Agents SDK guidance: `https://developers.openai.com/api/docs/guides/agents`
- OpenAI cost optimization: `https://developers.openai.com/api/docs/guides/cost-optimization`
- OpenAI flex processing: `https://developers.openai.com/api/docs/guides/flex-processing`

Decision impact:

- Do not add runtime AI/agent infrastructure to Kamra in Stage 7. The Stage 7 product need is auth/onboarding and shell separation, not an in-app agent.
- Use agentic execution as a workflow discipline only: compact context, commit-sized steps, targeted validation, and model escalation only where risk warrants it.
- For any future OpenAI API-backed agentic feature, prefer the Responses API when Kamra owns routing/branching directly, and consider the Agents SDK only when recurring tool loops, handoffs, guardrails, resumable approvals, or tracing justify the dependency.
- Current OpenAI cost guidance emphasizes fewer requests, fewer tokens, smaller models, Batch API, and flex processing for lower-priority async work. The current model guidance names `gpt-5.6-sol` as flagship, `gpt-5.6-terra` as lower-price strong performance, and `gpt-5.6-luna` as efficient high-volume. Pricing currently lists `gpt-5.6-luna` materially below `gpt-5.6-terra` and `gpt-5.6-sol`.

Remaining uncertainty:

- Model names, prices, and availability are intentionally treated as volatile. Re-check official OpenAI docs before adding any persisted model defaults or API-backed agent feature.

## User Requests

- Create a plan for Stage 7 of the MVP roadmap.
- Make the plan suitable for agentic execution.
- Keep execution budget-friendly with agentic models.

## Discovery Questions

No blocking questions before drafting. The remaining implementation choices are limited to feature-flag storage and the shape of the first module switcher.

- Should the Stage 7 feature flag be environment-configured only, database-backed only, or both with an environment kill switch?
- Should the first alpha shell use simple route groups in the current radial menu, or replace it with a plain module switcher before revisiting richer floating navigation?

## User Decisions

- Admins manually set the initial password for each alpha user.
- Each explicitly created alpha user is automatically assigned a new empty household because household creation is not available yet.
- Disabling alpha access blocks both creation of new alpha users and login for users marked as alpha users.
- Existing demo users `usera` and `userb`, and the existing admin, are not marked as alpha users and are unaffected by the alpha-access flag.
- Existing admin navigation may be renamed directly; no route aliases or redirects are required during the MVP.

## Current Reality

- Login exists through `POST /api/login` against active `users` collection records.
- Current-user and preferences routes are named under `/api/admin/*`, but they already support any authenticated user.
- Roles are currently `admin` and `user`.
- The user repository can find active users and update profile preferences, but it cannot create alpha users yet.
- Admin dashboard has an admin-only feature flag route for `allowAutoTickingAllShoppingListEntries`.
- Demo household reseeding creates stable demo users `usera` and `userb`, but that is a reset/demo utility, not controlled alpha access.
- Household routes require authentication and membership; admin role does not bypass household membership.
- Product catalog list and source routes are available to signed-in non-admin users; product mutation and validation routes are admin-only.
- App concern folders already exist: `product-lookup/`, `household/`, `site-admin/`, and `dev-admin/`.
- Current frontend routes still use generic `/admin/dashboard` and `/admin/ingestion` paths rather than concern-clear module paths.
- The radial shell currently exposes Home, Products, Admin Dashboard, and Crawls, filtered by admin role where needed.

## Intended Direction

- Keep public registration closed.
- Allow admins to create a small set of explicitly marked alpha identities through audited actions and a manually supplied initial password.
- Use a database-backed feature flag or access-control setting so alpha onboarding can be disabled without code changes.
- Keep invitation email, expiry email, whitelist cleanup cron, Google sign-in, and public self-registration out of this stage.
- Preserve serverless-first, locally runnable core logic.
- Make module boundaries visible in routes and navigation before richer four-corner/floating menu work.

## MVP Change Posture

- Breaking UI, route, and API changes are acceptable when they make the MVP clearer or easier to operate; do not preserve awkward names solely for compatibility.
- Existing database data is the compatibility boundary. Prefer additive fields, explicit migrations, and preservation of existing users, households, memberships, catalog records, and feature-flag data.
- If a data-shape change is unavoidable, document the migration and test it against existing records before removing the old shape.

## Scope

- Add a minimal controlled alpha access model for admin-created or admin-allowed users.
- Add audit metadata for who created or enabled access.
- Mark only explicitly created alpha users as alpha users; do not infer alpha status from the `user` role or from demo reseeding.
- Create one empty household for each new alpha user and make that user its initial member.
- Add admin-only routes and a small dev-admin UI surface for controlled alpha user management.
- Add or extend feature flag handling so the onboarding path is unavailable when disabled.
- Enforce the alpha flag during login for alpha-marked users as well as during alpha-user creation.
- Preserve existing demo-household reseed behavior and avoid using it as the only alpha-user mechanism.
- Improve route naming and shell grouping so product lookup, household, site-admin, and dev-admin are visibly distinct.
- Add focused API tests for disabled flag, non-admin rejection, admin success, and login/user access.
- Add frontend checks for menu visibility and admin-only UI gating where practical.
- Update durable docs for access behavior and operational constraints.

## Non-Goals

- Public registration.
- Google, passkey, OAuth, or magic-link sign-in.
- Automatic invitation emails.
- Automatic expiry emails.
- Whitelist cleanup cron.
- Full user management with roles beyond `admin` and `user`.
- Household creation UI or household invitation flows; the backend only creates an empty household as part of controlled alpha onboarding.
- Household invitation flows between ordinary users.
- Multi-admin conflict handling beyond audit metadata.
- In-app AI or OpenAI API-backed agent features.
- Four-corner mini drawer or richer floating bubble navigation.
- Crawler expansion, receipt parsing, expiry logic, or Stage 8 buy-before behavior.

## Assumptions

- Admin-created alpha users can use the current username/password login for Stage 7.
- Admins supply the initial password explicitly, with no email delivery or password generation in Stage 7.
- Alpha access is represented by an explicit alpha marker on user records plus audit metadata, rather than a separate public registration whitelist flow.
- A newly created alpha user receives a new empty household and initial membership in the same controlled operation.
- The alpha flag is checked at login only for alpha-marked users; demo users and the existing admin continue to use the normal login path.
- If a separate alpha access collection is introduced, it must not duplicate normal auth state without a clear purpose.
- Existing route names may be renamed directly because the MVP has no expected bookmark or deep-link compatibility requirement.
- The current `admin` role remains the only operator role in Stage 7.

## Open Questions

- No route-compatibility decision remains open. Stage 7 may rename `/admin/dashboard` and `/admin/ingestion` directly to concern-specific paths.

## Side Suggestions

- Add a `docs/access.md` file if Stage 7 touches enough auth behavior that `docs/tech-ops.md` would become crowded.
- Consider renaming `/api/admin/me` and `/api/admin/preferences` to `/api/me` and `/api/preferences` in a later auth cleanup. Stage 7 can leave the old paths alone to avoid auth churn.
- Add a small manual alpha checklist for portfolio/demo use: created user, login, household isolation, product browse, admin denial, logout.
- Keep richer navigation concepts in `mvp-followups.md` until all four modules have enough useful screens to justify the extra UI complexity.

## Agentic Execution Budget Policy

Use budget-friendly agentic execution by default:

- Context pack: each implementation step should begin by reading this plan, the nearest `AGENTS.md`, and only the files named in that step.
- Default model tier: use a lower-cost code-capable model for mechanical reads, route wiring, UI copy, localization parity, and straightforward tests.
- Escalation tier: use a stronger model only for auth/security design review, data-shape decisions, and final review of cross-boundary access behavior.
- Parallelism: use subagents or multi-agent fan-out only for independent review/search tasks, not for edits touching the same files.
- Token discipline: prefer `rg`, targeted reads, and small diffs; avoid reloading full roadmap/docs after the first context pass.
- Validation discipline: run focused tests first, then full `npm run typecheck`, `npm run test`, `npm run lint`, and `npm run build` near closeout.
- API-cost discipline: no OpenAI API calls are needed for this Stage 7 implementation. If a future API-backed agent is planned, re-check current OpenAI docs and prefer smaller/current efficient models plus Batch or flex only for asynchronous, non-production, lower-priority workloads.

Suggested model routing if the executor can choose model tiers:

- Planning updates and ordinary code edits: efficient/budget code model.
- Frontend route/menu cleanup and docs: efficient/budget code model.
- Auth creation, feature flag semantics, and repository data shape: mid-tier reasoning/code model.
- Final security review of alpha access and authorization boundaries: strongest available reasoning/code model for one focused pass.

## Steering Notes

- Stage 7 should not become a general auth-provider migration. The MVP has value now because household and shopping basics exist; the next risk is controlled access, not broad identity polish.
- Treat "alpha access" as explicitly admin-created access, not self-service registration.
- Treat "agentic execution" as implementation workflow guidance. Do not add self-running agent workflows to Kamra unless separately approved.

## Implementation Steps

### Step 1 - Controlled Alpha Access Backend

- Goal: Add the minimal backend model and admin-only routes for creating or enabling alpha users, with feature-flag gating and audit metadata.
- Files likely affected:
  - `packages/kamra-api-server/src/auth/user-auth.ts`
  - `packages/kamra-api-server/src/auth/mongo-user-repository.ts`
  - `packages/kamra-api-server/src/auth/user-auth.test.ts`
  - `packages/kamra-api-server/src/http/routes/auth-routes.ts` or a new focused route file under `packages/kamra-api-server/src/http/routes/`
  - `packages/kamra-api-server/src/http/routes/admin-dashboard-route.ts` if feature flags remain centralized there
  - `packages/kamra-api-server/src/http/app-handler.ts`
  - `packages/kamra-api-server/src/http/app-handler.test.ts`
- Validation:
  - Non-admin and unauthenticated requests cannot create/allow alpha users.
  - Disabled alpha flag rejects the admin creation path and rejects login for alpha-marked users.
  - Enabled alpha flag lets an admin create an explicitly marked alpha user with role `user` and a manually supplied initial password.
  - Creation produces a new empty household with the alpha user as its initial member.
  - Demo users `usera` and `userb`, and the existing admin, do not receive the alpha marker and remain able to log in when alpha access is disabled.
  - Created user can log in through existing login route.
  - Audit metadata records the admin email and timestamps without storing raw passwords or exposing the supplied password.
- Commit message idea: `feat: add controlled alpha access backend`

### Step 2 - Admin UI For Alpha Access

- Goal: Add a compact dev-admin/admin dashboard panel for controlled alpha access actions and status.
- Files likely affected:
  - `src/app/dev-admin/admin-dashboard.component.ts`
  - `src/app/auth.service.ts` if new helper methods are useful
  - `src/app/i18n/en.json`
  - `src/app/i18n/hu.json`
- Validation:
  - Admin sees the alpha access panel.
  - Non-admin signed-in user sees the existing admin-denied state.
  - Disabled alpha flag makes the creation controls unavailable or returns a clear message, and alpha-marked users receive a clear login denial.
  - Successful creation does not redisplay or log the supplied password.
- Commit message idea: `feat: add alpha access admin controls`

### Step 3 - Module Shell And Route Grouping

- Goal: Make the four app concerns visibly separate in routing and navigation while preserving current useful pages.
- Files likely affected:
  - `src/app/app.routes.ts`
  - `src/app/app.component.ts`
  - `src/app/i18n/en.json`
  - `src/app/i18n/hu.json`
  - Concern components only where route labels or page rail context need adjustment.
- Validation:
  - Product lookup navigation remains available to signed-in users.
  - Household entry point remains clear from the home/household flow.
  - Site-admin ingestion/product operations remain admin-only.
  - Dev-admin dashboard remains admin-only.
  - Navigation uses the new concern-specific routes directly; old admin route names do not need aliases or redirects.
  - Text does not overflow in the existing shell at desktop and mobile widths during manual/browser checks.
- Commit message idea: `feat: separate app module navigation`

### Step 4 - Docs And Operations Notes

- Goal: Document the Stage 7 access posture, feature flag behavior, and manual alpha verification path.
- Files likely affected:
  - `docs/tech-ops.md`
  - `docs/architecture.md`
  - `docs/household.md` if alpha users affect demo household notes
  - Possible new `docs/access.md`
  - `.agents/plans/initial-mvp-roadmap.md` after implementation closeout
- Validation:
  - Docs state that public registration, invitation email, expiry email, and cleanup cron remain deferred.
  - Docs explain how to disable alpha onboarding.
  - Docs distinguish demo reseed users from controlled alpha users.
- Commit message idea: `docs: document controlled alpha access`

### Step 5 - Final Review And Manual Verification

- Goal: Verify the user/admin boundary and shell behavior end to end.
- Files likely affected:
  - No planned source edits unless validation finds issues.
- Validation:
  - `npm test -- packages/kamra-api-server/src/auth`
  - `npm test -- packages/kamra-api-server/src/http/app-handler.test.ts`
  - `npm run typecheck`
  - `npm run test`
  - `npm run lint`
  - `npm run build`
  - Manual browser smoke:
    - unauthenticated user cannot access alpha/admin actions
    - admin can toggle/access alpha creation path when enabled
    - admin-created user can log in
    - created user can browse products and use only their household data
    - created user cannot access dev-admin or site-admin actions
    - module navigation groups remain visible and role-appropriate
- Commit message idea: `test: verify controlled alpha access`

## Validation Plan

Focused validation should run after each step, then full validation at closeout.

Commands:

```powershell
npm test -- packages/kamra-api-server/src/auth
npm test -- packages/kamra-api-server/src/http/app-handler.test.ts
npm run typecheck
npm run test
npm run lint
npm run build
```

Manual checks:

- Admin-only alpha creation path is hidden or denied for unauthenticated and non-admin users.
- Feature flag disabled means no alpha onboarding path is available.
- Feature flag enabled means admin can create/allow a controlled identity.
- Controlled identity login succeeds through the existing login flow.
- A newly created alpha identity has an empty household and membership in it.
- Disabling alpha access blocks alpha-marked login but does not block demo users or the existing admin.
- Controlled identity cannot access admin, dev-admin, site-admin, or unrelated household data.
- Navigation clearly separates product lookup, household, site-admin, and dev-admin.

## Risks

- Risk: Stage 7 could accidentally become public registration.
  - Mitigation: only admin-owned creation/allocation; no public self-service route.
- Risk: The manually supplied password could leak through logs, seed ledger, or responses.
  - Mitigation: hash immediately, avoid logging request payloads, and never include the password in the creation response or audit metadata.
- Risk: Feature flag semantics become ambiguous.
  - Mitigation: the flag blocks alpha creation and alpha-marked login, while demo users and the existing admin are explicitly outside the alpha gate; document and test both paths.
- Risk: Admin-created users might gain unintended household access.
  - Mitigation: create exactly one empty household with explicit initial membership, preserve membership checks, and add route tests that admin/user roles do not bypass unrelated household membership.
- Risk: Shell work could sprawl into the deferred floating menu concept.
  - Mitigation: keep Stage 7 to route labels/grouping and simple navigation only.
- Risk: A route or model rename could accidentally discard existing database data.
  - Mitigation: allow direct UI/API renames, but preserve database records through additive changes or explicit migration and regression tests.
- Risk: Budget-agent execution misses auth edge cases.
  - Mitigation: reserve one stronger-model review pass for auth/access boundaries and require focused route tests.

## Approval Checkpoint

Implementation complete. The alpha creation style, household behavior, alpha-login gating, and MVP change posture are recorded above. Stage 7 renamed navigation and routes directly while preserving existing database records through additive changes.
