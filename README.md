# Kamra

Kamra is a source-available grocery intelligence and household shopping-planning project. Its MVP
household loop is closed: a household can manage Product Groups, Products, and Stock Batches and use
target policies to build and apply a Shopping list. The active Phase 1 roadmap makes Product linking,
shop-specific list use, receipt/price evidence, and high-volume admin review one coherent experience.

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

### Complete local app with Docker

For a one-origin local application with MongoDB managed by Compose:

```powershell
Copy-Item .env.docker.example .env
docker compose up --build
```

Open [http://localhost:4200](http://localhost:4200). The first app start waits for MongoDB, then
seeds the local catalogue, admin account, and demo household. The default local credentials are
shown in `.env`; sign in as `admin@example.test`, `usera`, or `userb` with the configured seed
password. Mongo data is kept in the `kamra-mongo-data` named volume, so restarting Compose does not
reseed or delete the household.

Stop the services while preserving local data with `docker compose down`. To deliberately recreate
the disposable database, use `docker compose down -v` and start Compose again. The Compose MongoDB
service has no authentication and is local-only; never expose it or reuse its defaults in a hosted
environment. Detailed container and deployment guidance is in [docs/tech-ops.md](./docs/tech-ops.md).

Useful configured checks:

```bash
npm run smoke:catalog
npm run smoke:transactions
npm run seed
```

The smoke commands require a configured disposable MongoDB environment. They complement the
automated specs and the deferred [Phase 1 manual acceptance](./scripts/phase1-manual-test.md).

## Current MVP demo journey

1. Seed the approved development/demo database and sign in as `usera`.
2. Open Home and inspect the Product Group → Product → Stock Batch hierarchy.
3. Create or adjust a target policy, generate a need, choose an active Shop Market, and start a
   Shopping Trip.
4. Resolve or skip matches, record actual bought quantities and dates, add any unplanned purchase,
   then finalize the Trip.
5. As an admin, review the resulting Ingestion Submission without rewriting the household's Product
   or Batch history.

The accepted household scope and transferred checks are recorded in the archived
[Stage 8–11 MVP closure runbook](./scripts/mvp/stage11-mvp-manual-test.md). The active direction is
the [Phase 1 usability plan](./.agents/plans/phase-1-usability-completion-plan.md).

## Data and operational safety

The default seed and smoke scripts are intended for disposable or explicitly approved environments.
Do not run data-writing maintenance, archive imports, or reseeds against production without the
operator checks documented in the archived [MVP operations guide](./docs/mvp/alpha-operations.md). Raw Crawl
Snapshots are preserved as evidence; derived catalogue data may be rebuilt after a verified export.

See [SECURITY.md](./SECURITY.md) for secrets, household data, and vulnerability reporting guidance,
and [CONTRIBUTING.md](./CONTRIBUTING.md) for the small-step implementation and validation workflow.

## More Context

- [Product concept](./docs/repo-concept.md)
- [Architecture direction](./docs/architecture.md)
- [Tech and operations](./docs/tech-ops.md)
- [Ingestion operations](./docs/ingestion.md)
- [Crawler policy](./docs/crawler-policy.md)
- [Phase 1 roadmap](./.agents/plans/phase-1-usability-completion-plan.md)
- [Archived MVP operations](./docs/mvp/alpha-operations.md)
- [Domain language](./docs/domain-language.md)

## License

Kamra is source-available. See [LICENSE.md](./LICENSE.md) for the full terms.
