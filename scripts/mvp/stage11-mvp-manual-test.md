# Kamra Stage 8–11 MVP closure record

Status: Closed on 2026-07-14. This archived runbook records the accepted MVP household scope and is
not an active acceptance document.

## Closure decision

The MVP closes around the tested household workspace and Shopping-list experience. The final
Shopping Trip/pricing/ingestion-review checks, Crawl Snapshot archive/repair/dialog checks, and their
combined closure matrix were transferred to Phase 1 because those workflows will be redesigned
there. This is a deliberate scope boundary, not evidence that the outgoing behavior passed.

The transferred acceptance is tracked in [`scripts/phase1-manual-test.md`](../phase1-manual-test.md)
and will be finalized and run after the Phase 1 behavior stabilizes. Automated Stage 11 route,
repository, domain, browser-contract, and configured-smoke evidence remains valid as recorded below.

This file is operator-editable. Add notes, screenshots, reproduction details, and discoveries under
the relevant section. Do not add credentials, tokens, private household data, or raw production
exports. A later fixer session must diff operator edits before changing behavior. Deterministic
domain/API checks are moved to the covered section as they become automated; this document remains
necessary only for browser, configured-environment, and operator-session acceptance.

## Run metadata

- Date/time:
- Tester/operator:
- Branch and commit:
- Web/API build or deployment:
- Browser and version:
- Viewport(s):
- Locale(s):
- Theme(s):
- Database/environment:
- Disposable database for destructive checks:
- Result: MVP household scope accepted; Phase 1 workflows transferred

## Operator rules

- Use normal UI/API paths. Do not edit MongoDB directly to make a test pass.
- Use a disposable or explicitly approved database for seed, migration, archive, repair, and
  transaction operations.
- For each mutation, check visible feedback, persisted/reloaded state, Activity output, and absence
  of duplicate side effects where relevant.
- Record the exact expected/observed difference, account, locale, theme, viewport, and safe
  reproduction before requesting a fix.
- Run the affected section again after a fix, then repeat the full runbook after the final
  behavior-changing fix.

## 0. Preflight and automated evidence

Run from the repository root on the candidate commit.

The local preflight, configured catalogue/transaction smokes, focused demo seed/smoke, teardown
guard, and maintenance registry separation were already accepted before `257f07e`. No new code
after that commit changes those paths, so they are recorded in the covered table rather than
repeated here.

Operator notes and discoveries:

<!-- Add safe command summaries and failures here. -->

### Automated coverage ledger

| Area                | Existing automated evidence                                                                                                                                                                                                                                                                           | Manual remainder                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Feature flags       | Registry, schema key parity, admin PATCH, persistence, and workspace response                                                                                                                                                                                                                         | Toggle and visible Home effect                                                                           |
| Household settings  | Chromium contract covers owner settings save feedback and reload persistence for expiry policy and max-limit multiplier                                                                                                                                                                               | No remaining manual check for the accepted expiry toggle path                                            |
| Household stock     | Product Group → Product → Batch seam, writes, reads, membership boundary, shared grid tracks, child counts, and Group details wording                                                                                                                                                                 | Real-data CRUD synchronization, themes, and responsive layout                                            |
| Shopping completion | Partial Trip completion, Product-owned Batch, pending Ingestion Submission, retry, and Home finish collapse/reopen transition                                                                                                                                                                         | One visible real purchase flow and resulting stock                                                       |
| Shopping scale      | Pure scale eligibility rules cover no-policy rows, all four scales, expiry warning boundaries, and Chromium manual selection/reset behavior                                                                                                                                                           | Real seeded presentation and feedback                                                                    |
| Shopping targets    | Generator covers Product/Group shortage boundaries, group modes, empty groups, distribution, above-target no-op, and Chromium final-owner request wiring                                                                                                                                              | Real seeded override presentation and generated list                                                     |
| Quick add           | Name normalization and Chromium duplicate impulse behavior preserve the draft and prevent a second line                                                                                                                                                                                               | Real seeded locale/feedback presentation                                                                 |
| Ingestion review    | Raw snapshot → review candidate/list response                                                                                                                                                                                                                                                         | One visible review decision and status feedback                                                          |
| Demo fixture        | Seed smoke checks targets, expiry permutations, batch counts, unassigned products, and no orphan Batch                                                                                                                                                                                                | Visual grouping/order/theme/layout                                                                       |
| Expiry/read model   | Expired Batches remain visible and counted physically while expiry policy controls derived Current; the fresh-seed toggle and rendered count/state were accepted in the operator runbook.                                                                                                             | No remaining manual check for this path                                                                  |
| MongoDB             | Configured catalogue/transaction workflows                                                                                                                                                                                                                                                            | Run only with approved environment                                                                       |
| Browser contracts   | Chromium specs cover authenticated Home loading, settings save/reload, grid/details/count presentation, Home build/retry/generate/cancel/finish wiring, duplicate impulse preservation, Shopping Trip collapsed/toggle and completion, and Stage 9 price/review feedback with delayed stale handling. | Synthetic API state is not real-data, visual, locale, or deployment evidence; those checks remain below. |

