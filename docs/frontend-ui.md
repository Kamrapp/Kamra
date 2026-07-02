# Frontend UI Notes

Kamra currently uses Angular standalone components with small shared UI helpers instead of a broad component framework.

## Data Tables

Use `src/app/shared/resizable-table.component.ts` for compact admin/review tables that need:

- shared horizontal scrolling
- resizable columns
- projected row markup for domain-specific cells

For data that can exceed a few dozen records, use server-side pagination in the API and append pages in the browser as the table viewport scrolls. Do not rely on client-only virtualization over a capped API response; the API must expose `page`, `pageSize`, `totalCount`, and `totalPages` so the UI can tell whether more rows exist.

The product catalog uses this pattern:

- `/api/catalog/products?page=1&pageSize=25`
- `/api/catalog/sources`
- repository query with `skip` and `limit`
- frontend infinite scroll that loads the next page near the bottom of the table viewport
- source filter options loaded independently from paged rows
- source-filtered product queries using `source` query parameters

## Framework Decision

Do not add a general UI framework just for basic layout or one-off controls.

If admin/review tables need built-in column reordering, richer header filters, persisted column state, row selection, virtualized infinite row models, or better keyboard behavior across multiple pages, prefer evaluating AG Grid Community for table-heavy views. It has an Angular package, community modules, column sizing/moving/filtering, and infinite row model documentation.

Keep framework adoption scoped:

- introduce it first behind a reusable Kamra table wrapper
- avoid mixing framework table styling directly into feature components
- document which features use community/free modules only
- keep server-side pagination/filtering semantics owned by Kamra APIs

## Split Views

Future desktop-style split views should be implemented as reusable layout primitives, not page-local drag math. The target shape is:

- left rail with two stacked blocks for navigation/header context
- center main work area
- right rail for admin/action commands
- draggable separators between regions

Until that layout is built, page-local splitters should remain small and easy to delete.
