import { describe, expect, it } from "vitest";

import { createCatalogV1SeedDataset } from "./fixtures.js";
import { catalogV1CollectionNames } from "./contracts.js";
import { catalogV1CollectionSchemas } from "./schemas.js";
import { assertCatalogV1SeedDataset } from "./validation.js";

describe("Catalog v1 contracts", () => {
  it("validate the seeded dataset shape", () => {
    const dataset = createCatalogV1SeedDataset();

    expect(() => assertCatalogV1SeedDataset(dataset)).not.toThrow();
  });

  it("define one schema per catalog v1 collection", () => {
    expect(Object.keys(catalogV1CollectionSchemas).sort()).toEqual([...catalogV1CollectionNames].sort());
  });

  it("keep product schemas focused on lightweight processed data", () => {
    const productSchema = catalogV1CollectionSchemas["products"];
    const properties = productSchema["properties"] as Record<string, unknown>;

    expect(properties["imageUrl"]).toBeUndefined();
    expect(properties["rawHtml"]).toBeUndefined();
    expect(properties["rawImage"]).toBeUndefined();
    expect(properties["validationStatus"]).toBeDefined();
  });
});