## 3. Home Product Group → Product → Stock Batch workspace

Operator notes and discoveries:

If a Group minimum is edited without an explicit desired restock amount, the current MVP keeps the
target explicit rather than deriving it from the household multiplier. Treat automatic desired
restock derivation as deferred rather than a test failure.

## 4. Shopping list and household purchase application

- [x] In an active Shopping list, discard both a generated row and a manual impulse row. Rename an
      impulse row to the same name as another row, blur or press Enter, refresh, and confirm the
      removal/name change persists without creating a duplicate through Quick add.
- [x] Mark a Product row purchased and confirm the section is labeled Purchased, purchased rows keep
      the compact table tracks and discard action, and the purchased state survives a refresh before
      finalization.
- [x] Cancel both Shopping-list selection mode before generation and an active generated list after
      generation. Confirm the list closes, the household workspace reopens, and no selection/list
      state remains unexpectedly.

Operator notes and discoveries:

The visible Home list now uses the Product Group workspace selection and bridges its generated list
to the V2 Shopping Need foundation. Legacy household-list records remain a compatibility boundary;
do not treat their existence alone as a separate user workflow. The oldest Product strategy compares
each Product's latest available Batch; an older expired Batch must not make that Product win.

## 5. Shopping Trip, pricing, and ingestion review

Not executed for MVP closure. The complete set was transferred to the Phase 1 list-first shopping,
receipt/price bridge, scalable review, and final acceptance stages. The old separate Shopping Trip UI
is not the contract Phase 1 should preserve.

Operator notes and discoveries:

The browser contracts cover synthetic Trip creation/completion and admin feedback; this section is
only for real seeded persistence, full price-state coverage, locale/layout judgment, and configured
review evidence.

## 6. Developer Admin, feature flags, and maintenance

The Crawl Snapshot archive, Lidl repair dry run, and Crawl review-dialog checks were not executed for
MVP closure. They were transferred to Phase 1 after the scalable review and crawl-lifecycle redesign.

Operator notes and discoveries:

Record any configured-environment requirement, validator drift, archive checksum mismatch, repair
proposal, or ingestion-review discrepancy here without copying raw data.

## 7. Final evidence and waiver review

MVP closure was approved with the household-side scope above. No waiver claims that transferred Trip,
pricing, ingestion-review, crawl, or combined-matrix behavior passed; Phase 1 owns that evidence.

## 8. Known risk probes

Operator notes and discoveries:

## Fix/discovery log

Use one entry per finding. Do not erase previous entries after fixing; add the fix commit and retest.

### Finding template

- Finding id:
- Date/tester:
- Run section/item:
- Account/locale/theme/viewport:
- Expected:
- Observed:
- Reproduction:
- Severity: `blocker` / `high` / `medium` / `low` / `post-MVP`
- Owning stage/slice:
- Fix commit or waiver:
- Retest result:

## Final evidence log

Record only safe summaries. Never include credentials, tokens, or private household records.

- Date/environment/tester/commit:
- Automated evidence:
- Configured evidence:
- Browser evidence:
- Waivers and follow-ups:

## Covered and accepted

Move a check here after the operator has actually confirmed it. Keep active sections limited to
outstanding manual work and retests.

