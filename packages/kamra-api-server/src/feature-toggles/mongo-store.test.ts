import { describe, expect, it, vi } from "vitest";
import { createFakeDb } from "../test-support/fake-mongo.js";
import { FakeCollection } from "../test-support/fake-mongo.js";
import { MongoFeatureFlagStore } from "./mongo-store.js";

describe("MongoFeatureFlagStore", () => {
  it("persists revisions and audit records separately", async () => {
    const db = createFakeDb();
    const store = new MongoFeatureFlagStore(db);
    const record = await store.write({
      enabled: true,
      key: "allowControlledAlphaAccess",
      updatedAt: "2026-07-11T00:00:00.000Z",
      updatedByUserId: "admin"
    });
    await store.appendAudit({
      changedAt: record.updatedAt,
      changedByUserId: "admin",
      id: "audit-1",
      key: record.key,
      newValue: true,
      oldValue: false,
      reason: "rollout",
      revision: record.revision
    });
    expect(await store.read(record.key)).toMatchObject({ enabled: true, revision: 1 });
    expect(db.__collections["feature_flag_change_audits"]!.docs).toHaveLength(1);
    await expect(
      store.write({
        enabled: false,
        expectedRevision: 0,
        key: record.key,
        updatedAt: record.updatedAt,
        updatedByUserId: "admin"
      })
    ).rejects.toThrow("revision_conflict");
  });

  it("rejects when a conditional write loses its match", async () => {
    const flags = new FakeCollection("household_feature_flags");
    const store = new MongoFeatureFlagStore(createFakeDb({ household_feature_flags: flags }));
    const record = await store.write({
      enabled: true,
      key: "allowControlledAlphaAccess",
      updatedAt: "2026-07-11T00:00:00.000Z",
      updatedByUserId: "admin"
    });
    vi.spyOn(flags, "updateOne").mockResolvedValue({
      acknowledged: true,
      matchedCount: 0,
      modifiedCount: 0
    });

    await expect(
      store.write({
        enabled: false,
        expectedRevision: record.revision,
        key: record.key,
        updatedAt: "2026-07-11T00:01:00.000Z",
        updatedByUserId: "admin"
      })
    ).rejects.toThrow("feature_flag_revision_conflict");
  });
});
