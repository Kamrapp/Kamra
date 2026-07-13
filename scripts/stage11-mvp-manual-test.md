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
- [ ] Archive export manifest counts and checksums are independently verified before repair/import.
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

- [ ] Recheck the minimal household invitation lifecycle without email delivery: the owner invites
      an existing user and a not-yet-registered email, both pending rows are visible, the existing
      user can accept, and later registration claims the second invitation.
- [ ] Confirm an unrelated signed-in user sees no invitation or shared household, duplicate owner
      invites are rejected with feedback, and accepted invitations disappear from the pending list.
- [ ] Recheck the compact, table-like Manual terminology in English and Hungarian for readability.
- [ ] Recheck that the Activity console is slightly taller by default and its resize handle still
      changes only the output area.

Operator notes and discoveries:

The access, authentication, one-household creation, admin authorization, Manual navigation/tab
visibility, Activity behavior, and diagnostic-output checks are accepted below. Multiple household
management is not an MVP requirement. The invitation, compact-reference, Activity-height, navigation,
and settings-layout changes are implemented and remain active only as focused retests.

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

- [x] Seed/reseed completes without validator errors, then the demo fixture smoke passes.
- [x] Refreshing Home shows Product Groups plus Unassigned Products, then Products, then Batches;
      no Product Concept or Stock Target top-level vocabulary remains.
- [x] Manage household exposes editable expiry policy, default max-limit multiplier, group-target
      shopping mode, and sensible household properties; save gives visible feedback and survives
      refresh.
- [x] Default `allowExpiredItems` behavior is permissive. Turning it off keeps expired Batches
      visible but excludes them from derived Current/consumption; turning it on includes them again.
- [x] Group-target mode defaults to adding Products and a Group impulse only when needed. Verify
      Product-only and Ignore group targets modes save and survive refresh.

Operator notes and discoveries:
If a group minimum is edited without a desired restock amount, a future improvement could derive the
desired amount from the household multiplier. Defer this because changing it now would alter the
target contract/schema; the current explicit target behavior is accepted for MVP.

New focused retests:

- [ ] Product rows show `(0)`, `(1)`, or `(n)` Batch counts and update after adding/discarding a Batch.
- [ ] Manage household uses a compact title/field grid and the smaller back button; its settings
      still save with visible feedback and survive refresh.
- [ ] The left rail Navigate block goes back/forward through visited pages without duplicating
      entries after a history move.
- [ ] In Manage household, select each reset scope and confirm that its description is clear, the
      checkbox is required, and the final confirmation names the selected scope. On a disposable
      household, verify Shopping lists and trips, Batches only, Products and batches, Groups plus
      Products and batches, and All household content each clear the intended layer while keeping
      the household identity, members, and settings.

Focused retest cleanup, when the disposable environment should be empty afterwards:

```powershell
npm run teardown:demo-household -- --confirm=demo-household
```

This removes only the reserved demo household, its demo users, household-scoped V2 test records,
and demo seed-ledger entries. It does not remove shared catalogue, shop-market, or price data.

## 3. Home Product Group → Product → Stock Batch workspace

### Group and Product structure

- [x] Confirm Batch rows leave the child-action position empty and keep Details, Edit, and Discard
      aligned with the other row action sets, with Discard in the final position.
- [x] Confirm the Unassigned Products separator has a small italic title, Group-like light text,
      a stronger border, and a softened surface distinct from both Groups and Batch rows.

### CRUD and derived data

- [x] Edit a Group unit through the built-in selector and the Custom option. Entering test persists
      custom:test; the table displays italic test without the storage prefix.
- [x] Confirm Batch titles use the available source and stocked-at date, with Manual as the explicit
      fallback when no source snapshot exists. Edit the title date and confirm it updates Stocked at
      without adding a misaligned column.
- [ ] Confirm the Manual fallback in a Batch title is italic while source-backed titles remain normal.
- [ ] Confirm the compact Minimum, Current, Target, and Unit columns remain readable and Batch
      Quantity stays aligned under Product Current.
