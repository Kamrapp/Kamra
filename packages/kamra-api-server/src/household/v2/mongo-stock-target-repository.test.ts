import { describe, expect, it } from "vitest";
import { createFakeDb, FakeCollection } from "../../test-support/fake-mongo.js";
import type { StockTarget } from "./contracts.js";
import { MongoStockTargetRepository } from "./mongo-stock-target-repository.js";

const target: StockTarget = {
  acceptanceCriteria: {
    acceptedAttributesAny: [],
    acceptedConceptsAny: [],
    excludedAttributesAny: [],
    requiredAttributesAll: [],
    requiredConceptsAll: []
  },
  consumptionPolicy: "earliest_expiry_first",
  createdAt: "2026-07-11T00:00:00.000Z",
  createdByUserId: "u",
  displayName: "Milk",
  expiryWarningDays: 3,
  householdId: "h",
  id: "target",
  minimumQuantity: 2,
  revision: 0,
  status: "active",
  targetQuantity: 4,
  trackingUnit: "l",
  updatedAt: "2026-07-11T00:00:00.000Z",
  updatedByUserId: "u"
};

describe("MongoStockTargetRepository", () => {
  it("creates, revision-checks, updates, and archives targets", async () => {
    const db = createFakeDb({
      household_stock_targets: new FakeCollection<Record<string, unknown>>(
        "household_stock_targets",
        [target as unknown as Record<string, unknown>]
      )
    });
    const repository = new MongoStockTargetRepository(db);
    expect(
      (
        await repository.update({
          expectedRevision: 0,
          householdId: "h",
          id: "target",
          patch: { minimumQuantity: 3 },
          updatedAt: target.updatedAt,
          updatedByUserId: "u"
        })
      ).revision
    ).toBe(1);
    await expect(
      repository.update({
        expectedRevision: 0,
        householdId: "h",
        id: "target",
        patch: { minimumQuantity: 1 },
        updatedAt: target.updatedAt,
        updatedByUserId: "u"
      })
    ).rejects.toThrow("stale_revision");
    expect(
      (
        await repository.archive({
          expectedRevision: 1,
          householdId: "h",
          id: "target",
          updatedAt: target.updatedAt,
          updatedByUserId: "u"
        })
      ).status
    ).toBe("archived");
  });
});
