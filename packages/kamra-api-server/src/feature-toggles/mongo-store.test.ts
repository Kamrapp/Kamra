import { describe, expect, it } from "vitest";
import { createFakeDb } from "../test-support/fake-mongo.js";
import { MongoFeatureFlagStore } from "./mongo-store.js";

describe("MongoFeatureFlagStore", () => {
  it("persists revisions and audit records separately", async () => {
    const db = createFakeDb(); const store = new MongoFeatureFlagStore(db);
    const record = await store.write({ enabled: true, key: "allowControlledAlphaAccess", updatedAt: "2026-07-11T00:00:00.000Z", updatedByUserId: "admin" });
    await store.appendAudit({ changedAt: record.updatedAt, changedByUserId: "admin", id: "audit-1", key: record.key, newValue: true, oldValue: false, reason: "rollout", revision: record.revision });
    expect(await store.read(record.key)).toMatchObject({ enabled: true, revision: 1 });
    expect(db.__collections["feature_flag_change_audits"]!.docs).toHaveLength(1);
    await expect(store.write({ enabled: false, expectedRevision: 0, key: record.key, updatedAt: record.updatedAt, updatedByUserId: "admin" })).rejects.toThrow("revision_conflict");
  });
});
