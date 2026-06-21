# Session State: Bootstrap Documentation

## Session

- Date: 2026-06-21
- Plan: `.agents/plans/initial-mvp-roadmap.md`
- Branch: current workspace branch
- Current objective: finalize the initial markdown system and prepare for legacy inventory.

## Completed

- Created `AGENTS.md` as the active agent entrypoint.
- Split durable repo knowledge into `docs/`.
- Kept agent behavior, plans, sessions, and learnings in `.agents/`.
- Archived initial `zero_*.md` notes under `.agents/sessions/zero_init/`.
- Added `docs/skill-candidates.md` from the local `D:\Code\awesome-agent-skills` index.
- Added the active staged roadmap in `.agents/plans/initial-mvp-roadmap.md`.
- Moved the earlier standardization draft into `.agents/sessions/zero_init/standardization-plan-draft.md`.
- Added Kamra MVP direction: admin-only first login, no public registration, MongoDB healthcheck, Vercel deployment, one simple crawler, admin product view, Google auth later, households, shopping list generation, expiry/buffer logic, crawler expansion.
- Reordered roadmap so demo-user whitelist comes after product processing, and Google auth is a final extension rather than a household/product MVP blocker.
- Clarified that deployment, auth, ingestion, and admin views are foundation work; the product MVP begins when users can create or join a household, manage products or household items, and receive low-stock or buy-before notices.
- Added Result-style expected failure handling and dependency-injected strategies to the core coding guardrails.
- Added free-tier demo/testing/portfolio constraints and source-available public-repo safety expectations.
- Added source-available licensing posture through `LICENSE.md`.
- Added `docs/crawler-policy.md` for source-friendly crawler review, runtime guardrails, and takedown behavior.
- Expanded product direction with household shortage notices, mobile shopping, route optimization, user price updates, barcode/expiry scanning, product discovery, and independent ad-free recommendations.

## Important Decisions

- `docs/` holds durable repository knowledge.
- `.agents/` holds agent workflow and working memory.
- Current roadmap is `.agents/plans/initial-mvp-roadmap.md`.
- Implementation should use the Fixer role by default.
- Planning is exploratory; implementation is commit-sized and conservative.
- Raw crawl/fetch snapshots must be preserved before processed product data.
- Product query data, price history, and raw snapshots should remain separate.
- MVP should remain viable on free tiers for demo and testing.
- The first product MVP should include household item tracking plus low-stock or buy-before notices, not only deployment and ingestion plumbing.
- Kamra should remain independent from seller sponsorship, ads, or paid placement unless the concept is explicitly revised.
- Generic agent practices should move toward global settings or reusable skills when they prove reusable across repositories.

## Validation

- Ran reference scans with `rg`.
- No application tests were run because changes were documentation-only.

## Open Questions

- First frontend/serverless framework: Next.js on Vercel, minimal Vercel app, or another choice?
- Temporary admin auth: Vercel env vars, MongoDB admin document, or auth provider from the start?
- Legacy handling: archive in place, move to a legacy folder, or leave untouched until the new MVP runs?
- First crawler source: Lidl, Aldi, SPAR, or a deliberately simpler stable source?
- Initial household model: multi-member from the start or single-user first with migration path?

## Next Step

Create and review a Stage 1 legacy inventory plan before touching application code.
