# kamra-api-server AGENTS.md

## Purpose

This package contains Kamra's reusable backend/server code.

It is used by both:

- Vercel Function entrypoints in `api/`
- the local Node development runner in `scripts/local-api.ts`

## Boundaries

- Keep route handling, request handling, config parsing, MongoDB connection code, health reports, auth/session logic, and focused server tests here.
- Do not put Angular frontend code here.
- Do not put manually runnable utility scripts here; use `scripts/` unless a package-owned script is explicitly planned.
- Keep host-specific glue small enough that another serverless adapter could call the same server handler.
- Keep server logs timestamped and structured enough to read in both local console output and Vercel runtime logs.
- When a change affects logging behavior, update `docs/logging.md` and keep the file/console split consistent.

## Naming

- Prefer names that include the domain or responsibility: `health`, `mongodb`, `connection`, `session`, `admin`.
- Avoid vague module names like `core`, `helpers`, or `utils` unless the contents are genuinely generic and already justified.
- Expected failures should be represented as explicit results where practical, not broad swallowed exceptions.

## Validation

Use the root scripts:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
