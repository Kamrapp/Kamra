# Stage 3 Model Foundation

## Objective

Implement the first Stage 3 model foundation slice so Kamra has a lightweight, extensible shared product model, JSON-schema-capable contract artifacts, seedable sample data, database smoke validation, and a minimal admin-only product list path before crawler work begins.

Implementation status: completed in the current branch slice. Keep this plan as the historical approval record for the Stage 3 foundation work.

## Context Read

- `AGENTS.md`
- `.agents/plan-template.md`
- `.agents/coding-guidelines.md`
- `.agents/plans/mvp/initial-mvp-roadmap.md`
- `.agents/sessions/mvp/2026-06-23-roadmap-stage-3-redesign.md`
- `.agents/learnings/shared-contracts-and-migrations.md`
- `.agents/learnings/legacy-domain-model-notes.md`
- `docs/architecture.md`
- `docs/codebase-analysis.md`
- `docs/repo-concept.md`
- `docs/tech-ops.md`
- `docs/crawler-policy.md`
- `scripts/seed.ts`
- `packages/kamra-api-server/src/config/app-config.ts`
- `packages/kamra-api-server/src/db/mongo-client.ts`
- `packages/kamra-api-server/src/http/app-handler.ts`
- current seed and auth repository files under `packages/kamra-api-server/src/`

## Research Gate

Not needed for this slice.

The user asked for an optimistic but lightweight implementation that reuses current architecture and defers future richness instead of overengineering. We can safely start with a local TypeScript contract source of truth plus generated JSON Schema objects checked into the repo, without blocking on external crawler-source research or fuller standards work.

## User Requests

- Plan and execute the new Stage 3 model foundation.
- Reuse the old architecture from the docs where possible.
- Focus on what data must be stored for products, tag-like metadata, and stocks with prices and sizes later.
- Avoid raw binary/image storage; keep links instead to stay inside free MongoDB tier limits.
- Favor a lightweight, extensible model now and move future ideas to followups or future-architecture notes.
- Generate the model layer in TypeScript for app and API use.
- Add a JSON-schema possibility so workflow/agentic processing can use contract snapshots.
- Adjust roadmap/crawling notes to reflect the new design.
- Design a minimal smoke test and a seed that can feed basic working model data into the database in one easy manual run.
- Keep a session file updated after each code action because the session may be interrupted.

## User Decisions

- The canonical object name should be `product`.
- A stock is linked to a product and carries extra data like amount, expiry date, and location.
- Keep product tags as separate records and links for now rather than optimizing into a denormalized string array.
- Indexed fields should stay minimal for MVP.
- Seeded data does not need strong long-term distinction from future processed data, but processed records must track origin, such as `AldiCrawlerV3`.

## Current Reality

- The repo already has a shared TypeScript-capable server package in `packages/kamra-api-server/`.
- Seeding exists today only for the bootstrap admin user.
- MongoDB access, logging, and request handling are already centralized in the server package.
- There is no shared Stage 3 product model yet.
- The frontend currently has only home and health views.

## Intended Direction

- Add a shared model layer that is small enough for MVP but explicit about product, product-tag links, stock, source provenance, and processing metadata.
- Keep raw/source payload handling future-friendly by storing references and compact metadata, not bulky snapshots or binary fields in processed documents.
- Generate JSON Schema from TypeScript-authored contract definitions in repo code so later workflow jobs can validate payloads without importing Angular or route code.
- Add a seed and smoke path that prove the model in the real database before crawler work starts.
- Add the smallest admin-only list route and frontend view needed to inspect seeded products.

## Scope

- Shared TypeScript product-model contracts and helpers.
- JSON Schema artifact generation or checked-in schema objects for Stage 3 contracts.
- Mongo repositories/setup for Stage 3 seed and product query path.
- Migration-ledger contract and minimal repository/setup support.
- Database smoke validation path for Stage 3 collections and seed/query behavior.
- Seed definitions for a small grocery-focused sample dataset.
- Admin-only product list API route.
- Minimal frontend screen to view seeded products after login.
- Session note updates during implementation.

