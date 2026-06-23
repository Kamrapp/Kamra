# Roadmap Stage 3 Redesign Session

## Session

- Date: 2026-06-23
- Plan: `.agents/plans/initial-mvp-roadmap.md`
- Branch: `dev/bg/products`
- Current objective: Redesign post-Stage-2 MVP roadmap so product model contracts, seeded data, validation, database smoke testing, and household-query proof come before crawling.

## Completed

- Item: Read root `AGENTS.md`, active roadmap, architecture, codebase analysis, crawler policy, database environments, followups, and session template.
- Item: Created this session note early for continuation safety.
- Item: Reworked Stage 3-8 roadmap order so product model foundation and seeded data come before crawler intake.
- Item: Moved controlled external alpha/demo access after household stock and shopping-list value.
- Item: Added four app concern modules to architecture and kept the richer floating module navigation as followup UI work.

## Changed Files

- Path: `.agents/sessions/2026-06-23-roadmap-stage-3-redesign.md`
- Path: `.agents/plans/initial-mvp-roadmap.md`
- Path: `.agents/plans/mvp-followups.md`
- Path: `docs/architecture.md`
- Path: `docs/repo-concept.md`
- Path: `docs/tech-ops.md`

## Validation

- Ran: `rg` consistency search for old stage/demo/crawler/navigation terms.
- Result: Found and cleaned one stale deferred-navigation phrase; older completed Stage 2 plan references remain historical.
- Ran: `git -c safe.directory=D:/Code/Kamra diff --check`.
- Result: Passed; Git reported only existing LF-to-CRLF working-copy warnings.
- Not run: Code tests.
- Reason: Documentation-only redesign.

## Decisions

- Decision: Stage 3 should be replanned around product model and seeded-data readiness before crawler work.
- Reason: Crawlers should write into stable-enough raw, processing, and query contracts so avoidable recrawling is minimized.
- Decision: Exact collection/type names are deferred to the Stage 3 plan.
- Reason: Naming product/item/element and stock-location concepts is hard to unwind later and should be decided with model context.
- Decision: Keep the four-corner floating module menu as a followup while documenting the four module boundaries now.
- Reason: The boundary matters before the polished navigation exists.

## Open Issues

- Issue: Stage 3 still needs a dedicated implementation plan before code changes.
- Impact: Roadmap approves direction only; implementation should not begin without the Stage 3 plan.

## Roadmap Or Plan Updates

- Needed: Update `.agents/plans/initial-mvp-roadmap.md`, `.agents/plans/mvp-followups.md`, `docs/architecture.md`, `docs/repo-concept.md`, and `docs/tech-ops.md`.
- Status: Complete; this session is intended to be committed with the roadmap redesign.

## Next Step

Begin the Stage 3 product-model foundation plan.

## Notes For Future Agent

The user explicitly approved committing the documentation redesign if it completed cleanly. If Stage 3 implementation starts later, begin with research/model planning rather than crawler code.
