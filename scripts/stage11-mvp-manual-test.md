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

| Area                | Existing automated evidence                                                                                                                                                                                                                                                                           | Manual remainder                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Feature flags       | Registry, schema key parity, admin PATCH, persistence, and workspace response                                                                                                                                                                                                                         | Toggle and visible Home effect                                                                           |
| Household settings  | Chromium contract covers owner settings save feedback and reload persistence for expiry policy and max-limit multiplier                                                                                                                                                                               | Real seeded expiry/current presentation remains manual                                                   |
| Household stock     | Product Group → Product → Batch seam, writes, reads, membership boundary, shared grid tracks, child counts, and Group details wording                                                                                                                                                                 | Real-data CRUD synchronization, themes, and responsive layout                                            |
| Shopping completion | Partial Trip completion, Product-owned Batch, pending Ingestion Submission, retry, and Home finish collapse/reopen transition                                                                                                                                                                         | One visible real purchase flow and resulting stock                                                       |
| Shopping scale      | Pure scale eligibility rules cover no-policy rows, all four scales, expiry warning boundaries, and Chromium manual selection/reset behavior                                                                                                                                                           | Real seeded presentation and feedback                                                                    |
| Shopping targets    | Generator covers Product/Group shortage boundaries, group modes, empty groups, distribution, above-target no-op, and Chromium final-owner request wiring                                                                                                                                              | Real seeded override presentation and generated list                                                     |
| Quick add           | Name normalization and Chromium duplicate impulse behavior preserve the draft and prevent a second line                                                                                                                                                                                               | Real seeded locale/feedback presentation                                                                 |
| Ingestion review    | Raw snapshot → review candidate/list response                                                                                                                                                                                                                                                         | One visible review decision and status feedback                                                          |
| Demo fixture        | Seed smoke checks targets, expiry permutations, batch counts, unassigned products, and no orphan Batch                                                                                                                                                                                                | Visual grouping/order/theme/layout                                                                       |
| Expiry/read model   | Expired Batches remain visible and counted physically while expiry policy controls derived Current                                                                                                                                                                                                    | Household toggle and rendered count/state                                                                |
| MongoDB             | Configured catalogue/transaction workflows                                                                                                                                                                                                                                                            | Run only with approved environment                                                                       |
| Browser contracts   | Chromium specs cover authenticated Home loading, settings save/reload, grid/details/count presentation, Home build/retry/generate/cancel/finish wiring, duplicate impulse preservation, Shopping Trip collapsed/toggle and completion, and Stage 9 price/review feedback with delayed stale handling. | Synthetic API state is not real-data, visual, locale, or deployment evidence; those checks remain below. |

## 1. Access, identity, Manual, and diagnostics

- [ ] Recheck the latest build's pending invitation presentation in both the Home management block
      and secondary rail. Confirm the household title is localized as “Households”/“Háztartások”,
      pending rows are actionable, and accepted/rejected invitations disappear.
- [ ] Recheck the Manual terminology tables in English and Hungarian for readable text size and
      natural wording, including the Shopping Trip term.
- [ ] Recheck the Activity console at its current default height and confirm actionable errors still
      identify the affected object without exposing secrets.

Operator notes and discoveries:

## 2. Demo household and household settings

- [ ] In a fresh seeded household, turn Allow expired items off and confirm an expired Batch remains
      visible, its physical Product Batch count is unchanged, and derived Current excludes it. Turn
      the setting on again and confirm Current includes it without changing the count.

Operator notes and discoveries:

If a Group minimum is edited without an explicit desired restock amount, the current MVP keeps the
target explicit rather than deriving it from the household multiplier. Treat automatic desired
restock derivation as deferred rather than a test failure.

## 3. Home Product Group → Product → Stock Batch workspace

- [ ] On a fresh demo seed, confirm ordinary Groups show `Default (split)`/the localized equivalent,
      while `Gyümölcsök` shows its seeded local `latest` strategy. Change the household distribution
      setting, refresh Home, and confirm only inherited Group labels update; the local fruit override
      remains local.
- [ ] Inspect below-minimum, between-minimum/target, exact-target, above-target, and untracked rows
      in the seeded data: above target uses a green `>>` marker, between uses the blue/info treatment,
      state badges are readable, and untracked rows show no comparison symbols.
- [ ] Save one seeded Group/Product/Batch change from each available editor path and refresh. Confirm
      the other editor clears, the hierarchy remains attached, and visible Activity/toast feedback
      identifies the saved object.
- [ ] In light and dark themes, confirm the compact header, Group/Product/Batch indentation, count
      labels, fixed header, action columns, and date/status colors remain readable. Repeat at a narrow
      viewport and confirm intentional table scrolling without overlap.

## 4. Shopping list and household purchase application

- [ ] In seeded real data, select an otherwise steady Product and a Group manually, generate, and
      confirm exactly those owners appear once with the expected Product/Group presentation.
- [ ] With a targeted Group containing several Products, generate with the household default Split
      evenly strategy and then test Don’t split, Least amount, Latest, and Oldest through the Group
      detail override on a disposable copy. Confirm each resulting owner matches its label and restore
      `Default` afterward.
- [ ] Mark a seeded Product line purchased, adjust quantity, and finish shopping. Confirm a
      Product-owned Batch appears with the expected date/quantity, the Shopping list collapses, the
      household workspace opens, and success feedback explains what was saved.
- [ ] With a generated real-data list on desktop, confirm the quick-add/finalize controls stay compact
      while only the item table grows and scrolls. Repeat at a narrow viewport with the household,
      Shopping list, and Shopping Trip panels in expanded and collapsed states.

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
      Confirm the seeded multi-line Trip resumes without losing prior decisions.
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
      submitted-fact preservation are covered by route contracts.
