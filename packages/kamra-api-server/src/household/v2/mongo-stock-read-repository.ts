import type { MongoCollectionLike, MongoDatabaseLike } from "../../db/mongo-like.js";
import type { StockAllocation, StockBatch, StockTarget } from "./contracts.js";
import { summarizeStockTarget } from "./domain.js";

export interface StockTargetReadModel {
  aggregate: ReturnType<typeof summarizeStockTarget>;
  batches: StockBatch[];
  target: StockTarget;
}

export class MongoStockReadRepository {
  private readonly allocations: MongoCollectionLike<StockAllocation>;
  private readonly batches: MongoCollectionLike<StockBatch>;
  private readonly targets: MongoCollectionLike<StockTarget>;

  constructor(database: MongoDatabaseLike) {
    this.allocations = database.collection("household_stock_allocations");
    this.batches = database.collection("household_stock_batches");
    this.targets = database.collection("household_stock_targets");
  }

  async getTarget(householdId: string, targetId: string, today: string): Promise<StockTargetReadModel | null> {
    const target = await this.targets.findOne({ householdId, id: targetId, status: "active" });
    if (!target) return null;
    const allocations = await this.allocations.find({ householdId, stockTargetId: targetId }).toArray();
    const batches = await this.batches.find({ householdId }).toArray();
    return { aggregate: summarizeStockTarget(target, batches, allocations, today), batches: batches.filter((batch) => allocations.some((allocation) => allocation.stockBatchId === batch.id)), target };
  }
}
