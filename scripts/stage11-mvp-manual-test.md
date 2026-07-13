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

Automated local preflight: [x] `npm run mvp:preflight` passed on the current candidate with 269
unit tests, 8 deterministic integration tests, formatting, lint, typecheck, web build, and API
build. Repeat it only when the candidate changes; record any new failure in the evidence log.

- [ ] On the approved disposable environment, run the configured catalogue and transaction smokes.
      Record database name, collection cleanup, committed/rolled-back counts, and whether the run used
      the expected validator/transaction path.
- [ ] Run the maintenance preview and confirm validator actions and data actions are shown as
      separate operator actions.
- [ ] Set `SEED_DEMO_HOUSEHOLD_PASSWORD`, run `npm run seed:demo-household`, then run
      `npm run smoke:demo-household`. Record the fixture smoke result.
- [ ] When cleanup is required, run
      `npm run teardown:demo-household -- --confirm=demo-household` and confirm only the reserved demo
      household and its household-scoped records are removed.

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

- [ ] As an anonymous user, open protected Home, household, and admin routes. Confirm the intended
      sign-in state and no protected data.
- [ ] Sign in as controlled user A. Confirm the allocated household is visible; create one household
      from an empty account if needed and confirm it survives refresh.
- [ ] As the owner, invite an existing user and a valid not-yet-registered email. Confirm both
      pending rows appear in Household management and the secondary account rail.
- [ ] Confirm the owner can cancel a pending invitation. Confirm the invited user can accept or
      reject it, and that accepted/rejected/cancelled rows disappear from all affected views.
- [ ] Confirm a later registration claims its pending invitation. Confirm an unrelated user sees no
      invitation or household data, duplicate owner invitations are rejected, and accepted rows vanish.
- [ ] In Household management, confirm accepted members are visible to owner and member. Confirm
      owner removal and ownership transfer, then confirm a member can leave; refresh after each action.
- [ ] Open the Manual page in English and Hungarian. Confirm household/shopping content is available
      to normal users and product/ingestion content is admin-only. Confirm terminology rows are readable
      and vertically centered at desktop and narrow widths.
- [ ] Confirm the bottom-left Navigate block stays attached above Activity, goes back/forward without
      duplicate entries, and Activity shows concise, colored, identified action/error entries.
- [ ] Resize Activity output between 5rem and 20rem. Confirm only the output area changes and the
      default is approximately 10rem.
- [ ] Confirm health/diagnostic output identifies the effective database without secrets or raw
      private data. Check the Hungarian empty health state and recent household wording.

Operator notes and discoveries:

The one-household-from-empty-account path is accepted; multiple households are not an MVP
requirement. Invitation placement/title, member actions, and the final readable Manual/Activity
pass remain worth checking after the latest build.

## 2. Demo household and household settings

- [ ] Confirm the seeded fixture contains: targeted milk and bread groups with two Products each;
      no-target vegetables and fruit groups; a one-Product group; an empty group; and unassigned
      Products.
- [ ] Confirm Products with zero, one, and multiple Batches show `(0)`, `(1)`, or `(n)` and update
      after a Batch is added or discarded.
- [ ] Confirm the fixture visibly covers expired, future-expiring, no-expiry, below-minimum,
      at-minimum, at-target, and above-target states.
- [ ] In Household management, confirm the compact title/field grid, shared button sizing, household
      properties, expiry policy, default multiplier, grouped-target mode, and distribution mode. Save,
      reload, and confirm visible feedback and persistence.
- [ ] Confirm the default expiry policy includes expired Batches. Turn it off and confirm expired
      Batches remain visible but are excluded from derived Current/consumption; turn it on again.
- [ ] Select each reset scope on a disposable household. Confirm the checkbox is required, the
      description and final confirmation name the selected scope, and only the intended layer is
      cleared. Include Shopping lists/trips, Batches only, Products plus Batches, Groups plus Products
      plus Batches, and all household content.
- [ ] Confirm complete household deletion removes identity, memberships, invitations, and content,
      then returns safely to Home. Confirm non-owner management is read-only.

Operator notes and discoveries:

If a Group minimum is edited without an explicit desired restock amount, the current MVP keeps the
target explicit rather than deriving it from the household multiplier. Treat automatic desired
restock derivation as deferred rather than a test failure.

## 3. Home Product Group → Product → Stock Batch workspace

### Structure and derived values

- [ ] Confirm the Home vocabulary is Product Group, Product, and Stock Batch only. Groups start
      expanded, Products with Batches start collapsed, and empty rows have no inert disclosure control.
- [ ] Confirm the Unassigned Products separator has a small italic title, Group-like light text,
      stronger border, and a softened Group-like surface distinct from Groups and Batch rows. Its Add
      Product icon occupies the same action column as real Groups.
- [ ] Confirm Group and Product rows expose compact Minimum, Current, Target, Unit, state, and fixed
      action positions. Current is derived and not independently editable.
