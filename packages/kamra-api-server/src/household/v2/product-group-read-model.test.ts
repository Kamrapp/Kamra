import { describe, expect, it } from "vitest";

import type { HouseholdProduct, ProductGroup, StockBatch } from "./contracts.js";
import { buildProductGroupWorkspace } from "./product-group-read-model.js";

const time = "2026-07-12T00:00:00.000Z";
const group = (id: string, name: string, parentProductGroupId: string | null = null): ProductGroup => ({ createdAt: time, createdByUserId: "u", displayName: name, householdId: "h", id, parentProductGroupId, revision: 0, status: "active", targetPolicy: { consumptionPolicy: "earliest_expiry_first", desiredQuantity: 2, expiryWarningDays: 0, minimumQuantity: 1, trackingUnit: "count" }, trackingUnit: "count", updatedAt: time, updatedByUserId: "u" });
const product = (id: string, name: string, productGroupId: string | null): HouseholdProduct => ({ classificationRevision: 0, createdAt: time, createdByUserId: "u", directAttributes: [], directConcepts: [], displayName: name, householdId: "h", id, identityKind: "manual", identitySnapshot: {}, productGroupId, revision: 0, status: "active", updatedAt: time, updatedByUserId: "u" });
const batch = (id: string, productId: string, quantity: number): StockBatch => ({ acquiredOn: "2026-07-01", acquisitionSnapshot: { displayName: "Bread" }, classificationSnapshot: { capturedAt: time, directAttributes: [], directConcepts: [], effectiveConcepts: [], source: "manual" }, createdAt: time, createdByUserId: "u", expiryOn: null, householdId: "h", householdProductId: productId, id, originalQuantity: quantity, remainingQuantity: quantity, revision: 0, status: "available", unit: "count", updatedAt: time, updatedByUserId: "u" });

describe("buildProductGroupWorkspace", () => {
  it("rolls Product stock into its Group and ancestors once", () => {
    const result = buildProductGroupWorkspace({ allowExpiredItems: true, batches: [batch("b1", "p1", 1), batch("b2", "p1", 1)], groups: [group("g1", "Bread"), group("g2", "White bread", "g1")], products: [product("p1", "Pilos white bread", "g2")], today: "2026-07-12" });
    expect(result.productGroups[0]?.aggregate).toMatchObject({ availableQuantity: 2, state: "at_target" });
    expect(result.productGroups[0]?.childGroups[0]?.aggregate).toMatchObject({ availableQuantity: 2, state: "at_target" });
    expect(result.productGroups[0]?.childGroups[0]?.products).toHaveLength(1);
  });

  it("keeps Products without Groups visible and neutral without a target policy", () => {
    const result = buildProductGroupWorkspace({ allowExpiredItems: true, batches: [], groups: [], products: [product("p1", "Unassigned flour", null)], today: "2026-07-12" });
    expect(result.unassignedProducts[0]?.aggregate).toMatchObject({ availableQuantity: 0, state: "not_tracked" });
  });

  it("orders expired batches first, then earliest expiry", () => {
    const expired = { ...batch("expired", "p1", 1), expiryOn: "2026-07-10" };
    const soon = { ...batch("soon", "p1", 1), expiryOn: "2026-07-13" };
    const noExpiry = batch("none", "p1", 1);
    const result = buildProductGroupWorkspace({ allowExpiredItems: true, batches: [noExpiry, soon, expired], groups: [], products: [product("p1", "Milk", null)], today: "2026-07-12" });
    expect(result.unassignedProducts[0]?.batches.map((entry) => entry.id)).toEqual(["expired", "soon", "none"]);
  });
});