- [ ] In admin, create a Shop Market, Shop Product, and Price Observation. Confirm the invalid-form
      messages, successful/failing feedback, Activity entries, and overlapping-action handling.
      Request validation and duplicate responses are covered by route contracts.
- [ ] Verify base, offer, coupon, loyalty, manual, substitution, and no-price states in both locales
      and at a narrow viewport.
- [ ] At a narrow viewport, confirm the household workspace, Shopping list, and Shopping Trip
      panels stack with clear vertical separation in both expanded and collapsed states; no panel
      content overlaps, and expanding one does not cover the next panel.

Operator notes and discoveries:

The browser contracts cover synthetic Trip creation/completion and admin feedback; this section is
only for real seeded persistence, full price-state coverage, locale/layout judgment, and configured
review evidence.

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

- [ ] Retry a purchased-line application after a network or stale response. Confirm the retry creates
      no duplicate Product, Batch, or Purchase and Activity explains the result. Duplicate impulse
      preservation is covered by the synthetic Chromium Home contract and duplicate side effects by
      the configured Shopping Trip smoke.

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

| Area                         | Covered and accepted                                                                                                                                                                                                                                                                                                                               | Boundary or retest note                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Automated preflight          | Deterministic integration, full tests, formatting, lint, typecheck, web/API build, and diff checks were accepted before `257f07e`.                                                                                                                                                                                                                 | Repeat only after a behavior-changing candidate.                                                                                      |
| Catalog/transactions         | Catalog and transaction smoke evidence was accepted before `257f07e`, including commit/rollback behavior.                                                                                                                                                                                                                                          | No new code touches these paths.                                                                                                      |
| Automated household rules    | Shopping-scale eligibility, Product/Group target boundaries including above-target no-op behavior, all five Group distribution strategies, local override resolution, quick-add normalization, target comparison, read-model ordering, expiry inclusion, physical Batch counts, and Group aggregation have focused tests.                          | Browser presentation, configured migration, and operator feedback remain manual.                                                      |
| Demo fixture                 | Seeded Product Group/Product/Batch coverage, expiry permutations, unassigned Products, batch counts, and no productless Batch were accepted before `257f07e`.                                                                                                                                                                                      | Only the post-`257f07e` expiry/count behavior remains active above.                                                                   |
| Access and identity          | Protected routes, empty-user household creation, invitation placement/claiming, isolation, and admin authorization were accepted before `257f07e`.                                                                                                                                                                                                 | No new code touches these paths.                                                                                                      |
| Manual and diagnostics       | Manual tabs/visibility, locales, effective database diagnostics, Activity logging, sizing, and rail navigation were accepted before `257f07e`.                                                                                                                                                                                                     | No new code touches these paths.                                                                                                      |
| Household management         | Settings, expiry/target modes, reset scopes, complete deletion, owner controls, non-owner read-only behavior, and safe Home return were accepted before `257f07e`; the Chromium contract now covers settings save feedback and reload persistence.                                                                                                 | Real seeded expiry/current presentation and operator-confirmed destructive behavior remain manual.                                    |
| Home workspace               | Product Group hierarchy, CRUD, assignment, aggregation, ordering, custom units, Batch titles, stale-revision feedback, action positions, responsive behavior, accessibility, shared grid tracks, child counts, and Group details wording are covered by prior acceptance plus Chromium checks.                                                     | Real-data synchronization, themes, and responsive visual judgment remain manual.                                                      |
| Shopping basics              | Product Group selection, scale defaults, group modes/distribution, duplicate impulse handling, list editing, completion bridge, refresh/clear feedback, Product-owned stock behavior, selection/reset/final-owner behavior, and Home finish collapse/reopen are covered by focused tests.                                                          | Seeded strategy presentation, final purchase feedback, and real Product-owned stock remain active above.                              |
| Admin and maintenance        | Dynamic feature-flag metadata, alpha auto-save, user management, maintenance registry separation, and diagnostics were accepted before `257f07e`.                                                                                                                                                                                                  | Archive/repair and ingestion review remain active above.                                                                              |
| Stage 11 route contracts     | Matcher/planning state matrix, Trip completion persistence/idempotency, configured Shopping Trip Mongo smoke, Shop Market/Product/Price Observation request validation and duplicate handling, and ingestion review status/conflict/history contracts are covered by focused tests.                                                                | Browser presentation, locale, Activity, and configured maintenance-action evidence remain manual.                                     |
| Quick-add duplicate seam     | Normalized quick-add matching and duplicate-key behavior are covered by pure tests; the component keeps the draft and does not add a second line.                                                                                                                                                                                                  | Browser toast, Activity wording, and purchase-application presentation remain manual.                                                 |
| Browser Home contract        | Authenticated Home load, settings save/reload, Group details, shared grid tracks, child counts, Build → Generate → Cancel, failed-generation retry, active-list disabling, duplicate impulse preservation, Home finish collapse/reopen, and Shopping Trip default-collapsed/toggle behavior pass in Chromium with an unexpected-API-request guard. | Real seeded selection, visual/layout, locale, and persisted Mongo evidence remain manual/configured.                                  |
| Browser Trip/admin contracts | Custom-shop Trip continuation through finalize, unresolved/skip/bought controls, unplanned line, price validation/success, delayed review disabling, stale feedback, Activity output, and successful review retry pass in Chromium.                                                                                                                | Real market/product persistence, full price-state matrix, locale/theme/layout, and alternate review actions remain manual/configured. |
| Intentional deferrals        | Automatic desired-restock derivation, classification/tagging UX, and deeper ingestion/catalogue policy expansion remain outside the current MVP closure.                                                                                                                                                                                           | Revisit only through a post-MVP plan.                                                                                                 |
