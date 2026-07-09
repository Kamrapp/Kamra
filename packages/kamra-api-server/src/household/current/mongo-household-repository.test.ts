import { describe, expect, it } from "vitest";

import { createFakeDb, FakeCollection } from "../../test-support/fake-mongo.js";
import { MongoHouseholdRepository } from "./mongo-household-repository.js";

describe("MongoHouseholdRepository", () => {
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
      initialAmount: 1,
      minLimit: 0.5,
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
      stockStatus: "below_limit"
    });

    const updatedPage = await repository.updateHouseholdStockItem({
      currentAmount: 0.5,
      householdId: "household1",
      id: createdStockItem.id,
      minLimit: 0.5,
      unit: "kg",
      updatedAt: "2026-07-09T11:00:00.000Z",
      updatedByUserId: "usera",
      userId: "usera"
    });

    expect(updatedPage).not.toBeNull();
    expect(updatedPage!.stockItems[0]!).toMatchObject({
      currentAmount: 0.5,
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
      stockGroupKey: "flour"
    });
  });
});
