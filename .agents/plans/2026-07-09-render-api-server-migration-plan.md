# Render API Server Migration Plan

## Objective

Move Kamra's deployed API surface from Vercel Serverless Functions to a Render-hosted Node web service while keeping Vercel responsible for the Angular UI only.

The migrated API should keep the existing `/api/*` route shape, reuse the current shared server handler, and make frontend API origin and backend CORS origins configurable through environment variables.

## Context Read

- `AGENTS.md`
- `.agents/plan-template.md`
- `docs/architecture.md`
- `package.json`
- `vercel.json`
- `proxy.conf.json`
- `.env.example`
- `api/AGENTS.md`
- `src/AGENTS.md`
- `src/app/AGENTS.md`
- `packages/kamra-api-server/AGENTS.md`
- `scripts/local-api.ts`
- `packages/kamra-api-server/src/http/node-adapter.ts`
- `packages/kamra-api-server/src/http/app-handler.ts`
- `packages/kamra-api-server/src/http/app-route-context.ts`
- `packages/kamra-api-server/src/config/app-config.ts`
- `packages/kamra-api-server/src/http/routes/auth-routes.ts`
- `src/app/auth.service.ts`
- `src/app/browser-logger.ts`
- Targeted `rg` search for frontend `/api` and `fetch` usage.

## Research Gate

Needed and completed because this changes platform deployment behavior.

Sources checked:

- Render Web Services docs: Render web services need a public HTTP server bound to `0.0.0.0` and should use the `PORT` environment variable.
- Render Blueprint YAML reference: `render.yaml` can define a Node web service with `buildCommand`, `startCommand`, `healthCheckPath`, and `envVars`; secrets should be dashboard-managed or marked unsynced instead of hardcoded.
- Render Node version docs: Render can resolve Node from `NODE_VERSION`, `.node-version`, `.nvmrc`, or `package.json` `engines`.
- Render default environment variable docs: Render provides service metadata such as external URL/hostname, but application-specific config still needs explicit variables.
- Vercel project configuration docs: `buildCommand` and `outputDirectory` are project-configurable.
- Vercel environment variable docs: Production, preview, and development variables are scoped separately and apply to subsequent deployments or local Vercel development.
- Angular build environment docs: Angular environment values are bundled into browser code and are visible to users; only non-secret public config belongs there.
- MDN CORS docs: cross-origin browser calls with custom headers such as `Authorization` need preflight handling and explicit allowed origins/headers/methods.

Decision impact:

- The Render service should have a dedicated production server entrypoint, not rely on Vercel function files.
- The server must bind to `process.env.PORT` on `0.0.0.0`.
- The Angular UI needs a small public runtime/build config mechanism for `apiBaseUrl`; this value is not secret.
- The API needs explicit CORS support, including `OPTIONS` preflight, `Authorization`, and JSON content headers.
- Vercel should build only the Angular UI so the repository no longer creates deployed Vercel functions.

Remaining uncertainty:

- Which Render instance type should be used.
- Whether Render supports the exact desired production and preview branch wiring through one committed `render.yaml`, or whether a small dashboard step remains necessary after Blueprint import.
- Whether preview CORS can safely use deploy-preview origin patterns without over-widening browser access.

## User Requests

- Create a plan only; do not implement the migration yet.
- Keep this plan independent from the roadmap stages.
- Migrate the existing Vercel API into a backend server service hosted on Render because Vercel is limited to 12 functions.
- Keep Vercel hosting the Angular UI.
- Make the Vercel-hosted UI call the Render-hosted Node server.
- Configure frontend API base URL via environment variable.
- Configure backend CORS allowed origins via environment variable.
- Ensure local development/build can run web and API together.
- Ensure remote deployment works with Vercel and Render separately.
- Adjust `vercel.json` so Vercel runs UI only.
- Add Render-required configuration for running the server.
- Include operator questions and platform setup tasks.
- Do not include the concrete production URLs provided in chat in this plan file.

## Discovery Questions

Questions answered by the operator:

- Render should be configured with a committed `render.yaml` if Render supports the needed setup.
- Vercel preview deployments should later have separate APIs, but this migration does not need to build that out now.
- For now, Vercel preview deployments should use the empty API base URL fallback and the small retained Vercel serverless API surface.
- Local Angular development should use the local API by default, with `apiBaseUrl` unset.
- The Vercel `api/` directory should keep login/logout/log/admin shell and dashboard validity routes, but remove core domain API functions.
- The public Render API should keep the `/api/*` prefix externally.
- Render region should be Frankfurt.
- Render should auto-deploy production from `master` and preview from `master_dev`.
- Render should use the same MongoDB database configuration from environment variables.
- CORS should include approved production UI origins and preview patterns if this can be done safely.

