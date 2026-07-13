# Kamra Stage 8–11 MVP manual verification

Status: live integrated runbook for the complete Stage 8–11 MVP journey. This is the only active
manual acceptance document; the former Stage 8 and Stage 8–10 lists are historical.

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
- Result: `not started` / `pass` / `pass with waivers` / `blocked`

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

| Area                | Existing automated evidence                                                                            | Manual remainder                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Feature flags       | Registry, schema key parity, admin PATCH, persistence, and workspace response                          | Toggle and visible Home effect                          |
| Household stock     | Product Group → Product → Batch seam, writes, reads, and membership boundary                           | CRUD affordances, synchronization, layout, and feedback |
| Shopping completion | Partial Trip completion, Product-owned Batch, pending Ingestion Submission, retry                      | One visible purchase flow and resulting stock           |
| Shopping scale      | Pure scale eligibility rules cover no-policy rows, all four scales, and expiry warning boundaries      | Checkbox reset behavior and visible scale feedback      |
| Shopping targets    | Generator covers Product/Group shortage boundaries, group modes, empty groups, and distribution        | Selected-owner presentation and final generated list    |
| Quick add           | Name normalization covers accents, punctuation, case, known Product matching, and no-match cases       | Debounced input, unit presentation, and duplicate UI    |
| Ingestion review    | Raw snapshot → review candidate/list response                                                          | One visible review decision and status feedback         |
| Demo fixture        | Seed smoke checks targets, expiry permutations, batch counts, unassigned products, and no orphan Batch | Visual grouping/order/theme/layout                      |
| Expiry/read model   | Expired Batches remain visible and counted physically while expiry policy controls derived Current     | Household toggle and rendered count/state               |
| MongoDB             | Configured catalogue/transaction workflows                                                             | Run only with approved environment                      |

## 1. Access, identity, Manual, and diagnostics

Access, authentication, one-household creation, invitation lifecycle, admin authorization, Manual
visibility/locales, Activity sizing, rail navigation, and diagnostics were accepted before
`257f07e`. No later code change touches these paths, so no retest is open here.

Operator notes and discoveries:

The one-household-from-empty-account path is accepted; multiple households are not an MVP
requirement. Invitation placement/title, member actions, and the final readable Manual/Activity
pass remain worth checking after the latest build.

## 2. Demo household and household settings

- [ ] Retest the post-`257f07e` expiry/count change: with expired items excluded, an expired Batch
      remains visible and the Product still shows its physical Batch count while derived Current is
      zero. Re-enable expired items and confirm Current returns without changing the count.

Operator notes and discoveries:

If a Group minimum is edited without an explicit desired restock amount, the current MVP keeps the
target explicit rather than deriving it from the household multiplier. Treat automatic desired
restock derivation as deferred rather than a test failure.

## 3. Home Product Group → Product → Stock Batch workspace

The Product Group → Product → Batch hierarchy, structure, CRUD, derived data, responsive layout,
accessibility, custom units, batch titles, stale revisions, action positions, and theme treatment
were accepted before `257f07e`. No later frontend change touches those surfaces, so no retest is
open here.

## 4. Shopping list and household purchase application

- [ ] Select an otherwise steady Product and a Group manually, generate, and confirm exactly those
      owners appear once. Cancel from Build removes checkboxes without creating a list; Generate also
      exits selection mode and an active list must be cancelled before Build is available again.
- [ ] Retest the post-`257f07e` target comparison behavior: a Product/Group Current above Target is
      shown as good, its target comparison is not yellow, and generating again does not add a need.
- [ ] Mark a Product line purchased, adjust quantity, and finalize. Confirm a Product-owned Batch
      appears with the expected date/quantity, the workspace refreshes, the completed list clears, and
      visible success feedback explains what was saved.

Operator notes and discoveries:

The visible Home list now uses the Product Group workspace selection and bridges its generated list
to the V2 Shopping Need foundation. Legacy household-list records remain a compatibility boundary;
do not treat their existence alone as a separate user workflow.

## 5. Shopping Trip, pricing, and ingestion review

- [ ] From an open Shopping Need, start a Trip with one active Shop Market and a date. Repeat with
      Custom shop and a saved custom shop name; confirm both remain usable and no 400/404 appears.
- [ ] Confirm matching shows package count, expected total, applicable Price Observation, and an
      explanation. Check no-price, stale, future, conditional, expired, and incompatible states.
- [ ] Select an alternate bounded match and confirm package math, price, and explanation recalculate.
- [ ] Leave a line unresolved, confirm continuation is blocked, skip it, and resume remaining lines.
- [ ] Mark lines bought/not bought. Confirm only bought lines create stock on completion.
- [ ] Record actual Product, quantity, unit, paid price/currency, acquisition date, and expiry.
      Confirm the resulting Batch and pending Ingestion Submission contain the entered values.
- [ ] Choose an existing Household Product and separately create a genuine new Product. Confirm no
      accidental duplicate Product is created.
- [ ] Add an unplanned purchase, complete it, and confirm immediate household usability plus pending
      admin review.
- [ ] Resume a partially processed Trip and retry completion. Confirm resume feedback and no duplicate
      visible result.
- [ ] In admin review, accept, decline with a reason, and correct a review item. Confirm the visible
      status/reason/match-confidence presentation, localized feedback, overlapping-action handling,
      and understandable stale-review feedback. HTTP status persistence, conflict responses, and
      submitted-fact preservation are covered by the Stage 11 route contract tests.
- [ ] In admin, create a Shop Market, Shop Product, and Price Observation. Confirm the invalid-form
      messages, successful/failing feedback, Activity entries, and overlapping-action handling.
      Request validation and duplicate responses are covered by the Stage 11 route contract tests.
