import { describe, expect, it } from "vitest";

import { FakeCollection, createFakeDb } from "../../test-support/fake-mongo.js";
import type { HouseholdProduct, StockAllocation, StockBatch, StockTarget } from "./contracts.js";
import { MongoProductGroupRepository } from "./mongo-product-group-repository.js";

const time = "2026-07-12T00:00:00.000Z";
const target = (id: string, name: string): StockTarget => ({
  acceptanceCriteria: {
    acceptedAttributesAny: [],
    acceptedConceptsAny: [],
    excludedAttributesAny: [],
    requiredAttributesAll: [],
    requiredConceptsAll: []
  },
  consumptionPolicy: "earliest_expiry_first",
  createdAt: time,
  createdByUserId: "u",
  displayName: name,
  expiryWarningDays: 0,
  householdId: "h",
  id,
  minimumQuantity: 1,
  preferredProductId: null,
  preferredProductNameSnapshot: null,
  revision: 0,
  status: "active",
  targetQuantity: 2,
  trackingUnit: "count",
  updatedAt: time,
  updatedByUserId: "u"
});
const product = (id: string, name: string): HouseholdProduct => ({
  classificationRevision: 0,
  createdAt: time,
  createdByUserId: "u",
  directAttributes: [],
  directConcepts: [],
  displayName: name,
  householdId: "h",
  id,
  identityKind: "manual",
  identitySnapshot: {},
  revision: 0,
  status: "active",
  updatedAt: time,
  updatedByUserId: "u"
});
const batch = (id: string, name: string, householdProductId?: string | null): StockBatch => ({
  acquiredOn: "2026-07-12",
  acquisitionSnapshot: { displayName: name },
  classificationSnapshot: {
    capturedAt: time,
    directAttributes: [],
    directConcepts: [],
    effectiveConcepts: [],
    source: "manual"
  },
  createdAt: time,
  createdByUserId: "u",
  expiryOn: null,
  householdId: "h",
  householdProductId,
  id,
  originalQuantity: 1,
  remainingQuantity: 1,
  revision: 0,
  status: "available",
  unit: "count",
  updatedAt: time,
  updatedByUserId: "u"
});
const allocation = (id: string, batchId: string, targetId: string): StockAllocation => ({
  acceptanceResult: "accepted",
  allocatedQuantity: 1,
  createdAt: time,
  createdByUserId: "u",
  householdId: "h",
  id,
  revision: 0,
  status: "active",
  stockBatchId: batchId,
  stockTargetId: targetId,
  unit: "count",
  updatedAt: time,
  updatedByUserId: "u"
});

describe("MongoProductGroupRepository", () => {
  it("converts one-target Product history and wraps anonymous Batches in a generic Product", async () => {
    const products = new FakeCollection<Record<string, unknown>>("household_products", [
      product("p1", "White bread") as unknown as Record<string, unknown>
    ]);
    const batches = new FakeCollection<Record<string, unknown>>("household_stock_batches", [
      batch("b1", "White bread", "p1") as unknown as Record<string, unknown>,
      batch("b2", "Milk", null) as unknown as Record<string, unknown>
    ]);
    const db = createFakeDb({
      household_product_groups: new FakeCollection("household_product_groups"),
      household_stock_targets: new FakeCollection<Record<string, unknown>>(
        "household_stock_targets",
        [target("t1", "Bread") as unknown as Record<string, unknown>]
      ),
      household_stock_allocations: new FakeCollection<Record<string, unknown>>(
        "household_stock_allocations",
        [allocation("a1", "b1", "t1") as unknown as Record<string, unknown>]
      ),
      household_stock_batches: batches,
      household_products: products
    });

    const report = await new MongoProductGroupRepository(db).migrateLegacy();

    expect(report).toMatchObject({
      anonymousBatchesLinked: 1,
      conflicts: 0,
      groupsCreated: 1,
      productsLinked: 1
    });
    await expect(products.findOne({ id: "p1" })).resolves.toMatchObject({
      productGroupId: "product-group:t1"
    });
    await expect(batches.findOne({ id: "b2" })).resolves.toMatchObject({
      householdProductId: "household-product:legacy-anonymous:h:milk"
    });
    await expect(
      db.collection("household_product_groups").findOne({ id: "product-group:t1" })
    ).resolves.toMatchObject({
      displayName: "Bread",
      targetPolicy: { desiredQuantity: 2, minimumQuantity: 1 }
    });
  });

  it("reports a Product with multiple legacy Targets without assigning it", async () => {
    const products = new FakeCollection<Record<string, unknown>>("household_products", [
      product("p1", "Bread") as unknown as Record<string, unknown>
    ]);
    const db = createFakeDb({
      household_product_groups: new FakeCollection("household_product_groups"),
      household_stock_targets: new FakeCollection<Record<string, unknown>>(
        "household_stock_targets",
        [
          target("t1", "Bread") as unknown as Record<string, unknown>,
          target("t2", "Breakfast") as unknown as Record<string, unknown>
        ]
      ),
      household_stock_allocations: new FakeCollection<Record<string, unknown>>(
        "household_stock_allocations",
        [
          allocation("a1", "b1", "t1") as unknown as Record<string, unknown>,
          allocation("a2", "b2", "t2") as unknown as Record<string, unknown>
        ]
      ),
      household_stock_batches: new FakeCollection<Record<string, unknown>>(
        "household_stock_batches",
        [
          batch("b1", "Bread", "p1") as unknown as Record<string, unknown>,
          batch("b2", "Bread", "p1") as unknown as Record<string, unknown>
        ]
      ),
      household_products: products
    });

    const report = await new MongoProductGroupRepository(db).migrateLegacy();

    expect(report.conflicts).toBe(1);
    await expect(products.findOne({ id: "p1" })).resolves.not.toHaveProperty("productGroupId");
  });
});
