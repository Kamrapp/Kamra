import type { MongoDatabaseLike } from "../db/mongo-like.js";
import { MongoHouseholdProductRepository } from "../household/v2/mongo-household-product-repository.js";
import { MongoProductGroupRepository } from "../household/v2/mongo-product-group-repository.js";
import { MongoStockMigrationRepository } from "../household/v2/mongo-stock-migration.js";

const preservedLegacyCollections = [
  "household_local_products",
  "household_stock_items",
  "household_stock_targets"
] as const;

export interface AlphaDomainLanguagePreview {
  finalCollections: Record<string, number>;
  preservedLegacyCollections: Record<string, number>;
}

export interface AlphaDomainLanguageMigrationReport extends AlphaDomainLanguagePreview {
  groups: Awaited<ReturnType<MongoProductGroupRepository["migrateLegacy"]>>;
  products: Awaited<ReturnType<MongoHouseholdProductRepository["migrateLegacy"]>>;
  status: "completed";
  stock: Awaited<ReturnType<MongoStockMigrationRepository["migrateLegacy"]>>;
}

export class MongoAlphaDomainLanguageMaintenance {
  constructor(private readonly database: MongoDatabaseLike) {}

  async preview(): Promise<AlphaDomainLanguagePreview> {
    return {
      finalCollections: await this.countCollections([
        "household_product_groups",
        "household_products",
        "household_stock_batches",
        "household_stock_allocations",
        "household_stock_movements"
      ]),
      preservedLegacyCollections: await this.countCollections(preservedLegacyCollections)
    };
  }

  async setupCollections(): Promise<{ delegatedActions: string[]; status: "ready" }> {
    await new MongoStockMigrationRepository(this.database).setupCollections();
    await new MongoHouseholdProductRepository(this.database).setupCollections();
    await new MongoProductGroupRepository(this.database).setupCollections();
    return {
      delegatedActions: [
        "household-stock-targets-v1",
        "household-products-v1",
        "household-product-groups-v1"
      ],
      status: "ready"
    };
  }

  async migrateLegacy(): Promise<AlphaDomainLanguageMigrationReport> {
    const stock = await new MongoStockMigrationRepository(this.database).migrateLegacy();
    const products = await new MongoHouseholdProductRepository(this.database).migrateLegacy();
    const groups = await new MongoProductGroupRepository(this.database).migrateLegacy();
    return {
      ...(await this.preview()),
      groups,
      products,
      status: "completed",
      stock
    };
  }

  private async countCollections(
    collectionNames: readonly string[]
  ): Promise<Record<string, number>> {
    const entries = await Promise.all(
      collectionNames.map(
        async (name) => [name, await this.database.collection(name).countDocuments({})] as const
      )
    );
    return Object.fromEntries(entries);
  }
}
