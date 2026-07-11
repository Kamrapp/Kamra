import { describe, expect, it } from "vitest";
import { createFakeDb, FakeCollection } from "../../test-support/fake-mongo.js";
import { MongoStockReadRepository } from "./mongo-stock-read-repository.js";
import type { StockAllocation, StockBatch, StockTarget } from "./contracts.js";

const target: StockTarget = { acceptanceCriteria: { acceptedAttributesAny: [], acceptedConceptsAny: [], excludedAttributesAny: [], requiredAttributesAll: [], requiredConceptsAll: [] }, consumptionPolicy: "earliest_expiry_first", createdAt: "2026-07-11T00:00:00.000Z", createdByUserId: "u", displayName: "Milk", expiryWarningDays: 3, householdId: "h", id: "target", minimumQuantity: 2, revision: 0, status: "active", targetQuantity: 4, trackingUnit: "l", updatedAt: "2026-07-11T00:00:00.000Z", updatedByUserId: "u" };
const batch: StockBatch = { acquiredOn: "2026-07-01", acquisitionSnapshot: { displayName: "Milk" }, classificationSnapshot: { capturedAt: "2026-07-11T00:00:00.000Z", directAttributes: [], directConcepts: [], effectiveConcepts: [], source: "manual" }, createdAt: "2026-07-11T00:00:00.000Z", createdByUserId: "u", expiryOn: "2026-07-13", householdId: "h", id: "batch", originalQuantity: 1500, remainingQuantity: 1500, revision: 0, status: "available", unit: "ml", updatedAt: "2026-07-11T00:00:00.000Z", updatedByUserId: "u" };
const allocation: StockAllocation = { acceptanceResult: "accepted", allocatedQuantity: 1500, createdAt: target.createdAt, createdByUserId: "u", householdId: "h", id: "allocation", revision: 0, status: "active", stockBatchId: "batch", stockTargetId: "target", unit: "ml", updatedAt: target.updatedAt, updatedByUserId: "u" };

describe("MongoStockReadRepository", () => {
  it("returns one server-owned target aggregate", async () => {
    const db = createFakeDb({ household_stock_targets: new FakeCollection<Record<string, unknown>>("household_stock_targets", [target as unknown as Record<string, unknown>]), household_stock_batches: new FakeCollection<Record<string, unknown>>("household_stock_batches", [batch as unknown as Record<string, unknown>]), household_stock_allocations: new FakeCollection<Record<string, unknown>>("household_stock_allocations", [allocation as unknown as Record<string, unknown>]) });
    const result = await new MongoStockReadRepository(db).getTarget("h", "target", "2026-07-11");
    expect(result?.aggregate).toMatchObject({ availableQuantity: 1.5, nextExpiryOn: "2026-07-13", status: "below_minimum" });
    expect(result?.batches).toHaveLength(1);
  });
});
