import { describe, expect, it } from "vitest";
import { createFakeDb, FakeCollection } from "../../test-support/fake-mongo.js";
import { MongoStockMigrationRepository } from "./mongo-stock-migration.js";

const time = "2026-07-11T00:00:00.000Z";
describe("MongoStockMigrationRepository", () => {
  it("maps legacy products and stock to targets, batches, allocations, and opening movements idempotently", async () => {
    const db = createFakeDb({
      household_local_products: new FakeCollection("household_local_products", [
        {
          catalogProductId: null,
          createdAt: time,
          createdByUserId: "u",
          displayName: "Bread",
          householdId: "h",
          id: "p",
          stockGroupKey: "bread",
          status: "active",
          updatedAt: time,
          updatedByUserId: "u"
        }
      ]),
      household_stock_items: new FakeCollection("household_stock_items", [
        {
          catalogProductId: null,
          createdAt: time,
          createdByUserId: "u",
          currentAmount: 2,
          displayName: "Bread",
          householdId: "h",
          householdProductId: "p",
          id: "s",
          initialAmount: 2,
          minLimit: 1,
          stockedAt: time,
          status: "active",
          unit: "loaf",
          updatedAt: time,
          updatedByUserId: "u"
        }
      ])
    });
    const repository = new MongoStockMigrationRepository(db);
    await repository.setupCollections();
    expect(await repository.migrateLegacy()).toEqual({
      allocations: 1,
      batches: 1,
      movements: 1,
      targets: 1,
      totalMigratedQuantity: 2
    });
    await repository.migrateLegacy();
    expect(db.__collections["household_stock_batches"]!.docs).toHaveLength(1);
    expect(db.__collections["household_stock_allocations"]!.docs).toHaveLength(1);
  });
});
