# Technology And Operations Direction

## Purpose

This document captures the intended low-cost operational model for Kamra.

It is a direction document, not proof that the current codebase already follows this model.

## Target Architecture Decision

Kamra is serverless-first for the MVP target.

The intended setup:

- Vercel for Angular frontend hosting and Node.js stateless API routes
- MongoDB Atlas as the managed system of record
- separate databases or equivalent isolated environments for real internal data and demo-facing data
- GitHub Actions for scheduled or event-driven ingestion and transformation jobs
- Vercel and GitHub kept as current defaults, not hard architectural dependencies
- Google account authentication as a later auth extension unless revised by plan
- GitHub pull requests for controlled review
- free-tier friendly deployment for demos, testing, and portfolio/reference use
- source-available license posture that permits code review and reuse without allowing clone-and-host service copies

## Core Constraint

Do not introduce a persistent custom backend server as the default MVP architecture.

The MVP should avoid paid infrastructure requirements unless explicitly approved. Free-tier limits should shape crawler frequency, database volume, deployment choices, and demo behavior.

Allowed:

- stateless API routes
- scheduled ingestion jobs
- event-driven batch jobs
- deterministic transformation scripts
- scheduled maintenance processors for merge review, stale-data cleanup, and similar hygiene work
- managed database access
- managed authentication or OAuth integration
- feature-flagged email and cleanup workflows

Disallowed by default:

- long-running custom API processes
- crawlers running inside request handlers
- in-memory backend state dependencies
- architecture that requires fixed IP assumptions
- background workers that require always-on hosting
- uncontrolled public registration
- automatic invitation emails or cleanup cron before the whitelist feature flag is enabled
- designs that require paid services before the MVP can be demonstrated

## Portability And Platform Boundaries

Kamra can use convenient managed platforms without letting them own too much of the codebase.

Operational direction:

- keep Vercel-specific server adapters thin around app logic
- keep GitHub Actions workflows thin around checked-in scripts
- keep core logic locally runnable outside hosted-platform wrappers
- prefer explicit seams for hosting, auth-provider, email-provider, and workflow-entrypoint swaps
- avoid burying business logic in workflow YAML, deployment config, or provider-specific glue

## Data Flow

Target data lifecycle:

```text
External store source
  -> GitHub Actions ingestion job
  -> raw immutable snapshot
  -> transformation job
  -> canonical MongoDB collections
  -> stateless API route
  -> frontend
  -> user decision or generated shopping list
```

## Current Codebase Mismatch

The current repository contains:

- ASP.NET Core API
- Entity Framework data access
- SQL Server migrations
- Angular frontend
- MongoDB connector libraries
- Playwright-based crawler samples

This is valuable existing work, but it differs from the target MVP operating model.

Future standardization plans must explicitly decide:

- how Angular is retained or upgraded for Vercel deployment
- whether any .NET code remains as temporary reference tooling only
- how crawler logic maps into GitHub Actions
- how shared TypeScript contracts are generated or exposed for workflow jobs in other languages
- how SQL Server entities map to MongoDB documents or are retired
- how API behavior maps to Vercel serverless routes
- how existing user/auth concepts map to Google sign-in, households, and admin access

Workflow runtime should stay flexible per job. JavaScript or TypeScript is likely the most consistent default, but Python or C# should remain allowed when a crawler, parser, or transformation is materially better served by that toolchain.

When shared contract generation is promoted from followups, prefer a TypeScript source of truth with both JSON Schema and OpenAPI artifacts if the maintenance cost stays low enough. Those generated artifacts should be produced in CI or PR workflows and referenced from repository docs once they exist.

## Secrets

Secrets must not be committed.

Expected secret categories:

- MongoDB connection data
- Google OAuth or authentication provider secrets
- email provider credentials if invitation emails are enabled
- crawler credentials if any source requires them
- deployment tokens
- optional API keys for future integrations

Because the repository is public and source-available, demo data, sample data, and documentation must never require committed secrets or private production exports.

Prefer platform-managed secrets:

- GitHub Actions secrets for ingestion and transformation jobs
- Vercel environment variables for frontend and API routes
- local developer secrets outside source control

For the current Stage 2 MongoDB setup, prefer storing the full connection string and database name rather than splitting username and password across multiple app settings:

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `AUTH_TOKEN_SECRET` for signed browser-persisted user tokens

Authenticated user records now carry lightweight profile preferences:

- `profile.theme` stores `light` or `dark`
- `profile.language` stores `en` or `hu`

Anonymous users can still switch theme and language. Those choices are stored in browser cookies and are replaced by the signed-in user's profile preferences after login.

The current database environment matrix is documented in [docs/database-environments.md](./database-environments.md). In short:

- `kamra_prod` is the main production database
- `kamra_test` is the preview/test database
- `kamra_dev` is the developer release-testing database
- `kamra_smoke` is the proofbuild smoke database

Keep the environment names, user names, and secret locations aligned with that matrix instead of inventing new one-off combinations in code or docs.

## Logging And Diagnostics

Kamra currently uses a lightweight split logging model documented in [docs/logging.md](./logging.md):

- server logs are timestamped and written to console plus local rolling `logs/server-YYYY-MM-DD.log` files
- browser logs are timestamped in the browser, forwarded to `POST /api/log`, and mirrored to server console plus local rolling `logs/browser-YYYY-MM-DD.log` files
- Vercel runtime logs should be treated as the hosted observability surface for server-side console output
- file logs are a local convenience, disabled on Vercel, and should remain free of secrets

Logging should stay structured enough to debug startup and connectivity issues without becoming a general-purpose telemetry system before the app needs one.

## Seeding

Stage 2 includes a small seed registry that can be run locally with:

```powershell
npm run seed
```

Kamra now falls back to `1.1.1.1,8.8.8.8` for MongoDB Atlas SRV resolution whenever `MONGODB_URI` is configured and `MONGODB_DNS_SERVERS` is not set.

If that default ever needs to be overridden, set `MONGODB_DNS_SERVERS` in `.env.local`, in the shell, or in the affected hosted environment before running the seed or health check:

```powershell
$env:MONGODB_DNS_SERVERS='1.1.1.1,8.8.8.8'
npm run seed
```

The seed runner reads these shared database values from local environment files or platform secrets:

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `MONGODB_DNS_SERVERS` when a DNS override is needed for local or hosted SRV resolution

The deployed `api/` Vercel Function entrypoints do not use a separate secrets layer inside the repository. They read runtime values from `process.env` through `readAppConfig()`, so the active Vercel environment must define the same variables that local development uses. Login and admin-only API checks also require `AUTH_TOKEN_SECRET`.

Stage 2 health reporting intentionally uses `database` as the public health-check contract name even though the underlying connectivity check currently pings MongoDB. Keep the external shape platform-neutral unless a later plan deliberately adds store-specific or engine-specific diagnostics.

## Frontend Preferences And Localization

The Angular shell currently supports:

- light and dark themes via CSS custom properties in `src/styles.css`
- language switching between English and Hungarian
- per-user persistence through `PATCH /api/admin/preferences`
- anonymous fallback persistence through cookies

Default translations live in standard nested JSON files:

- `src/app/i18n/en.json`
- `src/app/i18n/hu.json`

Keep locale resources grouped by product area, such as `app`, `common`, `product`, `crawl`, `health`, and `editor`. The lightweight `LocalizationService` reads those JSON files now; future i18n libraries should be able to consume the same shape without a content migration.

Each seed owns its own optional env values. If all env values for an optional seed are present, that seed runs silently. If they are missing, `npm run seed` asks whether to run that seed and prompts for the missing values.

Current seed particles:

- `admin_identity` creates or updates one bootstrap admin identity in the `users` collection and records each run in `seed_ledger`
- `admin_identity` reads `SEED_ADMINUSER_USERNAME` and `SEED_ADMINUSER_PASSWORD`
- `catalog_v1_foundation` creates the first versioned catalog collections and synthetic grocery sample records
- `catalog_v1_foundation` runs when `SEED_CATALOG_V1=1`, or interactively when accepted through `npm run seed`
- `demo_household` recreates the stable demo household, demo users, and household stock rows for Stage 5
- `demo_household` reads `SEED_DEMO_HOUSEHOLD_PASSWORD`
- `demo_household` stores the demo login identifiers as `usera` and `userb` to match the current auth layer's lowercase login normalization

The same reset is available to signed-in admins through the developer-admin dashboard:

- frontend route: `/dev-admin`
- API route: `POST /api/admin/dashboard/reseed-demo-household`

The developer-admin dashboard also keeps read-only runtime health checks separate from modifying maintenance actions. The health route is `GET /api/admin/dashboard/health`; catalog validator upgrade and legacy validation backfill remain explicit modifier actions in the maintenance block.

Stage 7 controlled alpha access is documented in [docs/access.md](./access.md). It is admin-created, public registration remains closed, and the database-backed `allowControlledAlphaAccess` flag blocks both alpha-user creation and alpha-marked login when disabled.

For the full household stock model, current Stage 5 behavior, seeded rows, and Stage 6 handoff, see [docs/household.md](./household.md).

Catalog seed direction:

- product-model seed data should be synthetic, clearly marked by source and environment metadata, and safe to inspect in the deployed app
- product seeds should validate against the same JSON Schema or equivalent contract artifacts used by database smoke checks
- seeded products, source products, price or availability observations, and stock-location examples should be enough to test household queries before crawler data exists
- product seed refresh or cleanup behavior should be explicit so real database testing does not leave ambiguous sample records behind
- catalog setup creates missing collections with the current JSON Schema validators, but normal seed and smoke runs do not modify validators on existing collections
- validator changes on existing collections must be handled by a deliberate migration or admin-maintenance operation, because MongoDB `collMod` requires elevated database privileges beyond normal app read/write access
- the admin dashboard includes an explicit `Upgrade catalog validators` maintenance action that runs `collMod` for existing catalog collections and creates any missing catalog collections with current validators; use it only with a temporary MongoDB user that has validator-management privileges such as `dbAdmin`
- after catalog validators are upgraded, run the admin dashboard `Set legacy products unvalidated` maintenance action to physically add missing validation fields to legacy product documents
- if the legacy-product backfill reports that documents are shown as unvalidated by compatibility fallback, the product data is still readable, but the `products` collection validator has not yet accepted the new validation fields; run `Upgrade catalog validators` first, then retry the backfill
- on 2026-07-03, the Stage 4 manual-gateway maintenance run upgraded 9 existing catalog validators, created 0 missing catalog collections, and marked 1130 legacy products as `unvalidated`

Catalog validator maintenance procedure:

1. Temporarily run the local API with a MongoDB user that has validator-management privileges for the target database, such as `dbAdmin`.
2. Sign in as a Kamra admin and open the admin dashboard.
3. Click `Upgrade catalog validators`; the button runs `collMod` for existing catalog collections and creates any missing catalog collections with current validators.
4. Confirm the message reports the expected upgraded/created collection counts.
5. Click `Set legacy products unvalidated` to backfill missing product validation fields.
6. Confirm the message reports the expected product count, then return the app to its normal lower-privilege runtime MongoDB user.

Seeding rules:

- raw admin passwords must never be committed, logged, or written to seed ledger details
- passwords are stored only as salted `scrypt` hashes
- repeated runs with the same configured password leave the stored hash unchanged
- changing the configured bootstrap password intentionally rotates the stored hash
- future seeds should be added as separate seed definitions under `packages/kamra-api-server/src/seeds/`
- `scripts/seed.ts` should stay a thin registry runner and should not own individual seed behavior

Temporary bootstrap note:

- the first manually chosen admin email and password may be used only to unblock the empty Stage 2 database
- the next user/authentication slice must revisit this credential, rotate it if needed, and decide how real admin bootstrap credentials are owned long term
- do not treat the initial local `.env.local` admin credential as a production-ready identity policy

How to add future seeds:

- create one focused seed module with its own env names, prompt questions, validation, and tests
- expose it as a `SeedDefinition`
- register it in `scripts/seed.ts`
- keep seed ledger details free of raw secrets and private data

When a new optional seed is added, also update `.env.example` so the required environment names are discoverable without reading source code.

## CI And Validation

The repository should evolve toward CI checks for:

- frontend build
- API or serverless build
- unit tests where available
- crawler smoke checks that do not abuse external sources
- linting or formatting once selected
- documentation consistency checks when useful

CI should not hide architectural drift. When validation only covers legacy code, docs should say so.

For the public reference goal, CI should eventually make the repo look trustworthy to an outside reviewer: clear build status, no secret leakage, and a small set of meaningful checks.

The intended future CI shape is concern-specific and staged, not one large opaque workflow. As the relevant code appears, prefer:

- frontend checks when frontend files change
- API or serverless checks when API files change
- contract regeneration and schema smoke checks when shared contracts or model-shaping code changes
- transformation or migration-ledger validation when processors or schema-evolution scripts change
- lightweight smoke checks on code-changing PRs once the corresponding runtime surfaces exist
- source-friendly scheduled crawler health checks on `main` once crawler paths exist

The current Angular/API slice uses one small read-only `App Checks` workflow. It should stay secret-free and limited to install, lint, typecheck, test, and build until a later plan explicitly adds deeper smoke or deployment validation.

Catalog contract changes use a separate `Catalog Smoke` workflow. It uses the GitHub `Smoke` environment and expects `MONGODB_URI`, `MONGODB_DB_NAME`, and optionally `MONGODB_DNS_SERVERS` to point at `kamra_smoke`. The workflow regenerates the catalog v1 JSON Schema artifact, checks that it was committed, runs focused catalog tests, and runs `npm run smoke:catalog` against the configured smoke database.

Dependency update automation and PR-branch writeback are followup items, not MVP roadmap requirements. Keep them in `.agents/plans/mvp-followups.md` until the app surface is stable enough to justify the extra workflow behavior.