- [ ] Confirm Batch rows leave unused child-action positions empty, keep Details/Edit/Discard aligned,
      and keep Discard in the final action column.
- [ ] Confirm Batch Quantity aligns under Product Current; Stocked at and Expiry do not overlap.
      Confirm expired dates and state badges use readable muted danger/good/warning colors in both themes.
- [ ] Confirm Batches order expired first, then soonest future expiry, then no-expiry last. Confirm
      the browser renders that order and that expiry before Stocked at remains accepted and persisted.
- [ ] Confirm Batch titles use source plus stocked-at date, with italic Manual as fallback, for
      example `Lidl (2026-07-14)`. Edit the title date and confirm Stocked at changes in place.

### CRUD, editors, and integrity

- [ ] Create, rename, edit details, discard/cancel, and delete a Group. Confirm its Products and
      Batches remain attached or become unassigned according to the displayed policy.
- [ ] Use the Group unit selector and Custom option. Enter `test`, reload, and confirm storage is
      represented as `custom:test` while the table shows italic `test`; built-in and Custom controls stay
      side by side without layout jumps.
- [ ] Create, rename, reassign, edit GTIN/Note and Tracking unit, discard/cancel, and delete a
      Product. Confirm the Group dropdown initially shows its actual assignment and Product details
      remain on one line in normal mode.
- [ ] Add a Product with no Batch, then add one and multiple Batches. Confirm Product and Group
      Current values update once per physical Batch and no duplicate contribution appears.
- [ ] Edit Batch quantity, Stocked at, and Expiry from the inline row and the right-side editor.
      Confirm each save clears the other editor, refreshes the row, and updates Product/Group totals.
- [ ] Discard a Batch without entering edit mode first. Confirm the action, Activity result, and
      resulting history/status are understandable.
- [ ] Open Group/Product/Batch details. Confirm disclosure controls use right/down arrows, target
      values say Configured/Not set, and details do not edit unrelated rows.
- [ ] Save a stale Group, Product, and Batch revision from two views. Confirm the old state remains,
      the message says the item changed elsewhere and must be refreshed, and Activity uses the same
      actionable explanation.

### Visual, responsive, and accessibility checks

- [ ] In the light theme, confirm Group/Product/Batch surfaces are visibly separated with sufficient
      contrast, state badges are rounded and readable, and the fixed header/body/action tracks align.
- [ ] In the dark theme, confirm surfaces, state colors, disabled/error controls, date fields, and
      Activity remain readable without excessive brightness.
- [ ] At a narrow/mobile viewport, confirm tables scroll intentionally and no date, action, or
      critical control overlaps. Confirm panels collapse/grow without unexplained empty space.
- [ ] Confirm keyboard labels/tooltips, focus visibility, stable control widths, and non-color text
      for important state meanings.

Operator notes and discoveries:

The Group/Product/Batch structure, CRUD, derived-data behavior, responsive layout, and basic
accessibility have prior accepted evidence. Repeat the compact amount tracks, Unassigned action
alignment, and badge/theme checks after the final shopping/UI build.

## 4. Shopping list and household purchase application

- [ ] With no active list, click Build shopping list. Confirm checkboxes appear in the main Product
      Group/Product table, scale defaults are selected, and individual checkboxes can be added/removed.
      Changing scale reseeds the defaults without losing the ability to edit selection afterward.
- [ ] Confirm Build is disabled while an active generated list exists. Cancel the build state without
      creating a list; cancel an active list and confirm the controls return to the initial state.
- [ ] Select a steady Product and a Group manually, generate, and confirm exactly those owners appear
      once. Confirm generation exits selection mode, expands Shopping list, collapses Household stock,
      and hides the right-side stock editors; the list grows without collision.
- [ ] Verify one configured Group under each saved grouped-target mode: add Products plus Group
      impulse when needed, Products only, and Ignore group targets. Confirm product quantities use
      Target minus Current, current above Target is good and does not generate another need, and earliest
      expiry/first Product fallback is visible where applicable.
- [ ] Confirm the even and proportional group-distribution settings produce their expected visible
      Product split for a Group shortage above Product targets.
- [ ] Confirm selected owners have the muted bordered surface and disclosure arrow treatment used by
      the workspace; Product, Group, and impulse rows remain distinguishable.
- [ ] Add the same impulse name twice with casing/accents changed. Confirm one row remains, the
      second attempt leaves the field filled, does not increase the amount, and logs the already-added
      result. Confirm a unit conflict gives a clear warning.
- [ ] Type the name of an existing household Product into quick add. Confirm the unit auto-matches,
      the unit controls are locked for the backed Product line, and the line remains associated with
      that Product after reload.
- [ ] Edit planned and purchased amounts, skip/restore/regenerate lines, and confirm additive
      impulse changes affect planned quantity without silently changing purchased quantity.