- [x] Test Product Group/Product/Batch stale revision or concurrent-edit failure. The old state
      remains intact, the UI says the item was changed elsewhere, and it tells the user to refresh
      before saving again; the Activity entry uses the same actionable explanation.
- [x] Save from the inline editor and from the right-side editor. Each path clears the other editor,
      leaves no stale edit mode, and shows refreshed data.
- [x] Add Product from a Group and Add Batch from a Product. Add Batch opens only the Batch editor;
      parent identity and assignment remain unchanged.
- [ ] Recheck Group/Product details after the latest refinement: editing a Group opens its details
      row; editing a Product keeps the main row on one line, moves Group assignment into the
      details row, makes Product id compact, and gives Note more room.
- [x] Confirm Group/Product/Batch details. Disclosure controls use right/down arrows; details do not
      edit unrelated rows; target values use clear “Configured/Not set” terminology.
- [x] Confirm aggregate amounts, minimum/target state, next expiry, expiring count, no-expiry, and
      combined low-stock/expiry explanations are consistent after every mutation.

### Visual, responsive, and accessibility checks

- [ ] Desktop light theme: the household table has visibly separated, darker row surfaces with
      readable state colors; columns, fixed header, action columns, right editor, and shopping panel
      remain aligned and scroll correctly.
- [ ] Desktop dark theme: all surfaces, state colors, disabled/error controls, date fields, and
      activity console have readable contrast.
- [ ] Narrow/mobile layout: no critical actions or dates overlap; tables scroll intentionally;
      panels collapse/grow correctly and do not leave unexplained empty space.
- [ ] Group/Product/Batch controls have stable widths, keyboard labels/tooltips, focus visibility,
      and non-color text for important states.
- [ ] About page buttons are vertically centered; Manual header/tabs remain compact, while the
      terminology text is readable and vertically centered in its rows in both locales.
- [ ] Loading, empty, validation, 403, 404, 409, and 500 states are visible and localized.
- [ ] In Hungarian, the Admin health empty state is translated, and the recent household/product
      wording reads naturally rather than exposing stale Stage 6 or internal implementation text.

Operator notes and discoveries:

The Section 3 structure and first CRUD checks are accepted in the bottom table. Remaining focused
retests are the italic Manual fallback, narrower amount columns, and the latest Group/Product
details-editor layout, plus the remaining consistency/accessibility checks and the light-theme
contrast pass above.

## 4. Shopping list and household purchase application

- [ ] Generate/build shopping starts from the current Product Group/Product data, not an unrelated
      legacy table. Group Products appear once and manual impulse items are distinct.
- [ ] Product shortages use target minus Current. Group shortage is recalculated after planned
      Products; verify the configured mode for planned Product split, earliest-expiry fallback,
      first-Product fallback, and Group impulse fallback.
- [ ] Build shopping list selects the level-eligible rows automatically. Changing the scale resets
      selection from the scale. Manual checkbox changes persist until generation.
- [ ] Cancel after Build removes selection mode and checkboxes. Generate exits selection mode and
      creates the list from exactly the selected rows.
- [ ] Add the same impulse name twice with different casing/accents. No duplicate is created; the
      input remains filled and Activity reports the already-added action.
- [ ] Edit, skip, restore, regenerate, and cancel shopping lines. Confirm one active list and no
      unexpected Shop Product, Price Observation, Product, or Purchase side effects.
- [ ] Mark a Product line purchased, adjust quantity, and apply. A new Product-owned Batch appears
      after refresh with the correct dates/quantity.
- [ ] Apply a Group impulse line. A concrete household Product is created under the intended Group
      before the Batch is acquired.
- [ ] Repeat application/reload once from the UI. The deterministic integration test already
      covers idempotent completion; the browser check confirms the UI exits retry/loading state and
      shows the existing result without a duplicate row.

Operator notes and discoveries:

## 5. Concrete Shopping Trip, pricing, and ingestion review

- [ ] Start a Trip from an open Shopping Need by selecting exactly one active Shop Market and date.
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

