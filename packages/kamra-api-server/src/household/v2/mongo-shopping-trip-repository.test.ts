import { describe, expect, it } from "vitest";
import { createFakeDb, FakeCollection } from "../../test-support/fake-mongo.js";
import { createShoppingTrip } from "./shopping-trip-domain.js";
import { MongoShoppingTripRepository } from "./mongo-shopping-trip-repository.js";

const trip = createShoppingTrip({
  createdAt: "2026-07-12T00:00:00.000Z",
  createdByUserId: "user",
  householdId: "household",
  id: "trip",
  items: [
    {
      id: "item",
      needId: "need",
      displayNameSnapshot: "Milk",
      requiredQuantity: 1,
      requiredUnit: "l",
      planStatus: "unresolved",
      resultStatus: "pending"
    }
  ],
  plannedDate: "2026-07-12",
  sourceShoppingNeedListId: "needs",
  updatedAt: "2026-07-12T00:00:00.000Z",
  updatedByUserId: "user"
});

describe("MongoShoppingTripRepository", () => {
  it("creates, lists, and protects optimistic updates", async () => {
    const repository = new MongoShoppingTripRepository(
      createFakeDb({ household_shopping_trips: new FakeCollection("household_shopping_trips") })
    );
    await repository.setupCollections();
    await repository.create(trip);
    expect(await repository.get("household", "trip")).toMatchObject({ id: "trip" });
    expect(await repository.list("household")).toHaveLength(1);
    await repository.create({
      ...trip,
      id: "trip:older",
      updatedAt: "2026-07-11T00:00:00.000Z"
    });
    await expect(
      repository.listPage("household", { offset: 0, page: 1, pageSize: 1 })
    ).resolves.toMatchObject({ hasNextPage: true, items: [{ id: "trip" }] });
    const updated = { ...trip, revision: 1, status: "matching" as const };
    await expect(
      repository.update({ expectedRevision: 0, householdId: "household", trip: updated })
    ).resolves.toMatchObject({ status: "matching" });
    await expect(
      repository.update({ expectedRevision: 0, householdId: "household", trip: updated })
    ).rejects.toThrow("revision_conflict");
  });
});
