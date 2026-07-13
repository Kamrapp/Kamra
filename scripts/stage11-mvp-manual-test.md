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

- [x] Read-only ingestion quality audit completes; every issue has a parser, repair, defer, or
      waiver decision.
- [x] Processed-ingestion validation completes with no unexplained pending or failed snapshots.
- [x] Export a Crawl Snapshot archive with `npm run crawl:export` and the output option
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

- [x] Recheck that pending invitations appear in both the Home Households panel and the secondary
      account-rail surface. Accept an existing-user invitation and claim a not-yet-registered
      invitation after registration; confirm accepted rows disappear.
      -> we should also allow owner to "cancel" invitation in the manage household place where we see the pending invite at the invite block.
      invited user sohuld also have reject button to reject invitation
      already accepted invited people should also be present in a small list in the household management of both the owner and the invited user. the owner should be able to kick other members, promote to owner by transferring the ownership and the member should be able to quit the household.
- [x] Confirm the Home panel title is localized as Households/Háztartások, and an unrelated user
      sees neither the invitation nor the shared household.
- [x] Recheck the compact Manual terminology table in English and Hungarian at normal desktop and
      narrow widths; terms and definitions should be readable and vertically centered.
- [x] Recheck the Activity console at its 10rem default, 5rem minimum, and 20rem maximum. Resize
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

- [x] On a disposable household, verify each content reset scope still requires its confirmation
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

- [x] Confirm the shared header and body use the same compact Minimum, Current, Target, and Unit
      tracks; header labels remain readable and Batch Quantity stays aligned under Product Current.

### Visual, responsive, and accessibility checks

- [x] Confirm Product state badges have the same rounded, padded treatment as Group badges in both
      light and dark themes; preserve the already accepted row surfaces, contrast, responsive
      layout, controls, and localized error-state behavior.
- minor issue that in the "unassigned products" group row, the "add product" icon is int he first iconbutton column out of the 4, but it should be in the third one. need two empty blocks before it.

Operator notes and discoveries:

The Section 3 structure, CRUD, derived data, responsive behavior, and accessibility checks are
accepted in the bottom table. Only the shared header/body amount-column alignment and final
state-badge treatment remain active here.

## 4. Shopping list and household purchase application

- [x] Click Build shopping list. Checkboxes appear in the main Product Group/Product table; the
      scale selects shortage-eligible rows, manual changes persist, and changing the scale reseeds
      the selection. Groups and Products are shown once, and Group/impulse rows are distinguishable
      from normal Product rows in the generated list.
      -> when clicking "generate shopping list", the shopping list section should automaticall expand and the household stock section collapse.
      -> there is an issue that expanding a big shopping list collides with the household stock table when both are expanded. when the household stock block is collapsed, the shopping list looks perfect, falling below the top blocks even on the right side where the editors are still there.
      -> for convenience to enlarge the shopping list further upwards, we should also hide all right-side editors when collapsing the household stock block. this would allow only a collapsed household stocks and the households block next ot it on the top and the shopping lsit can grow all the way up until there.
