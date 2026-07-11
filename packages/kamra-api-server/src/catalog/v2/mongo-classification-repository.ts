import type { MongoCollectionLike, MongoDatabaseLike } from "../../db/mongo-like.js";
import type { Filter } from "mongodb";
import type { ProductTagAssignmentRecord, ProductTagRecord } from "../v1/contracts.js";
import { migrateLegacyClassification, type ProductAttributeAssignmentRecord, type ProductAttributeRecord, type ProductConceptAssignmentRecord, type ProductConceptRecord } from "./classification.js";
import type { ProductConceptRelation } from "../../household/v2/contracts.js";

interface MigrationDocument { id: string; }
export interface ClassificationMigrationReport {
  attributeAssignments: number;
  attributes: number;
  conceptAssignments: number;
  concepts: number;
  discardedKeywordCount: number;
  relationCount: number;
  skippedAssignmentCount: number;
  skippedRelationCount: number;
}

export class MongoClassificationRepository {
  private readonly attributeAssignments: MongoCollectionLike<ProductAttributeAssignmentRecord & MigrationDocument>;
  private readonly attributes: MongoCollectionLike<ProductAttributeRecord & MigrationDocument>;
  private readonly conceptAssignments: MongoCollectionLike<ProductConceptAssignmentRecord & MigrationDocument>;
  private readonly concepts: MongoCollectionLike<ProductConceptRecord & MigrationDocument>;
  private readonly relations: MongoCollectionLike<ProductConceptRelation & MigrationDocument>;

  constructor(private readonly database: MongoDatabaseLike) {
    this.attributeAssignments = database.collection("product_attribute_assignments");
    this.attributes = database.collection("product_attributes");
    this.conceptAssignments = database.collection("product_concept_assignments");
    this.concepts = database.collection("product_concepts");
    this.relations = database.collection("product_concept_relations");
  }

  async setupCollections(): Promise<void> {
    await Promise.all([
      this.concepts.createIndex({ key: 1 }, { name: "product_concepts_key_unique", unique: true }),
      this.attributes.createIndex({ key: 1 }, { name: "product_attributes_key_unique", unique: true }),
      this.relations.createIndex({ "child.scope": 1, "child.key": 1, "parent.scope": 1, "parent.key": 1 }, { name: "product_concept_relations_edge_unique", unique: true }),
      this.conceptAssignments.createIndex({ productId: 1, "concept.scope": 1, "concept.key": 1 }, { name: "product_concept_assignments_product_concept_unique", unique: true }),
      this.attributeAssignments.createIndex({ productId: 1, "attribute.scope": 1, "attribute.key": 1 }, { name: "product_attribute_assignments_product_attribute_unique", unique: true })
    ]);
  }

  async migrateLegacy(tags: readonly ProductTagRecord[], assignments: readonly ProductTagAssignmentRecord[]): Promise<ClassificationMigrationReport> {
    const result = migrateLegacyClassification(tags, assignments);
    await this.upsert(this.concepts, result.concepts);
    await this.upsert(this.attributes, result.attributes);
    await this.upsert(this.relations, result.relations.map((relation) => ({ ...relation, id: `relation:${relation.child.scope}:${relation.child.key}:${relation.parent.scope}:${relation.parent.key}` })));
    await this.upsert(this.conceptAssignments, result.conceptAssignments);
    await this.upsert(this.attributeAssignments, result.attributeAssignments);
    return {
      attributeAssignments: result.attributeAssignments.length,
      attributes: result.attributes.length,
      conceptAssignments: result.conceptAssignments.length,
      concepts: result.concepts.length,
      discardedKeywordCount: result.discardedKeywordCount,
      relationCount: result.relations.length,
      skippedAssignmentCount: result.skippedAssignmentCount,
      skippedRelationCount: result.skippedRelationCount
    };
  }

  private async upsert<T extends MigrationDocument>(collection: MongoCollectionLike<T>, records: readonly T[]): Promise<void> {
    if (records.length === 0) return;
    await collection.bulkWrite(records.map((record) => ({ replaceOne: { filter: { id: record.id } as Filter<T>, replacement: record, upsert: true } })));
  }
}
