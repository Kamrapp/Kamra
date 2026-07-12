# api/ AGENTS.md

## Purpose

This directory contains thin Vercel Function adapters for the shared API server.

Dedicated files map to high-traffic or compatibility `/api/*` routes. `api/[...path].ts` is the catch-all adapter for shared routes that do not need a dedicated wrapper; it preserves the original URL and delegates to the same dispatcher.

## Boundaries

- Keep route files thin and obvious.
- Adapt Vercel request/response objects to shared server logic.
- Put reusable request handling, config parsing, MongoDB logic, health report generation, auth/session logic, and tests in `packages/kamra-api-server/`.
- Use `scripts/local-api.ts` for local API development; it delegates to the same shared server handler.
- Keep dedicated wrappers only for the approved fallback/admin-validity routes:
  - login
  - logout
  - browser log ingestion
  - current admin/user identity
  - admin preferences
  - admin dashboard maintenance and health routes
- The catch-all adapter keeps shared household, catalog, ingestion-review, database-maintenance, and alpha-access routes useful on Vercel without duplicating one entrypoint per route.

## Naming

- Name route files for their public Vercel route, for example `health.ts` for `/api/health`.
- Add a short top-level comment when a route delegates to shared logic, so future readers do not mistake it for a standalone implementation.
