# Standardization Plan

Status: Superseded by `.agents/plans/mvp/initial-mvp-roadmap.md`.

This file is the first draft created during bootstrap. Keep it as historical planning context, but use the newer roadmap for active next steps.

---

Status: Draft

## Objective

Establish a controlled path from the current Kamra codebase to a cleaner serverless-first MVP foundation without losing useful existing crawler, domain, and frontend work.

This plan is documentation and preparation only until approved.

## Context Read

- `docs/repo-bootstrap-standard.md`
- `AGENTS.md`
- `docs/repo-concept.md`
- `docs/tech-ops.md`
- `.agents/coding-guidelines.md`
- `docs/codebase-analysis.md`
- `docs/architecture.md`
- `docs/skill-candidates.md`
- existing .NET API, EF data access, Mongo connector, crawler, and Angular frontend files sampled during bootstrap

## Current Reality

The repository currently contains:

- ASP.NET Core API with controllers and JWT setup
- Entity Framework SQL Server data access and migrations
- shared domain entities for elements, shops, stock, tags, and users
- MongoDB connector and record repositories
- Playwright-based crawler infrastructure
- Lidl and Aldi crawler samples
- Angular 14 frontend
- existing GitHub workflow files

The target direction is:

- Vercel-hosted frontend and stateless API routes
- MongoDB Atlas as MVP system of record
- GitHub Actions for ingestion and transformation
- Google account sign-in, household-focused user workflows, and admin product review as expected MVP concerns
- deterministic raw snapshot to canonical product transformation
- user-reviewed plans and commits

## Non-Goals

This plan does not:

- implement features
- delete legacy code
- choose final frontend framework
- migrate data
- rewrite crawlers
- replace the API
- create production workflows

## Assumptions

- The existing crawler work may be reusable.
- The existing SQL Server model is useful reference material but probably not the MVP persistence target.
- The first MVP should prove one ingestion-to-query path before broad feature work.
- Google account auth, household data boundaries, and admin visibility should be planned before the first user-facing implementation slice.
- User review remains required for every commit initially.

## Open Questions

- Should the Angular frontend remain for MVP, or should the frontend be rebuilt for Vercel ergonomics?
- Should crawler and transformation jobs stay in .NET, move to TypeScript, or be decided per source?
- Which store should be the first MVP source: Lidl, Aldi, SPAR, or another?
- Should legacy SQL Server code be preserved in place during MVP work, moved to an archive area, or gradually removed?
- What is the minimum useful shopping-list optimization for the first public hobby MVP?
- Should Google sign-in be Google-only for MVP, Google plus email/password, or initially admin-only while ingestion is built?
- Should households support multiple members in MVP, or start as one household per user?
- Should the admin dashboard show only crawled products, ingestion runs/errors, or a moderation workflow for product normalization?
- Which skill candidates should be reviewed first, and should any become project-local skills under `.agents/skills/`?

## Proposed Steps

### Step 1: Documentation Baseline Review

Goal:

- Review and revise the initial markdown set created during bootstrap.

Files likely affected:

- `AGENTS.md`
- `.agents/*.md`
- `docs/architecture.md`
- `docs/repo-bootstrap-standard.md`
- `docs/skill-candidates.md`

Validation:

- all references resolve
- docs distinguish current code from target architecture
- user confirms the workflow matches the desired collaboration style

Commit message idea:

- `docs: add agent collaboration baseline`

### Step 2: Skill Candidate Review

Goal:

- Review `docs/skill-candidates.md` after the concept, architecture, and tech/ops docs are accepted.

Files likely affected:

- `docs/skill-candidates.md`
- `.agents/learnings/skills.md`
- future `.agents/skills/` files if the user approves project-local skills

Validation:

- each retained candidate has a clear reason
- deferred candidates are explicitly marked
- no external skill is installed or trusted without review

Commit message idea:

- `docs: shortlist agent skills for kamra`