Questions still open for the operator:

- Which Render instance type should be used?
- What exact Render service names should be used for production and preview?
- Should Render preview use the same database env values as production initially, or should that be revisited when the preview API is created later?

## User Decisions

- The production API base URL value was provided in chat and must be configured outside this plan file.
- The production CORS allowlist values were provided in chat and must be configured outside this plan file.
- This migration is standalone and should not be treated as a new roadmap stage.
- Render configuration should prefer a committed `render.yaml`.
- Vercel should retain a small serverless API surface for basic admin validity checks on all deployments.
- Vercel-retained serverless functions should be limited to login, logout, browser logging, admin identity/preferences, and the four admin dashboard routes.
- Core domain API routes for household, catalog, ingestion, crawling, or product workflows should move off Vercel and run through Render.
- Preview deployments can keep using the empty API base URL fallback and retained Vercel serverless functions for now.
- Separate preview Render APIs are desired later, but are not in this migration's required scope.
- Local development should default to the local API with `apiBaseUrl` unset.
- Render should deploy from `master` to production and `master_dev` to preview if supported by the chosen Render setup.
- Render should use the Frankfurt region.
- Render should use MongoDB configuration from env vars, matching the current Vercel-style setup.

## Current Reality

- `api/` contains many thin Vercel Function entrypoints. Each delegates to `handleNodeRequest`.
- `packages/kamra-api-server/src/http/app-handler.ts` owns the shared `/api/*` route dispatch table.
- `scripts/local-api.ts` already starts a Node HTTP server and delegates to the same handler.
- `npm run build` currently runs both `build:web` and `build:api`.
- `vercel.json` currently sets `buildCommand` to `npm run build` and `outputDirectory` to the Angular browser output.
- `vercel.json` routes filesystem requests first and then falls back to `index.html`, but Vercel can still detect deployed functions from the root `api/` directory.
- `proxy.conf.json` sends local Angular dev `/api` calls to `http://localhost:3000`.
- Frontend services currently call relative `/api/*` URLs directly through `fetch`.
- Authentication stores a bearer token in browser localStorage and sends it through the `Authorization` header; it does not currently rely on cross-site cookies.
- The shared server handler does not currently add CORS headers or handle `OPTIONS` preflight globally.
- `readAppConfig` currently reads auth and MongoDB env vars, but not CORS config.

## Intended Direction

- Keep route/domain logic in `packages/kamra-api-server`.
- Add only thin host glue for Render.
- Keep Vercel deployment focused on the Angular UI.
- Keep local development low-friction with `npm run dev` starting web and API together.
- Keep production deployment explicit: Vercel gets public frontend config, Render gets backend secrets and CORS config.
- Keep a small Vercel serverless admin-validity surface so previews and fallback deployments can still sign in, log browser events, load admin identity/preferences, and use dashboard health/maintenance routes.
- Move core domain API traffic to Render.
- Keep the migration reversible until the Render service is smoke-tested.

This intentionally revises the earlier serverless-first hosting target because a platform limit now makes the current Vercel API deployment shape unsuitable.

## Scope

Included:

- Add a production Node API server entrypoint that listens on `process.env.PORT` and `0.0.0.0`.
- Add package scripts for building and starting the API server on Render.
- Add backend CORS configuration parsing and response behavior.
- Add `OPTIONS` preflight support for allowed origins, methods, and headers.
- Add a frontend API URL helper so all browser calls can use an env-configured base URL with a relative local fallback.
- Update all frontend `fetch("/api/...")` call sites to use the helper.
- Update browser logging to use the same API URL helper.
- Configure Vercel to build/deploy Angular UI only.
- Remove core domain Vercel function files after Render parity is verified.
- Keep only the approved small Vercel serverless API surface for login, logout, log, admin identity/preferences, and admin dashboard routes.
- Add `render.yaml` as the preferred Render configuration path, with dashboard-only steps documented only where Render requires them.
- Update `.env.example` with non-secret variable names and safe placeholder values.
- Update relevant README/AGENTS documentation because deployment behavior changes materially.
- Validate local dev, local production build/start, and remote platform settings.

## Non-Goals

