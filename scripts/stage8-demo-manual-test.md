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
9. Create a second batch for the Pilos Product, then classify the Product. Confirm the new batch inherits Product classification while the earlier batch snapshot remains unchanged.
10. Re-run `npm run seed` when finished to restore the fixture for the next tester.

## Related automated checks

```powershell
npm run smoke:transactions
npm test
npm run typecheck
npm run build:web
```
