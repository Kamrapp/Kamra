# kamra-api-server AGENTS.md

## Purpose

This package contains Kamra's reusable backend/server code.

It is used by both:

- Vercel Function entrypoints in `api/`
- the local Node development runner in `scripts/local-api.ts`

## Boundaries

- Keep route handling, request handling, config parsing, MongoDB connection code, health reports, auth/session logic, and focused server tests here.
- Keep seed orchestration and seed persistence adapters here when they are reusable by local scripts, Vercel-safe code, or future workflow entrypoints.
- Keep ingestion contracts, source parsers, processing logic, and ingestion persistence adapters here when they are reusable by scripts or workflow entrypoints.
- Do not put Angular frontend code here.
- Do not put manually runnable utility scripts here; use `scripts/` unless a package-owned script is explicitly planned.
- Keep host-specific glue small enough that another serverless adapter could call the same server handler.
- Keep server logs timestamped and structured enough to read in both local console output and Vercel runtime logs.
- When a change affects logging behavior, update `docs/logging.md` and keep the file/console split consistent.

## Naming

- Prefer names that include the domain or responsibility: `health`, `mongodb`, `connection`, `session`, `admin`.
- Avoid vague module names like `core`, `helpers`, or `utils` unless the contents are genuinely generic and already justified.
- Expected failures should be represented as explicit results where practical, not broad swallowed exceptions.
- Seed names should describe the data they own, for example `admin_user`, and ledger records must not include raw credentials.
- Each seed should be a separate definition with its own env names, prompts, validation, and tests; keep `scripts/seed.ts` as a thin registry runner.
- Each ingestion source should have isolated parser/source code, tests, and local README guidance when its behavior is not obvious from `docs/ingestion.md`.

## Validation

Use the root scripts:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