- [ ] Select an otherwise steady Product and a Group manually, generate, and confirm the resulting
      list contains exactly the selected owners. Cancel from Build removes checkboxes without
      creating a list; Generate also exits selection mode.
      -> when in build shopping list mode, the checboxes dont work manually, only the scale selects what it does, but selecting more items by clicking their checkbox doesnt seem to work
      -> build shopping list should not be enabled when there is already an active shopping list generated. it should be cancelled beforehand.
      -> please simplify the name of "update stocks per pourchased item". its simply integrating the purchased items of the shopping list into the household right? so kinda "finalize shopping & save new stocks" maybe? the goal is not to be short but expressive here. but o course short is nice.
      -> generating a shopping list, completing an item and clicking "update stocks per pourchased item" adds the new batch, but even afterwards. i ticked "Gyümölcsök" and got bought some Áfonya. now i have 11 kg gyümölcs and a target of 10. yet, generating the shop with the level wants to add more gyümölcsök. it seems that we have an issue with comparison to target, because the comparison symbol between the 11 current and the target 10 is yellow. it should be green. this is also true to other items I keep buying: the current is greater than the target but the comparison is yellow. I suspect that the comparison is the rong way between current and target, as towards minimum we seem to work as expected. or we still use the default multiplier based calculation over the actual target value set?
      -> try to build minimal integration tests for scenarios to check which level of shopping scale add and doesnt add certain content. separate cases so that a case simply has a specific group and product and batch combination like "group with target 2, two products with target 1 and 0.5, no stocks." shopping should buy 1 from one product, 0.5 fromt he other and 0.5 more from either or split to both, idk. anyway, such scenario should be testable and we should have a set of such integration tests around the shopping list generation calculation. note that the "When a Product Group is below target" setting oalso comes into play, so there are quite a few cases here to check. it may also be that the bug is elsewhere, but lets start here and save the tests to verify and snapshot success afterwards on this level even if bug is elsewhere. ofc fix the bug too pls.
      -> looking at the "When a Product Group is below target" options, an "Add products, then distribute group requirements evenly" and a similar "Add products, then distribute group requirement rationally" kind of setting is missing. these should mean that when a group requires a target and it has alrady products with stocks, we should either divide the required amount evenly among the poroducts, or take the ratio of their current amounts and distribute according to that. ofc this is only for extra amount above the inner product's own targets if there are such, but thats basic part of the logic here.
- [X] Verify the generated quantities use target minus Current, then check one configured Group in
      each household group-target mode. Confirm planned Product split, earliest-expiry fallback,
      first-Product fallback, and Group impulse behavior match the setting. The deterministic
      shopping-needs test covers the arithmetic; this check is for the visible list and setting.
- [x] Confirm shopping rows are compact enough to scan and use the expected muted Product,
      Group-level, and impulse surfaces. Edit, skip, restore, regenerate, and cancel lines without
      creating unrelated Shop Product, Price Observation, Product, or Purchase records.
      -> looks nice, but we should redesign the "ticked items": instead, it should follow a similar design to the unassigned products int he other table, with stronger borders. its expander should also be a lkittle arrow int he beginning to maqtch styling.
- [x] Add the same impulse name twice with different casing/accents and the same unit. Confirm one
      row remains, its amount increases additively, the input stays filled, and Activity explains the
      increase. Repeat with a different unit and confirm the add is rejected with an explanation.
      -> the "Shopping list item unit conflict" shoudl be avoided by automatically changing the editfield of the unit to match that of the same product if its already in the shopping list or exists as a lproduct int he household. so whenever we type int he name field of impulse, we should debounce and check if same-name product or shopping list entry exists. if so, we should set the unit field to match and log with debug level that we did this autoamtically to match. if user still changes unit, sure, it should ghet back to "Shopping list item unit conflict" warning.
      -> the unit field for impulse items should also be dropdown-based with possiblity as "custom" same as for the simple group/product unit property... waiot, the unit of a product is not even changeable in the table! it should be in the details section as first "Tracking unit" just like for groups! droddown and additional field when custom. Also, in the right side editor we should use the dropdown + editfield combo, not open string input. even for shopping list entries, we should have the dropdown for units. however, for simplicity, shopping list entries that have matching products int he household should have their units disabled for editing to avoid conflicts.
      -> all "cancel" little buttons with "×" should be bigger. use "X" if there is not a better big cross-symbol
      -> the more and more addition should only affect the plan amount, not the bought amount. this is generally true: adding impulse items should 
- [ ] Mark a Product line purchased, adjust quantity, and apply. Confirm a Product-owned Batch
      appears with the expected date/quantity, the main workspace refreshes without a second manual
      refresh, the completed shopping list is cleared, and a finished-shopping message is visible.
      -> no "finished-shopping" message appears anywhere, just reloads the page. not even a toast or activity log
- [x] Apply a Group impulse line. Confirm a concrete household Product is created under the intended
      Group before its Batch is acquired; repeat/reload once and confirm no duplicate result appears.

Operator notes and discoveries:

## 5. Concrete Shopping Trip, pricing, and ingestion review

