# Stage 2 Serverless Foundation Plan

Status: Mostly implemented; remaining completion work is narrowed in `.agents/plans/mvp/2026-06-23-finalize-stage-2-plan.md`.

## Objective

Create Kamra's minimal deployable serverless foundation: an Angular frontend, thin Vercel API adapters, locally runnable shared API logic, MongoDB connectivity, admin-only credential login, structured database seeding, and small PR checks for the new app surface.

This plan also resets the active docs for the new runtime reality by archiving stage-1-oriented or stale docs into a legacy subdirectory and replacing them with living docs that can evolve with implementation.

## Context Read

- `AGENTS.md`
- `.agents/planning-workflow.md`
- `.agents/plan-template.md`
- `.agents/coding-guidelines.md`
- `.agents/session-state-template.md`
- `.agents/plans/mvp/initial-mvp-roadmap.md`
- `.agents/plans/mvp/2026-06-22-portability-and-roadmap-doc-refresh-plan.md`
- `docs/repo-concept.md`
- `docs/architecture.md`
- `docs/tech-ops.md`
- `docs/codebase-analysis.md`
- `docs/repo-bootstrap-standard.md`
- repository file listing with `rg --files`
- `.github/workflows` listing

## Research Gate

Needed, because this stage depends on current Angular, Vercel, MongoDB Atlas, and GitHub Actions behavior.

Sources checked:

- Angular versioning and release docs: https://angular.dev/reference/releases
- Angular version compatibility docs: https://angular.dev/reference/versions
- Angular CLI local setup docs: https://angular.dev/tools/cli/setup-local
- Vercel Node.js runtime docs: https://vercel.com/docs/functions/runtimes/node-js
- Vercel supported Node.js versions docs: https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
- Vercel environment variable docs: https://vercel.com/docs/environment-variables
- MongoDB Atlas serverless connection guidance for Lambda-style functions: https://www.mongodb.com/docs/atlas/manage-connections-aws-lambda/
- MongoDB Atlas IP access list docs: https://www.mongodb.com/docs/atlas/security/ip-access-list/
- GitHub Actions Node.js build/test docs: https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs
- GitHub Actions secrets docs: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets

Decision impact:

- Angular v22 is currently active, Angular v20 remains LTS, and Angular v22 requires Node `^22.22.3 || ^24.15.0 || ^26.0.0`.
- Vercel currently defaults new projects to Node 24.x and supports 24.x, 22.x, and 20.x.
- Vercel API files in `/api` can be TypeScript functions with thin Web-standard request/response handlers.
- Vercel environment variables are appropriate for runtime secrets, and local development can use `.env.local` or `vercel env pull`.
- MongoDB recommends defining the MongoDB client outside Lambda-style handlers so warm invocations can reuse the client.
- Atlas requires IP access list entries for clients. Vercel free-tier dynamic egress may require a documented compromise unless a static egress/private networking option is introduced later.
- GitHub recommends `actions/setup-node` for consistent Node versions in workflows.
- GitHub Actions secrets are not passed to forked PR workflows, so PR validation should not require production or preview secrets.

Remaining uncertainty:

- Whether the first deployed Atlas network access should be documented as a one-time provisioning touch or as a broader free-tier compromise. User preference is to avoid recurring IP maintenance, so the implementation should favor the simplest clean setup that does not require repeated network edits.
- Whether to scaffold on Angular v22/Node 24 now or pin Angular v20/Node 22 for a quieter LTS foundation.

## User Requests

- Execute the next roadmap session for Stage 2, starting with a plan file for review.
- Ask simple questions when decisions materially affect velocity or quality.
- Move the current architecture document, codebase analysis, and outdated docs in `docs/` to a legacy subdirectory.
- Add actual, evolving docs in their place.
- Build the initial deployable application codebase.
- Prove communication with an empty MongoDB.
- Treat ops as setting up the MongoDB connection and documenting where secrets belong in Vercel or GitHub.
- Run locally and see admin login.
- Seed MongoDB with admin user data without storing raw credentials in code.
- Design seeding as a structured recurring action that can accept later seed steps.
- Add a PR check to validate the app surface.
- Add minimal linting workflow for code cleanliness when PRs are opened or updated.
- After plan approval, add a session file to track progress and reduce context-loss risk.

## Discovery Questions

