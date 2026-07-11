import { describe, expect, it } from "vitest";
import { aggregateAvailableQuantity, calculateEffectiveConcepts, classifyProduct, convertQuantity, matchAcceptanceCriteria, orderBatchesForConsumption, planConsumption, validateConceptRelations } from "./domain.js";
import type { AcceptanceCriteria, ProductConceptRef, StockAllocation, StockBatch, StockTarget } from "./contracts.js";
import { assertStockAllocation, assertStockBatch, assertStockTarget } from "./validation.js";

const concept = (key: string): ProductConceptRef => ({ scope: "catalog", key });
const attribute = (key: string) => ({ scope: "catalog" as const, key });
const criteria: AcceptanceCriteria = { requiredConceptsAll: [concept("pasta")], acceptedConceptsAny: [concept("spaghetti")], requiredAttributesAll: [attribute("gluten_free")], acceptedAttributesAny: [], excludedAttributesAny: [] };

describe("household v2 classification", () => {
  it("calculates sorted inclusive ancestry and explains a matching product", () => {
    const classification = classifyProduct([concept("spaghetti")], [attribute("gluten_free")], [{ kind: "is_a", child: concept("spaghetti"), parent: concept("pasta") }]);
    expect(classification.effectiveConcepts).toEqual([concept("pasta"), concept("spaghetti")]);
    expect(matchAcceptanceCriteria(criteria, classification)).toMatchObject({ accepted: true, missingRequiredConcepts: [], missingRequiredAttributes: [] });
  });

  it("rejects self-links and cycles", () => {
    expect(() => validateConceptRelations([{ kind: "is_a", child: concept("pasta"), parent: concept("pasta") }])).toThrow("self-link");
    expect(() => calculateEffectiveConcepts([concept("pasta")], [
      { kind: "is_a", child: concept("pasta"), parent: concept("food") },
      { kind: "is_a", child: concept("food"), parent: concept("pasta") }
    ])).toThrow("cycle");
  });
});

const target: StockTarget = { id: "target", householdId: "household", displayName: "Milk", trackingUnit: "l", minimumQuantity: 2, targetQuantity: 4, expiryWarningDays: 3, consumptionPolicy: "earliest_expiry_first", acceptanceCriteria: { requiredConceptsAll: [], acceptedConceptsAny: [], requiredAttributesAll: [], acceptedAttributesAny: [], excludedAttributesAny: [] }, status: "active", revision: 0, createdAt: "2026-07-11T00:00:00.000Z", updatedAt: "2026-07-11T00:00:00.000Z", createdByUserId: "user", updatedByUserId: "user" };
const batch = (id: string, expiryOn: string | null, quantity: number, acquiredOn = "2026-07-01"): StockBatch => ({ id, householdId: "household", acquiredOn, expiryOn, originalQuantity: quantity, remainingQuantity: quantity, unit: "ml", status: "available", acquisitionSnapshot: { displayName: id }, classificationSnapshot: { directConcepts: [], effectiveConcepts: [], directAttributes: [], source: "manual", capturedAt: "2026-07-11T00:00:00.000Z" }, revision: 0, createdAt: "2026-07-11T00:00:00.000Z", updatedAt: "2026-07-11T00:00:00.000Z", createdByUserId: "user", updatedByUserId: "user" });
const allocation = (batchId: string, quantity: number): StockAllocation => ({ id: `allocation-${batchId}`, householdId: "household", stockBatchId: batchId, stockTargetId: "target", allocatedQuantity: quantity, unit: "ml", acceptanceResult: "accepted", status: "active", revision: 0, createdAt: "2026-07-11T00:00:00.000Z", updatedAt: "2026-07-11T00:00:00.000Z", createdByUserId: "user", updatedByUserId: "user" });

describe("household v2 stock rules", () => {
  it("converts compatible units and prevents overlap double counting", () => {
    expect(convertQuantity(2, "l", "ml")).toBe(2000);
    expect(aggregateAvailableQuantity(target, [batch("a", "2026-07-20", 1500), batch("b", null, 1000)], [allocation("a", 1500)])).toBe(1.5);
  });

  it("orders dated batches before no-expiry batches with deterministic ties", () => {
    expect(orderBatchesForConsumption([batch("b", null, 1), batch("a", "2026-07-20", 1), batch("c", "2026-07-20", 1)], "earliest_expiry_first").map((item) => item.id)).toEqual(["a", "c", "b"]);
  });

  it("plans partial multi-batch consumption and rejects insufficient stock", () => {
    const first = batch("first", "2026-07-20", 1000, "2026-07-01"); const second = batch("second", null, 1000, "2026-07-02");
    expect(planConsumption(target, [first, second], [allocation("first", 1000), allocation("second", 1000)], 1.5)).toEqual([{ batchId: "first", quantity: 1000, unit: "ml" }, { batchId: "second", quantity: 500, unit: "ml" }]);
    expect(() => planConsumption(target, [first], [allocation("first", 1000)], 2)).toThrow("insufficient_stock");
  });

  it("validates target, batch, allocation, precision, and expiry invariants", () => {
    expect(() => assertStockTarget(target)).not.toThrow();
    expect(() => assertStockBatch(batch("a", "2026-07-20", 1))).not.toThrow();
    expect(() => assertStockAllocation(allocation("a", 1))).not.toThrow();
    expect(() => assertStockBatch(batch("bad", "2026-06-01", 1))).toThrow("precede");
    expect(() => assertStockTarget({ ...target, targetQuantity: 1 })).toThrow("below");
    expect(() => assertStockAllocation({ ...allocation("a", 1), allocatedQuantity: 1.0000001 })).toThrow("positive");
  });
});
