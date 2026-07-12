# Stage 8 demo household manual test

Use this against the local/demo database only. Reseeding resets the stable demo household `household1` and its legacy plus Stage 8 stock data.

## Prepare

1. Set a disposable demo password in `.env.local`:

   ```powershell
   $env:SEED_DEMO_HOUSEHOLD_PASSWORD = "your-local-demo-password"
   ```

2. Reseed the demo data:

   ```powershell
   npm run seed
   ```

3. Start the app/API and sign in as `usera` with that password. Open the demo household `Hungarian nature household`.

## Expected starting data

- Stock Target `Tej (bármelyik termék)`: target `3 l`, minimum `1 l`, current derived amount `2.5 l`.
- Product `Pilos 1.5% tej`: one allocated `1.5 l` batch.
- Product `Mizo laktózmentes tej`: one allocated `1 l` batch.
- Product `Kézzel felvitt joghurt`: one visible expired batch with quantity `4 custom:db`; its expiry is intentionally earlier than its acquisition date.
- `Liszt – még nincs besorolva`: one unassigned `2 custom:db` batch with no expiry and no Household Product.
- `Allow expired items` is enabled by default.

## Test sequence

1. Confirm Home groups the two different milk Products under one Stock Target and shows the derived `2.5 l`; do not edit the amount directly.
2. Rename `Pilos 1.5% tej`. Refresh and confirm its batch remains attached and its dates/quantity are unchanged.
3. Correct the Pilos batch quantity from `1.5` to `1`. Confirm the target amount becomes `2 l`.
4. Set that batch expiry to a date before its acquisition date. Save; it must succeed. Confirm the date is retained.
5. Turn `Allow expired items` off and save. Confirm expired stock stays visible but is excluded from the target amount and cannot be consumed.
6. Turn the setting back on. Confirm the expired stock becomes eligible again.
7. Discard the Mizo batch. Confirm the target amount falls to the remaining eligible quantity and the batch is not silently erased from history/status.
8. Inspect the unassigned group. Confirm the flour batch remains visible and can be corrected without becoming an unrelated top-level household row.
9. From the Pilos Product row, click **Add stock**. Confirm the right editor switches to **New stock batch**, keeps the Product name read-only, and lets you enter quantity, Stocked at, and Expiry. Save and confirm a second batch appears without changing the Product identity or the first batch snapshot.
10. Confirm that household Product Concept controls are no longer present in the stock workspace; existing classification data is deliberately deferred from this view.
11. Use the Product editor to save a Product with no initial Batch. Confirm it appears as an empty Product in Unassigned. Then select it, enable **Create initial stock batch**, enter a positive quantity, and confirm its Batch appears under the Product.
12. Rename a demo Product and a Stock Target. Confirm both save without a 404 and retain their existing Batch data.
13. Use **Add Stock Target** in the grouped footer. Confirm the inline draft accepts name, minimum, target, and unit; save it, then use the row edit and details icons to rename it and change its limits. Confirm its current amount remains derived/read-only.
14. In the left rail, click **Build shopping list**. Confirm checkboxes appear in the temporary selection table and the scale-eligible rows start selected.
15. Change the shopping scale. Confirm the checked selection resets to that scale's eligible rows; manually select or clear at least one row.
16. Click **Generate shopping list**. Confirm only checked legacy stock rows are included, then confirm the selection checkboxes disappear. Start Build again and use Cancel; confirm the checkboxes disappear without changing the persisted list.
17. Re-run `npm run seed` when finished to restore the fixture for the next tester.

## Pending workspace refinements

- Verify the compact fixed-header grouped table: Target rows expose Current, Minimum, and State; Product/Batch rows are visually indented and keep action columns aligned regardless of name or quantity length.
- Verify Target and Batch inline editors are collapsed by default and label Stocked at versus Expiry explicitly.
- Verify Manage household owns household name, default calculated max-limit multiplier, and Allow expired items; invitation remains a visible placeholder.
- The temporary checkbox selector currently uses the legacy stock table because the grouped v2 workspace still needs its own Shopping Need-to-list bridge. Do not treat it as v2 Target/Batch list generation yet.

## Related automated checks

```powershell
npm run smoke:transactions
npm test
npm run typecheck
npm run build:web
```