1. Runtime track: should Stage 2 use Angular v22 with Node 24, or Angular v20 LTS with Node 22?
   - Recommendation: Angular v22 and Node 24, because it matches current active Angular docs and Vercel's default Node version.
2. First Atlas network access posture: is a broad Atlas IP access entry acceptable for this free-tier Vercel proof if the database user is least-privilege and credentials stay in Vercel env vars?
   - Recommendation: accept it only for the Stage 2 proof, document it clearly, and revisit when static egress/private networking is worth paying for or when deployment target changes.
3. Session handling: should raw credential login create an HTTP-only signed cookie session rather than returning a browser-stored bearer token?
   - Recommendation: use an HTTP-only same-site cookie. It is still simple, but avoids normalizing localStorage token handling for the new app.

## User Decisions

- Pending review.

## Current Reality

- This checkout currently contains docs, agent files, license files, IDE metadata, and legacy GitHub workflows.
- `rg --files` shows no application source code in the current working tree.
- `docs/architecture.md`, `docs/tech-ops.md`, and `docs/codebase-analysis.md` describe target direction and legacy code from an earlier repository state, but they are not current runtime truth for this checkout.
- `.github/workflows` contains legacy `auto_push_*` workflows that appear unrelated to the intended Stage 2 app validation.
- Git status cannot currently be read in the sandbox because Git reports dubious ownership for `D:/Code/Kamra`. Fixing local Git safe-directory configuration may require user action or an approved environment change before commit preparation.

## Intended Direction

- Treat Stage 2 as a fresh foundation, not an adaptation of missing legacy code.
- Keep Vercel handlers thin around locally runnable TypeScript API logic.
- Keep Angular as the frontend baseline unless a later approved plan changes that direction.
- Keep MongoDB as the system of record, starting with only the collections needed for admin identity, sessions or session metadata if needed, seed records, and health checks.
- Store raw admin bootstrap credentials only in local `.env.local`, Vercel env vars, or GitHub Actions secrets where needed.
- Persist admin identity and password hash in MongoDB through an idempotent seed action.
- Add PR checks only for the new app slice and keep workflows small.

## Scope

- Archive stale docs to a legacy subdirectory.
- Replace archived active docs with current living docs for architecture, operations, and codebase/current-state.
- Create a TypeScript/Node/Angular workspace.
- Add a minimal Angular admin login experience.
- Add reusable API core modules for configuration, MongoDB connection, health checks, auth, sessions, admin identity, and seed orchestration.
- Add thin Vercel API routes for health, login, logout, and current admin identity.
- Add a local API runner that uses the same core handlers without requiring Vercel.
- Add an idempotent seed runner with a registry pattern for future seed steps.
- Add safe environment templates and docs without secrets.
- Add tests for deterministic auth/session/health/seed behavior where useful.
- Add a minimal PR workflow for install, lint, test, build, and a local API smoke check against a throwaway MongoDB service.
- Add a Stage 2 session file immediately after plan approval.

## Non-Goals

- Public registration.
- Google sign-in.
- Demo-user whitelist.
- Household workflows.
- Product ingestion or crawler work.
- Product schema finalization beyond the minimal admin/auth/seed documents.
- Production-grade role-management UI.
- Email provider setup.
- Paid networking or hosting setup unless the user explicitly chooses it.
- Auto-fix or PR branch writeback automation.
- Deleting legacy workflow files unless explicitly approved as part of this plan's docs/workflow cleanup step.

## Assumptions

- The first app can be created from the current docs-only checkout.
- The local developer will provide `.env.local` values or Vercel-pulled env values when testing against real MongoDB.
- The deployed Vercel project will receive env vars through Vercel's dashboard or CLI, not through committed files.
- GitHub Actions PR checks should not require private Vercel or Atlas secrets, because forked PRs and untrusted PR contexts may not receive them.
- Local and CI smoke tests can use a temporary MongoDB instance or a local service container rather than the real Atlas database.
- Admin password hashing should use Node built-in crypto, such as `scrypt`, to avoid native dependency friction in serverless deployment.

## Open Questions

- Should `docs/repo-bootstrap-standard.md` remain active, or move under legacy because it is generic bootstrap material rather than current Kamra runtime documentation?
- Should the legacy `auto_push_*` workflows be archived or disabled during Stage 2, or left untouched until a separate workflow-cleanup plan?
- Should the first deploy validation be manual, or should we add a separate manually dispatched workflow that can use protected secrets to call the deployed health endpoint?