- [ ] Start a Trip from an open Shopping Need by selecting exactly one active Shop Market and
      date. Confirm the market list loads after the household is selected, then repeat with Custom
      shop and a saved custom shop name; the custom trip remains usable without a configured market.
      -> starting a srip fails: "Shopping trip creation failed (400)." when name is not given (should generate "custom") and with 404 when name is given -> idk why it doesnt save.
      -> since this shopping trip is quite a new territory and is untested and is not required for household internal management, we should add a feature toggle to disable completely and hide it from the home page then.
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
      Section 0 export, inspect the manifest and sanitized content without changing the source. -> please explain what to do exactly, I dont understand this
- [ ] Review the Lidl repair dry run with `npm run repair:lidl-brochure`, using
      `--snapshot-id=<snapshot-id>` and `--limit=1`. This is a read-only plan by default. Apply
      only with explicit target/operator confirmation using `--apply`, `--target=<database>`, and
      `--operator=<identity>`; raw payload and provenance must remain unchanged.
      -> whats this for exactly?

- [x] Rerun ingestion quality and processed-ingestion validation. Every pending/duplicate/failure
      result has a documented decision.
- [ ] In the Crawl review dialog, confirm Save draft, Add empty price observation, and Apply JSON
      use dark themed surfaces in dark mode while retaining readable light-mode controls.
      -> the page is called "ingestion" but in the menu it is called "Admin". call it Some ingestion management or similar since its not really a site admin page but some specific feature page now
      -> clicking away from the crawl review dialog closes it automatically. this shounds fun but it triggers too easily. can we only have this effect when user clicks on the side rails area but not in the middle body area? also, can we increase the popover dialog size like ca 1.4 times?
      -> we should see the accept6ance status of the individual entries int he right side dialog int he table view (accepted/declined, why declined) and ideally also the "matchConfidence" values localized if possible.
      -> we should also have quick accept and decline int he rows, simply small buttons at the end similar to the buttons' style ont he household stocks. have a green tickmark and a red decline X. when declining, the additional dropdown for decline reason should appear left to the buttons int he row to select one and then have a confirm and cancel button. we can replace the accept and decline with the confirm and cancel at that point since we are in "decline mode"
Operator notes and discoveries:

## 7. Final evidence and waiver review

- [ ] Repeat the complete runbook from a clean refresh without direct database edits.
- [ ] Repeat the critical household/shopping path with two users and both locales.
- [ ] Review every operator note and discovery. Each is fixed, retested, explicitly deferred to
      post-MVP, or waived with risk, owner, reason, and follow-up.
- [ ] Update the evidence log with date, environment, tester, final commit, and command results.
- [ ] Confirm the old Stage 8 script and Stage 8–10 checklist link here and are no longer treated as
      separate acceptance sources.
      -> these old ones are gone now, arent they?! remove this entry then.
- [ ] Only after all required items are resolved or waived: mark MVP closure ready.

## 8. Known risk probes

Run these probes deliberately even when the main flow appears healthy. They are compact reminders
of the failure classes most likely to cross a frontend/API/persistence boundary.

- [x] Save the same Group, Product, or Batch from inline and right-side editors in both orders;
      confirm no stale editor, duplicate write, or lost revision remains.
      -> when trying to create product that already exists, we get "Product creation failed (409)." but we should have proper explanation that the product with same name already exists or something... please revisit and try to cover most such expected failure handlers to provide obvious user-facing notification text, not pure error codes and "something went wrong" level messages. it seems we are already returning somewhat useful error messages in "json(409, { error: "shop_market_already_exists" })" so we should show those at least
- [x] Toggle expired-item inclusion around an expired Batch and compare the visible Current,
      Product Group aggregate, and generated shopping need.
- [x] Use two Products and multiple Batches in one Group; confirm each physical Batch contributes
      once to its Product and the Group, including after refresh and retry.
- [ ] Add the same impulse item twice and retry a purchased-line application; confirm duplicate
      operations are rejected or treated idempotently with a visible Activity entry.
      -> i dont understand. i add he same item twice, it gets added to the amount of the other. then what? "retry a purchased-line application"?
- [x] Force or reproduce a stale revision, missing schema/maintenance setup, untranslated label,
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