- No domain feature work.
- No roadmap stage changes.
- No database schema changes.
- No auth model rewrite.
- No migration to Express unless native Node handling proves insufficient.
- No crawler or ingestion scheduling changes.
- No custom Render domain setup unless the operator explicitly adds it.
- No secret values committed to the repository.
- No broad frontend refactor beyond routing API calls through a shared helper.

## Assumptions

- The Render service can reuse the current TypeScript build output from `tsconfig.api.json`.
- The production server can start from compiled JavaScript instead of running `tsx` in production.
- Keeping the `/api/*` path prefix on Render is acceptable and minimizes frontend/backend route changes.
- The public frontend API base URL is safe to expose in browser code.
- CORS origin matching should be exact-origin based, not wildcard based.
- Local development should keep supporting `npm run dev` with Angular on port 4200 and API on port 3000.
- The existing bearer-token auth flow only requires `Authorization` header CORS support, not cross-site credential cookies.
- Render receives the same required backend secrets currently used by Vercel functions.
- Empty `apiBaseUrl` means same-origin `/api/*`, which supports local proxy development and Vercel preview fallback to the retained serverless functions.
- Non-empty `apiBaseUrl` means browser API calls should target the Render API while preserving the `/api/*` path prefix.
- Preview CORS patterns should be allowed only if the implementation can keep them constrained to expected Vercel preview origins.

## Open Questions

- What exact name should be used for the Render service?
- Which Render instance type should be selected?
- Can one committed `render.yaml` define both production-from-`master` and preview-from-`master_dev` services cleanly for this repository?
- Should preview/staging have separate API and database values when the separate preview API is added later?
- Should local production smoke testing serve the Angular build from a static local server, or is `npm run dev` plus API smoke enough?
- Should Vercel keep any rewrite from `/api/*` to the Render backend as a compatibility bridge, or should the browser call Render directly through `apiBaseUrl`?

## Side Suggestions

- Add a very small unauthenticated health endpoint that does not require MongoDB for Render health checks, or confirm the existing health route is safe enough for health probes.
- Add a short deployment checklist to `docs/tech-ops.md` or `README.md` after the migration so future platform changes are less archaeological.
- Consider a temporary compatibility rewrite from Vercel `/api/*` to Render only if old deployed frontend assets may remain cached with relative URLs.
- Consider adding a frontend API helper test if the helper has URL joining or trailing-slash normalization logic.

## Steering Notes

- This plan deliberately does not include the concrete production API or UI origin values provided in chat.
- This plan is independent from `initial-mvp-roadmap.md` and should not be named as a stage plan.
- The migration moves away from the documented serverless-first target due to a discovered Vercel function-count constraint.
- Operator notes integrated on 2026-07-09: use `render.yaml` if possible, keep a small serverless Vercel admin-validity API, remove core domain API functions from Vercel, deploy Render production from `master`, deploy Render preview from `master_dev`, use Frankfurt region, and keep local/preview fallback behavior through an empty `apiBaseUrl`.

## Implementation Steps

### Step 1

- Goal: Add backend deployment config primitives without changing runtime behavior.
- Files likely affected:
  - `package.json`
  - `scripts/local-api.ts` or a new `scripts/api-server.ts`
  - `tsconfig.api.json`
  - `.env.example`
  - `scripts/README.md`
- Work:
  - Add a production API start script that runs compiled JavaScript.
  - Ensure the server listens on `process.env.PORT` and host `0.0.0.0` in production while preserving local defaults.
  - Keep or rename `scripts/local-api.ts` depending on whether one entrypoint can serve both local and production clearly.
  - Preserve same-origin local behavior when frontend `apiBaseUrl` is unset.
- Validation:
  - `npm run build:api`
  - Start the compiled API server locally with `PORT=3000`.
  - Call at least one public or auth-free route and one unknown route.
- Commit message idea: `Prepare Node API server for Render hosting`

### Step 2

- Goal: Add explicit backend CORS support.
- Files likely affected:
  - `packages/kamra-api-server/src/config/app-config.ts`
  - `packages/kamra-api-server/src/config/app-config.test.ts`
  - `packages/kamra-api-server/src/http/app-handler.ts`
  - `packages/kamra-api-server/src/http/app-handler.test.ts`
  - `packages/kamra-api-server/src/http/app-route-context.ts`
  - `.env.example`
- Work:
  - Add an env var for comma-separated allowed CORS origins.
  - Normalize origins by trimming trailing slashes and rejecting invalid values.
  - Add CORS headers only when the request `Origin` exactly matches an allowed origin.
  - Add `OPTIONS` preflight handling for `/api/*`.
  - Allow the methods already used by existing routes.
  - Allow `Authorization`, `Content-Type`, and `Accept` headers.
  - Add `Vary: Origin` when CORS behavior depends on origin.
