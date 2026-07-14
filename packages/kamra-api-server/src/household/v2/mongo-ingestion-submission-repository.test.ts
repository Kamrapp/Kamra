import { describe, expect, it, vi } from "vitest";
import { createFakeDb, FakeCollection } from "../../test-support/fake-mongo.js";
import { MongoIngestionSubmissionRepository } from "./mongo-ingestion-submission-repository.js";

describe("MongoIngestionSubmissionRepository", () => {
  it("keeps a pending purchase fact reviewable and revision checked", async () => {
    const repository = new MongoIngestionSubmissionRepository(
      createFakeDb({ ingestion_submissions: new FakeCollection("ingestion_submissions") })
    );
    await repository.setupCollections();
    await repository.create({
      id: "submission:1",
      householdId: "household",
      shoppingTripId: "trip",
      shoppingTripItemId: "item",
      submittedByUserId: "user",
      status: "pending",
      facts: { displayName: "Manual milk", shopMarketId: "market", quantity: 1, unit: "l" },
      revision: 0,
      createdAt: "2026-07-12T00:00:00.000Z",
      updatedAt: "2026-07-12T00:00:00.000Z"
    });
    await repository.create({
      id: "submission:2",
      householdId: "household",
      shoppingTripId: "trip",
      shoppingTripItemId: "item:2",
      submittedByUserId: "user",
      status: "pending",
      facts: { displayName: "Bread", shopMarketId: "market", quantity: 1, unit: "count" },
      revision: 0,
      createdAt: "2026-07-12T00:30:00.000Z",
      updatedAt: "2026-07-12T00:30:00.000Z"
    });
    await expect(
      repository.listPage("pending", { offset: 0, page: 1, pageSize: 1 })
    ).resolves.toMatchObject({ hasNextPage: true, items: [{ id: "submission:2" }] });
    await expect(
      repository.review({
        expectedRevision: 0,
        id: "submission:1",
        reviewerId: "admin",
        status: "accepted",
        reviewedAt: "2026-07-12T01:00:00.000Z"
      })
    ).resolves.toMatchObject({ status: "accepted", revision: 1 });
    await expect(
      repository.review({
        expectedRevision: 0,
        id: "submission:1",
        reviewerId: "admin",
        status: "rejected",
        reviewedAt: "2026-07-12T02:00:00.000Z"
      })
    ).rejects.toThrow("revision_conflict");
  });

  it("rejects when the conditional review update loses its match", async () => {
    const submissions = new FakeCollection("ingestion_submissions");
    const repository = new MongoIngestionSubmissionRepository(
      createFakeDb({ ingestion_submissions: submissions })
    );
    await repository.setupCollections();
    await repository.create({
      id: "submission:race",
      householdId: "household",
      shoppingTripId: "trip",
      shoppingTripItemId: "item",
      submittedByUserId: "user",
      status: "pending",
      facts: { displayName: "Milk", shopMarketId: "market", quantity: 1, unit: "l" },
      revision: 0,
      createdAt: "2026-07-12T00:00:00.000Z",
      updatedAt: "2026-07-12T00:00:00.000Z"
    });
    vi.spyOn(submissions, "updateOne").mockResolvedValue({
      acknowledged: true,
      matchedCount: 0,
      modifiedCount: 0
    });

    await expect(
      repository.review({
        expectedRevision: 0,
        id: "submission:race",
        reviewerId: "admin",
        status: "accepted",
        reviewedAt: "2026-07-12T01:00:00.000Z"
      })
    ).rejects.toThrow("ingestion_submission_revision_conflict");
  });
});
