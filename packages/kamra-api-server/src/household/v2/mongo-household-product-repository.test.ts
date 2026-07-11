import { describe, expect, it } from "vitest";
import { createFakeDb } from "../../test-support/fake-mongo.js";
import { MongoHouseholdProductRepository } from "./mongo-household-product-repository.js";
import type { HouseholdProduct } from "./contracts.js";

const product: HouseholdProduct = { classificationRevision: 0, createdAt: "2026-07-11T00:00:00.000Z", createdByUserId: "u", directAttributes: [], directConcepts: [], displayName: "Pilos 1.5% milk", householdId: "h", id: "product-1", identityKind: "manual", identitySnapshot: { brand: "Pilos" }, revision: 0, status: "active", updatedAt: "2026-07-11T00:00:00.000Z", updatedByUserId: "u" };

describe("MongoHouseholdProductRepository", () => {
  it("creates products and revision-checks reusable classification changes", async () => {
    const db = createFakeDb(); const repository = new MongoHouseholdProductRepository(db); await repository.create(product);
    const updated = await repository.updateClassification({ directAttributes: [{ key: "fat.1_5_percent", scope: "catalog" }], directConcepts: [{ key: "food.milk", scope: "catalog" }], expectedRevision: 0, householdId: "h", id: "product-1", updatedAt: product.updatedAt, updatedByUserId: "u" });
    expect(updated.classificationRevision).toBe(1); expect(updated.directConcepts).toEqual([{ key: "food.milk", scope: "catalog" }]);
    await expect(repository.updateClassification({ directAttributes: [], directConcepts: [], expectedRevision: 0, householdId: "h", id: "product-1", updatedAt: product.updatedAt, updatedByUserId: "u" })).rejects.toThrow("stale_revision");
  });
});
