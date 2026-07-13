import type { MongoDatabaseLike } from "../../db/mongo-like.js";
import type { HouseholdProduct, ProductGroup, StockBatch } from "./contracts.js";
import {
  buildProductGroupWorkspace,
  type ProductGroupWorkspaceReadModel
} from "./product-group-read-model.js";

export class MongoProductGroupReadRepository {
  constructor(private readonly database: MongoDatabaseLike) {}

  async getWorkspace(householdId: string, today: string): Promise<ProductGroupWorkspaceReadModel> {
    const [groups, products, batches, household] = await Promise.all([
      this.database
        .collection<ProductGroup>("household_product_groups")
        .find({ householdId, status: "active" })
        .sort({ displayName: 1 })
        .toArray(),
      this.database
        .collection<HouseholdProduct>("household_products")
        .find({ householdId, status: "active" })
        .sort({ displayName: 1 })
        .toArray(),
      this.database
        .collection<StockBatch>("household_stock_batches")
        .find({ householdId })
        .toArray(),
      this.database
        .collection<{
          allowExpiredItems?: boolean | null;
          defaultCalculatedMaxLimitMultiplier?: number | null;
        }>("households")
        .findOne({ id: householdId })
    ]);
    return buildProductGroupWorkspace({
      allowExpiredItems: household?.allowExpiredItems ?? true,
      defaultCalculatedMaxLimitMultiplier: household?.defaultCalculatedMaxLimitMultiplier,
      batches,
      groups,
      products,
      today
    });
  }
}
