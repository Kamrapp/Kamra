import { describe, expect, it } from "vitest";
import { createAdHocShoppingNeed, generateShoppingNeed, generateTargetPolicyShoppingNeed, transitionShoppingNeed } from "./shopping-needs.js";
import type { StockTarget } from "./contracts.js";
import type { StockTargetAggregate } from "./domain.js";

const target: StockTarget = { acceptanceCriteria: { acceptedAttributesAny: [], acceptedConceptsAny: [], excludedAttributesAny: [], requiredAttributesAll: [], requiredConceptsAll: [] }, consumptionPolicy: "earliest_expiry_first", createdAt: "2026-07-11T00:00:00.000Z", createdByUserId: "u", displayName: "Milk", expiryWarningDays: 3, householdId: "h", id: "target", minimumQuantity: 2, preferredProductId: "product", preferredProductNameSnapshot: "Milk 1 l", revision: 0, status: "active", targetQuantity: 4, trackingUnit: "l", updatedAt: "2026-07-11T00:00:00.000Z", updatedByUserId: "u" };
const aggregate: StockTargetAggregate = { availableQuantity: 1, batchCount: 1, expiringBatchCount: 0, nextExpiryOn: null, noticeCodes: ["below_minimum"], status: "below_minimum" };

describe("shopping needs", () => {
  it("creates a shortage snapshot without selecting a shop or product", () => {
    expect(generateShoppingNeed(target, aggregate, "need-1")).toMatchObject({ plannedQuantity: 3, reasonCode: "below_minimum", stockTargetId: "target", state: "open", unit: "l" });
    expect(generateShoppingNeed(target, { ...aggregate, availableQuantity: 2, status: "between_minimum_and_target", noticeCodes: [] }, "need-2")).toBeNull();
  });
  it("supports ad-hoc and revision-checked skip/restore transitions", () => {
    const need = createAdHocShoppingNeed({ id: "manual", plannedQuantity: 2, unit: "count" }); const skipped = transitionShoppingNeed(need, "skipped", 0);
    expect(skipped).toMatchObject({ revision: 1, state: "skipped" }); expect(transitionShoppingNeed(skipped, "open", 1).state).toBe("open"); expect(() => transitionShoppingNeed(skipped, "open", 0)).toThrow("stale_revision");
  });
  it("generates a Product Group-owned need from its target policy", () => {
    const need = generateTargetPolicyShoppingNeed({ aggregate: { availableQuantity: 1, batchCount: 1, nextExpiryOn: null, state: "below_minimum", trackingUnit: "l" }, displayName: "Milk", id: "group:milk", needId: "need:milk", ownerKind: "product_group", policy: { consumptionPolicy: "earliest_expiry_first", desiredQuantity: 3, expiryWarningDays: 0, minimumQuantity: 2, trackingUnit: "l" } });
    expect(need).toMatchObject({ ownerId: "group:milk", ownerKind: "product_group", plannedQuantity: 2, unit: "l" });
  });
});
