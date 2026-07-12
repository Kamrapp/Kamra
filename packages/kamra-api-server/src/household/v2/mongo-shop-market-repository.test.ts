import { describe, expect, it } from "vitest";
import { createFakeDb, FakeCollection } from "../../test-support/fake-mongo.js";
import { MongoShopMarketRepository } from "./mongo-shop-market-repository.js";

describe("MongoShopMarketRepository", () => {
  it("creates and lists active markets by country", async () => {
    const repository = new MongoShopMarketRepository(createFakeDb({ shop_markets: new FakeCollection("shop_markets") }));
    await repository.setupCollections();
    await repository.create({ aliases: ["lidl-hu"], countryCode: "HU", createdAt: "2026-07-12", createdByUserId: "admin", currencyCode: "HUF", displayName: "Lidl Hungary", id: "shop-market:lidl-hu", revision: 0, status: "active", updatedAt: "2026-07-12", updatedByUserId: "admin" });
    expect(await repository.list("HU")).toHaveLength(1);
    expect(await repository.get("shop-market:lidl-hu")).toMatchObject({ displayName: "Lidl Hungary" });
  });
});
