# Portability And Roadmap Doc Refresh Plan

## Objective

Refresh the repository planning and bootstrap documents so they more clearly protect Kamra from platform lock-in, keep hosted-platform logic thin and replaceable, and define a stronger future CI/CD frame without pretending those checks should exist before the relevant code exists.

## Context Read

- `AGENTS.md`
- `.agents/plan-template.md`
- `.agents/planning-workflow.md`
- `.agents/coding-guidelines.md`
- `.agents/plans/initial-mvp-roadmap.md`
- `.agents/plans/2026-06-21-stage-1-legacy-inventory-plan.md`
- `.agents/sessions/2026-06-21-bootstrap-docs.md`
- `docs/repo-bootstrap-standard.md`
- `docs/repo-concept.md`
- `docs/architecture.md`
- `docs/tech-ops.md`
- `docs/codebase-analysis.md`

## Discovery Questions

- Should Vercel and GitHub remain the working default examples while the docs explicitly frame them as replaceable adapters rather than core architectural dependencies?
- How much CI/CD detail belongs in the roadmap now versus deferred to the future implementation plans for the specific app and workflow slices?

## User Decisions

- Run one more planning-oriented session before starting roadmap implementation work.
- Revisit the concept and look for missed opportunities or drift away from a source-available hobby project posture.
- Keep code as platform-agnostic as practical so GitHub and Vercel stay replaceable.
- Keep workflow files minimal and move meaningful logic into separately runnable scripts so orchestration stays thin and core behavior becomes easier to test.
- Keep the frontend and serverless host surface locally runnable, simplistic, and minimally scoped rather than overly platform-shaped.
- Strengthen the future pipeline direction with concern-specific PR checks and regular crawler-health style validation, but only introduce tests and checks when the relevant codebase slices exist.
- Reflect this frame in `docs/repo-bootstrap-standard.md`, `AGENTS.md`, and `.agents/plans/initial-mvp-roadmap.md`.
- Add a cleaner roadmap header with a compact concept section and a progress-tracking table.

## Current Reality

- The current docs name Vercel and GitHub Actions as the intended hosting and orchestration defaults.
- The architecture and tech-ops docs already allow some workflow-runtime flexibility, but they still read as more platform-bound than the user now wants.
- The roadmap has stage descriptions and validation goals, but it does not yet track milestone progress in a compact table or explicitly call out expected drift/change logging near the top.
- The bootstrap standard covers planning and validation well, but it does not yet strongly codify the “thin platform adapter, core logic in scripts/modules” principle for future repositories.

## Intended Direction

- Preserve the working assumption that Vercel and GitHub are acceptable initial platforms for Kamra.
- Reframe them as thin delivery and orchestration adapters around portable app, script, and contract layers.
- Make the roadmap explicitly distinguish “future pipeline expectations” from “checks that should exist immediately.”
- Keep the docs aligned with a small, maintainable, source-available hobby-project posture rather than enterprise-style overbuilding.

## Scope

- update the reusable bootstrap standard with portability and thin-orchestrator guidance
- update Kamra repository guidance where the portability agenda should be explicit
- revise the MVP roadmap structure and milestone details to include:
- a short roadmap-specific concept section
- a simple milestone tracking table
- stage-level reminders to keep platform glue thin and testable
- future CI/CD and maintenance expectations added to the appropriate stages rather than as generic testing mandates
- adjust concept, architecture, or tech-ops wording only where needed to avoid contradictions with the refreshed roadmap direction

## Non-Goals

- implementing CI workflows, scripts, or tests
- changing application code
- finalizing a specific AWS migration plan
- replacing Vercel or GitHub as the current default direction
- turning the repo into a generic multi-platform framework

## Assumptions

- The user wants documentation changes in this session, but still wants the repo’s “plan before implementation” rule respected.
- Platform independence should mean clear separation and low coupling, not refusal to use convenient managed platforms.
- Roadmap stages may mention future validation and automation work if they are attached to the stage where the relevant code first appears.

## Open Questions

- Whether `docs/architecture.md` and `docs/tech-ops.md` should be revised in this same pass, or only if the roadmap and bootstrap updates would otherwise conflict with them.
- Whether automated dependency-update PRs should be documented as a roadmap item, a tech-ops direction note, or both.

## Side Suggestions

- Add a future reusable checklist or learning note for “thin workflow orchestration” once the first real CI workflow lands. This matters because it could become broadly reusable across repositories. It does not need to be created in this pass.
- Add a later plan dedicated to CI topology after the Stage 2 foundation exists. This matters because the meaningful checks depend on actual package and app boundaries. It should remain out of scope for this doc refresh.

## Steering Notes

- Earlier docs established the initial hosting direction well, but the new emphasis is to keep those choices operationally convenient rather than architecturally binding.
- The strongest adjustment is not “change platforms now,” but “write the docs so code structure and validation strategy remain portable later.”

## Implementation Steps

### Step 1

- Goal: strengthen the reusable bootstrap standard around portability, thin platform adapters, and phased validation
- Files likely affected: `docs/repo-bootstrap-standard.md`
- Validation: updated text stays repository-agnostic and does not prescribe Kamra-specific technologies
- Commit message idea: `docs: strengthen bootstrap portability guidance`

### Step 2

- Goal: align Kamra-specific guidance with the portability agenda and hobby-project posture
- Files likely affected: `AGENTS.md`, `docs/repo-concept.md`, `docs/architecture.md`, `docs/tech-ops.md`
- Validation: Kamra-specific docs still point to Vercel and GitHub as defaults where intended, but clearly frame them as replaceable adapters
- Commit message idea: `docs: align kamra guidance with portability goals`

### Step 3

- Goal: restructure and extend the MVP roadmap with a compact concept header, milestone tracking table, and stage-level pipeline additions
- Files likely affected: `.agents/plans/initial-mvp-roadmap.md`
- Validation: the roadmap remains readable, stages stay ordered, and new CI/CD notes are attached only where the relevant code first exists
- Commit message idea: `docs: refresh roadmap structure and delivery guardrails`

## Validation Plan

- reread each edited markdown file after changes
- check that platform-agnostic guidance in the bootstrap standard remains generic
- check that Kamra-specific docs do not contradict the refreshed roadmap direction
- confirm the roadmap table and stage details remain internally consistent

## Risks

- Overcorrecting into vague platform-agnostic wording and losing practical direction.
  Mitigation: keep Vercel and GitHub as explicit current defaults where that remains true.
- Adding CI aspirations too early and making the roadmap feel heavier than the project needs.
  Mitigation: attach automation only to stages where the relevant code exists and describe it as staged, meaningful validation.
- Introducing duplicate guidance across too many docs.
  Mitigation: keep the bootstrap standard generic, keep `AGENTS.md` brief, and place most roadmap-specific detail in the roadmap itself.

## Approval Checkpoint

Do not edit the bootstrap standard, Kamra guidance docs, or the roadmap until the user approves this plan.
