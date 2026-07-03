# site-admin/

## Purpose

This folder contains operator-facing site administration screens.

Current scope:

- crawl and ingestion snapshot visibility
- source processing actions
- future product/source maintenance and merge review

## Boundaries

- Keep normal household user workflows out of this folder.
- Call `/api/*` routes through Angular services; do not import server packages directly.
- Keep raw source truth immutable from the browser until a reviewed correction model exists.

## Validation

Use root scripts:

- `npm run typecheck`
- `npm run build`
