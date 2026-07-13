import { describe, expect, it } from "vitest";

import { createFakeDb, FakeCollection } from "../../test-support/fake-mongo.js";
import { MongoHouseholdRepository } from "./mongo-household-repository.js";

describe("MongoHouseholdRepository", () => {
  it("resets only the requested household content scope and keeps identity intact", async () => {
    const db = createFakeDb();
    const repository = new MongoHouseholdRepository(db);
    await repository.setupCollections();
    await repository.createHousehold({
      createdAt: "2026-07-09T10:00:00.000Z",
      createdByUserId: "usera",
      id: "household1",
      name: "Demo household"
    });
    await db.collection("household_product_groups").insertOne({
      householdId: "household1",
      id: "group1"
    });
    await db.collection("household_products").insertOne({
      householdId: "household1",
      id: "product1"
    });
    await db.collection("household_stock_batches").insertOne({
      householdId: "household1",
      id: "batch1"
    });
    await db.collection("household_shopping_lists").insertOne({
      householdId: "household1",
      id: "list1"
    });

    const transactionClient = {
      startSession: () => ({
        abortTransaction: async () => undefined,
        commitTransaction: async () => undefined,
        endSession: async () => undefined,
        startTransaction: () => undefined
      })
    };
    const batchesResult = await repository.resetHouseholdContent({
      householdId: "household1",
      scope: "batches",
      transactionClient,
      userId: "usera"
    });

    expect(batchesResult.deleted).toMatchObject({
      household_stock_batches: 1
    });
    expect(db.__collections["household_stock_batches"]!.docs).toHaveLength(0);
    expect(db.__collections["household_products"]!.docs).toHaveLength(1);
    expect(db.__collections["household_product_groups"]!.docs).toHaveLength(1);
    expect(db.__collections["household_shopping_lists"]!.docs).toHaveLength(1);
    expect(db.__collections["households"]!.docs).toHaveLength(1);
    expect(db.__collections["household_memberships"]!.docs).toHaveLength(1);

    const allResult = await repository.resetHouseholdContent({
      householdId: "household1",
      scope: "all_household_data",
      transactionClient,
      userId: "usera"
    });

    expect(allResult.deleted).toMatchObject({
      household_product_groups: 1,
      household_products: 1,
      household_shopping_lists: 1
    });
    expect(db.__collections["households"]!.docs).toHaveLength(1);
    expect(db.__collections["household_memberships"]!.docs).toHaveLength(1);

    const deletedResult = await repository.resetHouseholdContent({
      householdId: "household1",
      scope: "delete_household",
      transactionClient,
      userId: "usera"
    });

    expect(deletedResult.deleted).toMatchObject({
      household_memberships: 1,
      households: 1
    });
    expect(db.__collections["households"]!.docs).toHaveLength(0);
    expect(db.__collections["household_memberships"]!.docs).toHaveLength(0);
  });

  it("skips validator updates for existing non-empty household collections", async () => {
    const db = createFakeDb({
      households: new FakeCollection("households", [
        {
          createdAt: "2026-07-01T10:00:00.000Z",
          createdByUserId: "usera",
          id: "legacy_household",
          name: "Legacy household",
          status: "active",
          updatedAt: "2026-07-01T10:00:00.000Z"
        }
      ])
    });
    const repository = new MongoHouseholdRepository(db);

    const summary = await repository.setupCollections();

    expect(summary.skippedValidatorUpdates).toContain("households");
    expect(db.__collections["households"]!.docs).toHaveLength(1);
    expect(db.__collections["households"]!.docs[0]).toMatchObject({
      id: "legacy_household"
    });
  });

  it("supports household membership isolation and stock CRUD", async () => {
    const db = createFakeDb();
    const repository = new MongoHouseholdRepository(db);
    await repository.setupCollections();

    await repository.createHousehold({
      createdAt: "2026-07-09T10:00:00.000Z",
      createdByUserId: "usera",
      id: "household1",
      name: "Demo household"
    });

    const listForOwner = await repository.listHouseholdsForUser("usera");
    const listForOther = await repository.listHouseholdsForUser("userb");

    expect(listForOwner).toHaveLength(1);
    expect(listForOwner[0]).toMatchObject({
      defaultCalculatedMaxLimitMultiplier: 2,
      favouriteShopId: null,
      id: "household1",
      membershipRole: "owner",
      memberCount: 1,
      name: "Demo household"
    });
    expect(listForOther).toHaveLength(0);

    const createdPage = await repository.createHouseholdStockItem({
      createdAt: "2026-07-09T10:00:00.000Z",
      createdByUserId: "usera",
      currentAmount: 0.2,
      displayName: "Kenyér",
      householdId: "household1",
      idealMaxLimit: 1,
      initialAmount: 1,
      minLimit: 0.5,
      productSourceId: "product_source_demo_bread",
      stockedAt: "2026-07-07T10:00:00.000Z",
      stockGroupKey: "kenyer",
      unit: "kg",
      userId: "usera"
    });

    expect(createdPage).not.toBeNull();
    expect(createdPage!.stockItems).toHaveLength(1);
    const createdStockItem = createdPage!.stockItems[0]!;
    expect(createdStockItem).toMatchObject({
      currentAmount: 0.2,
      displayName: "Kenyér",
      idealMaxLimit: 1,
      productSourceId: "product_source_demo_bread",
      stockStatus: "below_limit"
    });

    const updatedPage = await repository.updateHouseholdStockItem({
      currentAmount: 0.5,
      householdId: "household1",
      id: createdStockItem.id,
      idealMaxLimit: 2,
      minLimit: 0.5,
      productSourceId: "product_source_demo_bread_v2",
      unit: "kg",
      updatedAt: "2026-07-09T11:00:00.000Z",
      updatedByUserId: "usera",
      userId: "usera"
    });

    expect(updatedPage).not.toBeNull();
    expect(updatedPage!.stockItems[0]!).toMatchObject({
      currentAmount: 0.5,
      idealMaxLimit: 2,
      productSourceId: "product_source_demo_bread_v2",
      stockStatus: "at_limit"
    });

    const archivedPage = await repository.archiveHouseholdStockItem({
      householdId: "household1",
      id: createdStockItem.id,
      updatedAt: "2026-07-09T12:00:00.000Z",
      updatedByUserId: "usera",
      userId: "usera"
    });

    expect(archivedPage).not.toBeNull();
    expect(archivedPage!.stockItems).toHaveLength(0);

    const otherUserPage = await repository.getHouseholdStockPage({
      householdId: "household1",
      userId: "userb"
    });

    expect(otherUserPage).toBeNull();
  });

  it("reuses an existing local product when creating stock for a provided product id", async () => {
    const db = createFakeDb();
    const repository = new MongoHouseholdRepository(db);
    await repository.setupCollections();
    await repository.createHousehold({
      createdAt: "2026-07-09T10:00:00.000Z",
      createdByUserId: "usera",
      id: "household1",
      name: "Demo household"
    });
    await db.__collections["household_local_products"]!.insertOne({
      catalogProductId: null,
      catalogProductNameSnapshot: null,
      createdAt: "2026-07-09T10:00:00.000Z",
      createdByUserId: "usera",
      displayName: "Existing flour",
      householdId: "household1",
      id: "product_existing",
      productSourceId: "product_source_existing_flour",
      stockGroupKey: "flour",
      status: "active",
      updatedAt: "2026-07-09T10:00:00.000Z",
      updatedByUserId: "usera"
    });

    const page = await repository.createHouseholdStockItem({
      createdAt: "2026-07-09T10:15:00.000Z",
      createdByUserId: "usera",
      currentAmount: 1,
      displayName: "Ignored form value",
      householdId: "household1",
      householdProductId: "product_existing",
      minLimit: 0.5,
      stockedAt: "2026-07-09T10:15:00.000Z",
      stockGroupKey: "ignored_group",
      unit: "kg",
      userId: "usera"
    });

    expect(page).not.toBeNull();
    expect(db.__collections["household_local_products"]!.docs).toHaveLength(1);
    expect(page!.stockItems[0]).toMatchObject({
      displayName: "Existing flour",
      householdProductId: "product_existing",
      productSourceId: "product_source_existing_flour",
      stockGroupKey: "flour"
    });
  });

  it("persists seeded shops and shopping list snapshots", async () => {
    const db = createFakeDb();
    const repository = new MongoHouseholdRepository(db);
    await repository.setupCollections();
    await repository.createHousehold({
      createdAt: "2026-07-09T10:00:00.000Z",
      createdByUserId: "usera",
      id: "household1",
      name: "Demo household"
    });
    await repository.upsertSeedDataset({
      householdLocalProducts: [],
      householdMemberships: [],
      householdPurchasePriceObservations: [],
      households: [],
      householdShops: [
        {
          countryCode: "HU",
          createdAt: "2026-07-09T10:00:00.000Z",
          id: "shop_hu_lidl",
          label: "Lidl Hungary",
          sourceNames: ["lidl-hu-brochure"],
          status: "active",
          storeBrandKeys: ["lidl-hu"],
          updatedAt: "2026-07-09T10:00:00.000Z"
        }
      ],
      householdShoppingLists: [],
      householdStockItems: []
    });

    const createdList = await repository.createShoppingList({
      createdAt: "2026-07-09T11:00:00.000Z",
      createdByUserId: "usera",
      householdId: "household1",
      id: "shopping_list_1",
      items: [
        {
          displayName: "Tej",
          householdProductId: "product_milk",
          householdStockItemId: "stock_milk",
          id: "line_1",
          plannedAmount: 2.2,
          purchasedAmount: 2.2,
          reasonCode: "below_minimum",
          sourceKind: "generated",
          status: "not_applied",
          suggestedBuyAmount: 2.2,
          targetAmount: 4,
          ticked: false,
          uncertaintyFlags: ["missing_catalog_product", "missing_product_source"],
          unit: "l"
        }
      ],
      scale: "keep_it_chill",
      schemaVersion: "shopping_list_v1",
      shopId: "shop_hu_lidl",
      status: "active",
      updatedAt: "2026-07-09T11:00:00.000Z",
      updatedByUserId: "usera",
      userId: "usera"
    });

    expect((await repository.listShops()).map((shop) => shop.label)).toEqual(["Lidl Hungary"]);
    expect(createdList).not.toBeNull();
    expect(createdList).toMatchObject({
      id: "shopping_list_1",
      scale: "keep_it_chill",
      schemaVersion: "shopping_list_v1",
      shopId: "shop_hu_lidl"
    });
    expect(db.__collections["household_shopping_lists"]!.docs[0]).not.toHaveProperty("userId");

    const latestList = await repository.getLatestShoppingList({
      householdId: "household1",
      userId: "usera"
    });

    expect(latestList).not.toBeNull();
    expect(latestList!.items[0]).toMatchObject({
      displayName: "Tej",
      plannedAmount: 2.2
    });

    const updatedList = await repository.updateShoppingList({
      householdId: "household1",
      id: "shopping_list_1",
      items: [
        {
          ...latestList!.items[0]!,
          purchasedAmount: 2.5,
          ticked: true
        }
      ],
      stockAppliedAt: "2026-07-09",
      updatedAt: "2026-07-09T12:00:00.000Z",
      updatedByUserId: "usera",
      userId: "usera"
    });

    expect(updatedList).not.toBeNull();
    expect(updatedList).toMatchObject({
      stockAppliedAt: "2026-07-09"
    });
    expect(updatedList!.items[0]).toMatchObject({
      purchasedAmount: 2.5,
      ticked: true
    });
  });

  it("stores household feature flags with an enabled-by-default fallback", async () => {
    const db = createFakeDb();
    const repository = new MongoHouseholdRepository(db);
    await repository.setupCollections();

    expect(
      await repository.readFeatureFlag("allowAutoTickingAllShoppingListEntries", true)
    ).toMatchObject({
      enabled: true,
      key: "allowAutoTickingAllShoppingListEntries"
    });

    const updatedFlag = await repository.updateFeatureFlag({
      enabled: false,
      key: "allowAutoTickingAllShoppingListEntries",
      updatedAt: "2026-07-10T07:00:00.000Z",
      updatedByUserId: "admin@kamra.test"
    });

    expect(updatedFlag).toMatchObject({
      enabled: false,
      key: "allowAutoTickingAllShoppingListEntries",
      updatedByUserId: "admin@kamra.test"
    });
    expect(await repository.listFeatureFlags()).toMatchObject([
      {
        enabled: false,
        key: "allowAutoTickingAllShoppingListEntries"
      }
    ]);
  });
});
