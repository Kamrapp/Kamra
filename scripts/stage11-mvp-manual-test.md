# Kamra Stage 8–11 MVP manual verification

Status: Live integrated runbook, ready for the Stage 11 operator pass. This is the repository's
only manual acceptance document for the complete Stage 8–11 MVP journey.

This file is intentionally operator-editable. Add notes, screenshots, reproduction details, and
discoveries under the relevant section. Never add credentials, tokens, private household data, or
raw production exports. A later fixer session must diff operator edits before changing behavior.

The former Stage 8 demo script and Stage 8–10 checklist were reviewed during this consolidation.
Their still-relevant Product Group, Product, Batch, shopping, admin, maintenance, visual, and
failure checks are represented below. Obsolete Product Concept/classification workspace checks were
not carried forward because classification is intentionally outside the current stock-workspace MVP.

## Run metadata

- Date/time:
- Tester/operator:
- Branch and commit:
- Web/API build or deployment:
- Browser and version:
- Viewport(s):
- Locale(s):
- Theme(s):
- Database/environment name:
- Disposable database used for destructive/maintenance checks:
- Result: `not started` / `pass` / `pass with waivers` / `blocked`

## Operator rules

- Use normal UI/API paths. Do not edit MongoDB directly to make a test pass.
- Use a disposable or explicitly approved database for seed, migration, archive, repair, and
  transaction operations. Preserve raw crawl evidence before any approved repair.
- Record the exact expected/observed difference before asking for a fix.
- A successful HTTP response is not enough: confirm the visible result, persisted/reloaded result,
  activity log, and absence of duplicate side effects where relevant.
- Run the affected section again after each fix, then repeat the complete runbook after the final
  behavior-changing fix.

## 0. Preflight and automated evidence

Run from the repository root on the final Stage 11 implementation commit.

- [ ] Read-only ingestion quality audit completes; every issue has a parser, repair, defer, or
      waiver decision.
- [ ] Processed-ingestion validation completes with no unexplained pending or failed snapshots.
- [ ] Export a Crawl Snapshot archive with `npm run crawl:export` and the output option
      `--output=.artifacts/crawl-archives/stage11-check`, then independently verify its manifest
      counts and checksums before any repair/import. The command is read-only. Inspect
      `manifest.json` and the generated gzip JSONL files; do not commit the archive.

- [ ] Configured maintenance preview shows validator and data actions separately.

Operator notes and discoveries:

<!-- Add commands, environment names, output summaries, and failures here. -->

### Automated coverage ledger

The following cross-layer contracts are already exercised by `npm run mvp:preflight` through the
deterministic integration suite. The browser pass should verify the visible UI wiring and feedback,
not repeat database-side assertions that these tests already cover.

| Area                | Automated evidence                                                                   | Browser remainder                                                            |
| ------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Feature flags       | Registry key validation, admin PATCH persistence, dependent household response       | One admin toggle, refresh, and visible Home effect                           |
| Household stock     | Product Group → Product → Batch write/read and membership boundary                   | CRUD affordances, layout, editor synchronization, and error feedback         |
| Shopping completion | Partial Trip completion, Product-owned Batch, Ingestion Submission, idempotent retry | One bought line through the Home/Trip UI and visible resulting stock         |
| Ingestion review    | Raw snapshot → prepared review candidate/list response                               | One admin review decision and localized status feedback                      |
| Demo fixture        | `smoke:demo-household` validates seeded shape and ownership invariants               | Visual grouping, ordering, colors, and responsive layout                     |
| MongoDB behavior    | Catalog validator/index and transaction workflows                                    | Only run configured smokes; do not infer their result from fake-backed tests |

## 1. Access, identity, Manual, and diagnostics

- [ ] Recheck that pending invitations appear in both the Home Households panel and the secondary
      account-rail surface. Accept an existing-user invitation and claim a not-yet-registered
      invitation after registration; confirm accepted rows disappear.
- [ ] Confirm the Home panel title is localized as Households/Háztartások, and an unrelated user
      sees neither the invitation nor the shared household.
- [ ] Recheck the compact Manual terminology table in English and Hungarian at normal desktop and
      narrow widths; terms and definitions should be readable and vertically centered.
