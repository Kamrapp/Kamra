# MVP Quality Automation Follow-up

Status: Revised draft — bounded and executable; awaiting user approval before implementation.

## Objective

Reduce the remaining Stage 8–11 manual runbook to evidence that genuinely needs human judgment,
real users/deployment state, or an operator-approved historical dataset. Add a small browser
contract layer and close the highest-risk response/concurrency gaps without creating a broad
frontend test framework, visual-regression system, or new domain layer.

## Review decision

The generated proposal is useful, but its original required scope was too broad for MVP closure.
This revision makes these boundaries explicit:

| Proposal area | Decision | Reason |
| --- | --- | --- |
| Chromium browser contracts | Required, limited to four focused scenarios and one synthetic fixture harness | Playwright is already installed; this closes Angular wiring gaps without replacing manual visual review. |
| Critical response guards | Required only for consumers exercised by those scenarios | Avoids a generic frontend DTO/schema framework. |
| Compare-and-set concurrency | Required for Feature Flag storage and Ingestion Submission review; configured proof only for Trip/review data | Feature flags are global operational records and must not be mutated with temporary smoke keys. |
| Lidl repair CLI extraction | Deferred | The repair algorithm and safety policy are already pure-tested; CLI refactoring is not an MVP user-quality blocker. |
| axe, deployed browser tests, screenshots, Firefox/WebKit | Deferred | These require extra dependency, credentials, data-reset, baseline, or compatibility decisions. |

## Context Read

- `AGENTS.md`
- `.agents/planning-workflow.md`
- `.agents/coding-guidelines.md`
- `.agents/plan-template.md`
- `.agents/plans/2026-07-13-stage11-manual-test-automation-plan.md`
- `.agents/plans/mvp-closure-plan.md`
- `.agents/sessions/2026-07-13-stage-11-architecture-reorganization.md`
- `scripts/stage11-mvp-manual-test.md`
- `scripts/shopping-trip-smoke.ts`, `scripts/repair-lidl-brochure-rows.ts`, and archive tests
- Current browser services/components, Vitest configuration, Playwright package, and CI workflows

## Research Gate

No additional research is required for this revision. `playwright` is already a dev dependency and
exposes `playwright/test`; the local Angular dev server and Playwright `webServer` are sufficient for
secret-free mocked browser contracts. Do not add `@playwright/test`, axe, or another test framework.

## User Requests

- Re-audit what can be automated after most of the previous automation plan was implemented.
- Identify additional tests and quality controls that can reduce manual testing.
- Create a new plan for the worthwhile additions.

## Current Reality

- Domain, route, deterministic integration, and configured Shopping Trip MongoDB coverage now prove
  the important calculation, persistence, review, validator/index, and sequential retry contracts.
- The manual runbook still repeats many browser interaction assertions because the repository has no
  browser test suite. Existing frontend tests cover only small pure helpers; they do not exercise
  Angular templates, event bindings, disabled states, feedback, Activity output, locale switching,
  or narrow layout.
- The repository already depends on Playwright for crawlers and the installed package exposes the
  Playwright test runner. No browser-test dependency is required for the initial slice.
- Browser tests can intercept `/api/**` and use synthetic stateful fixtures, keeping normal CI
  secret-free. They complement rather than duplicate the handler and configured MongoDB tests.
- Several critical successful frontend responses are still trusted through TypeScript assertions.
  Malformed 2xx Trip, market, and Stage 9 admin payloads can therefore throw or leave misleading UI
  state. Guard only the consumers exercised by the new browser scenarios.
- Real-Mongo smoke coverage checks sequential retry and stale review behavior, but not concurrent
  requests. Current feature-flag and ingestion-review stores read before writing; their final
  compare-and-set result must be checked explicitly so two same-revision writes cannot both report
  success.
- The Lidl repair algorithm is pure-tested. Its CLI orchestration remains a manual/operator concern
  and is not an MVP automation blocker.
- Archive manifest, gzip, checksum, import idempotency, and non-empty-output refusal already have
  focused tests. Additional synthetic archive tests would add little signal; inspection of an
  operator-selected historical archive remains manual.

## Intended Direction

Use three complementary validation layers:

1. Pure and handler/integration tests prove domain and API contracts quickly.
2. Mock-backed browser contracts prove Angular wiring, visible state transitions, and deterministic
   responsive/locale invariants without secrets.
3. Narrow configured smokes prove MongoDB validators, indexes, transactions, compare-and-set, and
   cleanup behavior.

The final manual pass should then focus on subjective visual quality, one deployed real-data happy
path, two-user behavior, and approved historical archive/repair evidence.

## Scope

### Required current work

