import { featureFlagDefinitions, type FeatureFlagEvaluation, type FeatureFlagEvaluationContext, type FeatureFlagKey, type FeatureFlagRecord, type FeatureFlagStore } from "./contracts.js";

interface CachedValue { expiresAt: number; value: FeatureFlagEvaluation; }

export class FeatureFlagService {
  private readonly cache = new Map<FeatureFlagKey, CachedValue>();

  constructor(private readonly store: FeatureFlagStore, private readonly now: () => number = Date.now, private readonly cacheTtlMs = 10_000) {}

  async evaluate(key: FeatureFlagKey, context: FeatureFlagEvaluationContext = {}): Promise<FeatureFlagEvaluation> {
    void context;
    const definition = featureFlagDefinitions[key];
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > this.now()) return cached.value;
    try {
      const record = await this.store.read(key);
      const value: FeatureFlagEvaluation = { enabled: record?.enabled ?? definition.defaultValue, key, source: record ? "stored" : "default" };
      this.cache.set(key, { expiresAt: this.now() + this.cacheTtlMs, value });
      return value;
    } catch {
      const value: FeatureFlagEvaluation = { enabled: definition.failureValue, key, source: "failure" };
      this.cache.set(key, { expiresAt: this.now() + this.cacheTtlMs, value });
      return value;
    }
  }

  async update(input: { actorUserId: string; enabled: boolean; expectedRevision?: number; key: FeatureFlagKey; reason: string; updatedAt: string }): Promise<FeatureFlagRecord> {
    const current = await this.store.read(input.key);
    if (input.expectedRevision !== undefined && (current?.revision ?? 0) !== input.expectedRevision) throw new Error("feature_flag_revision_conflict");
    const updated = await this.store.write({ enabled: input.enabled, expectedRevision: input.expectedRevision, key: input.key, updatedAt: input.updatedAt, updatedByUserId: input.actorUserId });
    await this.store.appendAudit({ changedAt: input.updatedAt, changedByUserId: input.actorUserId, id: `${input.key}:${updated.revision}:${input.updatedAt}`, key: input.key, newValue: updated.enabled, oldValue: current?.enabled ?? featureFlagDefinitions[input.key].defaultValue, reason: input.reason.slice(0, 300), revision: updated.revision });
    this.cache.delete(input.key);
    return updated;
  }

  invalidate(key?: FeatureFlagKey): void {
    if (key) this.cache.delete(key); else this.cache.clear();
  }
}
