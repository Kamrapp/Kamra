# Plans

## Purpose

This folder stores proposed and approved implementation plans.

Implementation should start only after the relevant plan is approved by the user.

Use `.agents/plan-template.md` by default.

Plans may include a short research gate before approval when current standards, platform behavior, external services, or accepted best practices could materially change the implementation direction.

## Active Roadmap

Use `initial-mvp-roadmap.md` as the current staged direction.

Current final planning sequence:

- `2026-07-11-stage-8-coherent-household-mvp-plan.md` — Product Classification, Stock Targets/Batches, Shopping Needs, base content, and adjustable home workspace
- `2026-07-11-stage-9-concrete-shopping-catalogue-plan.md` — Shop Products/Price Observations, one-market Shopping Trips, Purchase Ingestion, and stock conversion
- `2026-07-11-stage-10-alpha-hardening-plan.md` — final terminology migration, verified Crawl Snapshot archive/reprocessing, targeted architecture hardening, and Alpha 1.0 readiness

Use `mvp-followups.md` for valuable ideas that should stay visible but should not bloat the first household/product MVP. Promote a followup into a plan only when it directly supports the next MVP milestone, removes a current blocker, or the user explicitly accepts the scope tradeoff.

Older bootstrap drafts are archived in `.agents/sessions/zero_init/`.

Prefer the active roadmap and the specific current plan over rediscovering older plans. Read completed or superseded plans only when their decisions are directly relevant.

Roadmap stages are allowed to be larger than one implementation session. Before implementation, split the active stage into commit-sized or one-shot agentic units and move lower-value side ideas to the followups list.

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
