# MVP Followups

Status: Active Triage List

## Purpose

This document stores useful ideas that should stay visible without bloating the initial MVP roadmap.

The initial MVP roadmap should focus on the shortest path to a usable household grocery-planning product. Followups here may become planned work later, but they are not approved implementation scope by being listed.

Use this file when a session discovers an idea that is valuable but not necessary for the next MVP milestone. Keep entries short enough that future planning can scan them quickly.

## Stage 8–10 carry-forward items

These items were intentionally skipped or kept transitional while the basic MVP loop was built:

- retire the Home compatibility shopping-list shell after Shopping Trips have equivalent manual acceptance
- complete deterministic migration/reconciliation of legacy Stock Targets/Allocations and remove active write paths
- promote reviewed purchase facts into shared catalogue identity without rewriting household snapshots
- add robust correction/reversal UI for completed Purchases and their Stock Movements
- replace manual Shop Product/Price administration with richer reviewed catalogue tooling
- add paged Trip, Purchase, Price Observation, and Ingestion Submission history views
- finish archive export/import and parser-quality repair workflow before external Alpha use

## Additional high-value suggestions

1. **Offline-first in-store trip cache** — preserve the active Trip and queued manual results through weak connectivity; AddedValue 5/5, Effort High, Complexity High, Priority High.
2. **Household explainability timeline** — show why a line was generated, which Product/Group target contributed, and which Batch changed after completion; AddedValue 5/5, Effort Med, Complexity Med, Priority High.
3. **Safe duplicate-product merge assistant** — compare identity, batches, prices, and history before an explicit household/admin merge; AddedValue 5/5, Effort High, Complexity High, Priority Med.
4. **Budget and price-history guardrails** — let a household set a trip budget and flag surprising price changes without changing deterministic matching; AddedValue 4/5, Effort Med, Complexity Med, Priority Med.
5. **Shared household quick actions** — keyboard/mobile shortcuts for add stock, mark bought, extend expiry, and undo the last safe action; AddedValue 4/5, Effort Low, Complexity Med, Priority Med.

## Frontend simplification / UX rework candidates

- **Workspace-to-page extraction:** move Manage household settings, Trip planning, and admin review into dedicated route pages; keep Home focused on stock and a compact trip summary. This reduces nested grids and panel-height CSS.
- **Flyout editors:** replace the three-block always-present composer with one typed Product Group/Product/Batch flyout that opens from a row and owns its save/cancel lifecycle. This removes duplicated inline/right-side synchronization.
- **Shared data-grid shell:** extract one accessible, scrollable hierarchy grid with fixed columns, disclosure, action slots, and status tokens; household stock, Trip Items, and admin review then supply row templates instead of separate CSS systems.

## Triage Fields

- AddedValue: `1/5` to `5/5`, focused on market gain, user delight, and likelihood that people would care.
- Effort: `Low` or `High`.
- Complexity: `Low`, `Med`, or `High`.
- Priority: `Low`, `Med`, or `High`.

These are planning hints, not commitments. Re-score an item when product evidence or implementation reality changes.

## Final Priority Bands After Alpha 1.0

### High-priority post-MVP

These are the first candidates after internal Alpha use confirms the Stage 8-10 loop. They are valuable, but none is required to complete the single-shop manual MVP:

- richer manual catalogue/shop-product/price management and product merge/duplicate tooling
- complete offer history, multiple-offer comparison, price timelines/charts, and clearer base-versus-offer visualization
- receipt/barcode capture, then OCR/parsing only after manual completion data proves the target contracts
- multi-shop price/route optimization after one-shop applicability/package math is trustworthy
- automated substitution ranking and richer preference constraints after override data exists
- branch-level shops/availability only when country-level chain markets prove too coarse
- consumption prediction, automatic replenishment, collaborative notifications, and richer household analytics after movement history is substantial
- Product Classification governance/version publishing and richer classification query expressions when real Product Concept graphs outgrow the MVP
- rich runtime classification translation management, translation completeness dashboards, and reviewed household-to-global content promotion beyond the minimal Stage 8-9 flow

### Optional later enhancements

- floating/four-corner navigation polish
- broad external observability platform
- dependency/autofix workflow automation
- advanced localization administration
- third-party/community classification packs, pack import/export, and automated translation suggestions
- source expansion that does not directly improve the validated shopping loop

Items still listed below retain their individual triage scores; this section is the final roadmap-level priority interpretation.

## Product UX