- [ ] Admin feature-flag list is rendered from registry/API metadata; no ordinary flag is missing
      because a frontend component forgot a key-specific binding.
- [ ] Toggle compact UI labels, refresh Home, and verify the visible state labels change. Toggle it
      off and verify full labels return.
- [ ] Toggle controlled alpha access only in an approved environment; verify the associated user
      workflow and authorization behavior remain coherent.
- [ ] Confirm one visible feature-flag save and failure state. Registry validation, stored override,
      defaults, and dependent response are covered by automated tests; configured maintenance or
      a deliberately stale revision remains the manual operator check only when the environment
      supports it.
- [ ] Run maintenance preview. Validator updates and data migrations are shown as separate actions;
      no “Mark complete” action falsely claims to execute external work.
- [ ] Run required validator/migration/reconciliation actions only against a disposable/approved
      target. Confirm repeat behavior and first-failure stopping.
- [ ] Export Crawl Snapshot archive, independently verify manifest/checksums, and inspect sanitized
      content without changing the source database.
- [ ] Review Lidl repair dry run. Apply only with explicit target/operator confirmation; reprocess
      corrected rows; verify raw payload and provenance remain unchanged.
- [ ] Rerun ingestion quality and processed-ingestion validation. Every pending/duplicate/failure
      result has a documented decision.
- [ ] Confirm logs include client identification where appropriate, redact secrets/private data,
      use useful levels, and show effective database names without credentials.

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

| Area                     | Covered and accepted                                                                                                                                                              | Operator note / boundary                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Automated preflight      | `npm run mvp:preflight` passed.                                                                                                                                                   | Repeat only when diagnosing a later failure.                                                   |
| Demo fixture             | Focused seed and `smoke:demo-household` passed.                                                                                                                                   | Seeded disposable household is valid for the remaining browser pass.                           |
| Catalog and transactions | Catalog smoke passed; transaction smoke passed with committed `2`, rollback `0`.                                                                                                  | Configured smoke evidence is accepted; fake tests are not a substitute.                        |
| Anonymous access         | Public/sign-in surfaces are reachable; protected routes show the intended sign-in state.                                                                                          | Accepted.                                                                                      |
| User access              | Controlled user A signs in and sees only the allocated household.                                                                                                                 | Accepted.                                                                                      |
| Household creation       | One household can be created from an empty user and managed as owner.                                                                                                             | Multiple-household management is deferred; the seeded household is sufficient for MVP checks.  |
| Admin authorization      | Normal users are rejected from Developer Admin, Site Admin, maintenance, feature flags, pricing, and ingestion review.                                                            | Accepted.                                                                                      |
| Manual access            | Rail navigation works; household/shopping content is available to normal users and product/ingestion content is admin-only; tabs work in both locales.                            | Compact terminology layout still needs the focused visual retest above.                        |
| Activity console         | Action feedback, browser-console mirroring, object context, scrolling, and output-only resizing work.                                                                             | Slightly taller default output still needs the focused visual retest above.                    |
| Diagnostics              | Effective database is identified without secrets or raw private data.                                                                                                             | Accepted.                                                                                      |
| Seeded household         | Product Groups, settings persistence, expiry policy, and group-target modes are covered by the accepted Section 2 checks above.                                                   | Desired-restock derivation remains explicitly deferred.                                        |
| Invitation backend       | Repository and route tests cover owner creation, duplicate protection, existing-user acceptance, and registration-time claiming.                                                  | Browser retest remains active; no email delivery is in scope.                                  |
| Home workspace structure | Groups/Products/Batches render in the intended three-level hierarchy; expansion, derived Current, assignment, action placement, expiry ordering, and orphan checks were accepted. | Batch action-slot alignment and Unassigned Products styling remain active above.               |
| Home CRUD                | Group/Product/Batch create, rename, detail, reassign, delete/discard, multi-Batch aggregation, and quantity/date correction were accepted without data-loss findings.             | Unit selector, Batch title/date presentation, and narrower amount columns remain active above. |
