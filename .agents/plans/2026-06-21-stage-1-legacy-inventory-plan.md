# Stage 1 Legacy Inventory Plan

## Objective

Complete Stage 1 of the MVP roadmap by classifying the legacy repository, extracting durable architectural and domain knowledge, and documenting what should be kept, referenced, or retired before the legacy branch split.

## Context Read

- `AGENTS.md`
- `.agents/plans/initial-mvp-roadmap.md`
- `.agents/planning-workflow.md`
- `.agents/coding-guidelines.md`
- `.agents/sessions/2026-06-21-bootstrap-docs.md`
- `docs/repo-concept.md`
- `docs/architecture.md`
- `docs/tech-ops.md`
- `docs/crawler-policy.md`
- `docs/codebase-analysis.md`
- targeted legacy code in `KamraBE/`, `Common/`, `Crawler/`, `Fetcher/`, `kamra-fe/`, `.github/workflows/`, and solution files

## Discovery Questions

- Should Angular remain the frontend baseline for the MVP, or should it be revisited before Stage 2?
- Should shared frontend/server contracts be first-class TypeScript models, with generated artifacts for non-TypeScript jobs?
- Which legacy entity ideas are valuable enough to preserve even if the C# runtime and EF Core are removed?

## User Decisions

- Start a new session anchored to Stage 1 of the MVP roadmap.
- Treat the frontend login screen, crawler/fetcher architecture, and entity models as discovery inputs rather than default runtime choices.
- Treat legacy backend crawler registration as superseded by workflow-driven ingestion.
- Treat EF Core and the C# backend runtime as unnecessary for the near-term MVP.
- Prefer Node.js in general for future backend/serverless work.
- Keep Angular unless discovery shows it is a poor fit.
- Preserve useful ideas around value-list properties, tags, compound products, DTO mapping, localization, and migration tracking.

## Current Reality

- The repository still runs as a mixed prototype: Angular frontend, ASP.NET Core API, EF/SQL persistence, Mongo-backed crawler data, and a fetcher bridge between Mongo and the API.
- The best reusable technical assets are the crawler architecture, selector/processor patterns, and domain-model ideas in `Common/Models`.
- The existing workflows are repository automation workflows, not ingestion workflows.
- The frontend already has login/signup scaffolding plus localization plumbing, but it points to the legacy API.

## Intended Direction

- Preserve knowledge, not the old runtime.
- Use Node.js and TypeScript for future serverless API routes.
- Keep Angular as the working frontend assumption unless a later plan intentionally changes that.
- Replace legacy backend crawler registration with GitHub Actions-driven ingestion.
- Treat shared TypeScript contracts as the main source of truth for frontend and server models, while generating language-agnostic artifacts for workflow jobs when needed.
- Preserve a migration ledger concept even after removing EF Core.

## Scope

- inventory legacy backend, crawler, fetcher, common-model, workflow, solution, and frontend structures
- expand durable documentation with keep/reference/retire guidance
- capture crawler and domain-model learnings in focused notes
- record session state for the upcoming legacy-branch split and cleanup
- adjust roadmap or architecture docs where the discovery reveals drift

## Non-Goals

- application code migration
- deleting legacy code
- creating the legacy branch
- implementing the Node.js serverless foundation
- finalizing the future MongoDB schema

## Assumptions

- The legacy branch will be created after documentation review.
- The old .NET runtime will become reference material, not an active delivery target.
- Angular can still be deployed or retained without forcing a framework rewrite in Stage 2.

## Open Questions

- How much of the future shared contract should be literal shared TypeScript versus explicit API DTOs?
- Should workflow jobs consume generated JSON Schema, OpenAPI, or another artifact from the TypeScript contract package?
- How should compound products represent composition when `Ratio` is not expressive enough?
- Which early canonical product fields should exist from day one versus being added later through migration-ledger changes?

## Side Suggestions

- Add a dedicated future plan for shared contracts and migration-ledger design before Stage 2 implementation. This matters because it affects API, frontend, and workflow boundaries at once. It does not block Stage 1 documentation.
- Add a future data-model note for separating household items from store offers. This matters because `Stock` currently mixes those concerns and could cause early Mongo drift. It does not expand current scope.

## Steering Notes

- Initial bootstrap docs treated frontend-framework choice as open. After inspecting the current code and user guidance, the working assumption now favors retaining Angular unless evidence later contradicts that.
- Initial bootstrap docs mentioned GitHub Actions ingestion, but legacy discovery shows the crawler/pipeline concepts are richer than the earlier docs captured, so they need dedicated learning notes.
- Legacy discovery also showed a stronger case for a shared TypeScript contract layer plus generated workflow artifacts than the earlier docs stated.

## Implementation Steps

### Step 1

- Goal: inventory the current legacy structure and classify reusable versus obsolete areas
- Files likely affected: `docs/codebase-analysis.md`
- Validation: document references match inspected files and repository structure
- Commit message idea: `docs: expand stage 1 legacy codebase analysis`

### Step 2

- Goal: capture durable lessons for crawler architecture, domain modeling, and shared contracts
- Files likely affected: `.agents/learnings/*.md`, `docs/architecture.md`, `docs/tech-ops.md`
- Validation: new notes clearly distinguish concepts to preserve from legacy implementation details to retire
- Commit message idea: `docs: capture legacy extraction learnings`

### Step 3

- Goal: align roadmap and session state with Stage 1 discovery outcomes
- Files likely affected: `.agents/plans/initial-mvp-roadmap.md`, `.agents/sessions/*.md`
- Validation: roadmap assumptions no longer conflict with the documented direction
- Commit message idea: `docs: align roadmap and session with stage 1 findings`

## Validation Plan

- read updated markdown files directly after editing
- check that all referenced directories and concepts exist in the inspected code
- record any unvalidated runtime assumptions explicitly in the session file

## Risks

- Over-documenting speculative future architecture instead of sticking to evidence from the codebase.
  Mitigation: keep future notes framed as direction or assumptions, not settled implementation.
- Preserving too much of the legacy shape and accidentally biasing later implementation.
  Mitigation: separate “concept worth keeping” from “implementation safe to retire.”
- Missing a useful legacy concept before the legacy branch split.
  Mitigation: include explicit keep/reference/retire sections and session notes for future cleanup.

## Approval Checkpoint

This plan covers documentation and discovery only. Stage 2 or later implementation should not begin until the user approves the relevant plan.
