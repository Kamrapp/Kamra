# Kamra

Kamra is a grocery intelligence and shopping-planning project. It is designed to help people explore product prices, compare store offers, and eventually build smarter shopping lists and household workflows.

Live deployment: [https://www.kamrapp.hu](https://www.kamrapp.hu)

## What Kamra Focuses On

- Product lookup across grocery stores
- Offer and price comparison
- Household-oriented shopping support
- Admin and ingestion tooling for maintaining the catalog
- A lightweight, free-tier-friendly deployment model

Kamra is intentionally independent: it does not promote sellers, sponsored rankings, or advertising-driven results.

## How The App Is Structured

- `src/` - Angular frontend
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
```

## More Context

- [Product concept](./docs/repo-concept.md)
- [Architecture direction](./docs/architecture.md)
- [Tech and operations](./docs/tech-ops.md)
- [Ingestion operations](./docs/ingestion.md)
- [Crawler policy](./docs/crawler-policy.md)

## License

Kamra is source-available. See [LICENSE.md](./LICENSE.md) for the full terms.