### Step 3: Existing Code Inventory

Goal:

- Expand `docs/codebase-analysis.md` into a fuller inventory of projects, responsibilities, dependencies, and likely reuse value.

Files likely affected:

- `docs/codebase-analysis.md`

Validation:

- each top-level project has an identified role
- current persistence and crawler flows are documented
- no code changes

Commit message idea:

- `docs: document current codebase responsibilities`

### Step 4: Target MVP Slice Definition

Goal:

- Define the smallest end-to-end MVP slice that proves the new architecture.

Likely slice:

- one store ingestion job
- raw snapshot storage
- transformation to canonical product records
- Google account sign-in decision captured
- basic household data boundary captured
- admin product visibility decision captured
- simple product query endpoint
- minimal frontend view

Files likely affected:

- `docs/repo-concept.md`
- `docs/architecture.md`
- `.agents/plans/mvp-slice-plan.md`

Validation:

- scope has explicit non-goals
- data lifecycle is testable with sample data
- user approves the first source and output

Commit message idea:

- `docs: define first mvp architecture slice`

### Step 5: Persistence Decision

Goal:

- Decide how MongoDB collections should represent raw snapshots, canonical products, store products, offers, and price history.

Files likely affected:

- `docs/architecture.md`
- `docs/tech-ops.md`
- `.agents/learnings/identity-resolution.md`

Validation:

- raw and canonical data are separate
- source traceability is preserved
- uncertain matches can be represented

Commit message idea:

- `docs: specify mvp data model direction`

### Step 6: Crawler Execution Decision

Goal:

- Decide how existing crawler code maps into GitHub Actions ingestion.

Files likely affected:

- `docs/tech-ops.md`
- `docs/codebase-analysis.md`
- future workflow plan

Validation:

- crawler runtime dependencies are identified
- scheduled and manual dispatch requirements are described
- external-source etiquette and rate limits are considered

Commit message idea:

- `docs: plan crawler execution model`

### Step 7: Frontend Direction Decision

Goal:

- Decide whether to retain Angular 14, upgrade it, or replace it before MVP implementation.

Files likely affected:

- `docs/tech-ops.md`
- `docs/codebase-analysis.md`
- future frontend plan

Validation:

- decision includes cost, deployment fit, migration effort, and user value
- no UI implementation yet

Commit message idea:

- `docs: record frontend mvp direction`

### Step 8: First Implementation Plan

Goal:

- Create the first approved implementation plan after decisions above are reviewed.

Likely plan:

- ingestion and raw snapshot prototype for one store using the target execution model

Files likely affected:

- `.agents/plans/first-ingestion-slice-plan.md`

Validation:

- commit split is clear
- implementation files are identified
- tests or sample-data checks are defined
- user approval checkpoint is present

Commit message idea:

- `docs: plan first ingestion slice`

## Risk Register

### Legacy Backend Gravity

Risk:

- Extending the ASP.NET Core API may feel fastest but could pull the project away from the serverless target.

Mitigation:

- require plans to state whether changes are legacy maintenance, migration support, or target architecture work.

### Persistence Confusion

Risk:

- SQL Server entities and MongoDB records may represent overlapping concepts differently.

Mitigation:

- document current models before migration decisions and keep raw, store-specific, and canonical records distinct.

### Crawler Fragility

Risk:

- Store pages can change and crawling can become brittle.

Mitigation:

- isolate per-store adapters, store raw snapshots, and keep transformations deterministic.

### Overlarge MVP

Risk:

- Inventory, OCR, route optimization, and enrichment workflows could make the first MVP too broad.

Mitigation:

- define the first slice around one store and one useful query path.

## Approval Checkpoint

This plan is not approved for implementation yet.

Recommended next action:

- user reviews the initial markdown set
- user answers the open decisions that affect architecture
- user reviews the skill candidate shortlist
- planner revises this plan before any code standardization starts
