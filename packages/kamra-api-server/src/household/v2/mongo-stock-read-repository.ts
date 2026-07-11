import type { MongoCollectionLike, MongoDatabaseLike } from "../../db/mongo-like.js";
import type { HouseholdProduct, StockAllocation, StockBatch, StockTarget } from "./contracts.js";
import { summarizeStockTarget } from "./domain.js";

export interface StockTargetReadModel {
  aggregate: ReturnType<typeof summarizeStockTarget>;
  batches: StockBatch[];
  target: StockTarget;
}

export interface StockWorkspaceReadModel {
  allowExpiredItems: boolean;
  products: HouseholdProduct[];
  targets: Array<StockTargetReadModel & { products: HouseholdProduct[] }>;
  unassignedBatches: StockBatch[];
}

export class MongoStockReadRepository {
  private readonly allocations: MongoCollectionLike<StockAllocation>;
  private readonly batches: MongoCollectionLike<StockBatch>;
  private readonly targets: MongoCollectionLike<StockTarget>;
  private readonly households: MongoCollectionLike<{ id: string; allowExpiredItems?: boolean | null }>;

  constructor(private readonly database: MongoDatabaseLike) {
    this.allocations = database.collection("household_stock_allocations");
    this.batches = database.collection("household_stock_batches");
    this.targets = database.collection("household_stock_targets");
    this.households = database.collection("households");
  }

  async getTarget(householdId: string, targetId: string, today: string): Promise<StockTargetReadModel | null> {
    const target = await this.targets.findOne({ householdId, id: targetId, status: "active" });
    if (!target) return null;
    const allocations = await this.allocations.find({ householdId, stockTargetId: targetId }).toArray();
    const batches = await this.batches.find({ householdId }).toArray();
    const household = await this.households.findOne({ id: householdId });
    return { aggregate: summarizeStockTarget(target, batches, allocations, today, household?.allowExpiredItems ?? true), batches: batches.filter((batch) => allocations.some((allocation) => allocation.stockBatchId === batch.id)), target };
  }

  async getWorkspace(householdId: string, today: string): Promise<StockWorkspaceReadModel> {
    const [targets, allocations, batches, products, household] = await Promise.all([
      this.targets.find({ householdId, status: "active" }).sort({ displayName: 1 }).toArray(),
      this.allocations.find({ householdId, status: "active" }).toArray(),
      this.batches.find({ householdId }).toArray(),
      this.database.collection<HouseholdProduct>("household_products").find({ householdId, status: "active" }).sort({ displayName: 1 }).toArray(),
      this.households.findOne({ id: householdId })
    ]);
    const batchesById = new Map(batches.map((batch) => [batch.id, batch]));
    const productById = new Map(products.map((product) => [product.id, product]));
    const allocatedBatchIds = new Set(allocations.map((allocation) => allocation.stockBatchId));
    const targetModels = targets.map((target) => {
      const targetAllocations = allocations.filter((allocation) => allocation.stockTargetId === target.id);
      const targetBatches = targetAllocations.map((allocation) => batchesById.get(allocation.stockBatchId)).filter((batch): batch is StockBatch => Boolean(batch));
      const targetProducts = [...new Map(targetBatches.map((batch) => batch.householdProductId ? [batch.householdProductId, productById.get(batch.householdProductId)] as const : null).filter((entry): entry is readonly [string, HouseholdProduct | undefined] => entry !== null && Boolean(entry[1]))).values()] as HouseholdProduct[];
      return { aggregate: summarizeStockTarget(target, batches, targetAllocations, today, household?.allowExpiredItems ?? true), batches: targetBatches, products: targetProducts, target };
    });
    return { allowExpiredItems: household?.allowExpiredItems ?? true, products, targets: targetModels, unassignedBatches: batches.filter((batch) => !allocatedBatchIds.has(batch.id)) };
  }
}
