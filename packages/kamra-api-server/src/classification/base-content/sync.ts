import type { MongoCollectionLike, MongoDatabaseLike } from "../../db/mongo-like.js";
import type {
  ProductAttributeRecord,
  ProductConceptRecord
} from "../../catalog/v2/classification.js";
import { loadBaseClassificationPack } from "./loader.js";

export interface ClassificationSyncReport {
  conflicts: string[];
  created: number;
  unchanged: number;
  updated: number;
}

export class MongoBaseClassificationSync {
  private readonly attributes: MongoCollectionLike<ProductAttributeRecord>;
  private readonly concepts: MongoCollectionLike<ProductConceptRecord>;

  constructor(database: MongoDatabaseLike) {
    this.attributes = database.collection("product_attributes");
    this.concepts = database.collection("product_concepts");
  }

  async sync(): Promise<ClassificationSyncReport> {
    const pack = loadBaseClassificationPack();
    const seedChecksum = `${pack.packId}:v${pack.version}`;
    const report: ClassificationSyncReport = {
      conflicts: [],
      created: 0,
      unchanged: 0,
      updated: 0
    };
    const origin = {
      capturedAt: new Date().toISOString(),
      kind: "seed" as const,
      producer: "base-classification-sync",
      sourceName: pack.packId
    };
    for (const concept of pack.concepts) {
      const existing = await this.concepts.findOne({ key: concept.key });
      const next: ProductConceptRecord = {
        createdAt: existing?.createdAt ?? origin.capturedAt,
        id: existing?.id ?? `concept:${concept.key}`,
        key: concept.key,
        label: pack.labels.en[concept.key]!,
        origin: existing?.origin ?? origin,
        seedChecksum,
        seedPackId: pack.packId,
        status: existing?.status ?? "active",
        translations: { en: pack.labels.en[concept.key]!, hu: pack.labels.hu[concept.key]! },
        updatedAt: origin.capturedAt
      };
      if (!existing) {
        await this.concepts.insertOne(next);
        report.created += 1;
      } else if (existing.seedPackId === pack.packId && existing.seedChecksum === seedChecksum) {
        report.unchanged += 1;
      } else {
        report.conflicts.push(`concept:${concept.key}`);
      }
    }
    for (const attribute of pack.attributes) {
      const existing = await this.attributes.findOne({ key: attribute.key });
      const next: ProductAttributeRecord = {
        createdAt: existing?.createdAt ?? origin.capturedAt,
        id: existing?.id ?? `attribute:${attribute.key}`,
        key: attribute.key,
        label: pack.labels.en[attribute.key]!,
        origin: existing?.origin ?? origin,
        seedChecksum,
        seedPackId: pack.packId,
        status: existing?.status ?? "active",
        translations: { en: pack.labels.en[attribute.key]!, hu: pack.labels.hu[attribute.key]! },
        updatedAt: origin.capturedAt
      };
      if (!existing) {
        await this.attributes.insertOne(next);
        report.created += 1;
      } else if (existing.seedPackId === pack.packId && existing.seedChecksum === seedChecksum) {
        report.unchanged += 1;
      } else {
        report.conflicts.push(`attribute:${attribute.key}`);
      }
    }
    return report;
  }
}
