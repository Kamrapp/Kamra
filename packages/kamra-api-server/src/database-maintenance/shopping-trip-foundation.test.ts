import { describe, expect, it } from "vitest";
import { createFakeDb } from "../test-support/fake-mongo.js";
import { MongoIngestionSubmissionRepository } from "../household/v2/mongo-ingestion-submission-repository.js";
import { MongoShopMarketRepository } from "../household/v2/mongo-shop-market-repository.js";
import { MongoShoppingNeedRepository } from "../household/v2/mongo-shopping-need-repository.js";
import { MongoShoppingTripRepository } from "../household/v2/mongo-shopping-trip-repository.js";

describe("shopping trip foundation maintenance", () => {
  it("initializes every repository behind the foundation entry", async () => {
    const database = createFakeDb();

    await Promise.all([
      new MongoIngestionSubmissionRepository(database).setupCollections(),
      new MongoShopMarketRepository(database).setupCollections(),
      new MongoShoppingNeedRepository(database).setupCollections(),
      new MongoShoppingTripRepository(database).setupCollections()
    ]);

    expect(Object.keys(database.__collections).sort()).toEqual([
      "household_shopping_need_lists",
      "household_shopping_trips",
      "ingestion_submissions",
      "shop_markets"
    ]);
  });
});
