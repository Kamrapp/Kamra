# User Token Login And Health Guard Plan

## Objective

Add a minimal standardized login backed by the seeded `users` collection, issue signed user tokens persisted by the browser, restrict health-check content to authenticated admins, and reshape the navigation into a floating right-side slider.

## Context Read

- `AGENTS.md`
- `src/AGENTS.md`
- `api/AGENTS.md`
- `packages/kamra-api-server/AGENTS.md`
- `.agents/coding-guidelines.md`
- `packages/kamra-api-server/src/auth/password-hash.ts`
- `packages/kamra-api-server/src/seeds/admin-identity-seed.ts`
- `packages/kamra-api-server/src/seeds/mongo-admin-identity-seed-repository.ts`
- `packages/kamra-api-server/src/config/app-config.ts`
- `packages/kamra-api-server/src/http/app-handler.ts`
- `packages/kamra-api-server/src/http/node-adapter.ts`
- `src/app/app.component.ts`
- `src/app/app.routes.ts`
- `src/app/health-check.component.ts`
- `.env.example`
- `docs/tech-ops.md`

## Research Gate

Not needed. This is a minimal local bootstrap auth slice using Node built-ins and existing seeded admin credentials.

## User Requests

- Add minimal standardized login with tokens based on users.
- Allow login with the seeded admin user.
- Make health check available only for admins.
- Keep the health menu item visible, but show unauthorized placeholder instead of health content.
- Improve navigation so it remains collapsed by default.
- Replace the full boring side nav with a small right-side arrow that slides out a floating half-height menu box.

## Current Reality

- Admin users are seeded in MongoDB `users` with `email`, `role: "admin"`, `status: "active"`, and `passwordHash`.
- There is password hashing/verification code, but no login or session route.
- `/api/health` is public.
- Angular has `/health` route and a right-side full-height drawer.

## Intended Direction

- Add signed user tokens using `AUTH_TOKEN_SECRET`.
- Keep token verification stateless and host-neutral.
- Keep Vercel route files thin.
- Authorize health server-side; frontend only improves the visible unauthorized state.
- Keep navigation simple and route-driven.

## Scope

- Add auth config for `AUTH_TOKEN_SECRET`.
- Add token signing/verification and user credential verification against `users`.
- Add `/api/login`, `/api/logout`, and `/api/admin/me` through the shared handler.
- Add thin Vercel route files for those API paths.
- Require admin auth for `/api/health`.
- Add Angular header login and unauthorized health placeholder.
- Change the menu into a floating slider box.
- Update `.env.example` and `docs/tech-ops.md`.
- Add focused tests.

## Non-Goals

- Public registration.
- Google sign-in.
- Long-lived refresh-token store.
- Role management UI.
- Password reset.
- Persisted sessions or revocation lists.

## Validation Plan

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Risks

- Stateless user tokens cannot be revoked before expiry.
  - Mitigation: keep a short token lifetime and use this only for bootstrap admin access.
- Missing `AUTH_TOKEN_SECRET` can block login and health.
  - Mitigation: fail closed and document the required env var.

## Approval Checkpoint

The user's explicit request approves this focused auth/navigation slice for immediate implementation.
