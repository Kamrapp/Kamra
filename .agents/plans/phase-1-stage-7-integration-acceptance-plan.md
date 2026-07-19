# Phase 1 Stage 7 — integration hardening and acceptance

Status: Draft closure framework. Keep it updated after every completed stage; perform final approval
only when Stages 1–6 and their required migrations/operations are complete.

## Objective

Prove the Phase 1 household-to-catalogue journey works as one coherent, supportable product, fix only
closure-blocking integration defects, execute the one maintained manual runbook, and record a durable
Phase 1 closure or explicit user-approved waivers.

This stage is an evidence and hardening stage, not a feature backlog.

## Entry conditions

- Stages 1–6 meet their approved exit criteria and their runtime behavior matches durable docs.
- All required database registry entries exist; required validator actions and existing-data
  migrations have explicit operator status and validation evidence.
- Every stage has added stable automated evidence and updated, but not repeatedly executed, the
  relevant section of `scripts/phase1-manual-test.md`.
- Stage-specific research decisions, known unsupported cases, retention/privacy rules, and residual
  risks are recorded outside transient session notes.
- A release-candidate environment, approved test accounts/data, supported receipt fixture, and
  disposable/configured Mongo environment are identified before the final run.

If an entry condition fails, return the defect or missing decision to its owning stage. Do not hide
unfinished product work inside acceptance polish.

## Evidence ledger

At the start of this stage, map every Phase 1 closure criterion and every remaining manual-runbook
item to one strongest evidence source:

- pure/domain or coordination specs for deterministic outcomes and cross-UI-block state;
- route/repository tests for API, authorization, concurrency, and persistence contracts;
- configured `npm run smoke:*` commands for real Mongo validators, indexes, transactions,
  migrations, lifecycle, and idempotency claims;
- the minimal browser smoke for deployability/branding;
- manual evidence only for real browser wiring, keyboard/screen-reader behavior, responsive/visual
  judgment, localization, configured operator safety, real supported receipt handling, and other
  facts the preceding layers cannot prove.

Remove obsolete or duplicated manual steps only when the replacement evidence proves the expected
outcome at an appropriate layer. The ledger records command/check, environment, result, date, and any
waiver; it does not copy sensitive payloads or generated logs into the repository.

## Integrated journeys to prove

1. **Household Product path:** discover a shared Product, understand why it matches, explicitly link
   or leave it unlinked/create as allowed, edit the link, and observe duplicate safeguards.
2. **Shopping path:** build the open list, start shopping at a shop, buy planned and unplanned rows,
   survive reload/retry/cancel as applicable, finish once, update stock once, and retain leftovers.
3. **Receipt and catalogue bridge:** upload the supported receipt, correct uncertain lines, preserve
   unresolved work, create idempotent price observations, and make only justified Product links or
   review candidates.
4. **Admin review path:** process a realistically large source/entry sequence with accept, later,
   decline, correction, interruption/resume, conflict, provenance, and authorized maintenance
   separation.
5. **Lifecycle path:** repeat source evidence, group pending work, process terminal evidence, preview
   and apply the approved lifecycle action, verify counts/audit/recovery, and preserve unresolved data.

## Cross-cutting hardening

- Reconcile final Hungarian and English terminology, navigation labels, help/error copy, and the
  household-first separation between Product management, Source review, and Developer tools.
- Check authorization and household/admin isolation across every new query and command, including
  direct route calls rather than UI visibility alone.
- Exercise stale revisions, double-submit/retry, reload/resume, partial failure, and idempotency at the
  boundaries where multiple stages meet.
- Review focus movement, visible shortcuts, screen-reader labels/status, touch alternatives,
  responsive layout, theme contrast, loading/empty/error states, and destructive confirmations.
- Verify audit/activity and logs communicate safe identifiers and outcomes without raw receipt,
  crawl, payment, loyalty, or household-private payloads.
