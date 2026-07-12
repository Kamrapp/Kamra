# Stage 8 household-stock manual verification — remaining checks

Use the local/disposable demo household only. The Product Group terminology, expansion hierarchy, Group/Product rename and reassignment, and right-side Product loading were confirmed on 2026-07-12.

## Prepare

```powershell
$env:SEED_DEMO_HOUSEHOLD_PASSWORD = "your-local-demo-password"
npm run seed
```

Sign in as `usera`, open `Hungarian nature household`, and use a desktop-width viewport.

## Recheck fixed behavior

1. Expand `Pilos 1.5% tej`. Confirm Batch **Quantity** is vertically aligned with the Product/Group **Current** column. Stocked at and Expiry must follow it without shifting the action column.
2. Click the Pilos Product pencil. Confirm the inline Product Group dropdown initially displays its currently assigned Group, not `Unassigned`. Change it, save, refresh, and confirm the Product appears only under the new Group.
3. Click a Group pencil, then expand its details. Confirm Tracking unit, Set target, Minimum, and Desired restock are editable there. Save, refresh, and confirm the table’s target columns preserve the new values.
4. Confirm Group details call the policy state **Configured/Not set**, rather than presenting a target quantity as “Target policy”.
5. Confirm the comparison glyph colors are visible in both themes: below Minimum is danger, meeting Minimum is leaf/good, above Desired restock is warning. Current must retain its faint emphasis.
6. In Dev Admin, save **Use abbreviated labels in compact UI**. Confirm it no longer rejects the flag key. Refresh Home and verify abbreviated state labels; turn it off and confirm the full labels return.
7. Edit a Batch quantity to a value both below and above its original quantity. Each save must refresh the Batch/Product/Group Current without a 500. Also set expiry before Stocked at and confirm it persists.
8. Discard a Batch and confirm it completes without a 404.

## Remaining Stage 8 behavior

1. Confirm expired Batches sort ahead of non-expired Batches, future expiry remains ascending, and no-expiry Batches are last. Expired expiry text must be danger-toned.
2. In Manage household, turn **Allow expired items** off and save. The expired Batch stays visible but stops contributing to Current; the settings success toast appears. Re-enable and confirm it contributes again.
3. From a Product row, use Add stock. Only the Batch editor should open. Save a new Batch and confirm Product identity remains unchanged.
4. Confirm Active household remains above the right-side editors and each editor uses right/down disclosure arrows.
5. Confirm activity entries name the affected Group/Product where available and newest errors appear first.
6. Verify Group/Product/Batch delete confirmations and outcomes.

## Deferred boundary

Moving shopping-selection checkboxes into the Product Group workspace requires the direct v2 shopping-list bridge and batch-aware purchase application. The current legacy shopping-list selector must not be used as evidence that Product Group shopping is complete.

## Automated checks

```powershell
npm test
npm run lint
npm run typecheck
npm run build:web
npm run smoke:transactions
```
