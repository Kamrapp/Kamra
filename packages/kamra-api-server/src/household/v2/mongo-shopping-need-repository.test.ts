import { describe, expect, it } from "vitest";
import { createFakeDb } from "../../test-support/fake-mongo.js";
import { MongoShoppingNeedRepository } from "./mongo-shopping-need-repository.js";
import { createAdHocShoppingNeed } from "./shopping-needs.js";

describe("MongoShoppingNeedRepository", () => {
  it("keeps one idempotent household list and revision-checks transitions", async () => {
    const db = createFakeDb();
    const repository = new MongoShoppingNeedRepository(db);
    await repository.setupCollections();
    const first = await repository.getOrCreateList("h", "u", "2026-07-11T00:00:00.000Z");
    const second = await repository.getOrCreateList("h", "u", "2026-07-12T00:00:00.000Z");
    expect(second.id).toBe(first.id);
    await repository.upsertNeed({
      actorUserId: "u",
      householdId: "h",
      need: createAdHocShoppingNeed({ id: "need", plannedQuantity: 1, unit: "count" }),
      now: "2026-07-11T00:00:00.000Z"
    });
    expect(
      (
        await repository.transitionNeed({
          actorUserId: "u",
          expectedRevision: 0,
          householdId: "h",
          needId: "need",
          now: "2026-07-11T00:00:00.000Z",
          state: "skipped"
        })
      ).items[0]?.state
    ).toBe("skipped");
    await expect(
      repository.transitionNeed({
        actorUserId: "u",
        expectedRevision: 0,
        householdId: "h",
        needId: "need",
        now: "2026-07-11T00:00:00.000Z",
        state: "open"
      })
    ).rejects.toThrow("stale_revision");
  });
});
