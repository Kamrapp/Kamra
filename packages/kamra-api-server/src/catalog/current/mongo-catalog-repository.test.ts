import { describe, expect, it } from "vitest";

import { MongoCurrentCatalogRepository } from "./mongo-catalog-repository.js";
import { createFakeDb, FakeCollection } from "../../test-support/fake-mongo.js";

describe("MongoCurrentCatalogRepository", () => {
  it("updates product details and marks renamed products unvalidated", async () => {
    const db = createFakeDb({
      products: new FakeCollection("products", [createProductRecord()])
    });

    const repository = new MongoCurrentCatalogRepository(db);
    const product = await repository.updateCatalogProduct({
      brandName: "Kamra",
      id: "product_1",
      name: "Friss tej",
      updatedAt: "2026-07-03T10:00:00.000Z",
      validationNote: "Needs another pass."
    });

    expect(product).toMatchObject({
      brandName: "Kamra",
      id: "product_1",
      name: "Friss tej",
      validationStatus: "unvalidated"
    });
    expect(db.__collections["products"]!.docs[0]).toMatchObject({
      name: "Friss tej",
      normalizedName: "friss tej",
      updatedAt: "2026-07-03T10:00:00.000Z",
      validationNote: "Needs another pass.",
      validationStatus: "unvalidated",
      validatedAt: null,
      validatedBy: null
    });
  });

  it("sets product validation state", async () => {
    const db = createFakeDb({
      products: new FakeCollection("products", [createProductRecord()])
    });

    const repository = new MongoCurrentCatalogRepository(db);
    const product = await repository.setCatalogProductValidationStatus({
      id: "product_1",
      note: "Looks good.",
      reviewedAt: "2026-07-03T10:00:00.000Z",
      reviewerId: "admin@kamra.test",
      status: "validated"
    });

    expect(product).toMatchObject({
      id: "product_1",
      validationStatus: "validated"
    });
    expect(db.__collections["products"]!.docs[0]).toMatchObject({
      invalidatedAt: null,
      invalidatedBy: null,
      validatedAt: "2026-07-03T10:00:00.000Z",
      validatedBy: "admin@kamra.test",
      validationNote: "Looks good.",
      validationStatus: "validated"
    });
  });

  it("hard-deletes a product and owned catalog records", async () => {
    const db = createFakeDb({
      price_observations: new FakeCollection("price_observations", [
        { id: "price_1", productId: "product_1", productSourceId: "source_1" },
        { id: "price_other", productId: "product_other", productSourceId: "source_other" }
      ]),
      product_source_identifiers: new FakeCollection("product_source_identifiers", [
        { id: "identifier_1", productSourceId: "source_1" },
        { id: "identifier_other", productSourceId: "source_other" }
      ]),
      product_sources: new FakeCollection("product_sources", [
        { id: "source_1", productId: "product_1" },
        { id: "source_other", productId: "product_other" }
      ]),
      product_tag_assignments: new FakeCollection("product_tag_assignments", [
        { id: "tag_assignment_1", productId: "product_1" },
        { id: "tag_assignment_other", productId: "product_other" }
      ]),
      products: new FakeCollection("products", [
        createProductRecord(),
        { ...createProductRecord(), id: "product_other", name: "Other item" }
      ]),
      stocks: new FakeCollection("stocks", [
        { id: "stock_1", productId: "product_1" },
        { id: "stock_other", productId: "product_other" }
      ])
    });

    const repository = new MongoCurrentCatalogRepository(db);
    const result = await repository.deleteCatalogProduct("product_1");

    expect(result).toEqual({
      deletedIdentifierCount: 1,
      deletedPriceObservationCount: 1,
      deletedProductCount: 1,
      deletedProductSourceCount: 1,
      deletedStockCount: 1,
      deletedTagAssignmentCount: 1
    });
    expect(
      db.__collections["products"]!.docs.map((doc: Record<string, unknown>) => doc["id"])
    ).toEqual(["product_other"]);
    expect(
      db.__collections["product_sources"]!.docs.map((doc: Record<string, unknown>) => doc["id"])
    ).toEqual(["source_other"]);
  });

  it("creates a validated catalog product from a review candidate", async () => {
    const db = createFakeDb();
    const repository = new MongoCurrentCatalogRepository(db);

    const result = await repository.createCatalogProductFromReviewCandidate({
      candidate: {
        origin: {
          capturedAt: "2026-07-03T09:00:00.000Z",
          sourceName: "simple_html_table_shop",
          sourceRecordId: "row-1",
          sourceUrl: "https://example.invalid/row-1"
        },
        priceObservations: [
          {
            currencyCode: "HUF",
            observedAt: "2026-07-03T09:00:00.000Z",
            price: 499,
            priceKind: "offer"
          }
        ],
        product: {
          brandName: "Kamra",
          kind: "grocery",
          measurements: [],
          name: "Friss tej",
          normalizedName: "friss tej",
          primaryCategoryKey: null
        },
        source: {
          countryCode: "HU",
          sourceName: "simple_html_table_shop",
          sourceProductKey: "simple-milk",
          sourceProductName: "Friss tej",
          storeBrandKey: "simple-html-table-shop"
        },
        sourceProductIdentifiers: [
          {
            kind: "retailer_product_id",
            value: "simple-milk"
          }
        ],
        stock: {
          availability: "infinite",
          countryCode: "HU"
        }
      },
      createdAt: "2026-07-03T09:01:00.000Z",
      reviewerId: "admin@kamra.test"
    });

    expect(result.productId).toBe("product_name_friss_tej");
    expect(db.__collections["products"]!.docs[0]).toMatchObject({
      id: "product_name_friss_tej",
      validationStatus: "validated",
      validatedBy: "admin@kamra.test"
    });
    expect(db.__collections["product_sources"]!.docs[0]).toMatchObject({
      id: "product_source_simple_html_table_shop_simple_milk",
      productId: "product_name_friss_tej"
    });
    expect(db.__collections["product_source_identifiers"]!.docs[0]).toMatchObject({
      kind: "retailer_product_id",
      productSourceId: "product_source_simple_html_table_shop_simple_milk"
    });
    expect(db.__collections["price_observations"]!.docs[0]).toMatchObject({
      price: {
        amount: 499,
        currencyCode: "HUF"
      },
      productId: "product_name_friss_tej",
      productSourceId: "product_source_simple_html_table_shop_simple_milk"
    });
    expect(db.__collections["stocks"]!.docs[0]).toMatchObject({
      productId: "product_name_friss_tej",
      status: "active"
    });
  });

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

  it("filters catalog review products by normalized name inclusion", async () => {
    const db = createFakeDb({
      products: new FakeCollection("products", [
        {
          ...createProductRecord(),
          id: "product_milk",
          name: "Friss tej",
          normalizedName: "friss tej"
        },
        {
          ...createProductRecord(),
          id: "product_bread",
          name: "Kenyér",
          normalizedName: "kenyér"
        }
      ])
    });

    const repository = new MongoCurrentCatalogRepository(db);
    const page = await repository.listCatalogProductsForReview({
      nameIncludes: "TEJ"
    });

    expect(page.totalCount).toBe(1);
    expect(page.products).toEqual([
      expect.objectContaining({
        id: "product_milk",
        name: "Friss tej"
      })
    ]);
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

    expect(commands).toContainEqual(
      expect.objectContaining({
        collMod: "products",
        validationAction: "error",
        validationLevel: "strict"
      })
    );
    expect(createdCollections).toContain("price_observations");
    expect(result).toMatchObject({
      databaseName: "kamra_test",
      upgradedCollections: ["products"]
    });
    expect(result.createdCollections.length).toBeGreaterThan(0);
  });
});

function createProductRecord() {
  return {
    brandName: null,
    createdAt: "2026-07-01T08:00:00.000Z",
    id: "product_1",
    invalidatedAt: null,
    invalidatedBy: null,
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
    updatedAt: "2026-07-01T08:00:00.000Z",
    validationNote: null,
    validationStatus: "validated",
    validatedAt: "2026-07-01T08:00:00.000Z",
    validatedBy: "admin@kamra.test"
  };
}
