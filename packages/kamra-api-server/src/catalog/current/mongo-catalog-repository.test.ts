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
    const updatedCount = await repository.markLegacyProductsUnvalidated();

    expect(updatedCount).toBe(1);
    expect(db.__collections["products"]!.docs[0]).toMatchObject({
      invalidatedAt: null,
      invalidatedBy: null,
      validationStatus: "unvalidated"
    });
    expect(db.__collections["products"]!.docs[1]).toMatchObject({
      validationStatus: "validated"
    });
  });
});