## Non-Goals

- Real crawler implementation.
- Scheduled workflows.
- Full raw snapshot persistence model for every source.
- Product merge tooling.
- Household CRUD beyond the minimum shared stock contract groundwork.
- Public/demo registration changes.
- Rich search, virtualization, or production-grade product moderation UI.

## Assumptions

- Stage 3 can use checked-in JSON Schema objects generated from local TypeScript definitions without introducing a separate package workspace.
- A simple admin-only product list is enough to validate the model in the running app.
- Seeded product data can be synthetic but Hungarian-grocery-shaped enough to exercise tags and categories.

## Open Questions

- None that block this slice. Exact future crawler raw-payload shape remains intentionally deferred.

## Side Suggestions

- If Stage 4 later needs higher raw payload fidelity, add a dedicated `raw_ingest_records` contract plus external-object-storage notes rather than expanding processed documents.
- If product tagging grows quickly, consider a later nightly denormalized search-signal field on products after manual tagging behavior becomes real.

## Steering Notes

- This plan intentionally keeps Stage 3 narrower than the full roadmap stage by focusing on the first end-to-end proof: contracts, schema, seed, smoke, query, and view.
- The user’s naming decisions removed the need for a deeper product-vs-item terminology debate in this slice.

## Implementation Steps

### Step 1

- Goal: Add shared Stage 3 contracts for products, tags, stocks, source provenance, and migration ledger, plus JSON Schema generation utilities and contract tests.
- Files likely affected:
  - `packages/kamra-api-server/src/`
  - possible generated schema file under `packages/kamra-api-server/src/contracts/`
- Validation:
  - `npm run test`
  - `npm run typecheck`
- Commit message idea:
  - `Add stage 3 shared product contracts`

### Step 2

- Goal: Add Mongo setup/repository code, a smoke validation path, and seed definitions for synthetic grocery data.
- Files likely affected:
  - `packages/kamra-api-server/src/db/`
  - `packages/kamra-api-server/src/seeds/`
  - `scripts/seed.ts`
  - possible new smoke script under `scripts/`
- Validation:
  - targeted tests
  - `npm run test`
  - `npm run typecheck`
- Commit message idea:
  - `Add stage 3 product seed and smoke validation`

### Step 3

- Goal: Expose an admin-only product list endpoint and a minimal frontend view for seeded product inspection.
- Files likely affected:
  - `packages/kamra-api-server/src/http/`
  - `api/`
  - `src/app/`
- Validation:
  - `npm run build`
  - `npm run test`
  - `npm run typecheck`
- Commit message idea:
  - `Add admin product list stage 3 view`

### Step 4

- Goal: Refresh roadmap/session/docs where the implemented Stage 3 slice adds concrete model decisions.
- Files likely affected:
  - `.agents/sessions/`
  - `.agents/plans/mvp/initial-mvp-roadmap.md`
  - optional docs touched only if the implementation reveals durable design details not already captured
- Validation:
  - `git diff --check`
- Commit message idea:
  - `Document stage 3 model foundation decisions`

## Validation Plan

- Run targeted Vitest coverage for new contract, seed, and handler modules.
- Run `npm run test`.
- Run `npm run typecheck`.
- Run `npm run build`.
- Run `git diff --check`.
- If environment is configured, run the new smoke script locally against the configured database.

## Risks

- Risk: Overbuilding the raw/source model before crawler needs are real.
  - Mitigation: keep processed/source-reference contracts compact and explicit; defer fuller raw payload contracts.
- Risk: Seed and smoke setup may imply stronger permanence than intended.
  - Mitigation: mark seed records with origin metadata and keep cleanup/reseed behavior explicit.
- Risk: Frontend work could sprawl into broader admin UX.
  - Mitigation: keep the UI to a simple authenticated inspection list.

## Approval Checkpoint

Implementation may proceed because the user explicitly asked to plan and execute this Stage 3 slice.