- [ ] Mark a Product line purchased, adjust its quantity, and finalize. Confirm a Product-owned Batch
      appears with the expected date/quantity, Product/Group Current refreshes without a second manual
      refresh, the completed list clears visibly, and a success toast/Activity message explains what was
      saved.
- [ ] Apply a Group impulse line. Confirm a concrete household Product is created under the intended
      Group before its Batch is acquired; repeat/reload once and confirm no duplicate result appears.

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
- [ ] In admin review, accept, decline with a reason, and correct a review item. Confirm status,
      decline reason, match confidence, localized feedback, stale-review conflict, and preserved history.
- [ ] In admin, create a Shop Market, Shop Product, and Price Observation. Confirm invalid forms,
      successful/failing feedback, Activity entries, and overlapping-action handling.
- [ ] Verify base, offer, coupon, loyalty, manual, substitution, and no-price states in both locales
      and at a narrow viewport.

Operator notes and discoveries:

Shopping Trip browser verification was previously skipped after 400/404 creation failures; repeat
it now that the API defaults unnamed Custom trips and the route/integration path is covered. The
deeper ingestion-review workflow was intentionally deferred until this focused pass.

## 6. Developer Admin, feature flags, and maintenance

- [ ] Confirm the feature-flag table is rendered from registry/API metadata. Toggle compact UI labels,
      refresh Home, and confirm abbreviated state labels change; toggle it back and confirm full labels.
- [ ] Confirm controlled alpha access saves on checkbox interaction, Create alpha user remains the
      separate action, the approved user flow works, and ordinary users remain unauthorized.
- [ ] Open Manage users. Confirm password reset, delete confirmation, sole-owner household cleanup,
      shared-household owner promotion, and self-delete protection.
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

- [ ] Create a duplicate Product name and save a stale Group/Product/Batch. Confirm known conflicts
      are translated into an actionable message rather than raw codes or identifiers.
- [ ] Retry a successful purchased-line completion operation. Confirm it is rejected or idempotent,
      creates no second Product/Batch/Purchase, and leaves a visible Activity entry.
- [ ] Toggle expiry inclusion and compare derived Current with an expired Batch present.
- [ ] Force a validation, 403, 404, 409, and 500 response through a safe UI/API path. Confirm visible,
      localized feedback and preserved prior state.

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

| Area                      | Covered and accepted                                                                                                                                                                                                   | Boundary or retest note                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Automated preflight       | Deterministic integration, full tests, formatting, lint, typecheck, web/API build, and diff checks passed on the current candidate.                                                                                    | Repeat only after a candidate changes.                                       |
| Catalog/transactions      | Catalog smoke and transaction smoke have recorded successful commit/rollback evidence.                                                                                                                                 | Re-run only with approved configured data.                                   |
| Automated household rules | Shopping-scale eligibility, Product/Group target boundaries, quick-add normalization, target comparison, read-model ordering, expiry inclusion, physical Batch counts, and Group aggregation have focused tests.       | Browser presentation and operator feedback remain manual.                    |
| Demo fixture              | Seeded Product Group/Product/Batch coverage, expiry permutations, unassigned Products, batch counts, and no productless Batch are validated by the fixture smoke.                                                      | Browser appearance remains manual.                                           |
| Access and identity       | Protected routes, empty-user household creation, invitation placement/claiming, isolation, and admin authorization have prior accepted evidence.                                                                       | Member-action and final two-user retests remain active above.                |
| Manual and diagnostics    | Manual tabs/visibility, locales, effective database diagnostics, Activity logging, sizing, and rail navigation have prior accepted evidence.                                                                           | Repeat readability checks after final UI changes.                            |
| Household management      | Settings, expiry/target modes, reset scopes, complete deletion, owner controls, non-owner read-only behavior, and safe Home return have prior accepted evidence.                                                       | Final disposable retest remains active above.                                |
| Home workspace            | Product Group hierarchy, CRUD, assignment, aggregation, ordering, custom units, Batch titles, stale-revision feedback, action positions, responsive behavior, and accessibility have prior accepted evidence.          | Final alignment/theme checks remain active above.                            |
| Shopping basics           | Product Group selection, scale defaults, group modes/distribution, duplicate impulse handling, list editing, completion bridge, refresh/clear feedback, and Product-owned stock behavior have prior accepted evidence. | Browser confirmation and known-product quick-add retest remain active above. |
| Admin and maintenance     | Dynamic feature-flag metadata, alpha auto-save, user management, maintenance registry separation, and diagnostics have prior accepted evidence.                                                                        | Configured archive/repair and ingestion review remain active above.          |
| Intentional deferrals     | Automatic desired-restock derivation, classification/tagging UX, and deeper ingestion/catalogue policy expansion remain outside the current MVP closure.                                                               | Revisit only through a post-MVP plan.                                        |
