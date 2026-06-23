# Coding Guidelines

## Purpose

This document defines current coding expectations for Kamra.

It should evolve as the repository standardizes. Until then, prefer small, reversible changes and make current-vs-target architecture explicit.

## General Rules

- Read nearby code before editing.
- Follow existing style within the touched area unless the plan explicitly changes it.
- Keep diffs small and reviewable.
- Avoid unrelated cleanup.
- Prefer explicit names over clever abstractions.
- Prefer low-cognitive-load control flow over cleverness.
- Use guard clauses and early returns when they make invalid states or exit paths obvious.
- Prefer a Result pattern, explicit success/failure return type, or equivalent local convention for expected failures.
- Add comments only when they reduce real confusion.
- Do not commit secrets.
- Do not assume documentation reflects runtime behavior without checking code.
- When adding a script, workflow, package area, app area, or operational command, update nearby docs with what it does, how to run it, required environment, validation, and whether it writes or deletes data.

## Architecture Rules

- Keep ingestion, transformation, persistence, query, and optimization responsibilities separate.
- Do not run crawlers in user-facing request handlers.
- Follow `docs/crawler-policy.md` before adding or enabling crawler sources.
- Do not introduce persistent backend-server requirements without an approved architecture change.
- Treat serverless API routes as stateless.
- Treat ingestion and transformation as batch or event-driven work.
- Keep raw source data distinct from canonical product data.
- Document data-writing and destructive maintenance scripts before or alongside implementation. The docs must state whether the script is safe for local, smoke, or production use.
- Use feature flags for risky, operationally sensitive, or staged behavior such as emails, cron jobs, public access, and destructive maintenance.
- Keep feature-flagged code explicit: the disabled path should be easy to see, safe by default, and covered by validation when the risk is meaningful.
- Use dependency injection for swappable strategies where applicable, especially crawlers, parsers, normalizers, matchers, pricing logic, email providers, auth providers, and feature-flag providers.
- Avoid inventing strategy abstractions for trivial one-off logic.

## Code Guardrails

Favor guardrails that reduce cognitive load:

- guard clauses for invalid input, unauthorized access, disabled features, missing configuration, and unsupported states
- feature flags for behavior that must be staged, reversible, or disabled in demos
- explicit allowlists for controlled access
- small functions with clear preconditions
- simple error paths that fail closed for auth, data access, emails, and cron jobs
- Result-style returns for validation failures, authorization denial, not found outcomes, disabled features, parser misses, and other expected business outcomes

Use exceptions for unexpected failures and infrastructure faults, not for ordinary control flow. Expected failure paths should be visible in function signatures or local conventions so callers must handle them deliberately.

Avoid burying important conditions deep inside nested control flow. If a future reviewer must hold many conditions in their head, refactor toward clearer guardrails.

## Data Rules

- Preserve raw snapshots where practical.
- Make transformations deterministic.
- Store enough metadata to trace a canonical record back to source observations.
- Separate store-specific product names from canonical product identity.
- Record ambiguity instead of pretending uncertain product matches are exact.

## Existing .NET Code

Current .NET code may remain useful for:

- crawler logic
- domain model reference
- migration source material
- batch jobs
- tests or prototypes

Before extending it, check whether the work belongs in the target serverless model or in a temporary migration path.

## Existing Angular Code

The existing Angular frontend is runtime truth for current frontend code.

Before major UI work, decide whether Angular remains the target frontend for MVP.

## Tests And Validation

Prefer validation appropriate to the touched layer:

- build checks for project changes
- unit tests for deterministic transformation logic
- smoke tests for API behavior
- sample-data tests for identity resolution
- manual verification for UI behavior

Test volume should match risk.

General implementation should add tests mainly for:

- shared/common logic
- deterministic transformation behavior
- tricky edge cases
- integration points where a break would be expensive to diagnose

Avoid adding broad test scaffolding for simple code that will be directly reviewed and is unlikely to regress independently.

Fix work should review existing and newly added tests before changing code. Add or adjust tests when they expose the mistake, protect against recurrence, or document a fragile contract.

Snapshot-style tests are preferred when the output is stable and accidental changes should be noisy, for example:

- entity or document shapes
- DTO serialization
- canonical product mapping output
- generated configuration or workflow files
- deterministic parser or transformer output

Avoid snapshots for frequently changing UI details or outputs where legitimate churn would make every change noisy.

If validation cannot be run, record why and what risk remains.

## Review Expectations

Reviews should focus on:

- correctness
- architectural drift
- missing validation
- unsafe assumptions
- scope creep
- maintainability

Style comments are secondary unless they affect clarity or consistency.