- [ ] Recheck the Activity console at its 10rem default, 5rem minimum, and 20rem maximum. Resize
      only its output area and confirm the Navigate block remains attached immediately above it.

Operator notes and discoveries:

The access, authentication, one-household creation, admin authorization, Manual navigation/tab
visibility, and diagnostic-output checks are accepted below. Multiple household management is not
an MVP requirement. Only invitation placement/title, compact-reference readability, and the final
Activity-height/rail attachment remain active here.

## 2. Seeded household and settings

Prepare the approved demo fixture using the focused local seed flow. Set
`SEED_DEMO_HOUSEHOLD_PASSWORD`, then run `npm run seed:demo-household` and
`npm run smoke:demo-household`. Use the full `npm run seed` only when catalogue/admin seed data
also needs to be refreshed. The fixture should cover:

- one targeted Product Group with two Products (two milk variants);
- one targeted Product Group with two Products (white and rye bread);
- no-target groups with multiple healthy products (vegetables and fruit);
- a one-Product group and an empty group;
- unassigned Products;
- Products with zero, one, and multiple Batches; the Product row should show its Batch count in
  parentheses after the identity label.
- expired, future-expiring, no-expiry, below-minimum, at-minimum, at-target, and above-target
  states.

Operator notes and discoveries:
If a group minimum is edited without a desired restock amount, a future improvement could derive the
desired amount from the household multiplier. Defer this because changing it now would alter the
target contract/schema; the current explicit target behavior is accepted for MVP.

New focused retests:

- [ ] On a disposable household, verify each content reset scope still requires its confirmation
      checkbox and clears only the described layer. Switching scopes must clear the confirmation
      checkbox. A non-owner must see static/read-only management content with mutation controls
      disabled or absent. Then select complete household deletion and confirm the household,
      memberships, invitations, and content disappear and the browser returns safely to Home.

Focused retest cleanup, when the disposable environment should be empty afterwards:

```powershell
npm run teardown:demo-household -- --confirm=demo-household
```

This removes only the reserved demo household, its demo users, household-scoped V2 test records,
and demo seed-ledger entries. It does not remove shared catalogue, shop-market, or price data.

## 3. Home Product Group → Product → Stock Batch workspace

### Group and Product structure

- [ ] Confirm the shared header and body use the same compact Minimum, Current, Target, and Unit
      tracks; header labels remain readable and Batch Quantity stays aligned under Product Current.

### Visual, responsive, and accessibility checks

- [ ] Confirm Product state badges have the same rounded, padded treatment as Group badges in both
      light and dark themes; preserve the already accepted row surfaces, contrast, responsive
      layout, controls, and localized error-state behavior.

Operator notes and discoveries:

The Section 3 structure, CRUD, derived data, responsive behavior, and accessibility checks are
accepted in the bottom table. Only the shared header/body amount-column alignment and final
state-badge treatment remain active here.

## 4. Shopping list and household purchase application

- [ ] Click Build shopping list. Checkboxes appear in the main Product Group/Product table; the
      scale selects shortage-eligible rows, manual changes persist, and changing the scale reseeds
      the selection. Groups and Products are shown once, and Group/impulse rows are distinguishable
      from normal Product rows in the generated list.
- [ ] Select an otherwise steady Product and a Group manually, generate, and confirm the resulting
      list contains exactly the selected owners. Cancel from Build removes checkboxes without
      creating a list; Generate also exits selection mode.
- [ ] Verify the generated quantities use target minus Current, then check one configured Group in
      each household group-target mode. Confirm planned Product split, earliest-expiry fallback,
      first-Product fallback, and Group impulse behavior match the setting. The deterministic
      shopping-needs test covers the arithmetic; this check is for the visible list and setting.
- [ ] Confirm shopping rows are compact enough to scan and use the expected muted Product,
      Group-level, and impulse surfaces. Edit, skip, restore, regenerate, and cancel lines without
      creating unrelated Shop Product, Price Observation, Product, or Purchase records.
- [ ] Add the same impulse name twice with different casing/accents and the same unit. Confirm one
      row remains, its amount increases additively, the input stays filled, and Activity explains the
      increase. Repeat with a different unit and confirm the add is rejected with an explanation.
