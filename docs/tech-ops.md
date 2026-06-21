# Technology And Operations Direction

## Purpose

This document captures the intended low-cost operational model for Kamra.

It is a direction document, not proof that the current codebase already follows this model.

## Target Architecture Decision

Kamra is serverless-first for the MVP target.

The intended setup:

- Vercel for frontend hosting and stateless API routes
- MongoDB Atlas as the managed system of record
- GitHub Actions for scheduled or event-driven ingestion and transformation jobs
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

- whether the Angular frontend is retained, migrated, or replaced
- whether .NET code is retained for scripts, libraries, or removed from runtime serving
- how crawler logic maps into GitHub Actions
- how SQL Server entities map to MongoDB documents or are retired
- how API behavior maps to Vercel serverless routes
- how existing user/auth concepts map to Google sign-in, households, and admin access

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

## Deployment Direction

Frontend and API deployment should be URL-based through Vercel.

Ingestion should run through GitHub Actions schedules or manual dispatch.

MongoDB should remain the persisted data layer for MVP target data.

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

## Open Decisions

These should be resolved by explicit planning before implementation:

- final frontend framework
- exact serverless API framework
- authentication provider and Google account integration details
- email provider choice for invitation and expiry emails
- feature flag mechanism for whitelist registration
- minimal user, household, membership, and admin role model
- MongoDB collection model
- crawler execution language and packaging
- migration or retirement path for SQL Server code
- minimal first ingestion source
- free-tier quota limits and acceptable demo data volume
- public demo data policy
- license and public-use wording for the repository
- source review and crawler compliance checklist