- Confirm documented hosting limits, timeouts, indexes, scheduled/manual jobs, backup/recovery, data
  retention, and operator commands match runtime truth.
- Measure the approved realistic catalogue, review-queue, receipt, and lifecycle fixtures. Fix
  consequential regressions; record harmless polish outside Phase 1.

## Defect policy and commit sequence

1. **Acceptance preparation** — reconcile the closure matrix, evidence ledger, commands,
   environments, runbook, and known prerequisites. Commit documentation/test harness changes only.
2. **Automated closure evidence** — fill only consequential gaps revealed by the ledger, writing
   expected outcomes first. Keep each independent product defect in a narrow reviewed fix commit.
3. **Configured smoke and migration validation** — run the approved disposable/configured database
   evidence, resolve stage-owned defects, and record operator results without private data.
4. **Integrated manual pass** — execute `scripts/phase1-manual-test.md` once on the release candidate.
   Fix blockers in separate commits and rerun affected sections plus any journey they can regress.
5. **Closure documentation** — record final results, waivers, residual risks, operations state,
   post-Phase-1 handoff, and archive/mark Phase 1 plans according to repository convention.

Do not bundle unrelated polish or refactoring into a closure fix. A failure that changes a stage's
architecture, data policy, or intended behavior reopens that stage plan and approval rather than
being solved silently here.

## Validation plan

- Run the full repository test, integration, typecheck, lint, build, format, and diff-check suite
  defined by the final package scripts.
- Run the maintained minimal browser smoke against the release-candidate build; it proves only that
  the page opens, the browser title is Kamra, and the top-left branding is visible.
- Run every configured Mongo smoke required by the completed stage plans against approved disposable
  data, including catalogue search/index, shopping/session transaction, receipt/price idempotency,
  ingestion/review, maintenance migrations, and lifecycle behavior where implemented.
- Execute the final manual runbook and retain only safe pass/fail evidence. Do not add broad
  Playwright implementation tests or visual snapshots to mirror deterministic specs.
- Re-run a focused check after a narrow fix, then the affected integrated journey before closure.

## Closure and waiver rules

Phase 1 closes only when every top-level closure criterion has passing evidence or the user explicitly
approves a waiver containing the unmet behavior, user/operational impact, risk, reason, owner, and
target follow-up. A transient CI issue, absent environment, or undocumented manual assumption is not
implicitly a waiver.

Closure documentation must:

- state the release-candidate commit and validation date/environment;
- link each criterion to its evidence and record required database/operator action status;
- list supported and unsupported receipt/lifecycle cases;
- distinguish fixed defects, accepted residual risks, and deferred convenience work;
- confirm product, architecture, operations, terminology, and testing docs reflect runtime truth;
- hand off the next core goal: household cost anticipation and configurable price optimization,
  including current-discount shop or alternative-Product suggestions built on Phase 1 observations.

## Exit criteria

- Every Phase 1 roadmap closure criterion is passed or explicitly waived under the rules above.
- The five integrated journeys and cross-cutting requirements have appropriate automated, configured,
  and genuinely manual evidence.
- No required migration, retention, privacy, security, accessibility, localization, or operator action
  remains hidden in conversation/session state.
- The final runbook passes on the release candidate and contains no obsolete manual duplication.
- Durable docs declare Phase 1 closed and make the pricing/optimization follow-up actionable without
  prematurely designing it.

## Deferred and excluded

- New Phase 1 features introduced solely during hardening.
- Broad Playwright/visual snapshot coverage for behavior already protected at a more stable layer.
- Household cost forecasts, discount aggregation, multi-shop optimization, and alternative Product
  recommendations; closure only preserves and documents the evidence seam they need.
- Unrelated catalogue, social, or aesthetic expansion.

## Revision cadence

At the end of every earlier stage, update entry conditions, implemented commands, evidence ownership,
known risks, and the relevant integrated journey. Do not turn this framework into a detailed script
until runtime contracts stabilize. Review and approve the final executable version after Stage 6.