- [ ] Verify base, offer, coupon, loyalty, manual, substitution, and no-price states in both locales
      and at a narrow viewport.

Operator notes and discoveries:

Shopping Trip browser verification was previously skipped after 400/404 creation failures; repeat
it now that the API defaults unnamed Custom trips and the route/integration path is covered. The
browser still needs the visual and interaction evidence listed above even though persistence and
HTTP conflict contracts are automated.

## 6. Developer Admin, feature flags, and maintenance

- [ ] Review Crawl Snapshot archive output on an approved disposable database. Open `manifest.json`,
      compare counts/checksums with the command summary, and inspect only decompressed gzip JSONL shape
      and redacted metadata. Do not import, repair, commit, or expose raw payloads.
- [ ] Run the Lidl repair dry run with `npm run repair:lidl-brochure -- --snapshot-id=<id> --limit=1`.
      Confirm it is read-only by default and that raw payload/provenance remain unchanged.
- [ ] In the Crawl review dialog, confirm dark themed draft/JSON/price-observation controls,
      localized Ingestion management navigation, side-rail/backdrop dismissal behavior, and readable
      enlarged dialog content.

Operator notes and discoveries:

Record any configured-environment requirement, validator drift, archive checksum mismatch, repair
proposal, or ingestion-review discrepancy here without copying raw data.

## 7. Final evidence and waiver review

- [ ] Repeat the complete runbook from a clean refresh on the final candidate commit.
- [ ] Repeat the critical household/shopping path with two users, English/Hungarian, light/dark,
      desktop/narrow viewports, and the approved disposable database where required.
- [ ] Review every operator note and discovery. Record the fix commit, retest result, explicit
      post-MVP deferral, or waiver with risk, owner, and reason.
- [ ] Record final date, environment, tester, commit, automated output, configured smoke output, and
      browser evidence in the evidence log.
- [ ] Mark MVP closure ready only when required correctness, authorization, persistence, transaction,
      history, and silent-error checks are resolved or explicitly waived.

## 8. Known risk probes

- [ ] Add the same impulse item twice and retry a purchased-line application. Confirm the second
      impulse attempt creates no second line, keeps the draft available, reports that the item is
      already present, and the retry creates no duplicate Product, Batch, or Purchase. Activity
      should explain both results.

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

| Area                      | Covered and accepted                                                                                                                                                                                                                                                                | Boundary or retest note                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Automated preflight       | Deterministic integration, full tests, formatting, lint, typecheck, web/API build, and diff checks were accepted before `257f07e`.                                                                                                                                                  | Repeat only after a behavior-changing candidate.                                                  |
| Catalog/transactions      | Catalog and transaction smoke evidence was accepted before `257f07e`, including commit/rollback behavior.                                                                                                                                                                           | No new code touches these paths.                                                                  |
| Automated household rules | Shopping-scale eligibility, Product/Group target boundaries, quick-add normalization, target comparison, read-model ordering, expiry inclusion, physical Batch counts, and Group aggregation have focused tests.                                                                    | Browser presentation and operator feedback remain manual.                                         |
| Demo fixture              | Seeded Product Group/Product/Batch coverage, expiry permutations, unassigned Products, batch counts, and no productless Batch were accepted before `257f07e`.                                                                                                                       | Only the post-`257f07e` expiry/count behavior remains active above.                               |
| Access and identity       | Protected routes, empty-user household creation, invitation placement/claiming, isolation, and admin authorization were accepted before `257f07e`.                                                                                                                                  | No new code touches these paths.                                                                  |
| Manual and diagnostics    | Manual tabs/visibility, locales, effective database diagnostics, Activity logging, sizing, and rail navigation were accepted before `257f07e`.                                                                                                                                      | No new code touches these paths.                                                                  |
| Household management      | Settings, expiry/target modes, reset scopes, complete deletion, owner controls, non-owner read-only behavior, and safe Home return were accepted before `257f07e`.                                                                                                                  | No new code touches these paths.                                                                  |
| Home workspace            | Product Group hierarchy, CRUD, assignment, aggregation, ordering, custom units, Batch titles, stale-revision feedback, action positions, responsive behavior, and accessibility were accepted before `257f07e`.                                                                     | No new frontend code touches these paths.                                                         |
| Shopping basics           | Product Group selection, scale defaults, group modes/distribution, duplicate impulse handling, list editing, completion bridge, refresh/clear feedback, and Product-owned stock behavior were accepted before `257f07e`.                                                            | Selection, target comparison, and final purchase feedback remain active above.                    |
| Admin and maintenance     | Dynamic feature-flag metadata, alpha auto-save, user management, maintenance registry separation, and diagnostics were accepted before `257f07e`.                                                                                                                                   | Archive/repair and ingestion review remain active above.                                          |
| Stage 11 route contracts  | Matcher/planning state matrix, Trip completion persistence/idempotency, configured Shopping Trip Mongo smoke, Shop Market/Product/Price Observation request validation and duplicate handling, and ingestion review status/conflict/history contracts are covered by focused tests. | Browser presentation, locale, Activity, and configured maintenance-action evidence remain manual. |
| Quick-add duplicate seam  | Normalized quick-add matching and duplicate-key behavior are covered by pure tests; the component keeps the draft and does not add a second line.                                                                                                                                   | Browser toast, Activity wording, and purchase-application presentation remain manual.             |
| Intentional deferrals     | Automatic desired-restock derivation, classification/tagging UX, and deeper ingestion/catalogue policy expansion remain outside the current MVP closure.                                                                                                                            | Revisit only through a post-MVP plan.                                                             |
