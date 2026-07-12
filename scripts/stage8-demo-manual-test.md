# Stage 8 household-stock manual verification — remaining checks

Use the local/disposable demo household only. The Product Group terminology, expansion hierarchy, Group/Product rename and reassignment, and right-side Product loading were confirmed on 2026-07-12.

## Prepare

```powershell
$env:SEED_DEMO_HOUSEHOLD_PASSWORD = "your-local-demo-password"
npm run seed
```

Sign in as `usera`, open `Hungarian nature household`, and use a desktop-width viewport.

The refreshed demo fixture intentionally includes `Tej`, `Kenyér`, `Zöldségek`, `Gyümölcsök`, `Egészséges rágcsálnivalók`, and an empty `Ünnepi sütés` group; grouped and ungrouped Products cover multiple Batches, expiry ordering, target states, and Product-only rows.

## Recheck fixed behavior

1. Expand and collapse the Household stock panel. Confirm the panel itself shrinks, not only its inner table. Expand and collapse the Shopping list panel even when it contains saved items; its content and table must disappear while collapsed.
2. Confirm the About page action buttons are vertically centered within their action row.
3. Confirm the Household stock panel has Refresh in its title row and Manage household is a compact gear icon beside the household selector with an accessible label/title.
4. Expand `Pilos 1.5% tej`. Confirm Batch **Quantity** is vertically aligned with the Product/Group **Current** column. Stocked at and Expiry must have separate non-overlapping columns without shifting the action column.
5. Click the Pilos Product pencil. Confirm the inline Product Group dropdown initially displays its currently assigned Group, not `Unassigned`. Change it, save, refresh, and confirm the Product appears only under the new Group.
6. Click a Group pencil, then expand its details. Confirm Tracking unit, Set target, Minimum, and Desired restock are editable there. Save, refresh, and confirm the table’s target columns preserve the new values.
7. Confirm Group details call the policy state **Configured/Not set**, rather than presenting a target quantity as “Target policy”.
8. Confirm the comparison glyph colors are visible in both themes: below Minimum is danger, meeting Minimum is leaf/good, above Desired restock is warning. Current must retain its faint emphasis.
9. In Dev Admin, save **Use abbreviated labels in compact UI**. Confirm it no longer rejects the flag key. Refresh Home and verify abbreviated state labels; turn it off and confirm the full labels return.
10. Edit a Batch quantity to a value both below and above its original quantity. Each save must refresh the Batch/Product/Group Current without a 500. Also set expiry before Stocked at and confirm it persists.
11. Save the Batch from the right-side editor and confirm the table row leaves edit mode and the editor clears. Save from the inline row and confirm the right-side editor also clears and the refreshed values appear.
12. Discard a Batch and confirm it completes without a 404.
13. Confirm comparison symbols are visibly larger and the state badges use good/danger styling in both light and dark themes.
14. In the Shopping list, add an impulse item, then submit the same name again with different casing or accents. Confirm no second line is created, the input remains filled, and the activity console reports that the item was already added.
15. Click a Product pencil and edit GTIN and Note in the expanded Product details row. Save, refresh, and confirm both values persist.
16. Expand a Product and confirm every Batch has magnifier, pencil, and discard actions immediately. The Batch magnifier shows Stocked at in its details row; the main Batch row shows Quantity and Expiry without overlapping dates. Discard works without opening edit mode.
17. Confirm the household selector panel does not show a persistent “Loaded N stock rows” message after refresh; meaningful save/error feedback belongs in the activity console or a mutation toast.
18. Confirm the Product Group table has no nested Stock Batch header. Group/Product rows show compact Minimum, Current, Target, and one Unit column; Batch Quantity aligns under Current and Batch Expiry sits toward the right across the Unit/State area.
19. Open the Manual page and confirm terminology cards are compact, readable, and do not dominate the tab content.
20. In Manage household, review **When a Product Group is below target**. Confirm the default is **Add products, then add a group item if needed**, and verify the other two choices save and survive refresh.
21. Generate a shopping list for the seeded v2 household. Confirm generated lines use concrete Products where available and show a Product Group name only for a Group impulse fallback. Tick a Product line, adjust its purchased amount, apply the list, refresh Home, and confirm a new Batch appears under that Product. For a Group impulse line, confirm a manual Product is created under the Group before its Batch is acquired.

## Remaining Stage 8 behavior

1. Confirm expired Batches sort ahead of non-expired Batches, future expiry remains ascending, and no-expiry Batches are last. Expired expiry text must be danger-toned.
2. In Manage household, turn **Allow expired items** off and save. The expired Batch stays visible but stops contributing to Current; the settings success toast appears. Re-enable and confirm it contributes again.
3. From a Product row, use Add stock. Only the Batch editor should open. Save a new Batch and confirm Product identity remains unchanged.
4. Confirm Active household remains above the right-side editors and each editor uses right/down disclosure arrows.
5. Confirm the Unassigned Products area is a slim separator rather than a full warning-colored data row. Confirm the demo no longer contains a productless `Needs Product` batch.
6. Confirm activity entries name the affected Group/Product where available and newest errors appear first.
7. Verify Group/Product/Batch delete confirmations and outcomes.
8. Use the demo fixture to inspect: two milk Products under one targeted Group, two bread Products under another targeted Group, no-target vegetable/fruit groups, a one-Product group, an empty group, ungrouped Products, multi-Batch Products, expired and future-expiry Batches, and a Product below its minimum.

## Deferred boundary

The Home list still stores its display/edit shell in the existing shopping-list collection for continuity, but v2 Product Group data now drives generation and v2 Product/Batch commands drive purchase application. The earlier note that the “final grouped-item rule was cut off” referred to the user request that ended after “for grouped items, we should”; the rule is now defined by the household setting below.

The grouped-target rule is now visible through the Home generation flow whenever the household has v2 Product Group data: Product target shortages are generated first; Group shortage is recalculated after those planned quantities; remaining shortage is split across already-planned Products, otherwise assigned to the earliest-expiring stocked Product (or the first Product), with the default mode creating a Group impulse need only when no Product exists. Applying purchased lines from this v2-compatible list creates or reuses Household Products and acquires v2 Stock Batches.

## Automated checks

```powershell
npm test
npm run lint
npm run typecheck
npm run build:web
npm run smoke:transactions
```
