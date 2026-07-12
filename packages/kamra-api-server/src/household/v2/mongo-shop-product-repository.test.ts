import { describe, expect, it } from "vitest";
import { createFakeDb, FakeCollection } from "../../test-support/fake-mongo.js";
import { MongoPriceObservationRepository } from "./mongo-price-observation-repository.js";
import { MongoShopProductRepository } from "./mongo-shop-product-repository.js";

describe("Stage 9 shop product and price repositories", () => {
  it("keeps shop products market-scoped and appends price history", async () => {
    const db = createFakeDb({
      shop_products: new FakeCollection("shop_products"),
      price_observations: new FakeCollection("price_observations")
    });
    const products = new MongoShopProductRepository(db);
    const prices = new MongoPriceObservationRepository(db);
    await products.setupCollections();
    await prices.setupCollections();
    await products.create({
      id: "shop-product:milk",
      productId: "product:milk",
      shopMarketId: "market:hu",
      displayName: "Milk 1 l",
      aliases: [],
      packageQuantity: 1,
      packageUnit: "l",
      status: "active"
    });
    await prices.append({
      id: "price:milk:1",
      shopProductId: "shop-product:milk",
      currencyCode: "HUF",
      kind: "base",
      observedAt: "2026-07-12T00:00:00.000Z",
      price: 499
    });
    expect(await products.list("market:hu", "milk")).toHaveLength(1);
    expect(await products.list("market:other")).toHaveLength(0);
    expect(await prices.list("shop-product:milk")).toHaveLength(1);
  });

  it("rejects negative prices before persistence", async () => {
    const prices = new MongoPriceObservationRepository(
      createFakeDb({ price_observations: new FakeCollection("price_observations") })
    );
    await expect(
      prices.append({
        id: "price:bad",
        shopProductId: "shop-product",
        currencyCode: "HUF",
        kind: "base",
        observedAt: "2026-07-12T00:00:00.000Z",
        price: -1
      })
    ).rejects.toThrow("invalid_price_observation");
  });
});
