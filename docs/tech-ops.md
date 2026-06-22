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

Shared contract generation should prefer a TypeScript source of truth with both JSON Schema and OpenAPI artifacts when the maintenance cost stays low enough. Those generated artifacts should be produced in CI or PR workflows and referenced from repository docs.

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

The current database environment matrix is documented in [docs/database-environments.md](./database-environments.md). In short:

- `kamra_prod` is the main production database
- `kamra_test` is the preview/test database
- `kamra_dev` is the developer release-testing database
- `kamra_smoke` is the proofbuild smoke database

Keep the environment names, user names, and secret locations aligned with that matrix instead of inventing new one-off combinations in code or docs.

## Logging And Diagnostics

Kamra currently uses a lightweight split logging model documented in [docs/logging.md](./logging.md):

- server logs are timestamped and written to console plus rolling `logs/server-YYYY-MM-DD.log` files
- browser logs are timestamped in the browser, forwarded to `POST /api/log`, and mirrored to server console plus rolling `logs/browser-YYYY-MM-DD.log` files
- Vercel runtime logs should be treated as the hosted observability surface for server-side console output
- file logs are a local convenience and should remain free of secrets

Logging should stay structured enough to debug startup and connectivity issues without becoming a general-purpose telemetry system before the app needs one.

## Seeding

Stage 2 includes a small seed registry that can be run locally with:

```powershell
npm run seed
```

If local DNS refuses the MongoDB Atlas SRV lookup, set `MONGODB_DNS_SERVERS` in `.env.local` or in the shell before running the seed:

```powershell
$env:MONGODB_DNS_SERVERS='1.1.1.1,8.8.8.8'
npm run seed
```

The seed runner reads these shared database values from local environment files or platform secrets:

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `MONGODB_DNS_SERVERS` when a local DNS override is needed

Each seed owns its own optional env values. If all env values for an optional seed are present, that seed runs silently. If they are missing, `npm run seed` asks whether to run that seed and prompts for the missing values.

Current seed particles:

- `admin_user` creates or updates one bootstrap admin identity in the `users` collection and records each run in `seed_ledger`
- `admin_user` reads `SEED_ADMINUSER_USERNAME` and `SEED_ADMINUSER_PASSWORD`

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
- low-noise dependency update PR automation after package boundaries stabilize

Late-stage hygiene automation may also include narrowly scoped PR-branch writeback, such as a linter or formatter creating one additional commit on the open PR branch. This should be deferred until the relevant codebase slice is stable enough to justify it.

Workflow files should mostly orchestrate scripts that can also be run locally. This keeps core logic easier to test, debug, and eventually move to other platforms if needed.

Any workflow that writes back to a branch should be planned explicitly, with documented:

- GitHub token source and least-privilege permissions
- branch protection and PR update behavior
- exact commands allowed to modify files
- guardrails that limit writeback to safe mechanical fixes
- disable path if the workflow becomes noisy or surprising

## Deployment Direction

Frontend and API deployment should be URL-based through Vercel.

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

Contract drift should be checked automatically where practical. A useful early safeguard is to validate sample or fixture documents against the generated contract artifacts and run smoke queries against a representative seeded database shape in CI.

The preferred safeguard is both:

- generated contract artifacts should be regenerated and surfaced in PR workflows when schema-relevant code changes
- seeded snapshot-style database data should be validated through smoke queries against the current code

Demo environments should run against generated sample datasets built by workflows from real ingestion/transformation logic, not against the live internal dataset directly.

Whitelist cleanup may also run as a scheduled job, but only after the whitelist feature flag is enabled. Until then, no automatic whitelist expiry job or invitation email should run.

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
- Google account authentication details after the admin-only phase
- feature flag mechanism for whitelist registration
- minimal user, household, membership, and admin role model
- MongoDB collection model
- free-tier quota limits and acceptable demo data volume
- which retailer or source should be the first enabled ingestion target after source-policy review and acquisition-method investigation
- license and public-use wording for the repository
- source review and crawler compliance checklist
