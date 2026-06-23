import type { Collection, Db } from "mongodb";

import type { CatalogV1SeedDataset } from "../catalog/v1/contracts.js";
import { MongoCurrentCatalogRepository } from "../catalog/current/mongo-catalog-repository.js";
import type { SeedLedgerRecord, CatalogV1SeedRepository } from "./catalog-v1-seed.js";

export class MongoCatalogV1SeedRepository implements CatalogV1SeedRepository {
  private readonly catalogRepository: MongoCurrentCatalogRepository;
  private readonly seedLedgerCollection: Collection<SeedLedgerRecord>;

  constructor(private readonly database: Db) {
    this.catalogRepository = new MongoCurrentCatalogRepository(database);
    this.seedLedgerCollection = database.collection<SeedLedgerRecord>("seed_ledger");
  }

  async recordSeed(record: SeedLedgerRecord): Promise<void> {
    await this.seedLedgerCollection.createIndex(
      { seedName: 1, completedAt: -1 },
      { name: "seed_ledger_seed_completed_at" }
    );
    await this.seedLedgerCollection.insertOne(record);
  }

  async setup(): Promise<{ databaseName: string; ensuredCollections: string[] }> {
    return await this.catalogRepository.setupCollections();
  }

  async upsertDataset(dataset: CatalogV1SeedDataset): Promise<{
    migrationLedgerCount: number;
    productSourceCount: number;
    productTagAssignmentCount: number;
    productTagCount: number;
    productCount: number;
    stockCount: number;
  }> {
    await this.catalogRepository.upsertCatalogSeedDataset(dataset);

    return {
      migrationLedgerCount: dataset.migrationLedger.length,
      productSourceCount: dataset.productSources.length,
      productTagAssignmentCount: dataset.productTagAssignments.length,
      productTagCount: dataset.productTags.length,
      productCount: dataset.products.length,
      stockCount: dataset.stocks.length
    };
  }
}
