# Frontend UI Notes

Kamra currently uses Angular standalone components with small shared UI helpers instead of a broad component framework. Reuse existing helpers and native CSS/Angular capabilities before adding a UI dependency or custom layout machinery.

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

Evaluate AG Grid Community only if several real admin/review pages need capabilities such as column reordering, richer header filters, persisted column state, selection, virtualized infinite rows, or advanced keyboard behavior that the existing table helper cannot meet cheaply. Do not add it for a one-off table or basic layout.

Keep framework adoption scoped:

- introduce it first behind a reusable Kamra table wrapper
- avoid mixing framework table styling directly into feature components
- document which features use community/free modules only
- keep server-side pagination/filtering semantics owned by Kamra APIs

## Split Views

For a real second split-view page, extract the shared layout behavior rather than duplicating page-local drag math. Until then, use a small page-local implementation or native CSS layout when that is clearer. A future desktop-style split view may use:

- left rail with two stacked blocks for navigation/header context
- center main work area
- right rail for admin/action commands
- draggable separators between regions

Until that layout is built, page-local splitters should remain small and easy to delete.
