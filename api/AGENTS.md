# api/ AGENTS.md

## Purpose

This directory contains the small retained Vercel Function fallback surface.

Each file here maps to a deployed `/api/*` route. Do not add helper modules here unless they are intentionally route files.

## Boundaries

- Keep route files thin and obvious.
- Adapt Vercel request/response objects to shared server logic.
- Put reusable request handling, config parsing, MongoDB logic, health report generation, auth/session logic, and tests in `packages/kamra-api-server/`.
- Use `scripts/local-api.ts` for local API development; it delegates to the same shared server handler.
- Keep only the approved fallback/admin-validity routes here:
  - login
  - logout
  - browser log ingestion
  - current admin/user identity
  - admin preferences
  - admin dashboard maintenance and health routes
- Do not re-add household, catalog, ingestion-review, or other core domain routes here unless a new approved plan explicitly changes the deployment split.

## Naming

- Name route files for their public Vercel route, for example `health.ts` for `/api/health`.
- Add a short top-level comment when a route delegates to shared logic, so future readers do not mistake it for a standalone implementation.
