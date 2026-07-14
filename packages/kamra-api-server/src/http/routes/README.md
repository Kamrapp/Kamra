# HTTP route ownership

The route indexes in this directory are capability bundles consumed by the shared application
dispatcher. They make ownership discoverable without changing public URLs or moving domain policy
into HTTP adapters:

- `access/` — authentication, current-user, preferences, and alpha-user access.
- `admin/` — developer-admin, Stage 9 admin, and database-maintenance routes.
- `catalog/` — catalogue product/source and validation routes.
- `household/` — legacy household and household-v2 Product Group, Product, Batch, shopping, and
  trip routes.
- `ingestion/` — raw snapshot processing and product-review routes.
- `observability/` — health and client-log routes.

The source route modules remain beside these indexes during the first locality pass. Keep the
bundle order aligned with the dispatcher because route matching is first-match based. Run
`npm test` and `npm run test:integration` after changing a bundle.
