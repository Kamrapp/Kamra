import type { MongoCollectionLike, MongoDatabaseLike } from "../../db/mongo-like.js";
import type { HouseholdProduct, ProductGroup, StockAllocation, StockBatch, StockTarget, TargetPolicy } from "./contracts.js";

export interface ProductGroupMigrationReport {
  anonymousBatchesLinked: number;
  conflicts: number;
  groupsCreated: number;
  productsLinked: number;
}

export class MongoProductGroupRepository {
  private readonly groups: MongoCollectionLike<ProductGroup>;

  constructor(private readonly database: MongoDatabaseLike) {
    this.groups = database.collection("household_product_groups");
  }

  async setupCollections(): Promise<void> {
    await Promise.all([
      this.groups.createIndex({ id: 1 }, { name: "household_product_groups_id_unique", unique: true }),
      this.groups.createIndex({ householdId: 1, parentProductGroupId: 1, status: 1, displayName: 1 }, { name: "household_product_groups_household_parent_status_display" })
    ]);
  }

  async create(group: ProductGroup): Promise<ProductGroup> {
    await this.groups.insertOne(group);
    return group;
  }

  async get(householdId: string, id: string): Promise<ProductGroup | null> {
    return await this.groups.findOne({ householdId, id, status: "active" });
  }

  async list(householdId: string): Promise<ProductGroup[]> {
    return await this.groups.find({ householdId, status: "active" }).sort({ displayName: 1 }).toArray();
  }

  async update(input: { displayName: string; expectedRevision: number; householdId: string; id: string; parentProductGroupId?: string | null; targetPolicy?: TargetPolicy | null; trackingUnit: ProductGroup["trackingUnit"]; updatedAt: string; updatedByUserId: string }): Promise<ProductGroup> {
    const current = await this.groups.findOne({ householdId: input.householdId, id: input.id, status: "active" });
    if (!current) throw new Error("product_group_not_found");
    if (current.revision !== input.expectedRevision) throw new Error("stale_revision");
    if (input.parentProductGroupId === input.id) throw new Error("product_group_cycle");
    const next: ProductGroup = {
      ...current,
      displayName: input.displayName,
      trackingUnit: input.trackingUnit,
      ...(input.parentProductGroupId === undefined ? {} : { parentProductGroupId: input.parentProductGroupId }),
      ...(input.targetPolicy === undefined ? {} : { targetPolicy: input.targetPolicy }),
      revision: current.revision + 1,
      updatedAt: input.updatedAt,
      updatedByUserId: input.updatedByUserId
    };
    await this.groups.updateOne({ householdId: input.householdId, id: input.id, revision: input.expectedRevision }, { $set: next });
    return next;
  }

  async migrateLegacy(): Promise<ProductGroupMigrationReport> {
    const targets = await this.database.collection<StockTarget>("household_stock_targets").find({ status: "active" }).toArray();
    const allocations = await this.database.collection<StockAllocation>("household_stock_allocations").find({ status: "active" }).toArray();
    const batches = await this.database.collection<StockBatch>("household_stock_batches").find({}).toArray();
    const products = await this.database.collection<HouseholdProduct>("household_products").find({ status: "active" }).toArray();
    const groups = targets.map(toProductGroup);
    await this.upsertGroups(groups);
    const targetIds = new Set(targets.map((target) => target.id));
    const batchesById = new Map(batches.map((batch) => [batch.id, batch]));
    const targetIdsByProduct = new Map<string, Set<string>>();
    for (const allocation of allocations) {
      if (!targetIds.has(allocation.stockTargetId)) continue;
      const batch = batchesById.get(allocation.stockBatchId);
      if (!batch?.householdProductId) continue;
      const ids = targetIdsByProduct.get(batch.householdProductId) ?? new Set<string>();
      ids.add(allocation.stockTargetId);
      targetIdsByProduct.set(batch.householdProductId, ids);
    }
    const productCollection = this.database.collection<HouseholdProduct>("household_products");
    let productsLinked = 0;
    let conflicts = 0;
    for (const product of products) {
      if (product.productGroupId) continue;
      const targetIdsForProduct = [...(targetIdsByProduct.get(product.id) ?? [])];
      if (targetIdsForProduct.length === 0) continue;
      if (targetIdsForProduct.length > 1) { conflicts += 1; continue; }
      await productCollection.updateOne({ householdId: product.householdId, id: product.id, revision: product.revision }, { $set: { productGroupId: `product-group:${targetIdsForProduct[0]}`, revision: product.revision + 1 } });
      productsLinked += 1;
    }
    const anonymousBatches = batches.filter((batch) => !batch.householdProductId);
    let anonymousBatchesLinked = 0;
    const batchCollection = this.database.collection<StockBatch>("household_stock_batches");
    for (const batch of anonymousBatches) {
      const productId = `household-product:legacy-anonymous:${batch.householdId}:${slug(batch.acquisitionSnapshot.displayName)}`;
      let product = await productCollection.findOne({ householdId: batch.householdId, id: productId, status: "active" });
      if (!product) {
        const now = batch.updatedAt;
        product = {
          classificationRevision: 0,
          createdAt: batch.createdAt,
          createdByUserId: batch.createdByUserId,
          directAttributes: [],
          directConcepts: [],
          displayName: batch.acquisitionSnapshot.displayName,
          householdId: batch.householdId,
          id: productId,
          identityKind: "manual",
          identitySnapshot: { brand: batch.acquisitionSnapshot.brand, gtin: batch.acquisitionSnapshot.gtin, measurementLabel: batch.acquisitionSnapshot.measurementLabel, sourceKey: batch.acquisitionSnapshot.sourceKey, sourceName: batch.acquisitionSnapshot.sourceName, sourceUrl: batch.acquisitionSnapshot.sourceUrl },
          revision: 0,
          status: "active",
          updatedAt: now,
          updatedByUserId: batch.updatedByUserId
        };
        await productCollection.insertOne(product);
      }
      await batchCollection.updateOne({ householdId: batch.householdId, id: batch.id }, { $set: { householdProductId: product.id } });
      anonymousBatchesLinked += 1;
    }
    return { anonymousBatchesLinked, conflicts, groupsCreated: groups.length, productsLinked };
  }

  private async upsertGroups(groups: readonly ProductGroup[]): Promise<void> {
    if (groups.length === 0) return;
    await this.groups.bulkWrite(groups.map((group) => ({ replaceOne: { filter: { id: group.id }, replacement: group, upsert: true } })));
  }
}

function toProductGroup(target: StockTarget): ProductGroup {
  return {
    createdAt: target.createdAt,
    createdByUserId: target.createdByUserId,
    displayName: target.displayName,
    householdId: target.householdId,
    id: `product-group:${target.id}`,
    parentProductGroupId: null,
    revision: 0,
    status: target.status,
    targetPolicy: { consumptionPolicy: target.consumptionPolicy, desiredQuantity: target.targetQuantity, expiryWarningDays: target.expiryWarningDays, minimumQuantity: target.minimumQuantity, trackingUnit: target.trackingUnit },
    trackingUnit: target.trackingUnit,
    updatedAt: target.updatedAt,
    updatedByUserId: target.updatedByUserId
  };
}

function slug(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unnamed";
}
