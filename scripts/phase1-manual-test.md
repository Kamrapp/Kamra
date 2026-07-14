# Kamra Phase 1 manual acceptance

Status: Deferred draft. Maintain this runbook while Phase 1 stages are implemented, but do not run
the integrated pass until Stage 7 of
`.agents/plans/phase-1-usability-completion-plan.md`. Testing the outgoing Shopping Trip and crawl
review experiences before their planned redesign is not Phase 1 acceptance.

This runbook owns the MVP checks transferred from
[`scripts/mvp/stage11-mvp-manual-test.md`](./mvp/stage11-mvp-manual-test.md). Stage plans should turn
stable deterministic expectations into specs, route/repository tests, or configured `npm run smoke:*`
checks first. Keep manual steps only for real wiring, visual and interaction judgment, localization,
approved external/database evidence, and operator safety.

## Run metadata

- Date/time:
- Tester/operator:
- Branch and commit:
- Web/API build or deployment:
- Browser and version:
- Viewport(s): desktop and narrow
- Locale(s): English and Hungarian
- Theme(s): light and dark
- Database/environment:
- Approved disposable database for destructive checks:
- Result: `not started` / `pass` / `pass with waivers` / `blocked`

## Execution gate

- [ ] Stages 1–6 are complete and their stable expectations are reflected below.
- [ ] Automated preflight and focused specs pass on the candidate commit.
- [ ] Required configured Mongo smoke scripts pass on an approved disposable database.
- [ ] Test accounts, receipt fixtures, crawl fixtures, and archive paths contain no secrets or private
      production exports.
- [ ] The tester understands which cleanup/archive actions can mutate data.

Do not continue to the sections below until this gate is opened in Phase 1 Stage 7.

## 1. Household vocabulary and Product discovery

- [ ] Confirm household, Shopping-list, shopping-session, Product, source-capture, and review terms
      match the approved vocabulary in both locales and do not expose avoidable implementation terms.
- [ ] From the household flow, search a realistically sized Product catalogue by name and identifier;
      confirm responsive paging, clear result identity, and useful compact metadata.
- [ ] Confirm suggestions use the approved concept/group/tag metadata without silently selecting a
      weak match. Correct a suggestion, deliberately create a Product, and leave one item unlinked.
- [ ] Reload and confirm links and corrections persist without accidental duplicate Products.

## 2. High-throughput review and administration

- [ ] Open realistically large synthetic source-capture and entry queues. Confirm their relationship,
      counts, filters, progress, and resumability are understandable.
- [ ] Process a sequence equivalent to accept, accept, later, accept, decline, correct, accept using
      keyboard controls; repeat the essential path at a narrow touch viewport. Confirm focus and next-
      item movement stay predictable.
- [ ] Interrupt and resume. Confirm deferred work remains findable, corrections and decline reasons
      persist, and no action is applied twice.
- [ ] Trigger an overlapping/stale decision and confirm understandable conflict feedback, preserved
      edits, and safe recovery. Exercise undo only for an action explicitly documented as reversible.
- [ ] Apply a source-level action and confirm the preview/confirmation states exactly how child entries
      will be affected.
- [ ] Confirm Site Admin, Developer Admin, review, maintenance, and diagnostics navigation has a clear
      purpose and does not mix routine review with dangerous operational actions.

## 3. Shopping-list-first shop session

- [ ] Build a Shopping list, start shopping with one active Shop Market and date, and repeat with a
      saved custom shop. Confirm the Shopping list remains the main workspace and the session feels
      like contextual detail rather than a second list.
- [ ] Mark planned rows bought/not bought and add an unplanned purchase. Confirm bought actions are
      automatically tracked in the active session and unbought rows remain list work.
- [ ] Confirm applicable price information and package math clearly cover base, offer, coupon,
      loyalty, manual, substitution, no-price, stale, future, conditional, expired, and incompatible
      states where those states remain in the approved design.
- [ ] Select an alternate bounded match and confirm package count, price, total, and explanation
      recalculate. Leave a line unresolved and confirm the approved skip/correction behavior.
