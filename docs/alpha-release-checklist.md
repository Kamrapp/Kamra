# Kamra Alpha release checklist

This checklist is the compact release gate. The detailed human flow remains in
[`scripts/stage11-mvp-manual-test.md`](../scripts/stage11-mvp-manual-test.md).

## Automated checks

- [x] `npm test`
- [x] `npm run format:check`
- [x] `npm run lint -- --max-warnings=0`
- [x] `npm run typecheck`
- [x] `npm run build:web`
- [x] `npm run build:api`
- [x] `npm run smoke:catalog` in an approved disposable/configured database
- [x] `npm run smoke:transactions` in an approved disposable/configured database

## Data and operations

- [ ] Raw Crawl Snapshot archive exported; manifest counts and checksums independently checked.
- [ ] Read-only ingestion quality audit reviewed; parser/repair decisions are explicit.
- [ ] Domain-language maintenance preview reviewed; validator and data actions acknowledged separately.
- [ ] Clean-target archive import/restore drill completed or explicitly waived with owner and follow-up.
- [ ] Seeded demo volume and query/index behavior checked in the intended environment.

## User and admin acceptance

- [ ] Two-user household isolation and member/owner authorization checked.
- [ ] Product Group → Product → Stock Batch CRUD, target policies, expiry setting, and history checked.
- [ ] Shopping Need → active Shop Market → matching/override/skip → actual result → Trip completion checked.
- [ ] Existing Product reuse, new Product creation, unplanned purchase, duplicate retry, and stale revision behavior checked.
- [ ] Admin Ingestion Submission review is isolated, localized, and does not rewrite household history.
- [ ] English/Hungarian, keyboard/focus, dark/light, narrow layout, empty/loading/403/404/409/500, and activity-console states checked.

## Decision record

Every unchecked item must be either fixed before release or recorded as a waiver with risk, reason,
owner, and follow-up date. Remaining minor spacing/color polish is allowed only after correctness and
authorization are green. New domain workflows belong in a later plan.

## Latest automated/configured evidence (2026-07-13)

The local gate passes with 64 test files/231 tests, format, lint, typecheck, web build, and API build.
Configured catalogue and transaction smoke checks plus the alpha-domain-language dry-run have passed.
The processed-ingestion check is intentionally still red for four newly captured, unprocessed snapshots;
the exact ids are emitted by the validator. The Lidl parser repair is committed and dry-run validated,
but its reviewed apply/reconciliation and the clean-target archive restore remain operator evidence.
