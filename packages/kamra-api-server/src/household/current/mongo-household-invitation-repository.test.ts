import { describe, expect, it } from "vitest";

import { createFakeDb } from "../../test-support/fake-mongo.js";
import { MongoHouseholdInvitationRepository } from "./mongo-household-invitation-repository.js";
import { MongoHouseholdRepository } from "./mongo-household-repository.js";

describe("MongoHouseholdInvitationRepository", () => {
  it("creates one pending invitation and turns it into an active membership", async () => {
    const database = createFakeDb();
    const householdRepository = new MongoHouseholdRepository(database);
    await householdRepository.setupCollections();
    await householdRepository.createHousehold({
      createdAt: "2026-07-13T10:00:00.000Z",
      createdByUserId: "owner@example.test",
      id: "household-1",
      name: "Shared home"
    });
    const repository = new MongoHouseholdInvitationRepository(database);

    const created = await repository.createPendingInvitation({
      email: "member@example.test",
      householdId: "household-1",
      invitedByUserId: "owner@example.test",
      now: "2026-07-13T10:05:00.000Z"
    });

    expect(created.status).toBe("created");
    if (created.status !== "created") return;

    await expect(
      repository.createPendingInvitation({
        email: "member@example.test",
        householdId: "household-1",
        invitedByUserId: "owner@example.test",
        now: "2026-07-13T10:06:00.000Z"
      })
    ).resolves.toMatchObject({ status: "already_pending" });

    await expect(repository.listPendingForEmail("member@example.test")).resolves.toMatchObject([
      {
        email: "member@example.test",
        householdId: "household-1",
        householdName: "Shared home",
        id: created.invitation.id,
        status: "pending"
      }
    ]);

    await expect(
      repository.acceptInvitation({
        email: "member@example.test",
        invitationId: created.invitation.id,
        now: "2026-07-13T10:10:00.000Z"
      })
    ).resolves.toMatchObject({
      invitation: {
        acceptedByUserId: "member@example.test",
        status: "accepted"
      },
      status: "accepted"
    });

    await expect(
      householdRepository.listHouseholdsForUser("member@example.test")
    ).resolves.toHaveLength(1);
    await expect(repository.listPendingForEmail("member@example.test")).resolves.toHaveLength(0);
  });
});
