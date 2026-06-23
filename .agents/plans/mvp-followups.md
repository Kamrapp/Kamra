# MVP Followups

Status: Active Triage List

## Purpose

This document stores useful ideas that should stay visible without bloating the initial MVP roadmap.

The initial MVP roadmap should focus on the shortest path to a usable household grocery-planning product. Followups here may become planned work later, but they are not approved implementation scope by being listed.

Use this file when a session discovers an idea that is valuable but not necessary for the next MVP milestone. Keep entries short enough that future planning can scan them quickly.

## Triage Fields

- AddedValue: `1/5` to `5/5`, focused on market gain, user delight, and likelihood that people would care.
- Effort: `Low` or `High`.
- Complexity: `Low`, `Med`, or `High`.
- Priority: `Low`, `Med`, or `High`.

These are planning hints, not commitments. Re-score an item when product evidence or implementation reality changes.

## Product UX

| Followup | Why It Matters | AddedValue | Effort | Complexity | Priority |
| --- | --- | --- | --- | --- | --- |
| Four-corner floating module navigation | Replace the plain navigation with four small floating module launchers once the underlying app areas exist. The intended concerns are: a public or role-gated arukereso-style product lookup platform, household management, site-admin product merge and stock-staleness operations, and dev-admin diagnostics/user/database/health checks. Until alpha access exists, keep these concerns separated through basic navigation instead of rushing the floating UI. | 4/5 | High | Med | Med |
| Installable PWA or mobile-first shopping list | A shopping list is most useful in-store, so installable/mobile behavior can make the product feel real after the household loop exists. | 5/5 | High | Med | High |
| Quick barcode and expiry-date scanning | Reduces friction when adding household items or expiry dates, but depends on having household inventory and product matching first. | 5/5 | High | High | Med |
| Richer notification channels | Email, push, or other reminders for low-stock and buy-before warnings can increase usefulness after in-app notices prove valuable. | 4/5 | High | Med | Med |
| Password-field reveal icon polish | Some browsers only re-show the native password reveal eye under specific field-state behavior. Unless a simple app-side cause appears later, treat this as low-value control polish rather than MVP work. | 1/5 | Low | Low | Low |

## Product Intelligence

| Followup | Why It Matters | AddedValue | Effort | Complexity | Priority |
| --- | --- | --- | --- | --- | --- |
| Route optimization with max-shop constraints | Lets users balance quickest, cheapest, and preferred-store shopping after price and store data are trustworthy. | 5/5 | High | High | Med |
| Similar or side-product recommendations | Helps users find better offers or substitutes, but must remain independent from ads and sponsorship. | 4/5 | High | High | Med |
| Household baseline comparison | Suggests commonly missing staples by comparing a household to its own habits or safe sample patterns. | 4/5 | High | Med | Med |
| Stronger quality, brand, dietary, and preference modeling | Makes recommendations feel personal and trustworthy once product data is rich enough. | 5/5 | High | High | Med |

## Data And Source Expansion

| Followup | Why It Matters | AddedValue | Effort | Complexity | Priority |
| --- | --- | --- | --- | --- | --- |
| Crawler expansion beyond the first source | More sources make price tracking meaningful, but every source needs policy review, source-friendly limits, and isolated parsing. | 5/5 | High | High | High |
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

When promoting an item, copy only the relevant details into the new plan and keep the implementation split commit-sized.
