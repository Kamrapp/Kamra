import type { MongoCollectionLike, MongoDatabaseLike } from "../db/mongo-like.js";
import type {
  FeatureFlagChangeAudit,
  FeatureFlagKey,
  FeatureFlagRecord,
  FeatureFlagStore
} from "./contracts.js";

interface FeatureFlagAuditDocument extends FeatureFlagChangeAudit {
  createdAt: string;
}

export class MongoFeatureFlagStore implements FeatureFlagStore {
  private readonly audits: MongoCollectionLike<FeatureFlagAuditDocument>;
  private readonly flags: MongoCollectionLike<FeatureFlagRecord>;

  constructor(database: MongoDatabaseLike) {
    this.flags = database.collection<FeatureFlagRecord>("household_feature_flags");
    this.audits = database.collection<FeatureFlagAuditDocument>("feature_flag_change_audits");
  }

  async setupCollections(): Promise<void> {
    await Promise.all([
      this.flags.createIndex(
        { key: 1 },
        { name: "household_feature_flags_key_unique", unique: true }
      ),
      this.audits.createIndex(
        { id: 1 },
        { name: "feature_flag_change_audits_id_unique", unique: true }
      ),
      this.audits.createIndex(
        { key: 1, changedAt: -1 },
        { name: "feature_flag_change_audits_key_changed_at" }
      )
    ]);
  }

  async read(key: FeatureFlagKey): Promise<FeatureFlagRecord | null> {
    return await this.flags.findOne({ key });
  }

  async write(input: {
    expectedRevision?: number;
    key: FeatureFlagKey;
    updatedAt: string;
    updatedByUserId: string;
    enabled: boolean;
  }): Promise<FeatureFlagRecord> {
    const existing = await this.read(input.key);
    if (
      input.expectedRevision !== undefined &&
      (existing?.revision ?? 0) !== input.expectedRevision
    )
      throw new Error("feature_flag_revision_conflict");
    const result = await this.flags.updateOne(
      input.expectedRevision === undefined
        ? { key: input.key }
        : { key: input.key, revision: input.expectedRevision },
      {
        $set: {
          enabled: input.enabled,
          revision: (existing?.revision ?? 0) + 1,
          updatedAt: input.updatedAt,
          updatedByUserId: input.updatedByUserId
        },
        $setOnInsert: {
          createdAt: input.updatedAt,
          id: `household_feature_flag_${input.key}`,
          key: input.key
        }
      },
      { upsert: true }
    );
    if (input.expectedRevision !== undefined && existing && result.matchedCount !== 1)
      throw new Error("feature_flag_revision_conflict");
    const updated = await this.read(input.key);
    if (!updated) throw new Error("feature_flag_storage_failure");
    return updated;
  }

  async appendAudit(audit: FeatureFlagChangeAudit): Promise<void> {
    await this.audits.insertOne({ ...audit, createdAt: audit.changedAt });
  }
}
