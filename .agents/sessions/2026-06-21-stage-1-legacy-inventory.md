# Session State: Stage 1 Legacy Inventory

## Session

- Date: 2026-06-21
- Plan: `.agents/plans/2026-06-21-stage-1-legacy-inventory-plan.md`
- Branch: current workspace branch
- Current objective: finish Stage 1 legacy discovery and prepare the repo for a later legacy-branch split plus serverless rewrite planning.

## Completed

- Read the active repo guidance, roadmap, bootstrap session, and target-architecture docs.
- Inspected the legacy ASP.NET API, EF Core data model, Mongo-backed crawler infrastructure, fetcher bridge, Angular frontend, workflows, and solution files.
- Expanded `docs/codebase-analysis.md` with a fuller keep/reference/retire inventory and a first-pass target direction derived from the actual code.
- Added focused learnings for crawler pipeline patterns, domain-model extraction, and shared-contract plus migration-ledger direction.
- Updated architecture and tech-ops docs so they no longer imply that frontend retention, workflow runtime language, or migration tracking are still completely open-ended.
- Updated the MVP roadmap with Stage 1 outputs and clarified Stage 2/3 discovery questions around Angular retention, shared contracts, and post-EF migration tracking.
- Created a dedicated Stage 1 plan file for later implementation sessions to reference.

## Changed Files

- `.agents/plans/2026-06-21-stage-1-legacy-inventory-plan.md`
- `.agents/plans/initial-mvp-roadmap.md`
- `.agents/learnings/crawler-pipeline-patterns.md`
- `.agents/learnings/legacy-domain-model-notes.md`
- `.agents/learnings/shared-contracts-and-migrations.md`
- `.agents/sessions/2026-06-21-stage-1-legacy-inventory.md`
- `docs/codebase-analysis.md`
- `docs/architecture.md`
- `docs/tech-ops.md`

## Validation

- Ran: targeted file reads across backend, crawler, fetcher, frontend, workflows, and solution files
- Result: documentation updates are grounded in inspected runtime code and repository structure
- Not run: application builds or tests
- Reason: this session is documentation-only and the workspace currently remains on the legacy mixed-stack codebase
- Not run: `git status`
- Reason: repository ownership is marked as dubious for the sandbox user, so Git inspection would need a safe-directory override

## Decisions

- Decision: keep Angular as the working frontend assumption for future planning
- Reason: the current frontend is small but reusable, already has localization plumbing, and nothing discovered makes Angular a clear blocker yet

- Decision: treat Node.js and TypeScript as the future serverless backend baseline
- Reason: it aligns with the intended Vercel runtime and removes the need for the legacy ASP.NET and EF runtime

- Decision: preserve crawler architecture ideas but replace crawler registration with workflow-driven ingestion
- Reason: the selector/processor/pipeline patterns are valuable, but the old hosting and persistence shape is not

- Decision: preserve a migration-ledger concept after EF Core removal
- Reason: document-shape evolution still needs tracked, replayable migrations or backfills

## Open Issues

- Issue: the future shared-contract strategy is not yet designed in detail
- Impact: Stage 2 implementation could drift between frontend, API, and workflow models if this is not planned explicitly

- Issue: legacy `Stock` mixes store-offer and household-inventory concepts
- Impact: early MongoDB schema work could inherit a misleading model boundary

- Issue: compound-product modeling currently relies on a simple ratio field
- Impact: future household/product search capabilities may need richer composition semantics than the legacy model provides

## Next Step

Review the Stage 1 documentation changes, then create the legacy branch and follow with a dedicated Stage 2 plan for Angular-on-Vercel plus Node.js serverless foundation and shared-contract design.

## Notes For Future Agent

- The strongest legacy assets are the crawler adapter patterns, the flexible classification/property ideas, and the Angular auth/localization shell.
- The safest runtime pieces to retire are the ASP.NET API, EF/SQL stack, fetcher bridge, and backend-driven crawler registration.
- If the next session starts schema planning, read `.agents/learnings/legacy-domain-model-notes.md` and `.agents/learnings/shared-contracts-and-migrations.md` first.
