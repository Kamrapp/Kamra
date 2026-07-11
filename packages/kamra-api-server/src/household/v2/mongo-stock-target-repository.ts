import type { MongoCollectionLike, MongoDatabaseLike } from "../../db/mongo-like.js";
import type { StockTarget } from "./contracts.js";

export class MongoStockTargetRepository {
  private readonly targets: MongoCollectionLike<StockTarget>;

  constructor(database: MongoDatabaseLike) {
    this.targets = database.collection("household_stock_targets");
  }

  async create(target: StockTarget): Promise<StockTarget> {
    await this.targets.insertOne(target);
    return target;
  }

  async update(input: { householdId: string; id: string; expectedRevision: number; patch: Partial<Pick<StockTarget, "acceptanceCriteria" | "consumptionPolicy" | "displayName" | "expiryWarningDays" | "minimumQuantity" | "preferredProductId" | "preferredProductNameSnapshot" | "status" | "targetQuantity" | "trackingUnit">>; updatedAt: string; updatedByUserId: string }): Promise<StockTarget> {
    const current = await this.targets.findOne({ householdId: input.householdId, id: input.id, status: "active" });
    if (!current) throw new Error("stock_target_not_found");
    if (current.revision !== input.expectedRevision) throw new Error("stale_revision");
    const next = { ...current, ...input.patch, revision: current.revision + 1, updatedAt: input.updatedAt, updatedByUserId: input.updatedByUserId };
    if (next.targetQuantity < next.minimumQuantity) throw new Error("target_quantity_below_minimum");
    await this.targets.updateOne({ householdId: input.householdId, id: input.id, revision: input.expectedRevision }, { $set: next });
    return next;
  }

  async archive(input: { householdId: string; id: string; expectedRevision: number; updatedAt: string; updatedByUserId: string }): Promise<StockTarget> {
    return await this.update({ ...input, patch: { status: "archived" } });
  }
}
