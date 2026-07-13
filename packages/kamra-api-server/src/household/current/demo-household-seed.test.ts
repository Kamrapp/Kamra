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
    expect(db.__collections["household_product_groups"]!.docs).toHaveLength(6);
    expect(db.__collections["household_products"]!.docs).toHaveLength(15);
    expect(db.__collections["household_stock_batches"]!.docs).toHaveLength(18);
    expect(
      db.__collections["household_stock_batches"]!.docs.every(
        (doc) => typeof doc.householdProductId === "string"
      )
    ).toBe(true);
    expect(db.__collections["household_stock_targets"]!.docs).toHaveLength(1);
    expect(db.__collections["household_stock_allocations"]!.docs).toHaveLength(3);
    expect(db.__collections["household_stock_items"]!.docs.map((doc) => doc.id)).toContain(
      "household_stock_household1_kenyer"
    );
    expect(db.__collections["households"]!.docs[0]).toMatchObject({
      defaultCalculatedMaxLimitMultiplier: 2,
      favouriteShopId: null
    });
    expect(db.__collections["users"]!.docs.map((doc) => doc.email)).toEqual(["usera", "userb"]);
  });

  it("tears down only the reserved demo household data", async () => {
    const db = createFakeDb();
    const repository = new MongoHouseholdDemoSeedRepository(db);

    await runDemoHouseholdSeed(
      {
        userPassword: "demo-password"
      },
      repository,
      new Date("2026-07-09T10:00:00.000Z")
    );

    const result = await repository.teardownDemoHousehold();

    expect(result.deletedHouseholds).toBe(1);
    expect(result.deletedUsers).toBe(2);
    expect(db.__collections["users"]!.docs).toHaveLength(0);
    expect(db.__collections["households"]!.docs).toHaveLength(0);
    expect(db.__collections["household_products"]!.docs).toHaveLength(0);
    expect(db.__collections["household_stock_batches"]!.docs).toHaveLength(0);
    expect(db.__collections["seed_ledger"]!.docs).toHaveLength(0);
  });
});
