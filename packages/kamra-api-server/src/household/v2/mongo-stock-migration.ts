import type { MongoCollectionLike, MongoDatabaseLike } from "../../db/mongo-like.js";
import type { HouseholdLocalProductRecord, HouseholdStockItemRecord } from "../v1/contracts.js";
import type {
  StockAllocation,
  StockBatch,
  StockMovement,
  StockTarget,
  TrackingUnit
} from "./contracts.js";

export interface StockMigrationReport {
  allocations: number;
  batches: number;
  movements: number;
  targets: number;
  totalMigratedQuantity: number;
}

export class MongoStockMigrationRepository {
  private readonly allocations: MongoCollectionLike<StockAllocation>;
  private readonly batches: MongoCollectionLike<StockBatch>;
  private readonly movements: MongoCollectionLike<StockMovement>;
  private readonly targets: MongoCollectionLike<StockTarget>;

  constructor(private readonly database: MongoDatabaseLike) {
    this.allocations = database.collection("household_stock_allocations");
    this.batches = database.collection("household_stock_batches");
    this.movements = database.collection("household_stock_movements");
    this.targets = database.collection("household_stock_targets");
  }

  async setupCollections(): Promise<void> {
    await Promise.all([
      this.targets.createIndex(
        { id: 1 },
        { name: "household_stock_targets_id_unique", unique: true }
      ),
      this.targets.createIndex(
        { householdId: 1, status: 1, normalizedKey: 1 },
        { name: "household_stock_targets_household_status_key" }
      ),
      this.batches.createIndex(
        { id: 1 },
        { name: "household_stock_batches_id_unique", unique: true }
      ),
      this.batches.createIndex(
        { householdId: 1, status: 1, expiryOn: 1 },
        { name: "household_stock_batches_household_status_expiry" }
      ),
      this.allocations.createIndex(
        { id: 1 },
        { name: "household_stock_allocations_id_unique", unique: true }
      ),
      this.allocations.createIndex(
        { stockBatchId: 1, status: 1 },
        { name: "household_stock_allocations_batch_status" }
      ),
      this.movements.createIndex(
        { id: 1 },
        { name: "household_stock_movements_id_unique", unique: true }
      ),
      this.movements.createIndex(
        { householdId: 1, createdAt: -1 },
        { name: "household_stock_movements_household_created_at" }
      )
    ]);
  }

  async migrateLegacy(): Promise<StockMigrationReport> {
    const products = await this.database
      .collection<HouseholdLocalProductRecord>("household_local_products")
      .find({})
      .toArray();
    const stockItems = await this.database
      .collection<HouseholdStockItemRecord>("household_stock_items")
      .find({})
      .toArray();
    const targets = products.map((product) => toTarget(product));
    const targetByProduct = new Map(
      products.map((product, index) => [product.id, targets[index]!] as const)
    );
    const batches: StockBatch[] = [];
    const allocations: StockAllocation[] = [];
    const movements: StockMovement[] = [];
    for (const item of stockItems) {
      const target = targetByProduct.get(item.householdProductId);
      if (!target) continue;
      const acquiredOn = toDate(item.stockedAt);
      const batchId = `stock-batch:${item.id}`;
      const quantity = item.currentAmount;
      const batch: StockBatch = {
        acquiredOn,
        acquisitionSnapshot: {
          displayName: item.displayName,
          gtin: item.gtin,
          sourceName: item.sourceName,
          sourceUrl: item.sourceProductUrl
        },
        classificationSnapshot: {
          capturedAt: item.updatedAt,
          directAttributes: [],
          directConcepts: [],
          effectiveConcepts: [],
          source: "manual"
        },
        createdAt: item.createdAt,
        createdByUserId: item.createdByUserId,
        expiryOn: null,
        householdId: item.householdId,
        id: batchId,
        originalQuantity: Math.max(item.initialAmount, quantity),
        productId: item.catalogProductId,
        remainingQuantity: quantity,
        revision: 0,
        shopProductId: null,
        status: quantity > 0 ? "available" : "depleted",
        unit: toTrackingUnit(item.unit),
        updatedAt: item.updatedAt,
        updatedByUserId: item.updatedByUserId
      };
      batches.push(batch);
      if (quantity <= 0) continue;
      allocations.push({
        acceptanceResult: "accepted",
        allocatedQuantity: quantity,
        createdAt: item.createdAt,
        createdByUserId: item.createdByUserId,
        householdId: item.householdId,
        id: `stock-allocation:${item.id}`,
        revision: 0,
        status: "active",
        stockBatchId: batchId,
        stockTargetId: target.id,
        unit: batch.unit,
        updatedAt: item.updatedAt,
        updatedByUserId: item.updatedByUserId
      });
      movements.push({
        actorUserId: item.createdByUserId,
        createdAt: item.createdAt,
        householdId: item.householdId,
        id: `stock-movement:${item.id}:opening`,
        kind: "migration_opening_balance",
        occurrenceAt: acquiredOn,
        operationId: `migration:household-stock-targets-v1:${item.id}`,
        quantityDelta: quantity,
        resultingQuantity: quantity,
        stockBatchId: batchId,
        stockTargetId: target.id,
        unit: batch.unit
      });
    }
    await this.upsert(this.targets, targets);
    await this.upsert(this.batches, batches);
    await this.upsert(this.allocations, allocations);
    await this.upsert(this.movements, movements);
    return {
      allocations: allocations.length,
      batches: batches.length,
      movements: movements.length,
      targets: targets.length,
      totalMigratedQuantity: allocations.reduce(
        (total, allocation) => total + allocation.allocatedQuantity,
        0
      )
    };
  }

  private async upsert<T extends { id: string }>(
    collection: MongoCollectionLike<T>,
    records: readonly T[]
  ): Promise<void> {
    if (records.length === 0) return;
    await collection.bulkWrite(
      records.map((record) => ({
        replaceOne: { filter: { id: record.id } as never, replacement: record, upsert: true }
      }))
    );
  }
}

function toTarget(product: HouseholdLocalProductRecord): StockTarget {
  const timestamp = product.updatedAt;
  return {
    acceptanceCriteria: {
      acceptedAttributesAny: [],
      acceptedConceptsAny: [],
      excludedAttributesAny: [],
      requiredAttributesAll: [],
      requiredConceptsAll: []
    },
    consumptionPolicy: "earliest_expiry_first",
    createdAt: product.createdAt,
    createdByUserId: product.createdByUserId,
    displayName: product.displayName,
    expiryWarningDays: 0,
    householdId: product.householdId,
    id: `stock-target:${product.id}`,
    minimumQuantity: 0,
    preferredProductId: product.catalogProductId,
    preferredProductNameSnapshot: product.catalogProductNameSnapshot,
    revision: 0,
    status: product.status,
    targetQuantity: 0,
    trackingUnit: "custom:legacy",
    updatedAt: timestamp,
    updatedByUserId: product.updatedByUserId
  };
}
function toDate(value: string): string {
  return value.slice(0, 10);
}
function toTrackingUnit(value: string): TrackingUnit {
  return ["g", "kg", "ml", "l", "count"].includes(value)
    ? (value as TrackingUnit)
    : `custom:${value.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