- Add a small, secret-free Chromium Playwright browser-contract harness using the existing dependency.
- Automate bounded Home, Shopping Trip, and Stage 9 admin interaction checks: at most four focused
  scenarios, not a second complete manual runbook.
- Add explicit payload guards and tests only for the critical responses consumed by those scenarios.
- Fix and test same-revision compare-and-set behavior for Feature Flag storage and Ingestion Review;
  add configured concurrency evidence only for run-scoped Trip/review data.
- Add a narrowly path-filtered browser CI gate and reconcile the manual runbook afterward.

### Optional work

- None in this plan. Accessibility scans may be proposed later after the browser harness is stable.

### Deferred work

- A credentialed browser suite against a deployed preview and real Smoke database. It could replace
  the last real happy-path manual check, but it needs test-account ownership, data reset, secret
  handling, and environment serialization decisions.
- User-deletion transaction redesign and feature-flag audit/write atomicity across infrastructure
  failure. These need separate behavior/transaction decisions beyond compare-and-set correctness.
- Full visual regression screenshots. The current UI is still changing enough that baselines would
  create review noise and risk approving visual defects mechanically.
- Cross-browser Firefox/WebKit runs. Start with Chromium; add another engine only after a concrete
  compatibility risk appears.
- Lidl repair CLI orchestration extraction; retain the existing manual dry-run and approved-historical
  data checks.
- Feature-flag concurrency against a configured database; global flags are not safe temporary smoke
  fixtures.

## Non-Goals

- No numeric line/branch coverage target. It would reward low-value tests and does not map cleanly to
  the remaining risks.
- No tests of Angular or browser framework behavior, private component methods, or static template
  text merely to increase counts.
- No broad frontend DTO/shared-package migration.
- No weakening validators, swallowing malformed payloads, or treating fake persistence as MongoDB
  proof.
- No removal of subjective visual, real two-user, deployed-environment, or historical-data checks.

## Assumptions

- Browser contracts can seed `kamra_user_token` in local storage and intercept every API request
  before the Angular app loads.
- Synthetic browser fixtures contain no private data, so traces/screenshots on failure are safe CI
  artifacts.
- The existing Angular development server is sufficient for browser contracts; no backend process
  is needed because `/api/**` is intercepted.
- Accessible roles, labels, and visible user-facing text are preferred locators. Add a test id only
  when the UI has no stable accessible locator and changing that would be inappropriate.

## Implementation Steps

### Step 1 — Establish the browser-contract harness

- Add `playwright.config.ts`, a `tests/browser/` area, and `npm run test:browser`.
- Start only `npm run dev:web` through Playwright `webServer`; use Chromium, one worker in CI,
  synthetic traces/screenshots only on failure, and no retries locally.
- Add a small stateful API fixture that handles only endpoints requested by a scenario and fails a
  test on unexpected API calls. Seed a synthetic authenticated user through local storage and the
  mocked current-user response.
- Add one baseline test proving authenticated Home load, no uncaught page error, and no unexpected
  console error or unhandled API request.
- Update `scripts/README.md` with purpose, usage, mocked-data boundary, and browser installation.
- Validation: `npm run test:browser`, web typecheck/build, lint, format check.
- Commit: `test: add browser contract harness`

### Step 2 — Automate Home shopping and feedback wiring

- Keep this to at most two focused specs sharing the fixture.
- Cover Build → select Product/Group → Generate, Cancel from selection mode, and Build disabled while
  an active list exists.
- Cover one successful refresh/save response, one failed response, duplicate impulse rejection with
  preserved draft, and the visible feedback/Activity result.
- Use one paired Product/Group Current/Target fixture and one expired-item policy reload only;
  physical Batch counts and every seed permutation remain lower-layer/manual evidence.
- Test stable user outcomes and requests, not internal signals or implementation order.
- Validation: focused Home browser specs plus existing pure/integration tests.
- Commit: `test: cover Home shopping browser contracts`

### Step 3 — Automate Shopping Trip and admin browser wiring

- Keep this to at most two focused specs: one Trip scenario and one Stage 9 admin scenario.
- Cover active-market or Custom Trip creation, price/package explanation display, one unresolved
  block-or-skip transition, bought/not-bought marking, completion feedback, and one unplanned
  purchase. The alternate-match matrix and persistence stay in lower-layer tests.
- Cover Stage 9 admin invalid-form feedback, one successful create/review, delayed-request disabling,
  stale-review feedback, and Activity entries.
- Exercise English and Hungarian labels in targeted cases and one narrow viewport invariant:
  critical controls remain reachable and the page has no horizontal document overflow.
- Keep price calculation and persistence assertions in their existing lower-layer tests; browser
  specs assert presentation and request wiring only.
- Validation: focused Trip/admin browser specs, translation parity, existing route/integration tests.
- Commit: `test: cover Trip and admin browser contracts`

