import { describe, expect, it } from "vitest";
import { FeatureFlagService } from "./service.js";
import type { FeatureFlagRecord, FeatureFlagStore } from "./contracts.js";

function store(initial: Partial<Record<"allowControlledAlphaAccess" | "allowAutoTickingAllShoppingListEntries", boolean>> = {}): FeatureFlagStore & { audits: unknown[]; records: Map<string, FeatureFlagRecord> } {
  const records = new Map(Object.entries(initial).map(([key, enabled]) => [key, { enabled: Boolean(enabled), key, revision: 1, updatedAt: "now", updatedByUserId: "seed" } as FeatureFlagRecord]));
  const audits: unknown[] = [];
  return { audits, records, appendAudit: async (audit) => { audits.push(audit); }, read: async (key) => records.get(key) ?? null, write: async (input) => { const record = { enabled: input.enabled, key: input.key, revision: (records.get(input.key)?.revision ?? 0) + 1, updatedAt: input.updatedAt, updatedByUserId: input.updatedByUserId }; records.set(input.key, record); return record; } };
}

describe("feature flag service", () => {
  it("uses stored values, defaults, bounded caching, and invalidation", async () => {
    let now = 0; const flags = store({ allowControlledAlphaAccess: true }); const service = new FeatureFlagService(flags, () => now, 100);
    expect(await service.evaluate("allowControlledAlphaAccess")).toMatchObject({ enabled: true, source: "stored" });
    flags.records.get("allowControlledAlphaAccess")!.enabled = false;
    expect(await service.evaluate("allowControlledAlphaAccess")).toMatchObject({ enabled: true });
    now = 101; expect(await service.evaluate("allowControlledAlphaAccess")).toMatchObject({ enabled: false });
    service.invalidate(); flags.records.get("allowControlledAlphaAccess")!.enabled = true; expect(await service.evaluate("allowControlledAlphaAccess")).toMatchObject({ enabled: true });
  });

  it("fails closed for alpha access and records old/new values", async () => {
    const flags = store(); const service = new FeatureFlagService(flags);
    expect((await service.evaluate("allowControlledAlphaAccess")).enabled).toBe(false);
    await service.update({ actorUserId: "admin", enabled: true, key: "allowControlledAlphaAccess", reason: "alpha rollout", updatedAt: "2026-07-11T00:00:00.000Z" });
    expect(flags.audits[0]).toMatchObject({ oldValue: false, newValue: true, reason: "alpha rollout" });
  });
});
