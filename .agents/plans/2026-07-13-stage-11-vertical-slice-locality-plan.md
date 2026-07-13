# Stage 11 Vertical-Slice Locality And Integration Contracts

Status: Implementation in progress. This is the single technical and manual wrap-up stage
for the MVP: it absorbs the remaining Stage 8–10 evidence, suspected UI/data-integrity checks,
and narrowly scoped fixes while preserving the Stage 10 release gate. Implementation must remain
commit-sized and must not reopen the Stage 8–10 domain model without a concrete finding.

## Objective

Make the most obvious Kamra capabilities easier to locate, change, and validate as vertical
slices. A future engineer should be able to start from a capability directory and find its
contracts, domain policy, persistence adapter, HTTP adapter, UI adapter, and integration tests
without searching the entire repository for every related symbol.

The stage also adds a real integration-test layer. Unit tests remain valuable for pure rules and
repositories; integration tests must exercise seams where a change can appear valid in isolation
but fail globally, such as:

- a feature flag being registered in one layer but rejected by a schema or route validator;
- an admin flag change not reaching the household workspace response;
- a household command persisting data that the grouped read model cannot return;
- a shopping-trip completion creating stock without its ingestion submission or retry boundary;
- an ingestion processing change not reaching the review/catalogue boundary.

Stage 11 also replaces fragmented manual verification. Operators should not run separate Stage 8,
Stage 9, and Stage 10 acceptance sessions after this plan is approved. The final live runbook is
`scripts/stage11-mvp-manual-test.md`; it combines the existing Stage 8 demo script, the Stage 8–10
acceptance checklist, and the cross-layer checks introduced here. The operator may add notes and
discoveries directly to that file. A later fixer session diffs those notes, implements the owned
changes, updates the runbook, and reruns only the affected sections before the final full pass.

## Cross-stage closure ownership

Stage 11 owns the final pass over all user-visible and operator-visible concerns that were left
open by Stage 8–10:

- Product Group → Household Product → Stock Batch CRUD, hierarchy, target derivation, expiry
  policy, ordering, history, stale revisions, unassigned products, and Product-owned stock;
- Home layout behavior: panel collapse/growth, fixed and aligned columns, detail/edit/discard
  actions, right-side editor synchronization, dark/light themes, compact labels, responsive
  layout, focus/keyboard labels, loading/empty/error/403/404/409/500 states, and activity logs;
- household settings, feature-flag persistence/effect, group-target shopping modes, generated
  Product/Group/impulse lines, duplicate impulse prevention, selection/build/generate/cancel flows,
  and final application into Products and Batches;
- Shopping Trip market selection, matching/price explanations, no-price/stale/incompatible cases,
  overrides, skip/resume, actual purchase results, existing/new Product choice, unplanned purchase,
  idempotent retry, stale revision, transaction rollback, and pending Ingestion Submissions;
- admin market/Product/Price Observation and Ingestion Submission workflows, authorization,
  localized success/failure feedback, revision conflicts, and history preservation;
- developer-admin flags, maintenance/validator-vs-migration actions, audit/redaction/effective
  database diagnostics, archive checksum/export/import/repair/reprocessing, and realistic-volume
  behavior.

The old `scripts/stage8-demo-manual-test.md` and `.agents/plans/stage8-10-manual-acceptance-checklist.md`
remain useful historical inventories while Stage 11 is being implemented. At wrap-up, the new
Stage 11 runbook supersedes them as the only operator checklist; the older files should link to it
rather than invite a second independent test session.

## Why this stage is needed now

The current runtime already has several good domain directories:

- `packages/kamra-api-server/src/catalog/`
- `packages/kamra-api-server/src/household/`
- `packages/kamra-api-server/src/ingestion/`
- `packages/kamra-api-server/src/feature-toggles/`
- `src/app/household/`, `src/app/site-admin/`, and `src/app/dev-admin/`

The main remaining locality problems are bounded and observable:

1. `packages/kamra-api-server/src/http/routes/` is a central mixed-feature directory and
   `app-handler.ts` manually assembles a long route list.
2. Stage 9 shopping contracts, matching, repositories, and routes are household-facing but form
   a distinct shopping vertical; their ownership is not obvious from the current paths.
3. The server feature-flag registry is dynamic for API evaluation, while the developer-admin
   frontend still hardcodes individual flag keys, signals, labels, and save actions.
4. `app-handler.test.ts` covers many route seams, but there is no named integration harness and
   no focused cross-layer test command.