## Side Suggestions

- Add a `docs/security.md` later when auth and user roles become more than admin-only. It would keep security posture from becoming scattered across architecture and ops docs.
- Add generated OpenAPI or JSON Schema only after the API surface stabilizes beyond Stage 2. Adding it now would be ceremony without much contract value.
- Consider changing `AGENTS.md` references from `docs/codebase-analysis.md` to a new `docs/current-state.md` once the docs reset lands. That avoids making a legacy-analysis filename pretend to be the forever source of runtime truth.

## Steering Notes

- Stage 2 is broader than the roadmap's pure connectivity proof because the user explicitly included docs reset, admin login, structured seeding, and PR checks.
- The docs reset should preserve historical material rather than overwrite it. The active docs should be smaller and truer to the current repo.
- The first implementation should privilege visible, boring seams: host adapter, local runner, core logic, Mongo access, and frontend UI.
- Atlas network access should be configured once during provisioning if possible, then left alone unless the deployment model changes. Avoid recurring IP churn.

## Implementation Steps

### Step 1

- Goal: create the Stage 2 session file and reset active docs around current runtime truth.
- Files likely affected:
  - `.agents/sessions/mvp/2026-06-22-stage-2-serverless-foundation.md`
  - `docs/legacy/2026-06-stage-1/architecture.md`
  - `docs/legacy/2026-06-stage-1/tech-ops.md`
  - `docs/legacy/2026-06-stage-1/codebase-analysis.md`
  - `docs/architecture.md`
  - `docs/tech-ops.md`
  - `docs/codebase-analysis.md` or new `docs/current-state.md`
  - possibly `AGENTS.md` if the active current-state doc path changes
- Validation:
  - active docs describe the current docs-only-to-new-app reality
  - archived docs remain available and clearly labeled as historical
  - `AGENTS.md` required-reading links remain valid
- Commit message idea: `docs: reset stage 2 architecture and current-state docs`

### Step 2

- Goal: scaffold the minimal TypeScript/Angular workspace and local/Vercel app boundaries.
- Files likely affected:
  - `package.json`
  - `package-lock.json`
  - `tsconfig*.json`
  - `angular.json`
  - `src/**` or `apps/web/**`
  - `api/**`
  - `packages/api-core/**`
  - `scripts/**`
  - `vercel.json`
  - `.gitignore`
- Validation:
  - `npm ci` or `npm install` succeeds
  - Angular app builds
  - local API runner starts without Vercel
  - Vercel adapter files remain thin
- Commit message idea: `feat: scaffold serverless app foundation`

### Step 3

- Goal: implement MongoDB configuration, connection reuse, safe health check, and environment documentation.
- Files likely affected:
  - `packages/api-core/src/config/**`
  - `packages/api-core/src/db/**`
  - `packages/api-core/src/health/**`
  - `api/health.ts`
  - `scripts/local-api.ts`
  - `.env.example`
  - `docs/tech-ops.md`
- Validation:
  - local health check reports configured/unconfigured states safely
  - health check connects to MongoDB when `MONGODB_URI` and database name are present
  - response does not expose connection strings, usernames, hostnames unless intentionally approved, or raw errors
  - MongoDB client is initialized for reuse outside request handlers
- Commit message idea: `feat: add mongo-backed health check`

### Step 4

- Goal: implement idempotent structured seeding for admin identity.
- Files likely affected:
  - `packages/api-core/src/seeds/**`
  - `packages/api-core/src/users/**`
  - `scripts/seed.ts`
  - `.env.example`
  - `docs/tech-ops.md`
- Validation:
  - seed runner creates or updates the admin identity from env-provided email/password
  - raw admin password is never written to source or logs
  - password is stored as a salted hash
  - seed execution is recorded in a seed or migration ledger collection
  - repeated seed runs are safe
- Commit message idea: `feat: add structured admin seed`

### Step 5

- Goal: implement raw admin credential login, protected admin identity endpoint, logout, and minimal frontend login/admin screen.
- Files likely affected:
  - `packages/api-core/src/auth/**`
  - `packages/api-core/src/http/**`
  - `api/login.ts`
  - `api/logout.ts`
  - `api/admin/me.ts`
  - Angular auth/login/admin files under `src/**` or `apps/web/**`