| Area                           | Covered and accepted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Boundary or retest note                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Automated preflight            | Deterministic integration, full tests, formatting, lint, typecheck, web/API build, and diff checks were accepted before `257f07e`.                                                                                                                                                                                                                                                                                                                                                                                           | Repeat only after a behavior-changing candidate.                                                      |
| Catalog/transactions           | Catalog and transaction smoke evidence was accepted before `257f07e`, including commit/rollback behavior.                                                                                                                                                                                                                                                                                                                                                                                                                    | No new code touches these paths.                                                                      |
| Automated household rules      | Shopping-scale eligibility, Product/Group target boundaries including above-target no-op behavior, all five Group distribution strategies, local override resolution, quick-add normalization, target comparison, read-model ordering, expiry inclusion, physical Batch counts, and Group aggregation have focused tests.                                                                                                                                                                                                    | Browser presentation, configured migration, and operator feedback remain manual.                      |
| Demo fixture                   | Seeded Product Group/Product/Batch coverage, expiry permutations, unassigned Products, batch counts, no productless Batch, and the fresh-seed expiry/count behavior were accepted.                                                                                                                                                                                                                                                                                                                                           | Visual grouping/order/theme/layout remain manual.                                                     |
| Access and identity            | Protected routes, empty-user household creation, invitation placement/claiming/presentation, isolation, admin authorization, and narrow-viewport localized compact ✓/× invitation actions were accepted.                                                                                                                                                                                                                                                                                                                     | Real multi-user lifecycle remains manual.                                                             |
| Manual and diagnostics         | Manual tabs/visibility, English/Hungarian terminology including Shopping Trip, effective database diagnostics, Activity logging/actionable errors, sizing, and rail navigation were accepted in the latest review.                                                                                                                                                                                                                                                                                                           | No remaining manual check in this area.                                                               |
| Household management           | Settings, expiry/target modes, reset scopes, complete deletion, owner controls, non-owner read-only behavior, safe Home return, and the fresh-seed Allow expired items toggle/current-count behavior were accepted; the Chromium contract covers settings save feedback and reload persistence.                                                                                                                                                                                                                              | Operator-confirmed destructive behavior remains manual.                                               |
| Home workspace                 | Product Group hierarchy, CRUD, assignment, aggregation, ordering, custom units, Batch titles, stale-revision feedback, action positions, single `>` comparison markers/state badges, editor-path synchronization, Group override inheritance, Product/Batch unit matching, fixed header, indentation, count labels, light/dark presentation, narrow scrolling, accessibility, shared grid tracks, child counts, and Group details wording are covered by prior acceptance plus Chromium checks.                              | No additional accepted Home workspace check remains outside the active Shopping list items.           |
| Shopping basics                | Product Group selection, scale defaults, group modes/distribution, duplicate impulse handling, list editing, completion bridge, Product-owned stock creation, refresh/clear feedback, selection/reset/final-owner behavior, generated-list table sizing/scrolling, responsive panel separation, Home finish/cancel collapse-reopen, latest-batch Oldest selection, row discard/rename persistence, purchased-row presentation/persistence, and both cancellation paths are covered by focused tests and operator acceptance. | Shopping-session and price/catalogue bridge acceptance transferred to Phase 1.                        |
| Admin and maintenance          | Dynamic feature-flag metadata, alpha auto-save, user management, maintenance registry separation, and diagnostics were accepted before `257f07e`.                                                                                                                                                                                                                                                                                                                                                                            | Crawl archive/repair/dialog and scalable ingestion review transferred to Phase 1.                     |
| Stage 11 route contracts       | Matcher/planning state matrix, Trip completion persistence/idempotency, stale/network retry without duplicate Product/Batch/Purchase side effects, configured Shopping Trip Mongo smoke, Shop Market/Product/Price Observation request validation and duplicate handling, and ingestion review status/conflict/history contracts are covered by focused tests.                                                                                                                                                               | Integrated acceptance is transferred to the redesigned Phase 1 workflow.                              |
| Quick-add duplicate seam       | Normalized quick-add matching and duplicate-key behavior are covered by pure tests; the component keeps the draft and does not add a second line.                                                                                                                                                                                                                                                                                                                                                                            | Browser toast, Activity wording, and purchase-application presentation remain manual.                 |
| Browser Home contract          | Authenticated Home load, settings save/reload, Group details, shared grid tracks, child counts, Build → Generate → Cancel, failed-generation retry, active-list disabling, duplicate impulse preservation, Home finish collapse/reopen, and Shopping Trip default-collapsed/toggle behavior pass in Chromium with an unexpected-API-request guard.                                                                                                                                                                           | Real seeded selection, visual/layout, locale, and persisted Mongo evidence remain manual/configured.  |
| Browser Trip/admin contracts   | Custom-shop Trip continuation through finalize, unresolved/skip/bought controls, unplanned line, price validation/success, delayed review disabling, stale feedback, Activity output, and successful review retry pass in synthetic Chromium contracts.                                                                                                                                                                                                                                                                      | Real/configured and subjective evidence is transferred to Phase 1 rather than accepted for MVP.       |
| Final evidence and risk probes | The household-side final candidate and the explicitly accepted Shopping-list row/cancellation behaviors were reviewed.                                                                                                                                                                                                                                                                                                                                                                                                       | The combined Trip/crawl closure matrix is transferred to Phase 1 and was not counted as MVP evidence. |
| Intentional deferrals          | The list-first shop session, receipt-to-price/catalogue bridge, high-throughput review, Product discovery/linking, terminology cleanup, crawl minimization, automatic desired-restock derivation, and deeper ingestion/catalogue policy expansion remain outside the closed MVP.                                                                                                                                                                                                                                             | The core usability items are planned in `.agents/plans/phase-1-usability-completion-plan.md`.         |
