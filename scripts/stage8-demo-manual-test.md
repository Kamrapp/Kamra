# Stage 8 household-stock manual verification

Use a local or disposable demo database only. Reseeding resets the stable demo household `household1`.

## Prepare

1. Set a disposable demo password in `.env.local`.

   ```powershell
   $env:SEED_DEMO_HOUSEHOLD_PASSWORD = "your-local-demo-password"
   ```

2. Reseed and start the app/API.

   ```powershell
   npm run seed
   ```

3. Sign in as `usera`, open `Hungarian nature household`, and use a desktop-width viewport.

## Product Group workspace

1. Confirm the Home workspace uses **Product groups**, not Product Concepts or Stock Targets. Groups start expanded; Products with batches start collapsed. Empty rows have no inert disclosure control.
2. Expand `Pilos 1.5% tej`; confirm its batches appear below the Product with aligned Quantity, Stocked at, and Expiry columns.
3. Click the Product pencil. Confirm the name becomes an in-table field, its Product Group dropdown appears, and Save/Discard work. Confirm the right-side Product block also loads the same Product.
4. Reassign that Product from its inline Product Group dropdown. Save, refresh, and confirm the Product and all of its batches now appear under the selected Group exactly once.
5. Click a Group pencil. Rename it inline, save, refresh, and confirm its Product rows and batches remain attached.
6. Click the detail magnifier on a Group and Product. Confirm it toggles between plus/minus and shows the corresponding target/identity details without editing unrelated rows.
7. Confirm the comparison symbols use muted status colors: Current below Minimum is danger; Current meeting Minimum is good; Current below/at Target is good; Current over Target is warning. Confirm Current itself has the faint emphasis surface.
8. In Dev Admin, toggle **Use abbreviated labels in compact UI**, refresh Home, and confirm state labels shorten (for example `below min.`). Turn it off again and confirm the full labels return.

## Stock batches and expiry

1. Expand a Product and click a Batch pencil. Confirm its quantity, Stocked at, and Expiry turn into fields in that same table row; no extra editor row appears. The matching Stock Batch block on the right also opens.
2. Change the Pilos Batch quantity and save. Confirm the row refreshes with the new quantity and the Product/Group derived Current updates.
3. Change the Batch expiry to a date before Stocked at. Save; it must succeed and remain visible after refresh.
4. Confirm an expired Batch appears before non-expired batches. Its expiry date must use the faded danger color. Non-expired dated Batches follow by earliest expiry; no-expiry Batches are last.
5. In Manage household, turn off **Allow expired items**, save, and confirm an expired Batch remains visible but stops contributing to Current. Confirm the success toast appears. Turn it back on and confirm its contribution returns.
6. Click Batch Discard, accept the confirmation, and confirm it is no longer an available row and the derived totals change. It must not report a 404.
7. From a Product row, click Add stock. Confirm only the Stock Batch block opens; the Group and Product blocks remain collapsed. Save a new Batch and confirm it appears under the same Product without changing identity data.

## Right-side editor and activity

1. Confirm **Active household** remains at the top of the right column above the three editor blocks.
2. Confirm each Group/Product/Batch editor disclosure uses a right-pointing arrow when closed and a down-pointing arrow when open.
3. Create a Group, Product without stock, and then a Batch. Confirm the Activity console names the affected Group/Product where possible and shows failures at the top in the error color.
4. Confirm clicking a Batch name alone does not unexpectedly open an editor; use its pencil. Selecting/editing remains available from the right-side blocks and the inline table.

## Layout and shopping boundary

1. With Household stock expanded and Shopping list collapsed, confirm the stock table grows to use the available height and its inner body scrolls beneath a fixed header.
2. Expand Shopping list. Confirm the two panels share the available vertical workspace roughly evenly and their inner content scrolls independently.
3. The shopping-list selection table is legacy transitional UI. Do not treat it as Product Group shopping behavior yet: moving selection checkboxes into the Product Group workspace remains a Stage 8 follow-up before shopping-flow acceptance.

## Related automated checks

```powershell
npm run smoke:transactions
npm test
npm run lint
npm run typecheck
npm run build:web
```
