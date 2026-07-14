# Stage 4 Part 2 UI Pagination Session

## Scope

Improve product catalog pagination and table behavior after the product view only loaded the first 200 backend rows.

## Decisions

- Keep the current lightweight Angular UI stack for this pass.
- Use server-side pagination for product catalog data.
- Use infinite scroll in the product table viewport to append additional server pages.
- Document AG Grid Community as the preferred future evaluation target if table features become heavier than the shared Kamra table can reasonably support.

## Implemented

- Added query propagation through the Node API adapter.
- Changed `/api/catalog/products` to parse `page` and `pageSize`.
- Changed catalog repository product review query to use `skip`, `limit`, and `countDocuments`.
- Changed product catalog service/component to request pages of 25 and append more rows near the bottom of the table.
- Added `/api/catalog/sources` so offer source filters are complete before every source has appeared in paged products.
- Added server-side source filtering for product pages.
- Added docs in `docs/frontend-ui.md`.

## Validation

- `npm test -- packages/kamra-api-server/src/http/app-handler.test.ts`
- `npm run typecheck`
- `npm run build`

## Remaining Followups

- Clean polluted persisted product names such as price-prefixed Lidl rows.
- Add server-side source/name filters if current-page-only source filters are not sufficient.
- Evaluate AG Grid Community before adding column reordering, rich filters, or more advanced table keyboard behavior manually.