5. Mongo fake tests do not enforce collection validators, so schema drift can remain invisible
   until a configured database smoke or manual operation.

## Architectural decisions

### Vertical slices are ownership boundaries, not a new framework

Each capability should converge on this shape where it is useful:

```text
<capability>/
  contracts/       public/request/response and persistence boundary types
  domain/          pure rules and command policy
  persistence/     Mongo adapters and collection setup
  http/            thin authenticated route adapters
  ui/              Angular components/services for that capability
  integration/     cross-layer tests for the capability
```

The existing `v1`/`v2`, `current`, `sources`, `processing`, and `repair` directories remain valid
when they express a real compatibility or lifecycle boundary. Do not flatten them merely to make
the tree look uniform.

### The feature-flag registry remains the source of definitions

Feature flags must not be discovered solely from MongoDB: the database stores overrides and audit
history, while safe defaults, ownership, lifecycle/removal conditions, scope, and admin-display
metadata require checked-in code. `featureFlagDefinitions` becomes the single registration point.

From that registry, derive or validate:

- the TypeScript key union;
- request validation and collection-schema enums;
- admin API rows and safe display metadata;
- frontend control metadata and translation keys;
- parity tests that fail when a new flag is registered but not consumable.

Flags with extra workflows, such as controlled alpha access and alpha-user creation, may keep a
specialized workflow card. The flag row itself must still come from the registry; specialized UI
behavior is metadata-driven rather than another hardcoded allowlist.

### Integration tests use two explicit environments

1. **Deterministic local integration tests:** use the existing fake Mongo and app handler through a
   small reusable harness. These run in normal PR checks and verify cross-layer request/response
   contracts without secrets or a network database.
2. **Configured disposable integration smoke:** use a narrowly triggered workflow with the existing
   `Smoke` environment and explicit database configuration. It verifies Mongo validators,
   indexes, maintenance setup, transaction behavior, and cleanup. It must not run for unrelated
   docs-only or isolated frontend changes and must never target a developer database implicitly.

The fake database must not pretend to enforce Mongo validators. Where validator behavior matters,
the local test should assert the requested schema/maintenance contract and the configured smoke
must exercise the real validator.

## Ordered implementation steps

Every step ends with focused tests, format/lint/typecheck/build checks proportional to its risk,
an updated Stage 11 session handoff, and one additional commit. No amend, push, reset, or broad
history rewrite is part of this stage.

### Step 11.1 — Boundary inventory and ownership map

Status: Complete in `196c83d`.

- Add a concise `docs/vertical-slice-map.md` mapping capability → backend owner paths, route
  adapters, frontend owner paths, persistence collections, and integration-test entrypoints.
- Record current transitional boundaries rather than pretending the map is already ideal.
- Add a small README or ownership note only where a directory would otherwise be ambiguous.

Acceptance: a reviewer can identify the owning paths for Household, Shopping, Catalogue, Ingestion,
Feature Flags, Site Admin, and Developer Admin without repository-wide search. No runtime behavior
changes.

Commit: `docs: map Stage 11 vertical slice boundaries`

### Step 11.2 — Reusable integration harness

Status: Complete in the current Stage 11 implementation commit.

- Add `packages/kamra-api-server/src/test-support/integration/` with a request helper that builds
  authenticated app requests against a named fake database and keeps user/role/household fixtures
  explicit.
- Keep fake Mongo behavior honest; capture requested collection validators/index setup where that
  helps contract assertions, but do not implement a second Mongo engine.
- Add `npm run test:integration` using a dedicated Vitest configuration or include pattern so the
  test class is visible in local output and can be selected independently from unit tests.
- Document the difference between unit, local integration, configured smoke, and browser tests.

Acceptance: one representative admin and one representative household request run through the
real app handler, route authentication, repository factory, and fake persistence using the harness.

Commit: `test: add vertical slice integration harness`

### Step 11.3 — First cross-layer integration contracts

Status: In progress; the feature-flag → household-workspace, Product Group → Product → Batch,
partial shopping-trip completion, and raw-ingestion → review-candidate contracts are complete in
separate Step 11.3 commits.

Add small, high-signal scenarios rather than duplicating every unit test:

- Feature flag GET/PATCH → registry validation → stored override → household workspace response.
- Product Group/Product/Batch write → grouped workspace read model, including schema/setup
  initialization and one authorization failure.
- Shopping Need/Trip completion → Product-owned Batch + Ingestion Submission, with idempotent
  retry.
- Ingestion raw/review boundary → processed review item/catalogue candidate shape, using sanitized
  fixtures and no real private data.

