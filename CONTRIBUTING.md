# Contributing to Kamra

Kamra is developed through small, reviewable changes. Treat the current code as runtime truth and
the plans as the approved direction; record drift instead of silently widening scope.

## Before changing code

- Read the repository `AGENTS.md`, the active plan, and the nearest feature documentation.
- For meaningful behavior, schema, route, or architecture changes, add or update the relevant plan
  before implementation.
- Keep Product Group, Household Product, Stock Batch, Shopping Need, Shopping Trip, and Ingestion
  Submission ownership aligned with [the domain dictionary](./docs/domain-language.md).
- Database structural changes require a separate validator action and existing-data migration entry
  in the database maintenance registry.

## Implementation workflow

1. Inspect the owning slice and existing tests.
2. Define expected outcomes in focused tests before using current behavior as evidence, then implement
   one focused, reversible unit.
3. Add focused tests for changed behavior, persistence, validation, or authorization. Prefer
   logic/coordination specs when several UI blocks interact; use browser contracts only when browser
   wiring itself is the risk.
4. Run proportionate checks; for normal application changes use:

   ```bash
   npm test
   npm run format:check
   npm run lint -- --max-warnings=0
   npm run typecheck
   npm run build:web
   npm run build:api
   ```

5. Update the active session handoff and the owning phase/stage manual acceptance script when the
   change creates a new testable flow. Keep deterministic checks automated, and run the integrated
   manual pass at its approved acceptance gate rather than against an interaction scheduled for
   replacement.
6. Create a new commit that describes the unit. Keep unrelated cleanup out of the commit.

Do not amend, push, reset, checkout, force-update, or rewrite history as part of the normal agentic
workflow. A commit is not evidence that configured Mongo, archive, or browser checks passed; record
those separately.

## Boundaries

- Keep API entrypoints thin and reusable policy in `packages/kamra-api-server` domain services.
- Keep browser services responsible for transport and components responsible for presentation.
- Prefer explicit validation and Result-style expected failures over broad exception handling.
- Do not add secrets, private household exports, or uncontrolled public registration.
- Preserve raw ingestion evidence and never silently overwrite conflicts during import or repair.

## Pull requests

Describe the behavior, data impact, validation commands, and any configured/manual checks that remain.
Call out migrations, new indexes, compatibility paths, authorization changes, and known waivers. Keep
the PR focused enough that another reviewer can reproduce the changed flow.