| Followup | Why It Matters | AddedValue | Effort | Complexity | Priority |
| --- | --- | --- | --- | --- | --- |
| Four-corner floating module navigation | Replace the plain navigation with four small floating module launchers once the underlying app areas exist. The intended concerns are: a public or role-gated arukereso-style product lookup platform, household management, site-admin product merge and stock-staleness operations, and dev-admin diagnostics/user/database/health checks. Until alpha access exists, keep these concerns separated through basic navigation instead of rushing the floating UI. | 4/5 | High | Med | Med |
| Installable PWA or mobile-first shopping list | A shopping list is most useful in-store, so installable/mobile behavior can make the product feel real after the household loop exists. | 5/5 | High | Med | High |
| Quick barcode and expiry-date scanning | Reduces friction when adding household items or expiry dates, but depends on having household inventory and product matching first. | 5/5 | High | High | Med |
| Richer notification channels | Email, push, or other reminders for low-stock and buy-before warnings can increase usefulness after in-app notices prove valuable. | 4/5 | High | Med | Med |
| Password-field reveal icon polish | Some browsers only re-show the native password reveal eye under specific field-state behavior. Unless a simple app-side cause appears later, treat this as low-value control polish rather than MVP work. | 1/5 | Low | Low | Low |
| Multi-tier application-resource localization | Stage 8 handles runtime classification labels separately through database records seeded from feature-local translation files. A broader database override system for application UI copy can wait until static Angular resources create real maintenance pain. | 3/5 | High | Med | Low |
| Focused tri-state home workspace | Build on the MVP's adjustable Household/Shopping divider only if Alpha use supports it: animate one block into a focused expanded state, collapse the other to title/action, and show compact second-row details/quick actions per item while retaining dedicated editors. Which actions belong inline must come from usage evidence, not a fixed speculative design. | 4/5 | High | Med | Med |

## Product Intelligence

| Followup | Why It Matters | AddedValue | Effort | Complexity | Priority |
| --- | --- | --- | --- | --- | --- |
| Route optimization with max-shop constraints | Lets users balance quickest, cheapest, and preferred-store shopping after price and store data are trustworthy. | 5/5 | High | High | Med |
| Similar or side-product recommendations | Helps users find better offers or substitutes, but must remain independent from ads and sponsorship. | 4/5 | High | High | Med |
| Household baseline comparison | Suggests commonly missing staples by comparing a household to its own habits or safe sample patterns. | 4/5 | High | Med | Med |
| Stronger quality, brand, dietary, and preference modeling | Makes recommendations feel personal and trustworthy once product data is rich enough. | 5/5 | High | High | Med |

## Post-MVP Classification And Product Group Extensions

Stage 8's final model keeps Product Concepts/Attributes as classification vocabulary, gives each Household Product zero-or-one direct Product Group membership, and keeps Stock Batches beneath Products. Product Groups and Products may own optional target policies; Product Group totals roll up from Product-owned Batches. Classification does not drive Home grouping in the MVP. The following remain post-MVP unless a real usage problem earns a focused plan:

| Followup | Why It Matters | AddedValue | Effort | Complexity | Priority |
| --- | --- | --- | --- | --- | --- |
| Versioned taxonomy publishing and materialized closure | Lets admins stage large hierarchy edits, compare versions, invalidate caches safely, and query deep graphs efficiently after the MVP graph grows. | 4/5 | High | High | Med |
| Rich Product Concept relation vocabulary | Relations such as equivalent/alias, part-of, incompatible-with, certification, and substitute-for need semantics distinct from inclusive `is_a`; adding them prematurely would make matching ambiguous. | 4/5 | High | High | Med |
| Rich classification query/expression language | Nested all/any/none groups, numeric facets, brand/package constraints, and reusable query templates can support advanced browsing or matching, but need a stable grammar, validator, explanation path, and accessible UI. | 5/5 | High | High | Med |
| Multiple Product Group membership | One Product contributing to unrelated Product Groups would complicate totals, shopping residuals, and household mental models. Consider it only if repeated real use shows nested Product Groups cannot model the need. | 3/5 | High | High | Low |
| Automatic Product Group assignment | Classification or history could suggest Product Group membership, but suggestions must stay explainable, user-confirmed, and must never silently rewrite household grouping or totals. | 4/5 | High | High | Low |
| Taxonomy governance and merge tooling | Admin review, aliases, deprecation redirects, impact previews, custom/global promotion, and provenance become important once many products and households depend on classification. | 4/5 | High | High | Med |
| Numeric and certification attributes | Fat percentage, package amount, nutrition, allergen thresholds, and certified dietary claims should become typed Product Attributes where exact/range semantics matter. | 5/5 | High | High | Med |
| Learned classification and matching | Crawler/manual evidence can propose Product Concepts, Product Attributes, and Product Group suggestions with confidence, but trusted assignments and household totals must remain reviewable and deterministic. | 5/5 | High | High | Med |
| Rich classification translation administration | Completeness reporting, bulk editing, translation review, import/export, and automated suggestions improve many-language operation, but MVP only needs default-label fallback, EN/HU seed parity, and optional admin-entered translations during promotion. | 4/5 | High | Med | Med |
| Versioned/community content packs | Importing or publishing independent concept/template packs could broaden domains quickly, but introduces trust, namespace, merge, dependency, and translation-version problems beyond the single checked-in Kamra base pack. | 3/5 | High | High | Low |