Each scenario should assert the externally meaningful response and the important persisted side
effects. Put one scenario in each capability’s integration directory or use a clearly named
cross-capability suite when the seam is the subject.

Acceptance: deleting or bypassing one required route/repository/schema registration causes an
integration test to fail; tests do not merely reassert a pure function’s return value.

Commit per independent contract: `test: cover <capability> integration boundary`

### Step 11.4 — Registry-driven feature-flag metadata

Status: Complete in the current Step 11.4 implementation commit; frontend iteration remains Step
11.5.

- Extend the checked-in registry with stable admin-display metadata: translation keys, grouping,
  control kind, and whether a specialized workflow is attached. Keep operational removal notes in
  code/docs but do not expose unnecessary internal detail to ordinary users.
- Derive the accepted key list and schema enum from the registry or add a generated/parity guard
  that makes drift impossible to miss.
- Return safe metadata with the admin flag response, while keeping stored overrides and audit rows
  unchanged.
- Add integration coverage for a registry key through GET, PATCH, persistence, and a dependent
  household response.

Acceptance: adding a registered boolean flag requires no second hardcoded frontend key list; an
unknown key is rejected; a missing translation or schema registration fails a check; existing flag
defaults and audit behavior remain unchanged.

Commit: `refactor: centralize feature flag metadata`

### Step 11.5 — Generic developer-admin flag presentation

Status: Complete in the current Step 11.5 implementation commit.

- Replace the current key-specific flag signals and repeated controls with a registry/API-driven
  list of flag view models.
- Render ordinary boolean controls with an iteration; retain a separate alpha-access workflow
  only because it includes user creation, but have its flag row come from the same metadata.
- Keep save behavior explicit and revision-safe; show translated label/description, current value,
  loading, success, and failure states.
- Add a browser-resource/component-level contract test for rendering metadata and keep the server
  integration test as the source of API truth.

Acceptance: a newly registered ordinary flag appears in the admin list after its metadata and
translation are added, without another key-specific component binding. Existing alpha-access and
compact-label behavior remains unchanged.

Commit: `refactor: render feature flags from registry metadata`

### Step 11.6 — Route and adapter locality

- Group HTTP route modules behind capability index files, for example `http/routes/access`,
  `admin`, `catalog`, `household`, `ingestion`, and `observability`.
- Keep `app-handler.ts` as a small dispatcher that imports route bundles rather than knowing every
  route file. Route moves must not move domain policy into HTTP adapters.
- Start with mechanical moves of the most obvious complete route files; preserve compatibility
  exports when tests or external scripts need them.
- Do not move every `household/v2` file in one commit. If a shopping slice move is justified,
  move contracts/domain/persistence together and prove imports with integration tests.

Acceptance: route ownership is visible from paths, the dispatcher remains small, all route
contracts and authorization tests pass, and no public URL or collection name changes.

Commit per bundle: `refactor: group <capability> route adapters`

### Step 11.7 — Frontend capability locality

- Group only obvious future-change clusters, starting with Developer Admin feature flags and the
  Stage 9 admin market/pricing/review surface. Keep shared shell, localization, logging, and theme
  services in `src/app/shared`.
- Move files mechanically with import updates; do not redesign Home or introduce a new frontend
  framework.
- Add a short module README only when the new directory needs an owner/validation explanation.

Acceptance: a future flag or pricing-review change has a bounded frontend path, lazy route imports
still work, localization parity remains green, and the web build is unchanged in behavior.

Commit per cluster: `refactor: localize <capability> frontend module`

### Step 11.8 — CI selection and documentation closeout

- Add local integration tests to the normal app check once they are deterministic and fast.
- Add a narrowly path-filtered configured integration workflow only for API/domain/schema/maintenance
  changes; reuse the existing `Smoke` environment and cleanup conventions.
- Update `docs/architecture.md`, `docs/vertical-slice-map.md`, `scripts/README.md`, the roadmap,
  and the Stage 11 session handoff with commands and stop conditions.
- Record any compatibility adapter that remains and its removal evidence; do not delete legacy
  collections or route writes merely because a new directory exists.

Acceptance: contributors can choose the smallest relevant test command, PR checks provide signal
for cross-layer changes, and no workflow silently requires private configuration for ordinary code
checks.

Commit: `docs: document Stage 11 integration workflow`

### Step 11.9 — Complete the single Stage 8–11 manual runbook