### Step 4 — Fail closed on malformed critical success payloads

- Add small explicit decoders/type guards only in `household-v2.service.ts`, the Home stock-service
  methods exercised by Step 2, and the Stage 9 admin response consumers exercised by Step 3. Validate
  the fields the callers actually use; do not build a generic schema framework.
- Write intended-outcome tests first: malformed JSON, missing arrays/results, invalid item states,
  and wrong primitive types return the existing localized error result and preserve the last valid
  state rather than throwing or displaying success.
- Add browser cases for one malformed Home/Trip response and one malformed admin response to prove
  visible failure feedback and absence of uncaught errors.
- Do not widen this step to every client service; record additional consumers only when a real risk
  or failure appears.
- Validation: focused decoder/service tests, malformed-response browser specs, typecheck, lint.
- Commit: `fix: validate critical browser API responses`

### Step 5 — Prove concurrent compare-and-set and idempotency

- Add repository tests in which `updateOne` reports no match after an initially valid read. Feature
  flag and ingestion-review writes must return their stable revision-conflict errors instead of a
  success object; only a successful flag write may append its audit record.
- Extend the configured Shopping Trip smoke with controlled concurrent requests:
  - two identical same-operation completion requests produce one Batch, Movement, operation, and
    Ingestion Submission;
  - two non-idempotent reviews with the same expected revision produce one winner and one conflict;
  - no configured feature-flag concurrency case; global flags are operational data, not safe
    temporary smoke fixtures.
- If the expected outcome requires a new global transaction policy rather than a narrow matched-count
  or retry correction, pause and return to planning.
- Validation: focused repository tests and `npm run smoke:shopping-trip` on an approved disposable
  database.
- Commit: `test: enforce concurrent mutation contracts`

### Step 6 — Add the browser CI gate

- Add a secret-free, frontend-path-filtered `Browser Contracts` workflow rather than putting browser
  installation into every App Checks run.
- Use `npm ci`, `npx playwright install --with-deps chromium`, and `npm run test:browser`; keep one CI
  worker and upload failure artifacts only when safe synthetic fixtures are in use.
- Keep `npm run mvp:preflight` browser-free so local API/domain work does not unexpectedly require a
  browser installation. Document `npm run test:browser` as a separate release gate.
- Validation: workflow syntax/diff review and a local browser run.
- Commit: `ci: run browser contract checks`

### Step 7 — Reconcile the remaining manual boundary

- Remove browser matrix clauses proven by the new specs instead of duplicating them as mandatory
  manual steps.
- Keep a compact manual pass for subjective theme/readability/focus quality, one deployed real-data
  household/Trip/admin happy path, two-user behavior, actual locale copy review, approved archive and
  repair evidence, and final waiver/evidence ownership.
- Update the automated coverage ledger, `scripts/README.md`, relevant operations/CI docs, current
  session handoff, and this plan's status/evidence.
- Run `npm run mvp:preflight`, `npm run test:browser`, and the configured smokes appropriate to the
  touched files before claiming completion.
- Commit: `docs: narrow MVP manual verification`

## Validation Plan

- Focused Vitest files after each unit.
- `npm run test:integration` after API/repository changes.
- `npm run test:browser` after browser/client changes.
- `npm run smoke:shopping-trip` after concurrency changes, only on an approved disposable database.
- `npm run format:check`, `npm run lint -- --no-warn-ignored`, and `npm run typecheck` per unit.
- `npm run build:web` for browser/client work and `npm run build:api` for repository/smoke work.
- Final `npm run mvp:preflight`, browser suite, relevant configured smokes, and `git diff --check`.

## Risks

- Mock-backed browser tests can accidentally duplicate backend policy. Keep fixtures declarative and
  assert UI/request wiring only; domain/API truth stays in lower-layer tests.
- Browser selectors can become brittle. Prefer roles, labels, and stable user-visible outcomes;
  avoid CSS-layout and exact-copy selectors unless copy is the contract.
- Browser CI adds time and browser installation cost. Keep Chromium-only, path-filtered, and small.
- Concurrency tests can be nondeterministic if they rely only on timing. Coordinate requests at the
  repository/database boundary where needed and assert persisted outcomes, not completion order.
- Malformed-payload validation can grow into a schema framework. Limit guards to critical fields and
  current consumers.
- Historical repair behavior remains manual/operator evidence in this plan; do not refactor it as an
  incidental testing seam.

## Approval Checkpoint

Implementation should not begin until the user approves the required Steps 1–7. Accessibility scans,
repair CLI orchestration, deployed browser tests, screenshot baselines, and additional browser engines
are explicitly deferred and do not block this MVP quality-automation pass.