Workflow files should mostly orchestrate scripts that can also be run locally. This keeps core logic easier to test, debug, and eventually move to other platforms if needed.

Any future workflow that writes back to a branch should be planned explicitly, with documented:

- GitHub token source and least-privilege permissions
- branch protection and PR update behavior
- exact commands allowed to modify files
- guardrails that limit writeback to safe mechanical fixes
- disable path if the workflow becomes noisy or surprising

## Roadmap And Followup Triage

The active MVP roadmap should stay focused on the smallest useful household grocery-planning product.

Use `.agents/plans/mvp-followups.md` for valuable but non-essential ideas, including richer navigation concepts, authentication upgrades, repository automation, crawler expansion beyond the first useful sources, advanced recommendations, and mobile/PWA extensions.

Followup entries should include:

- added value, scored from `1/5` to `5/5` for market gain and user likability
- effort, using `Low` or `High`
- complexity, using `Low`, `Med`, or `High`
- priority, using `Low`, `Med`, or `High`

Promote a followup into an implementation plan only when it directly supports the next MVP milestone, removes a current operational or security blocker, or the user explicitly accepts the scope tradeoff.

When a roadmap stage grows too large for one implementation session, split it into one-shot units by domain concern before implementation. Keep each unit small enough to validate and review independently, and move lower-value side work to followups.

## Deployment Direction

Frontend and API deployment should be URL-based through Vercel.

The `ftpcontent/` directory is reserved for small static files hosted with the custom domain root, such as a simple index page or image assets that point visitors toward the Vercel app runtime. Keep it static, tiny, and free of secrets or environment-specific generated output.

Ingestion should run through GitHub Actions schedules or manual dispatch.

MongoDB should remain the persisted data layer for MVP target data.

Current Stage 2 Atlas note:

- Atlas project: `Kamrapp`
- Atlas cluster: `KamrappCluster`
- Local/Vercel/GitHub access currently depends on a temporary Atlas IP access list entry allowing `0.0.0.0/0` for one week.
- This is acceptable as a short-lived Stage 2 bootstrap measure only because database credentials are stored as secrets and database users were reduced to read/write on the app database instead of broader admin access.
- This access model must be revisited before treating the deployment as stable. Later work should narrow the network exposure or change the runner/deployment model so the database is not left broadly reachable longer than necessary.
- Secret password inventories may live in a separate private repository so generated credentials do not need to be recreated on every restore or rotation, but that private store must never be referenced with concrete values in this repository.

The first admin-only login should use Vercel-managed credentials or secrets as the simplest bootstrap gate, while the authenticated admin identity should still exist in the database so authorization, auditing, and future role handling do not depend on env vars alone.

Even after EF Core removal, Kamra should retain a migration-ledger mechanism so document-shape changes and scripted backfills remain traceable.

Contract drift should be checked automatically where practical after shared contracts and schema-relevant code exist. Generated OpenAPI/JSON Schema artifacts are tracked as followup work until the API and model boundaries are stable enough to make them useful.

Demo environments should run against generated sample datasets built by workflows from real ingestion/transformation logic, not against the live internal dataset directly.

Whitelist cleanup and invitation or expiry emails are followup work. Until explicitly planned, no automatic whitelist expiry job or invitation email should run.

## Licensing And Public Use

Kamra uses `LICENSE.md` to make code available for review, learning, contribution, and reuse while preventing third parties from offering a hosted or managed copy of the application without permission.

Do not describe the project as permissively open source in user-facing or portfolio copy unless the license changes. Prefer:

- source-available
- public reference project
- open development repository

## Crawler Operations

Crawler work must follow `docs/crawler-policy.md`.

Operational defaults:

- review robots.txt and known source terms before enabling a source
- use conservative schedules and request volume
- keep crawlers outside API request handlers
- make each source easy to disable
- avoid authenticated, personal, paywalled, CAPTCHA-protected, or anti-bot-protected surfaces
- present price data as observed and timestamped, not guaranteed

Standardized processor jobs should also be planned alongside crawlers where needed, for example:

- duplicate or merge-candidate detection
- stale stock or outdated offer cleanup
- no-longer-available item handling
- snapshot-to-query backfills after schema changes

## Open Decisions

These should be resolved by explicit planning before implementation:

- exact serverless API framework
- Google account authentication details when promoted from followups
- feature flag mechanism for fuller whitelist registration when promoted from followups
- minimal user, household, membership, and admin role model
- MongoDB collection model
- free-tier quota limits and acceptable demo data volume
- which retailer or source should be the first enabled ingestion target after source-policy review and acquisition-method investigation
- license and public-use wording for the repository
- source review and crawler compliance checklist