- [ ] Record or correct actual Product, amount/unit, paid price/currency, acquisition date, and expiry;
      confirm the resulting Stock Batch and evidence candidate contain the entered values.
- [ ] Reload, cancel, resume, and retry the supported session states. Confirm no duplicate Product,
      Batch, purchase, price observation, or visible result is created.
- [ ] Finish shopping and confirm purchased rows are applied to household stock while unresolved or
      unpurchased rows remain on the open Shopping list.
- [ ] At desktop and narrow viewports, confirm the household and list/session details remain visually
      separated, usable, and non-overlapping in both themes.

## 4. Receipt reconciliation and catalogue bridge

- [ ] Upload each approved digital-receipt fixture from an active session. Confirm file validation,
      progress, safe error handling, retry, and the documented raw-file/privacy behavior.
- [ ] Reconcile matched, uncertain, missing, and extra receipt lines. Correct identifiers, Products,
      amounts, units, prices, currency, shop, and date where supported.
- [ ] Confirm receipt-only purchases become unplanned bought list rows, confidently reconciled rows
      complete the intended list work, and uncertain rows never silently change shared Product facts.
- [ ] Confirm resulting price observations carry the expected Product/shop/date/source context and are
      idempotent across reload and upload retry.
- [ ] Finish with no receipt and separately with unresolved receipt rows. Confirm both paths explain
      pending work and preserve a safe later-review path.
- [ ] Review a receipt-derived catalogue candidate as accept, later, decline with reason, and correct;
      confirm provenance, confidence, localized feedback, Activity/audit output, and stale handling.

## 5. Crawl lifecycle, archive, and repair

- [ ] Run repeated approved crawl fixtures that contain exact and near duplicates. Confirm exact
      captures do not duplicate work and near matches are grouped without silently deleting distinct
      unresolved evidence.
- [ ] Process a grouped candidate and confirm source provenance remains inspectable and corrections do
      not mutate raw evidence.
- [ ] Run the approved lifecycle/minimization operation. Confirm counts, terminal-state retention,
      failures, retry behavior, and database-size effect match the documented policy.
- [ ] Review Crawl Snapshot archive output on an approved disposable database. Open `manifest.json`,
      compare counts/checksums with the command summary, and inspect only decompressed gzip JSONL shape
      and redacted metadata. Do not import, repair, commit, or expose raw payloads.
- [ ] Run the Lidl repair dry run with `npm run repair:lidl-brochure -- --snapshot-id=<id> --limit=1`.
      Confirm it is read-only by default and raw payload/provenance remain unchanged.
- [ ] In the redesigned crawl/source review UI, confirm dark-theme evidence/JSON/price-observation
      controls, localized navigation, dismissal behavior, readable detail, and safe raw-data handling.

## 6. Final integrated evidence

- [ ] Repeat the core household → Product link → list → shop session → receipt reconciliation → stock
      and price-observation journey with two authorized users where roles differ.
- [ ] Confirm authorization, stale writes, visible success/failure, Activity/audit history, retry
      idempotency, and absence of silent errors across the integrated journey.
- [ ] Repeat the critical path in English/Hungarian, light/dark, and desktop/narrow combinations.
- [ ] Review every note and discovery. Record a fix commit and retest, or an explicit waiver with risk,
      owner, reason, and follow-up phase.
- [ ] Record final candidate, automated results, configured-smoke results, receipt fixtures, crawl/
      archive evidence, browser evidence, and approved waivers without private data.

## Findings and evidence

Use one entry per finding and preserve the history after fixes.

### Finding template

- Finding id:
- Date/tester:
- Section/item:
- Account/locale/theme/viewport:
- Expected:
- Observed:
- Safe reproduction:
- Severity: `blocker` / `high` / `medium` / `low` / `post-Phase-1`
- Owning stage:
- Fix commit or waiver:
- Retest result:

### Final evidence

- Date/environment/tester/commit:
- Automated evidence:
- Configured Mongo evidence:
- Receipt/crawl fixtures:
- Browser/manual evidence:
- Waivers and follow-ups:
