# Kamra

Kamra is a source-available grocery intelligence and household shopping-planning project. The current
Alpha path lets a household manage Product Groups, Products, and Stock Batches; build a concrete
Shopping Trip from target policies; record actual purchases; and send reviewed purchase evidence to
the catalogue administration workflow.

Live deployment: [https://www.kamrapp.hu](https://www.kamrapp.hu)

## What Kamra Focuses On

- Product lookup across grocery stores
- Offer and price comparison
- Household-oriented shopping support
- Admin and ingestion tooling for maintaining the catalog
- Manual crawl review with accepted-row hiding, source filters, paging, and accept/merge confirmation
- User and anonymous preferences for theme and language
- A lightweight, free-tier-friendly deployment model

Kamra is intentionally independent: it does not promote sellers, sponsored rankings, or advertising-driven results.

## How The App Is Structured

- `src/` - Angular frontend
- `src/app/i18n/` - default English and Hungarian locale resources in nested JSON format
- `api/` - thin Vercel Function entrypoints
- `packages/kamra-api-server/` - shared backend and server logic
- `scripts/` - local tools for ingestion, seeding, and validation
- `docs/` - product, architecture, and operations notes

## Running Locally

Install dependencies:

```bash
npm install
```

Common commands:

```bash
npm run dev
npm run build
npm run test
npm run lint
npm run format:check
npm run typecheck
```

Useful Alpha checks:

```bash
npm run smoke:catalog
npm run smoke:transactions
npm run seed
```

The smoke commands require a configured disposable MongoDB environment. They do not replace the
manual browser acceptance flow in [the Stage 8–11 MVP runbook](./scripts/stage11-mvp-manual-test.md).

## Alpha demo journey

1. Seed the approved development/demo database and sign in as `usera`.
2. Open Home and inspect the Product Group → Product → Stock Batch hierarchy.
3. Create or adjust a target policy, generate a need, choose an active Shop Market, and start a
   Shopping Trip.
4. Resolve or skip matches, record actual bought quantities and dates, add any unplanned purchase,
   then finalize the Trip.
5. As an admin, review the resulting Ingestion Submission without rewriting the household's Product
   or Batch history.

Use [scripts/stage11-mvp-manual-test.md](./scripts/stage11-mvp-manual-test.md) for the single
cross-stage household/admin verification runbook and [docs/alpha-release-checklist.md](./docs/alpha-release-checklist.md)
for the release gate.

## Data and operational safety

The default seed and smoke scripts are intended for disposable or explicitly approved environments.
Do not run data-writing maintenance, archive imports, or reseeds against production without the
operator checks documented in [docs/alpha-operations.md](./docs/alpha-operations.md). Raw Crawl
Snapshots are preserved as evidence; derived catalogue data may be rebuilt after a verified export.

See [SECURITY.md](./SECURITY.md) for secrets, household data, and vulnerability reporting guidance,
and [CONTRIBUTING.md](./CONTRIBUTING.md) for the small-step implementation and validation workflow.

## More Context

- [Product concept](./docs/repo-concept.md)
- [Architecture direction](./docs/architecture.md)
- [Tech and operations](./docs/tech-ops.md)
- [Ingestion operations](./docs/ingestion.md)
- [Crawler policy](./docs/crawler-policy.md)
- [Alpha operations](./docs/alpha-operations.md)
- [Domain language](./docs/domain-language.md)

## License

Kamra is source-available. See [LICENSE.md](./LICENSE.md) for the full terms.
