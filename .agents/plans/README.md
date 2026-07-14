# Plans

## Purpose

This folder stores proposed and approved implementation plans.

Implementation should start only after the relevant plan is approved by the user.

Use `.agents/plan-template.md` by default.

Plans should distinguish required current work from optional work, deliberate deferrals, and speculative exclusions. Thorough planning reduces uncertainty; it does not authorize speculative implementation.

Plans may include a short research gate before approval when current standards, platform behavior, external services, or accepted best practices could materially change the implementation direction.

## Active Roadmap

Use `phase-1-usability-completion-plan.md` as the current staged direction. Phase 1 closes the
household-to-catalogue usability loop through canonical terminology, household Product discovery,
high-throughput review, a Shopping-list-first shop session, receipt reconciliation and price
observations, and bounded crawl-data lifecycle management.

The MVP closed on 2026-07-14. Its roadmap, completed plans, closure plan, and followup inventory are
archived under `mvp/`. Completed MVP handoffs are under `.agents/sessions/mvp/`; older bootstrap
drafts remain under `.agents/sessions/zero_init/`.

Prefer the active roadmap and the specific current plan over rediscovering older plans. Read completed or superseded plans only when their decisions are directly relevant.

Roadmap stages are allowed to be larger than one implementation session. Before implementation, split the active stage into commit-sized or one-shot agentic units, implement the highest-value current path first, and move lower-value side ideas to the followups list.

## Naming

Suggested naming:

- `YYYY-MM-DD-topic-plan.md`
- `initial-mvp-roadmap.md`
- `stage-2-serverless-foundation-plan.md`
- `feature-product-search-plan.md`

## Status Markers

Each plan should make its status clear:

- Draft
- Approved
- In Progress
- Completed
- Superseded

If a session changes roadmap order, validation strategy, or platform posture, update the roadmap or mark that update as the next required planning step.
