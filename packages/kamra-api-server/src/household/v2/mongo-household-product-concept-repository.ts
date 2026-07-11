import type { MongoCollectionLike, MongoDatabaseLike } from "../../db/mongo-like.js";
import type { HouseholdProductConcept } from "./contracts.js";

export class MongoHouseholdProductConceptRepository {
  private readonly concepts: MongoCollectionLike<HouseholdProductConcept>;

  constructor(database: MongoDatabaseLike) {
    this.concepts = database.collection("household_product_concepts");
  }

  async setupCollections(): Promise<void> {
    await Promise.all([
      this.concepts.createIndex({ householdId: 1, key: 1 }, { name: "household_product_concepts_household_key_unique", unique: true }),
      this.concepts.createIndex({ householdId: 1, status: 1, label: 1 }, { name: "household_product_concepts_household_status_label" })
    ]);
  }

  async create(concept: HouseholdProductConcept): Promise<HouseholdProductConcept> {
    await this.concepts.insertOne(concept);
    return concept;
  }

  async list(householdId: string): Promise<HouseholdProductConcept[]> {
    return await this.concepts.find({ householdId, status: "active" }).sort({ label: 1 }).toArray();
  }
}
