import { describe, expect, it } from "vitest";
import { createFakeDb, FakeCollection } from "../test-support/fake-mongo.js";
import { MongoAlphaDomainLanguageMaintenance } from "./alpha-domain-language-maintenance.js";

describe("MongoAlphaDomainLanguageMaintenance", () => {
  it("previews final and preserved legacy collection counts", async () => {
    const database = createFakeDb({
      household_local_products: new FakeCollection("household_local_products", [{ id: "old" }]),
      household_product_groups: new FakeCollection("household_product_groups", [{ id: "group" }])
    });

    await expect(new MongoAlphaDomainLanguageMaintenance(database).preview()).resolves.toEqual({
      finalCollections: {
        household_product_groups: 1,
        household_products: 0,
        household_stock_allocations: 0,
        household_stock_batches: 0,
        household_stock_movements: 0
      },
      preservedLegacyCollections: {
        household_local_products: 1,
        household_stock_items: 0,
        household_stock_targets: 0
      }
    });
  });

  it("composes the existing idempotent migrations without deleting legacy evidence", async () => {
    const database = createFakeDb({
      household_local_products: new FakeCollection("household_local_products"),
      household_stock_items: new FakeCollection("household_stock_items")
    });
    const maintenance = new MongoAlphaDomainLanguageMaintenance(database);

    await expect(maintenance.setupCollections()).resolves.toEqual({
      delegatedActions: [
        "household-stock-targets-v1",
        "household-products-v1",
        "household-product-groups-v1"
      ],
      status: "ready"
    });
    const report = await maintenance.migrateLegacy();

    expect(report.status).toBe("completed");
    expect(report.groups.conflicts).toBe(0);
    expect(database.__collections["household_local_products"]?.docs).toHaveLength(0);
    expect(database.__collections["household_stock_items"]?.docs).toHaveLength(0);
  });
});
