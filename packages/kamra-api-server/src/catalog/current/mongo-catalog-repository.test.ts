import { describe, expect, it } from "vitest";

import { MongoCurrentCatalogRepository } from "./mongo-catalog-repository.js";
import { createFakeDb, FakeCollection } from "../../test-support/fake-mongo.js";

describe("MongoCurrentCatalogRepository", () => {
  it("treats legacy products as unvalidated without needing a startup write", async () => {
    const db = createFakeDb({
      products: new FakeCollection("products", [
        {
          brandName: "Legacy",
          createdAt: "2026-07-01T08:00:00.000Z",
          id: "product_legacy_1",
          kind: "grocery",
          measurements: [],
          name: "Legacy item",
          normalizedName: "legacy item",
          origin: [
            {
              capturedAt: "2026-07-01T08:00:00.000Z",
              kind: "seed",
              producer: "LegacySeed",
              sourceName: "seed_catalog"
            }
          ],
          primaryCategoryKey: null,
          status: "active",
          updatedAt: "2026-07-01T08:00:00.000Z"
        }
      ])
    });

    const repository = new MongoCurrentCatalogRepository(db);
    await repository.setupCollections();

    const page = await repository.listCatalogProductsForReview();

    expect(db.__collections["products"]!.docs[0]).toMatchObject({
      name: "Legacy item"
    });
    expect(page.products[0]).toMatchObject({
      id: "product_legacy_1",
      validationStatus: "unvalidated"
    });
  });

  it("backfills missing validation state to unvalidated", async () => {
    const db = createFakeDb({
      products: new FakeCollection("products", [
        {
          brandName: "Legacy",
          createdAt: "2026-07-01T08:00:00.000Z",
          id: "product_legacy_1",
          kind: "grocery",
          measurements: [],
          name: "Legacy item",
          normalizedName: "legacy item",
          origin: [
            {
              capturedAt: "2026-07-01T08:00:00.000Z",
              kind: "seed",
              producer: "LegacySeed",
              sourceName: "seed_catalog"
            }
          ],
          primaryCategoryKey: null,
          status: "active",
          updatedAt: "2026-07-01T08:00:00.000Z"
        },
        {
          createdAt: "2026-07-01T08:00:00.000Z",
          id: "product_validated_1",
          invalidatedAt: null,
          invalidatedBy: null,
          kind: "grocery",
          measurements: [],
          name: "Validated item",
          normalizedName: "validated item",
          origin: [
            {
              capturedAt: "2026-07-01T08:00:00.000Z",
              kind: "seed",
              producer: "ValidatedSeed",
              sourceName: "seed_catalog"
            }
          ],
          primaryCategoryKey: null,
          status: "active",
          updatedAt: "2026-07-01T08:00:00.000Z",
          validationNote: null,
          validationStatus: "validated",
          validatedAt: "2026-07-01T08:00:00.000Z",
          validatedBy: "admin@kamra.test"
        }
      ])
    });

    const repository = new MongoCurrentCatalogRepository(db);
    const result = await repository.markLegacyProductsUnvalidated();

    expect(result).toEqual({
      skippedCount: 0,
      status: "updated",
      updatedCount: 1
    });
    expect(db.__collections["products"]!.docs[0]).toMatchObject({
      invalidatedAt: null,
      invalidatedBy: null,
      validationStatus: "unvalidated"
    });
    expect(db.__collections["products"]!.docs[1]).toMatchObject({
      validationStatus: "validated"
    });
  });

  it("reports legacy validator incompatibility when product validation fields cannot be written", async () => {
    const db = createFakeDb({
      products: new FakeCollection("products", [
        {
          brandName: null,
          createdAt: "2026-07-01T08:00:00.000Z",
          id: "product_legacy_1",
          kind: "grocery",
          measurements: [],
          name: "Legacy item",
          normalizedName: "legacy item",
          origin: [],
          primaryCategoryKey: null,
          status: "active",
          updatedAt: "2026-07-01T08:00:00.000Z"
        }
      ])
    });
    db.__collections["products"]!.updateMany = async () => {
      throw Object.assign(new Error("Document failed validation"), { code: 121 });
    };

    const repository = new MongoCurrentCatalogRepository(db);
    const result = await repository.markLegacyProductsUnvalidated();

    expect(result).toEqual({
      skippedCount: 1,
      status: "validator_incompatible",
      updatedCount: 0
    });
  });

  it("upgrades validators on existing catalog collections and creates missing collections", async () => {
    const commands: unknown[] = [];
    const createdCollections: string[] = [];
    const db = {
      collection: (name: string) => new FakeCollection(name),
      command: async (command: unknown) => {
        commands.push(command);
        return { ok: 1 };
      },
      createCollection: async (name: string) => {
        createdCollections.push(name);
        return new FakeCollection(name);
      },
      databaseName: "kamra_test",
      listCollections: () => ({
        toArray: async () => [{ name: "products" }]
      })
    };

    const repository = new MongoCurrentCatalogRepository(db as never);
    const result = await repository.upgradeCatalogValidators();

    expect(commands).toContainEqual(expect.objectContaining({
      collMod: "products",
      validationAction: "error",
      validationLevel: "strict"
    }));
    expect(createdCollections).toContain("price_observations");
    expect(result).toMatchObject({
      databaseName: "kamra_test",
      upgradedCollections: ["products"]
    });
    expect(result.createdCollections.length).toBeGreaterThan(0);
  });
});
