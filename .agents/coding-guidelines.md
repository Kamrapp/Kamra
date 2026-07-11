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

## Feature Toggle Rules

- Routine feature enablement belongs in application storage and the admin dashboard, not environment variables. Environment configuration may still supply deployment secrets or a separately approved emergency infrastructure kill switch.
- Define flags in one typed code registry with purpose, owner, default value, storage-failure value, rollout scope, and removal condition.
- Evaluate flags through the injected feature-toggle service. Do not query flag collections from feature code or scatter raw flag-name strings through routes and components.
- Missing-record and storage-failure behavior must be explicit and tested. Access, external side effects, scheduled writes, maintenance, and destructive behavior fail closed.
- Global flags are the default. Add household, user, role, or percentage targeting only for an approved use case; do not prebuild a rollout platform.
- Cache only for a documented bounded TTL and maximum-stale window. Admin updates must invalidate the local cache, and hosted propagation delay must be visible to operators.
- Persist who changed a flag, the old/new values, time, revision, and a bounded reason for sensitive changes. Administrative audit must not depend only on ephemeral runtime logs.
- Use flags for staged or risky behavior, kill switches, controlled access, external side effects, and short migrations. Do not use them as permissions, schema versions, permanent configuration, user preferences, or substitutes for valid domain states.
- Every temporary flag needs a planned removal step. Remove its disabled branch, registry entry, admin control, tests, and stored record when the feature is stable.

## Application Logging Rules

- Emit stable structured events for meaningful domain actions and failures. Include an event name/version, classification, outcome, correlation or operation id, error code when relevant, and only the safe entity identifiers needed to diagnose the action.
- Distinguish debug diagnostics, normal informational domain events, recoverable warnings, actionable errors, and privileged audit changes. Do not turn every HTTP request or low-level successful write into an application event.
- The domain command owner should emit the canonical action event. Avoid duplicate logs from route, service, and repository layers for the same outcome.
- Log expected validation and authorization failures with stable reason/field codes, not rejected values or raw payloads.
- Never log passwords, tokens, credentials, raw request bodies, private notes, full emails, unrestricted URLs, or source payloads. Use centralized bounded serialization and redaction.
- Persist audit-relevant administrative changes, such as feature-toggle changes, maintenance actions, catalogue promotion/archive/merge decisions, membership ownership changes, and history reversals. Hosted console retention is not an audit ledger.
- Update `docs/logging.md` and representative tests whenever event shape, classification, redaction, transport, retention, or audit behavior changes.

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