- [ ] Mark a Product line purchased, adjust quantity, and apply. Confirm a Product-owned Batch
      appears with the expected date/quantity, the main workspace refreshes without a second manual
      refresh, the completed shopping list is cleared, and a finished-shopping message is visible.
- [ ] Apply a Group impulse line. Confirm a concrete household Product is created under the intended
      Group before its Batch is acquired; repeat/reload once and confirm no duplicate result appears.

Operator notes and discoveries:

## 5. Concrete Shopping Trip, pricing, and ingestion review

- [ ] Start a Trip from an open Shopping Need by selecting exactly one active Shop Market and
      date. Confirm the market list loads after the household is selected, then repeat with Custom
      shop and a saved custom shop name; the custom trip remains usable without a configured market.
- [ ] Confirm matching shows package count, expected total, applicable Price Observation, and
      explanation. No-price, stale, future, conditional, expired, and incompatible states remain
      explicit.
- [ ] Select an alternate bounded match and confirm package math, price, and explanation recalculate.
- [ ] Leave a line unresolved, verify continuation is blocked, then skip it and resume the remaining
      lines.
- [ ] Mark lines bought/not bought. Only bought lines produce stock on completion.
- [ ] Record actual Product choice, quantity, unit, paid price/currency, acquisition date, and
      expiry. Confirm these values reach the resulting Batch and pending Ingestion Submission.
- [ ] Choose an existing Household Product and separately create a genuine new Product. Confirm
      no accidental duplicate Product is created.
- [ ] Add an unplanned purchase, complete it, and verify immediate household usability plus pending
      admin review.
- [ ] Resume a partially processed Trip and retry completion from the UI. Integration and
      transaction smoke cover the persistence/idempotency and MongoDB transaction claims; the
      browser check is limited to resume state, feedback, and no duplicate visible result.
- [ ] Admin lists, accepts, rejects, and corrects an Ingestion Submission. Stale review is rejected;
      household history and snapshots are not rewritten.
- [ ] Admin creates a Shop Market, Shop Product, and Price Observation. Invalid forms fail locally;
      successful/failing requests provide feedback and Activity entries; overlapping actions are
      disabled.
- [ ] Verify base, offer, coupon, loyalty, manual, substitution, and no-price states in both
      locales and with a narrow viewport.

Operator notes and discoveries:

## 6. Developer Admin, feature flags, and maintenance

- [ ] Review the Crawl Snapshot archive procedure on an approved/disposable database. After the
      Section 0 export, inspect the manifest and sanitized content without changing the source.
- [ ] Review the Lidl repair dry run with `npm run repair:lidl-brochure`, using
      `--snapshot-id=<snapshot-id>` and `--limit=1`. This is a read-only plan by default. Apply
      only with explicit target/operator confirmation using `--apply`, `--target=<database>`, and
      `--operator=<identity>`; raw payload and provenance must remain unchanged.

- [ ] Rerun ingestion quality and processed-ingestion validation. Every pending/duplicate/failure
      result has a documented decision.
- [ ] In the Crawl review dialog, confirm Save draft, Add empty price observation, and Apply JSON
      use dark themed surfaces in dark mode while retaining readable light-mode controls.

Operator notes and discoveries:

## 7. Final evidence and waiver review

- [ ] Repeat the complete runbook from a clean refresh without direct database edits.
- [ ] Repeat the critical household/shopping path with two users and both locales.
- [ ] Review every operator note and discovery. Each is fixed, retested, explicitly deferred to
      post-MVP, or waived with risk, owner, reason, and follow-up.
- [ ] Update the evidence log with date, environment, tester, final commit, and command results.
- [ ] Confirm the old Stage 8 script and Stage 8–10 checklist link here and are no longer treated as
      separate acceptance sources.
- [ ] Only after all required items are resolved or waived: mark MVP closure ready.

## 8. Known risk probes

Run these probes deliberately even when the main flow appears healthy. They are compact reminders
of the failure classes most likely to cross a frontend/API/persistence boundary.

- [ ] Save the same Group, Product, or Batch from inline and right-side editors in both orders;
      confirm no stale editor, duplicate write, or lost revision remains.