- Validation:
  - invalid login fails closed
  - valid login creates an HTTP-only same-site signed cookie session
  - unauthenticated requests cannot access admin-only endpoint or admin UI state
  - authenticated admin identity comes from MongoDB-backed user data
  - no public registration route exists
- Commit message idea: `feat: add admin-only login`

### Step 6

- Goal: add focused tests and local smoke scripts for the new foundation.
- Files likely affected:
  - `packages/api-core/**/*.test.ts`
  - `scripts/smoke-local.ts`
  - `package.json`
  - test configuration files
- Validation:
  - auth hashing and verification tests pass
  - health result-shaping tests pass
  - seed idempotency behavior is covered with a fake or test database boundary
  - local smoke can exercise health and admin-login flow against configured MongoDB
- Commit message idea: `test: cover serverless foundation core`

### Step 7

- Goal: add minimal PR checks for the app slice.
- Files likely affected:
  - `.github/workflows/app-checks.yml`
  - package scripts
  - possibly `.github/workflows/README.md` or docs note
- Validation:
  - workflow runs on `pull_request` and relevant `push` events
  - workflow uses `actions/setup-node`
  - workflow runs install, lint, tests, build, and a local smoke check
  - workflow does not require private Vercel or Atlas secrets for PRs
  - workflow permissions are minimal and do not write back to branches
- Commit message idea: `ci: add app checks`

### Step 8

- Goal: document deployment, local setup, secrets, free-tier notes, and validation.
- Files likely affected:
  - `README.md` if created
  - `docs/tech-ops.md`
  - `docs/architecture.md`
  - `.agents/sessions/mvp/2026-06-22-stage-2-serverless-foundation.md`
- Validation:
  - local run instructions work from a clean checkout
  - Vercel env var names are documented without values
  - GitHub secret names, if any, are documented without values
  - Atlas network-access compromise or stricter choice is documented
  - deployed healthcheck validation steps are documented
  - session file records completed steps, changed files, validation, and next action
- Commit message idea: `docs: document stage 2 operations`

## Validation Plan

Local validation:

- `npm ci`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run seed`
- `npm run dev:api`
- `npm run dev:web`
- manual browser check of admin login
- local healthcheck request before and after MongoDB configuration

Deployment validation:

- configure Vercel env vars for MongoDB, admin seed credentials, and session signing
- deploy to Vercel
- run seed against the deployed/target database through a controlled local command or protected action
- verify deployed `/api/health` reports safe healthy status
- verify deployed admin login works
- verify unauthenticated admin endpoint access is rejected

CI validation:

- PR workflow installs dependencies with a pinned Node version
- PR workflow runs lint, tests, build, and smoke check
- workflow does not depend on private production secrets
- workflow permissions are read-only unless a later plan approves writeback

Documentation validation:

- active docs match implemented runtime truth
- archived docs are clearly historical
- no secret values appear in docs, examples, committed env files, workflow logs, or source

## Risks

- Atlas network access from Vercel free-tier may require a broad IP allowlist.
  - Mitigation: use least-privilege database users, strong generated passwords, TLS connection strings, no committed credentials, and explicit docs marking this as a Stage 2 compromise.
- Angular v22 may have newer defaults that slow initial setup.
  - Mitigation: keep app surface tiny, avoid experimental APIs, and use documented current CLI defaults.
- Workspace complexity could outrun the MVP proof.
  - Mitigation: keep only three boundaries at first: Angular UI, core API logic, thin host/local adapters.
- PR smoke tests against real Atlas would be fragile and secret-dependent.
  - Mitigation: use a temporary local MongoDB service or fake boundary in PR checks; keep real deployed health validation manual or protected.
- Admin auth can accidentally become the future auth architecture.
  - Mitigation: document it as bootstrap-only and keep it isolated from later Google auth and whitelist plans.
- Git safe-directory failure may block status checks or commit prep.
  - Mitigation: ask the user to configure Git safe directory or approve a targeted configuration command before commit work.

## Approval Checkpoint

Implementation should not begin until the user approves this plan.

After approval, the first action is to create `.agents/sessions/mvp/2026-06-22-stage-2-serverless-foundation.md` and then start Step 1.