- Create and maintain `scripts/stage11-mvp-manual-test.md` as a live operator document. It must
  include preparation/safety, two-user setup, seeded household coverage, Home CRUD and layout,
  settings/flags, shopping-list generation/application, Shopping Trips, admin review/pricing,
  ingestion/archive/maintenance operations, automated commands, and final evidence/waiver rules.
- Carry forward every still-open item from the old Stage 8 demo script and Stage 8–10 checklist,
  but remove duplicate instructions and explicitly name the expected result for each action.
- Add an `Operator notes and discoveries` area under every major section. The operator may edit
  unchecked items, add reproduction details, browser/environment information, and screenshots or
  file references, but must not add credentials or private data.
- Add a short `Known risk probes` section for likely regressions: inline/right-editor desynchrony,
  expired-batch inclusion, group/product total double-counting, duplicate impulse lines, stale
  revision handling, missing schema/maintenance setup, untranslated labels, dark-mode contrast,
  fixed-column overflow, and silent failed actions.

Acceptance: the runbook is the only planned future operator walkthrough for Stage 8–11; every
previous unchecked checklist item maps to one runbook section or has an explicit waiver owner.

Commit: `docs: add Stage 8-11 MVP manual runbook`

### Step 11.10 — Execute the integrated manual pass and fix findings

Run the runbook as one continuous session after implementation slices are complete. Do not mark a
section green from an automated test alone. For each failure or discovery:

1. Add the exact observed behavior, expected behavior, account/locale/theme/viewport, and a safe
   reproduction to the live runbook.
2. Classify it as a Stage 8 household bug, Stage 9 shopping/admin bug, Stage 10 operational bug,
   Stage 11 locality/integration bug, or an explicit post-MVP deferral.
3. Implement one narrow fix, add a focused regression/integration test where appropriate, update
   the runbook expectation, and commit it separately.
4. Rerun the affected section, then repeat the full runbook after the last behavior-changing fix.

The final pass must include both light and dark themes, narrow and desktop widths, a normal member
and an admin, and a disposable/configured database for any validator, transaction, archive, repair,
or maintenance action. A visual issue may remain open only if it is explicitly classified as a
bounded post-MVP polish item.

Acceptance: no open correctness, authorization, persistence, transaction, history, or silent-error
finding lacks an owning commit or a named waiver. The runbook records actual evidence, not planned
claims.

Commit per finding: `fix: close MVP manual finding <short-scope>`

### Step 11.11 — Final cross-stage reconciliation

- Diff the operator-edited runbook and review every note/discovery since the previous implementation
  commit; do not overwrite operator notes while updating expected results.
- Run the complete automated suite, deterministic integration suite, configured smokes/maintenance
  actions, and the final browser walkthrough from the same final commit.
- Update `docs/alpha-release-checklist.md`, `docs/vertical-slice-map.md`, the roadmap, and the
  Stage 11 session handoff with evidence, waivers, known limitations, and the final commit.
- Change the old Stage 8 script and Stage 8–10 checklist headers to point to the Stage 11 runbook
  as the single source of truth. Retain their historical content unless a separate cleanup is
  explicitly approved.
- Only then move MVP Closure from planned validation into a completed/waived release decision.

Acceptance: a new operator can run one document for the complete Stage 8–11 MVP journey, and a new
developer can identify the owning code/test paths without reconstructing prior session history.

Commit: `docs: close Stage 11 MVP evidence`

## Schema, migration, and compatibility guardrails

- File moves alone need no migration entry.
- Any feature-flag schema/validator change needs a database maintenance registry entry and an
  independent validator action; stored overrides need a separate idempotent migration only if the
  document shape changes.
- Integration tests must assert that maintenance setup includes every collection used by the
  scenario, but must not mark configured maintenance complete.
- Keep old route/collection adapters until integration and configured evidence prove equivalent
  behavior. No destructive cleanup is part of Stage 11.

## Explicit non-goals

- No repository-wide `src/app/features` rewrite.
- No new DI/container/event-bus framework.
- No automatic loading of arbitrary database-defined feature flags.
- No API URL, Mongo collection, or user-facing domain rename solely for folder symmetry.
- No broad CSS/HTML redesign, model redesign, or ingestion-policy expansion.
- No replacing configured/browsers acceptance with tests that only use fakes.

## Approval checkpoint

Approve the plan before Step 11.1 implementation. During implementation, pause if a proposed move
changes a public contract, persistence shape, authorization boundary, or lifecycle ownership in a
way this plan does not define. Stage 10 remains implementation-complete but release closure still
depends on its configured/browser evidence; Stage 11 does not waive that gate.
