# Developer-admin feature flags

This barrel marks the frontend boundary for registry-driven feature-flag presentation. The
server registry and admin API own accepted keys and metadata; these components own ordinary flag
editing and the specialized alpha-access workflow. Add future flag presentation here rather than
binding a new key directly in the dashboard shell.

Validate with `npm run build:web`, `npm run typecheck`, and `npm run lint`.
