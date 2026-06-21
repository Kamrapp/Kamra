# Skill Candidates

## Purpose

This document lists potentially useful external skills for Kamra.

It is a candidate shortlist, not an installed-skill manifest. Skills must be reviewed before adoption because curated skill indexes are not security audits.

## Source Reviewed

Local fork:

- `D:\Code\awesome-agent-skills`

Upstream:

- `VoltAgent/awesome-agent-skills`

Observation:

- the local fork currently acts as a curated link index through `README.md`
- individual skill source code is not vendored in this repository
- future adoption should inspect the target skill repository before installation

## Selection Timing

Skill selection should happen after:

- repository concept is clear
- target architecture is clear
- technology and operations direction is clear

The shortlist should be revisited when major decisions change, such as retaining Angular versus moving to Next.js.

## Likely Useful Now

### Planning And Skill Creation

- [`openai/openai-docs`](https://officialskills.sh/openai/skills/openai-docs) - useful when creating or refining Codex/OpenAI-related workflows.
- [`openai/yeet`](https://officialskills.sh/openai/skills/yeet) - useful later for commit, push, and PR flow once the user wants that automated.
- [`openai/gh-fix-ci`](https://officialskills.sh/openai/skills/gh-fix-ci) - useful for debugging GitHub Actions checks.
- [`openai/gh-address-comments`](https://officialskills.sh/openai/skills/gh-address-comments) - useful once PR review comments become part of the workflow.
- [`anthropics/skill-creator`](https://officialskills.sh/anthropics/skills/skill-creator) or [`microsoft/skill-creator`](https://officialskills.sh/microsoft/skills/skill-creator) - useful reference for building Kamra-specific planner/executor skills.

### Browser, Crawling, And UI Verification

- [`openai/playwright`](https://officialskills.sh/openai/skills/playwright) - useful for browser automation, forms, scraping support, and local web verification.
- [`openai/playwright-interactive`](https://officialskills.sh/openai/skills/playwright-interactive) - useful for iterative UI debugging with persistent browser context.
- [`anthropics/webapp-testing`](https://officialskills.sh/anthropics/skills/webapp-testing) - useful for local web application testing with Playwright.
- [`testdino-hq/playwright-skill`](https://github.com/testdino-hq/playwright-skill) - candidate for deeper E2E testing patterns.

### Vercel And Next.js

- [`openai/vercel-deploy`](https://officialskills.sh/openai/skills/vercel-deploy) - useful when preview or production deployment is introduced.
- [`vercel-labs/next-best-practices`](https://officialskills.sh/vercel-labs/skills/next-best-practices) - useful if Kamra moves to Next.js.
- [`vercel-labs/next-cache-components`](https://officialskills.sh/vercel-labs/skills/next-cache-components) - useful if Next.js caching becomes central.
- [`vercel-labs/next-upgrade`](https://officialskills.sh/vercel-labs/skills/next-upgrade) - useful if a Next.js app later needs version upgrades.

### MongoDB

- [`mongodb/mongodb-mcp-setup`](https://officialskills.sh/mongodb/skills/mongodb-mcp-setup) - useful if MongoDB MCP access is adopted.
- [`mongodb/mongodb-connection`](https://officialskills.sh/mongodb/skills/mongodb-connection) - useful for serverless MongoDB client behavior.
- [`mongodb/mongodb-schema-design`](https://officialskills.sh/mongodb/skills/mongodb-schema-design) - useful for raw snapshots, canonical products, offers, and price history.
- [`mongodb/mongodb-query-optimizer`](https://officialskills.sh/mongodb/skills/mongodb-query-optimizer) - useful once query performance matters.
- [`mongodb/mongodb-natural-language-querying`](https://officialskills.sh/mongodb/skills/mongodb-natural-language-querying) - useful later for intent-query exploration.
- [`mongodb/mongodb-search-and-ai`](https://officialskills.sh/mongodb/skills/mongodb-search-and-ai) - useful later for richer product search and recommendations.

### Existing Codebase Support

- [`openai/aspnet-core`](https://officialskills.sh/openai/skills/aspnet-core) - useful while analyzing or migrating the current ASP.NET Core API.
- [`angular/angular-developer`](https://github.com/angular/skills) - useful if Angular is retained or upgraded.
- [`angular/angular-new-app`](https://github.com/angular/skills) - useful only if a new Angular app is intentionally created.

### Source Ingestion Candidates

- [`firecrawl/firecrawl-build`](https://officialskills.sh/firecrawl/skills/firecrawl-build) - candidate for scraping/extraction integrations.
- [`firecrawl/firecrawl-build-scrape`](https://officialskills.sh/firecrawl/skills/firecrawl-build-scrape) - candidate for single-page extraction.
- [`firecrawl/firecrawl-build-search`](https://officialskills.sh/firecrawl/skills/firecrawl-build-search) - candidate for source discovery.
- [`firecrawl/firecrawl-build-interact`](https://officialskills.sh/firecrawl/skills/firecrawl-build-interact) - candidate for multi-step source interactions.

These should be evaluated carefully against cost, source terms, and the existing Playwright crawler code before adoption.

### Security And Secrets

- [`openai/security-best-practices`](https://officialskills.sh/openai/skills/security-best-practices) - useful for code security review.
- [`openai/security-threat-model`](https://officialskills.sh/openai/skills/security-threat-model) - useful before exposing API routes or auth.
- [`trailofbits/differential-review`](https://officialskills.sh/trailofbits/skills/differential-review) - useful for security-focused diff review.
- [`wrsmith108/varlock-claude-skill`](https://github.com/wrsmith108/varlock-claude-skill) - candidate for safer environment-variable handling.

### Observability

- [`openai/sentry`](https://officialskills.sh/openai/skills/sentry) - useful if Sentry is adopted.
- [`getsentry/sentry-nextjs-sdk`](https://officialskills.sh/getsentry/skills/sentry-nextjs-sdk) - useful if Next.js and Sentry are chosen.
- [`getsentry/sentry-dotnet-sdk`](https://officialskills.sh/getsentry/skills/sentry-dotnet-sdk) - useful only if .NET runtime remains relevant.

## Deferred Or Conditional

- Next.js skills are deferred until frontend direction is decided.
- Angular skills are deferred until Angular retention is decided.
- Firecrawl skills are deferred until crawler strategy and source terms are reviewed.
- Sentry skills are deferred until observability is needed.
- PR automation skills are deferred until the user is comfortable moving from per-commit review toward PR-level review.

## Adoption Rules

Before adopting a skill:

1. inspect the source repository
2. read the skill instructions fully
3. check tool permissions and security implications
4. decide whether it belongs globally or project-locally
5. document why it is useful for Kamra
6. install or vendor only after user approval

For Codex project-local skills, use `.agents/skills/` if adoption becomes part of the repository.