- Validation:
  - `npm run test -- app-config app-handler`
  - Manual `OPTIONS` request with an allowed origin.
  - Manual `OPTIONS` request with a disallowed origin.
  - Manual authenticated request with `Authorization` from an allowed origin.
- Commit message idea: `Add configurable API CORS handling`

### Step 3

- Goal: Make frontend API calls use configurable `apiBaseUrl`.
- Files likely affected:
  - `src/app/`
  - `src/main.ts` if app initialization is needed
  - `public/` if runtime config is used
  - `scripts/` if build-time config generation is used
  - `angular.json`
  - `package.json`
  - `.env.example`
- Work:
  - Add one shared frontend helper for building API URLs.
  - Choose a config strategy:
    - Build-time generated TypeScript config from env, simplest for Vercel production.
    - Runtime public JSON/config script, better if changing API origin without rebuilding matters.
  - Keep default `apiBaseUrl` empty so local Angular dev uses the existing proxy and Vercel previews can use the retained same-origin serverless functions.
  - Use the non-empty configured production API base URL for Vercel production so core UI calls target Render.
  - Replace direct relative `/api/*` fetch inputs with the helper.
  - Keep bearer-token `Authorization` behavior unchanged.
- Validation:
  - `npm run typecheck`
  - `npm run build:web`
  - Local `npm run dev` smoke: login/current-user flow and browser logger call.
  - Production-build smoke with a non-empty API base URL.
- Commit message idea: `Route frontend API calls through configurable base URL`

### Step 4

- Goal: Split Vercel and Render deployment configuration.
- Files likely affected:
  - `vercel.json`
  - `render.yaml` if Blueprint is chosen
  - `package.json`
  - `.env.example`
  - `README.md` or `docs/tech-ops.md`
- Work:
  - Change Vercel build command to build the Angular UI and the retained small serverless API surface only if Vercel requires compiled function type checking through the build command.
  - Keep Vercel output directory pointed at the Angular browser output.
  - Ensure Vercel deploys fewer than 12 serverless functions by retaining only the approved admin-validity API files.
  - Add `render.yaml` with Node runtime, API build command, API start command, health check path, Frankfurt region, production branch, and preview branch setup where Render supports it.
  - Do not hardcode secret values in Render config.
  - Document required platform env vars and which platform owns each one.
- Validation:
  - `npm run build:web`
  - `npm run build:api`
  - Confirm Vercel deployment has only the retained small serverless API files.
  - Confirm Render start command runs the compiled server locally.
- Commit message idea: `Configure Vercel UI and Render API deployment`

### Step 5

- Goal: Prune Vercel serverless API deployment surface after Render parity.
- Files likely affected:
  - `api/`
  - `api/AGENTS.md`
  - `tsconfig.api.json`
  - `package.json`
  - tests if imports or includes reference `api/`
- Work:
  - Keep these Vercel function entrypoints:
    - `api/login.ts`
    - `api/logout.ts`
    - `api/log.ts`
    - `api/admin/me.ts`
    - `api/admin/preferences.ts`
    - `api/admin/dashboard/health.ts`
    - `api/admin/dashboard/upgrade-catalog-validators.ts`
    - `api/admin/dashboard/backfill-unvalidated-products.ts`
    - `api/admin/dashboard/reseed-demo-household.ts`
  - Remove Vercel function entrypoints for household, catalog, ingestion, crawling, and other core domain API routes.
  - Update `api/AGENTS.md` to describe the retained Vercel fallback/admin-validity surface instead of the full API.
  - Update TypeScript API include paths only if needed after pruning.
  - Remove or update stale docs that imply all `/api/*` routes deploy as Vercel functions.
- Validation:
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
  - Confirm the deployed root `api/` function count is below the Vercel limit.
  - Confirm Vercel preview can sign in, load admin identity/preferences, log browser events, and open the admin dashboard using retained same-origin functions.
  - Confirm core domain UI calls use Render when production `apiBaseUrl` is configured.
- Commit message idea: `Prune Vercel API functions to admin fallback`

### Step 6

- Goal: Platform rollout and smoke validation.
- Files likely affected:
  - Documentation only, unless rollout reveals a narrow fix.