- [ ] Toggle expired-item inclusion around an expired Batch and compare the visible Current,
      Product Group aggregate, and generated shopping need.
- [ ] Use two Products and multiple Batches in one Group; confirm each physical Batch contributes
      once to its Product and the Group, including after refresh and retry.
- [ ] Add the same impulse item twice and retry a purchased-line application; confirm duplicate
      operations are rejected or treated idempotently with a visible Activity entry.
- [ ] Force or reproduce a stale revision, missing schema/maintenance setup, untranslated label,
      dark-theme contrast issue, fixed-column overflow, and failed action; confirm each has an
      understandable UI result rather than a silent no-op.

Operator notes and discoveries:

## Fix/discovery log

Use one entry per finding. Do not erase previous entries after fixing; add the fix commit and
retest result.

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

## 10. Covered and accepted

Move completed checks here as the runbook progresses. Keep active sections limited to outstanding
work, retests, and decisions. This table records operator evidence without repeating full test steps.

| Area                     | Covered and accepted                                                                                                                                                                                     | Operator note / boundary                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Automated preflight      | `npm run mvp:preflight` passed.                                                                                                                                                                          | Repeat only when diagnosing a later failure.                                                  |
| Demo fixture             | Focused seed and `smoke:demo-household` passed.                                                                                                                                                          | Seeded disposable household is valid for the remaining browser pass.                          |
| Catalog and transactions | Catalog smoke passed; transaction smoke passed with committed `2`, rollback `0`.                                                                                                                         | Configured smoke evidence is accepted; fake tests are not a substitute.                       |
| Anonymous access         | Public/sign-in surfaces are reachable; protected routes show the intended sign-in state.                                                                                                                 | Accepted.                                                                                     |
| User access              | Controlled user A signs in and sees only the allocated household.                                                                                                                                        | Accepted.                                                                                     |
| Household creation       | One household can be created from an empty user and managed as owner.                                                                                                                                    | Multiple-household management is deferred; the seeded household is sufficient for MVP checks. |
| Admin authorization      | Normal users are rejected from Developer Admin, Site Admin, maintenance, feature flags, pricing, and ingestion review.                                                                                   | Accepted.                                                                                     |
| Manual access            | Rail navigation works; household/shopping content is available to normal users and product/ingestion content is admin-only; tabs work in both locales.                                                   | Only compact terminology readability remains active.                                          |
| Activity console         | Action feedback, browser-console mirroring, object context, scrolling, and output-only resizing work.                                                                                                    | Only the final height and Navigate attachment retest remains active.                          |
| Diagnostics              | Effective database is identified without secrets or raw private data.                                                                                                                                    | Accepted.                                                                                     |
| Seeded household         | Product Groups, settings persistence, expiry policy, and group-target modes are covered by the accepted Section 2 checks above.                                                                          | Desired-restock derivation remains explicitly deferred.                                       |
| Invitation backend       | Repository and route tests cover owner creation, duplicate protection, existing-user acceptance, and registration-time claiming.                                                                         | Browser check remains only for Home placement/title; no email delivery is in scope.           |
| Household management     | Compact owner controls, settings persistence, invitation management, reset scopes, complete deletion, and owner-only read-only handling were accepted in the operator pass.                              | Final disposable reset/deletion retest remains active.                                        |
| Navigation rail          | Back/forward navigation does not duplicate entries and the Navigate block is attached above Activity.                                                                                                    | Final height/attachment retest remains active.                                                |
| Home workspace structure | Groups/Products/Batches render in the intended three-level hierarchy; expansion, derived Current, assignment, action placement, expiry ordering, orphan checks, and visual responsiveness were accepted. | Amount-track alignment and state-badge treatment remain active above.                         |
| Home CRUD                | Group/Product/Batch create, rename, detail, reassign, delete/discard, multi-Batch aggregation, quantity/date correction, custom units, and meaningful batch titles were accepted.                        | No additional CRUD retest is active.                                                          |
| Admin controls           | Registry-driven flags, compact labels, alpha auto-save, Manage users, maintenance actions, and diagnostic logging were accepted.                                                                         | Crawl archive/repair procedure and review-dialog theme remain active.                         |
