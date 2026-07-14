import { describe, expect, it } from "vitest";
import { createFakeDb, FakeCollection } from "../../test-support/fake-mongo.js";
import { MongoPriceObservationRepository } from "./mongo-price-observation-repository.js";
import { MongoShopProductRepository } from "./mongo-shop-product-repository.js";

describe("Stage 9 shop product and price repositories", () => {
  it("keeps shop products market-scoped and appends price history", async () => {
    const db = createFakeDb({
      shop_products: new FakeCollection("shop_products"),
      shop_price_observations: new FakeCollection("shop_price_observations")
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
      createFakeDb({ shop_price_observations: new FakeCollection("shop_price_observations") })
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

  it("upgrades the dedicated validator and migrates only legacy Stage 9-shaped records", async () => {
    const legacyObservation = {
      id: "price:legacy",
      shopProductId: "shop-product:legacy",
      currencyCode: "HUF",
      kind: "base" as const,
      observedAt: "2026-07-12T00:00:00.000Z",
      price: 599
    };
    const db = createFakeDb({
      shop_price_observations: new FakeCollection("shop_price_observations"),
      price_observations: new FakeCollection("price_observations", [
        legacyObservation,
        {
          id: "catalog-price",
          productId: "product:milk",
          price: { amount: 599, currencyCode: "HUF" }
        }
      ])
    });
    const prices = new MongoPriceObservationRepository(db);

    await expect(prices.upgradeValidator()).resolves.toMatchObject({
      databaseName: "fake_db",
      upgradedCollections: ["shop_price_observations"]
    });
    await expect(prices.migrateLegacy()).resolves.toMatchObject({
      migratedCount: 1,
      preservedHistory: true,
      status: "ready"
    });
    await expect(prices.migrateLegacy()).resolves.toMatchObject({ migratedCount: 0 });
    expect(db.__collections["shop_price_observations"]?.docs).toEqual([legacyObservation]);
    expect(db.__collections["price_observations"]?.docs).toHaveLength(2);
  });
});