- Work:
  - Configure Render env vars.
  - Deploy Render API.
  - Smoke-test Render API directly.
  - Configure Vercel env vars.
  - Deploy Vercel UI.
  - Smoke-test UI-to-API calls from each approved frontend origin.
  - Check Render logs for CORS, auth, and MongoDB connection failures.
- Validation:
  - Direct API health check on Render.
  - Browser login/current-user flow from Vercel-hosted UI.
  - Product catalog list call.
  - Household stock list call if test data exists.
  - Admin health/dashboard call.
  - Browser log ingestion call.
- Commit message idea: `Document Render API rollout validation`

## Operator Platform Tasks

Render:

- Create or connect Node web services for production and preview through `render.yaml` if possible.
- Use Frankfurt region.
- Choose the service names and instance type.
- Configure production auto-deploy from `master`.
- Configure preview auto-deploy from `master_dev`.
- Set build command to install dependencies and build the API only.
- Set start command to run the compiled API server.
- Set required backend env vars:
  - `NODE_ENV=production`
  - `AUTH_TOKEN_SECRET`
  - `MONGODB_URI`
  - `MONGODB_DB_NAME`
  - `MONGODB_DNS_SERVERS` if still needed
  - CORS allowed origins env var with the approved frontend origins
  - `NODE_VERSION` only if `package.json` `engines` is not sufficient or an exact version is required
- Configure preview CORS patterns if Render preview API is enabled and the implementation supports constrained pattern matching.
- Confirm Render-provided `PORT` is used by the server.
- Configure health check path after the implementation confirms which route should be used.
- Confirm MongoDB Atlas network access allows Render outbound connections.

Vercel:

- Keep the Angular project connected to Vercel.
- Set build command to the UI-only build script.
- Keep output directory as the Angular browser output.
- Set frontend API base URL env var for Production.
- Leave frontend API base URL unset for Preview unless or until a separate preview Render API is created.
- Redeploy after env var changes.
- Confirm only the retained admin-validity `api/` functions are deployed after Step 5.
- Confirm total deployed Vercel function count remains below the platform limit.

Local operator setup:

- Add frontend API base URL and CORS env vars to `.env.local` only if testing direct cross-origin local calls.
- Keep `.env.local` out of git.
- Use `npm run dev` for the standard local web-plus-API workflow, with `apiBaseUrl` unset so the existing local proxy is used.
- Use production build/start commands for pre-deploy smoke tests.

## Validation Plan

Automated:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build:web`
- `npm run build:api`
- `npm run build`

Manual local:

- `npm run dev`
- Open Angular dev server.
- Confirm API calls still work through local proxy or direct configured base URL.
- Start compiled API server and hit a route directly.
- Send CORS preflight requests for allowed and disallowed origins.

Manual remote:

- Deploy Render API.
- Hit Render health route directly.
- Deploy Vercel UI.
- Load Vercel UI and confirm network requests go to configured API base URL.
- Load Vercel preview with `apiBaseUrl` unset and confirm retained same-origin serverless admin-validity routes work.
- Confirm no CORS failures in browser devtools.
- Confirm login and authenticated admin calls work.
- Confirm Render logs show expected request handling and no missing env config.

## Risks

- Vercel may still exceed the function limit if retained admin-validity routes grow.
  - Mitigation: keep only the approved retained route files and verify deployment output.
- Angular config generated at build time will require a redeploy when the API origin changes.
  - Mitigation: choose runtime public config if that flexibility matters.
- CORS can silently block auth if `Authorization` is not allowed.
  - Mitigation: test preflight and authenticated requests explicitly.
- Exact-origin CORS will fail if configured origins include paths or trailing slash mismatches.
  - Mitigation: normalize env values and document origin-only values.
- Preview-origin CORS patterns may accidentally become too broad.
  - Mitigation: prefer exact origins where possible and only add constrained preview matching after review.
- Cached old frontend assets may still call relative `/api/*`.
  - Mitigation: retained serverless admin-validity routes keep basic operations working; use cache-busting deployment for core domain routes.
- Render free or low-tier services may cold start or sleep depending on plan.
  - Mitigation: choose instance type intentionally and document expected behavior.
- MongoDB Atlas network rules may block Render.
  - Mitigation: verify Atlas access settings during rollout.
- Moving away from serverless-first creates architecture drift.
  - Mitigation: document the reason and keep server glue thin and portable.

## Approval Checkpoint

Implementation should not begin until the user approves this plan and answers the operator questions that affect deployment strategy:

- Render instance type.
- Render service names.
- Whether the final `render.yaml` can express production-from-`master` and preview-from-`master_dev` without dashboard-only drift.
