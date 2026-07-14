# src/ AGENTS.md

## Purpose

This directory currently contains the Angular browser application.

`src/main.ts` is the Angular bootstrap entrypoint. It is not backend code and should not be treated as a server entrypoint.

## Boundaries

- Keep browser UI, components, frontend styles, and Angular app configuration here.
- Call backend behavior through `/api/*` routes rather than importing server package code directly.
- Keep reusable backend/server logic in `packages/kamra-api-server/`.
- Keep Vercel Function entrypoints in `api/`.

## Frontend Notes

- Reuse theme tokens from `src/styles.css` instead of scattering raw colors.
- Prefer native CSS layout and existing shared components over JavaScript layout glue or a new UI dependency. Extract a shared component only for a distinct, repeated responsibility.
- Use `public/brand/kamra-basket.png` for the large brand mark and `public/favicon.ico` for the browser icon.
- Preserve the quiet, natural, pastel Kamra direction unless a later design plan changes it.
- Browser startup and app lifecycle logs should go through `src/app/browser-logger.ts` so they reach both the browser console and the shared `/api/log` path.
- Keep browser logging small and non-blocking; it should help debug startup and environment issues without becoming a telemetry system.

## Validation

Use root scripts for now:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
