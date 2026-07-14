import type { Db } from "mongodb";
import { describe, expect, it } from "vitest";

import { createFakeDb, FakeCollection } from "../test-support/fake-mongo.js";
import type { MongoTransactionClientLike } from "../db/mongo-like.js";
import { MongoUserRepository } from "./mongo-user-repository.js";
import { hashPassword } from "./password-hash.js";

describe("MongoUserRepository admin operations", () => {
  it("deletes a sole-owner household with its content", async () => {
    const database = createFakeDb({
      households: new FakeCollection("households", [{ id: "household1", name: "Only household" }]),
      household_memberships: new FakeCollection("household_memberships", [
        {
          createdAt: "2026-07-13T10:00:00.000Z",
          householdId: "household1",
          id: "membership1",
          role: "owner",
          status: "active",
          updatedAt: "2026-07-13T10:00:00.000Z",
          userId: "owner@example.test"
        }
      ]),
      household_products: new FakeCollection("household_products", [
        { householdId: "household1", id: "product1" }
      ]),
      users: new FakeCollection("users", [
        {
          authProvider: "bootstrap_credentials",
          email: "owner@example.test",
          passwordHash: await hashPassword("password"),
          role: "user",
          status: "active"
        }
      ])
    });
    const repository = new MongoUserRepository(database as unknown as Db, transactionClient);

    const result = await repository.deleteUser("owner@example.test");

    expect(result).toMatchObject({ deletedHouseholdIds: ["household1"] });
    expect(database.__collections["users"]!.docs).toHaveLength(0);
    expect(database.__collections["households"]!.docs).toHaveLength(0);
    expect(database.__collections["household_products"]!.docs).toHaveLength(0);
  });

  it("promotes the next active member when deleting the sole owner", async () => {
    const database = createFakeDb({
      households: new FakeCollection("households", [
        { id: "household1", name: "Shared household" }
      ]),
      household_memberships: new FakeCollection("household_memberships", [
        {
          createdAt: "2026-07-13T10:00:00.000Z",
          householdId: "household1",
          id: "membership-owner",
          role: "owner",
          status: "active",
          updatedAt: "2026-07-13T10:00:00.000Z",
          userId: "owner@example.test"
        },
        {
          createdAt: "2026-07-13T11:00:00.000Z",
          householdId: "household1",
          id: "membership-next",
          role: "member",
          status: "active",
          updatedAt: "2026-07-13T11:00:00.000Z",
          userId: "next@example.test"
        }
      ]),
      users: new FakeCollection("users", [
        {
          authProvider: "bootstrap_credentials",
          email: "owner@example.test",
          passwordHash: await hashPassword("password"),
          role: "user",
          status: "active"
        },
        {
          authProvider: "bootstrap_credentials",
          email: "next@example.test",
          passwordHash: await hashPassword("password"),
          role: "user",
          status: "active"
        }
      ])
    });
    const repository = new MongoUserRepository(database as unknown as Db, transactionClient);

    const result = await repository.deleteUser("owner@example.test");

    expect(result).toMatchObject({ promotedUserIds: ["next@example.test"] });
    expect(database.__collections["households"]!.docs).toHaveLength(1);
    expect(database.__collections["household_memberships"]!.docs).toEqual([
      expect.objectContaining({ role: "owner", userId: "next@example.test" })
    ]);
  });
});

const transactionClient: MongoTransactionClientLike = {
  startSession: () => ({
    abortTransaction: async () => undefined,
    commitTransaction: async () => undefined,
    endSession: async () => undefined,
    startTransaction: () => undefined
  })
};
