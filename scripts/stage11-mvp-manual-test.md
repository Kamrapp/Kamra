# Kamra Stage 8–11 MVP manual verification

Status: Live integrated runbook, ready for the Stage 11 operator pass. This document is the single
replacement for `scripts/stage8-demo-manual-test.md` and the Stage 8–10 manual checklist. Do not
run the older documents as a separate acceptance session.

This file is intentionally operator-editable. Add notes, screenshots, reproduction details, and
discoveries under the relevant section. Never add credentials, tokens, private household data, or
raw production exports. A later fixer session must diff operator edits before changing behavior.

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

- [ ] `npm test` passes.
- [ ] `npm run test:integration` passes and reports named cross-layer scenarios.
- [ ] `npm run format:check` passes.
- [ ] `npm run lint -- --max-warnings=0` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build:web` passes.
- [ ] `npm run build:api` passes.
- [ ] `npm run smoke:catalog` passes against an approved disposable/configured database.
- [ ] `npm run smoke:transactions` passes with committed `2`, rollback `0`, and cleanup confirmed.
- [ ] Read-only ingestion quality audit completes; every issue has a parser, repair, defer, or
      waiver decision.
- [ ] Processed-ingestion validation completes with no unexplained pending or failed snapshots.
- [ ] Archive export manifest counts and checksums are independently verified before repair/import.
- [ ] Configured maintenance preview shows validator and data actions separately.

Operator notes and discoveries:

<!-- Add commands, environment names, output summaries, and failures here. -->

## 1. Access, identity, Manual, and diagnostics

- [ ] Anonymous user reaches only public/sign-in surfaces; protected Home, admin, and household
      routes show the intended sign-in state.
- [ ] Controlled user A can sign in and sees only the allocated household.
- [ ] User A creates or opens a household and can manage it as owner.
- [ ] User A invites/accepts controlled user B if the invitation path is enabled; B sees the shared
      household, while an unrelated user sees no household data.
- [ ] Admin-only Developer Admin, Site Admin, maintenance, feature-flag, pricing, and ingestion
      review surfaces reject a normal user with the intended 403/unauthorized behavior.
- [ ] The Manual page is reachable from the rail; household/shopping content is available to normal
      users, while product/ingestion content is admin-only. Check English and Hungarian terminology.
- [ ] Activity console shows concise action start/success/failure messages, mirrors errors to the
      browser console as designed, identifies the affected object where available, scrolls, and
      resizes only its output area.
- [ ] Health/diagnostic output identifies the effective database without exposing secrets or raw
      private data.

Operator notes and discoveries:

## 2. Seeded household and settings

Prepare the approved demo fixture using the documented local seed flow. The fixture should cover:

- one targeted Product Group with two Products (two milk variants);
- one targeted Product Group with two Products (white and rye bread);
- no-target groups with multiple healthy products (vegetables and fruit);
- a one-Product group and an empty group;
- unassigned Products;
- Products with zero, one, and multiple Batches;
- expired, future-expiring, no-expiry, below-minimum, at-minimum, at-target, and above-target
  states.

- [ ] Seed/reseed completes without validator errors or productless Stock Batches.
- [ ] Refreshing Home shows Product Groups plus Unassigned Products, then Products, then Batches;
      no Product Concept or Stock Target top-level vocabulary remains.
- [ ] Manage household exposes editable expiry policy, default max-limit multiplier, group-target
      shopping mode, and sensible household properties; save gives visible feedback and survives
      refresh.
- [ ] Default `allowExpiredItems` behavior is permissive. Turning it off keeps expired Batches
      visible but excludes them from derived Current/consumption; turning it on includes them again.
- [ ] Group-target mode defaults to adding Products and a Group impulse only when needed. Verify
      Product-only and Ignore group targets modes save and survive refresh.

Operator notes and discoveries:

## 3. Home Product Group → Product → Stock Batch workspace

### Group and Product structure

- [ ] Groups start expanded; Products with Batches start collapsed; empty rows have no inert
      disclosure control.
- [ ] Group rows show compact Minimum, Current, Target, Unit, state, and fixed actions. Current is
      derived and not independently editable.
- [ ] Product rows show their own identity, group assignment, Product target state, and fixed
      action positions. Product Group dropdown initially shows the actual assignment.
- [ ] Batch rows show Quantity aligned under Product Current, then Stocked at and Expiry without
      overlap; expired dates and status badges use the correct muted danger/good/warning colors.
- [ ] Batches are ordered expired first, then soonest future expiry, then no-expiry last.
- [ ] Expiry before Stocked at is accepted and remains persisted.
- [ ] Unassigned Products use a slim separator/presentation, not an obtrusive warning block.
- [ ] No productless “Needs Product” Batch remains; every Batch has a Product owner.

### CRUD and derived data

- [ ] Create, rename, edit details, discard/cancel, and delete a Group. Products and Batches remain
      attached or become unassigned according to the approved policy; no history disappears.
- [ ] Create, rename, reassign, edit GTIN/Note, discard/cancel, and delete a Product. Existing
      Batches and historical snapshots remain intact.
- [ ] Add a Product with no Batch; it appears with zero Current. Add a Batch later without changing
      Product identity.
- [ ] Add a second Batch to an existing Product. It contributes to the same Product and Group
      automatically and does not create a duplicate Product/Group contribution.
- [ ] Correct Batch quantity upward and downward, and edit Stocked at/Expiry. Derived Product and
      Group Current values refresh without 404/500 errors.
- [ ] Discard a Batch without entering edit mode first. Confirm the action, activity result, and
      resulting history/status are understandable.
- [ ] Test Product Group/Product/Batch stale revision or concurrent-edit failure. The old state
      remains intact and the UI explains the conflict.
- [ ] Save from the inline editor and from the right-side editor. Each path clears the other editor,
      leaves no stale edit mode, and shows refreshed data.
- [ ] Add Product from a Group and Add Batch from a Product. Add Batch opens only the Batch editor;
      parent identity and assignment remain unchanged.
- [ ] Open Group/Product/Batch details. Disclosure controls use right/down arrows; details do not
      edit unrelated rows; target values use clear “Configured/Not set” terminology.
- [ ] Confirm aggregate amounts, minimum/target state, next expiry, expiring count, no-expiry, and
      combined low-stock/expiry explanations are consistent after every mutation.

### Visual, responsive, and accessibility checks

- [ ] Desktop light theme: table columns, fixed header, action columns, right editor, and shopping
      panel remain aligned and scroll correctly.
- [ ] Desktop dark theme: all surfaces, state colors, disabled/error controls, date fields, and
      activity console have readable contrast.
- [ ] Narrow/mobile layout: no critical actions or dates overlap; tables scroll intentionally;
      panels collapse/grow correctly and do not leave unexplained empty space.
- [ ] Group/Product/Batch controls have stable widths, keyboard labels/tooltips, focus visibility,
      and non-color text for important states.
- [ ] About page buttons are vertically centered; Manual header/tabs/content remain compact.
- [ ] Loading, empty, validation, 403, 404, 409, and 500 states are visible and localized.

Operator notes and discoveries:

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
- [ ] Repeat application/reload/retry. No duplicate Product, Batch, Movement, or list side effect.

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
- [ ] Resume a partially processed Trip and retry the same completion. Confirm idempotent results,
      transaction rollback on failure, and stale-revision guidance.
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
- [ ] Confirm feature-flag update audit records, defaults, failure values, and revision conflicts.
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
