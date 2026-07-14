# Docker-backed local application support

## Objective

Provide a simple, reproducible local container workflow for the current Angular + Node API
application, with Node 24 and a Compose-managed MongoDB service. `docker compose up --build` should
serve the complete application from one origin and initialize a fresh local database without wiping
data on ordinary restarts.

## Context Read

- `package.json`, `scripts/local-api.ts`, `scripts/seed.ts`, and the existing build configs.
- `docs/tech-ops.md`, `README.md`, `scripts/README.md`, and `.env.example`.
- `render.yaml`, `vercel.json`, and the unrelated legacy `services/shopping-list-api/Dockerfile`.
- Current Mongo seed setup and `seed_ledger` behavior.

## Research Gate

Not needed. This is a repository-local Docker/Compose workflow using the existing Node build and
Mongo client; no provider-specific or standards-sensitive decision is required.

## User Requests

- Add separate simple Docker support using Node 24.
- Include MongoDB in the local Compose application.
- Make `.env` plus `docker compose up` sufficient for a complete local app.
- Document local operation and deployment know-how in the relevant infrastructure documentation.

## Current Reality

- Angular and the Node API run as separate local processes during development.
- The compiled API has a Node entrypoint, but no production server serves the compiled Angular output
  from the same process.
- The repository has Mongo-backed seed scripts and a disposable-database guard, but no container
  bootstrap path.
- `services/shopping-list-api/Dockerfile` targets the separate legacy C# service and must remain
  independent from the main application container.

## Intended Direction

- Use a root multi-stage Dockerfile based on `node:24-bookworm-slim`.
- Serve compiled Angular assets and `/api/*` through one small Node container entrypoint, preserving
  the shared `handleNodeRequest` path.
- Run MongoDB as a sibling Compose service with a named volume and healthcheck.
- Bootstrap only when the configured database has not recorded the required local seed results;
  never reseed the demo household on every container restart.
- Keep production deployment guidance explicit: Compose Mongo is for local/disposable use, while
  production should use a managed MongoDB and a separately managed secret store.

## Scope

- Root `Dockerfile`, `.dockerignore`, `compose.yaml`, and local Docker env example.
- Container static/API server and first-run bootstrap entrypoint.
- Minimal package scripts if needed for local Docker operations.
- README, `docs/tech-ops.md`, and `scripts/README.md` usage/deployment guidance.
- Focused tests or build validation for the new server/bootstrap boundaries where practical.

## Deferred Work

- Production orchestration, TLS termination, backups, Mongo replica-set transactions, scaling, and
  secrets management beyond documenting the managed-platform boundary.
- Replacing Vercel/Render deployment definitions with Docker deployment definitions.
- Adding a second always-on worker or ingestion scheduler to Compose.

## Non-Goals

- Changing application behavior, API contracts, or database schemas.
- Modifying the separate `services/shopping-list-api` container.
- Committing real credentials or a root `.env` file.

## Assumptions

- A single same-origin container is the most useful local “complete application” shape.
- The existing seed scripts are safe and idempotent enough for a fresh local database, while the
  bootstrap marker prevents destructive reseeding during ordinary restarts.
- Local Mongo authentication is intentionally disabled for simplicity; deployment guidance must
  clearly prohibit treating this Compose database as production infrastructure.

## Implementation Steps

### Step 1

- Goal: Add the Node 24 image, same-origin static/API server, Mongo Compose service, and safe
  first-run bootstrap.
- Files likely affected: `Dockerfile`, `.dockerignore`, `compose.yaml`, `docker/entrypoint.sh`,
  `scripts/container-server.ts`, `scripts/container-bootstrap.ts`, and package scripts if needed.
- Validation: API/web build, typecheck, lint, focused server checks, and Dockerfile/config inspection
  (Docker is not available in the current execution environment).
- Commit message idea: `feat: add Node 24 Docker Compose runtime`

### Step 2

- Goal: Document local startup, data persistence/reset behavior, env variables, and production
  deployment boundaries.
- Files likely affected: `.env.docker.example`, `README.md`, `docs/tech-ops.md`, and
  `scripts/README.md`.
- Validation: formatting, documentation links/content review, and clean Git diff.
- Commit message idea: `docs: document Docker local deployment`

## Validation Plan

- `npm run build`
- `npm run typecheck`
- `npm run lint -- --no-fix`
- `npm run format:check`
- `npm test`
- If Docker is available later: `docker compose config`, `docker compose up --build`, open
  `http://localhost:4200`, verify `/api/healthz`, sign in with the seeded local credentials, stop
  and restart without data loss, and use `docker compose down -v` only for an explicit clean reset.

## Risks

- Serving Angular and API from one process could diverge from Vercel’s split deployment; keep the
  container server thin and reuse the existing API adapter.
- Automatic bootstrap can become destructive if it always reseeds; gate it on seed-ledger markers
  and document the opt-out for any non-disposable database.
- Mongo Compose without authentication is convenient but unsafe outside local development; make the
  boundary prominent in infrastructure docs.

## Approval Checkpoint

The user explicitly approved implementation by requesting the Docker support change.

## Implementation status

Step 1 is implemented in the working tree: the Node 24 multi-stage image, same-origin container
server, first-run seed guard, Compose Mongo service, and local Docker environment example are in
place. Step 2 documentation is also updated. Docker commands could not be executed because Docker
is unavailable in the current environment; repository build, typecheck, lint, formatting, and test
validation passed.