## Data And Source Expansion

| Followup | Why It Matters | AddedValue | Effort | Complexity | Priority |
| --- | --- | --- | --- | --- | --- |
| Crawler expansion beyond the first source | More sources make price tracking meaningful, but every source needs policy review, source-friendly limits, and isolated parsing. | 5/5 | High | High | High |
| End-of-MVP SPAR/Tesco brochure expansion | Revisit SPAR brochure/PDF and Tesco catalogue/PDF ingestion after the current crawled shops have supported product lookup, household stock, and shopping-list or notice features. Keep source review, no-bypass rules, and source-specific parsers. | 4/5 | Med | Med | Med |
| Temporary Lidl/Aldi-style product discovery | Limited-offer products are useful for grocery planning, but source behavior and identity matching should be proven first. | 4/5 | High | Med | Med |
| User-submitted price updates from shop photos | Can fill gaps where crawler coverage is weak, but raises moderation, trust, privacy, and image-processing concerns. | 4/5 | High | High | Low |
| Generated OpenAPI and JSON Schema artifacts | Useful once API and model boundaries stabilize; premature during Stage 2 because contracts are still small. | 3/5 | High | Med | Med |
| Migration-ledger and backfill hardening | Important once document shapes start changing around real product and household data. | 4/5 | High | Med | High |

## Access, Identity, And Communication

| Followup | Why It Matters | AddedValue | Effort | Complexity | Priority |
| --- | --- | --- | --- | --- | --- |
| Google account sign-in | Better user trust and lower password-management burden after the household/product MVP is useful. | 4/5 | High | Med | Med |
| Full whitelist invitation and expiry emails | Nice for demo-user access, but the first MVP can use simpler admin-controlled access until there is product value to demonstrate. | 3/5 | High | Med | Low |
| Real email provider adapter | Needed before production-like invitation, expiry, or notification emails; should stay behind feature flags. | 3/5 | High | Med | Low |
| Password reset and credential recovery | Important if raw credential login remains beyond bootstrap, but Google sign-in may reduce the need. | 3/5 | High | Med | Low |

## Admin And Operations

| Followup | Why It Matters | AddedValue | Effort | Complexity | Priority |
| --- | --- | --- | --- | --- | --- |
| Product and stock management admin surface | Helps site admins inspect products, stock, offers, and uncertain mappings once ingestion exists. | 4/5 | High | Med | High |
| Resource translation admin surface | Gives site admins a place to manage runtime overrides for localized app resources, including missing-value tracking and gradual translation backfill. | 4/5 | High | Med | Low |
| Deep developer admin diagnostics | Keeps health checks, logs, seed status, and environment diagnostics away from normal product navigation. | 3/5 | Low | Med | Med |
| Atlas network exposure tightening | Replaces the temporary broad access posture with a more durable security stance when free-tier constraints or hosting choices allow it. | 4/5 | High | Med | High |
| Centralized hosted observability | Vercel logs are enough for Stage 2; richer retention and search can wait until real usage creates debugging pain. | 3/5 | High | Med | Low |

## Repository And Workflow Hygiene

| Followup | Why It Matters | AddedValue | Effort | Complexity | Priority |
| --- | --- | --- | --- | --- | --- |
| Dependency update PR automation | Helpful after package boundaries stabilize; too noisy before the app surface settles. | 2/5 | Low | Med | Low |
| PR-branch autofix/writeback workflow | Can save time for mechanical lint/format fixes, but write permissions and surprise commits are not worth it before MVP. | 2/5 | High | Med | Low |
| Separate lint autofix workflow | A small workflow that only handles safe mechanical fixes such as lint autofixes could reduce avoidable CI failures by pushing a narrow follow-up commit. Keep it separate from read-only validation and only consider it once the exact autofix commands are proven predictable. | 2/5 | Low | Low | Med |
| Legacy workflow retirement | Old `auto_push_*` workflows should be reviewed and removed or archived when the new PR workflow is trusted. | 3/5 | Low | Low | Med |
| Documentation consistency checks | Useful if docs drift becomes frequent; should not block early product delivery. | 2/5 | Low | Low | Low |

## Promotion Rule

Move an item from this file into an approved plan only when:

- it directly supports the next MVP milestone,
- it removes a current operational or security blocker,
- or the user explicitly decides the added value is worth expanding scope.

When promoting an item, confirm that existing code, native/platform capability, or a small local change cannot satisfy the proven need more cheaply. Copy only the relevant details into the new plan, state what remains deferred, and keep the implementation split commit-sized.
