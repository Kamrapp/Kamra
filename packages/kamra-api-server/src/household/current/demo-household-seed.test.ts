import { describe, expect, it } from "vitest";

import { createFakeDb } from "../../test-support/fake-mongo.js";
import { MongoHouseholdDemoSeedRepository, runDemoHouseholdSeed } from "./demo-household-seed.js";

describe("runDemoHouseholdSeed", () => {
  it("recreates the demo household data with stable ids", async () => {
    const db = createFakeDb();
    const repository = new MongoHouseholdDemoSeedRepository(db);

    const result = await runDemoHouseholdSeed(
      {
        userPassword: "demo-password"
      },
      repository,
      new Date("2026-07-09T10:00:00.000Z")
    );

    expect(result.seedName).toBe("demo_household");
    expect(db.__collections["users"]!.docs).toHaveLength(2);
    expect(db.__collections["households"]!.docs).toHaveLength(1);
    expect(db.__collections["household_memberships"]!.docs).toHaveLength(2);
    expect(db.__collections["household_local_products"]!.docs).toHaveLength(12);
    expect(db.__collections["household_shops"]!.docs).toHaveLength(4);
    expect(db.__collections["household_shopping_lists"]!.docs).toHaveLength(0);
    expect(db.__collections["household_purchase_price_observations"]!.docs).toHaveLength(0);
    expect(db.__collections["household_stock_items"]!.docs).toHaveLength(12);
    expect(db.__collections["household_stock_items"]!.docs.map((doc) => doc.id)).toContain(
      "household_stock_household1_kenyer"
    );
    expect(db.__collections["households"]!.docs[0]).toMatchObject({
      defaultCalculatedMaxLimitMultiplier: 2,
      favouriteShopId: null
    });
    expect(db.__collections["users"]!.docs.map((doc) => doc.email)).toEqual(["usera", "userb"]);
  });
});
