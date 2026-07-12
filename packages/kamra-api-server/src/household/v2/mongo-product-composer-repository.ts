import type { MongoCollectionLike, MongoDatabaseLike, MongoTransactionClientLike } from "../../db/mongo-like.js";
import { runMongoTransaction } from "../../db/mongo-transaction.js";
import type { DomainOperation, HouseholdProduct, ProductGroup, StockBatch, StockMovement, TargetPolicy, TrackingUnit } from "./contracts.js";

export interface CreateProductWithBatchInput {
  actorUserId: string;
  batch: { acquiredOn: string; displayName: string; expiryOn?: string | null; originalQuantity: number; unit: TrackingUnit };
  group?: { displayName: string; targetPolicy?: TargetPolicy | null; trackingUnit: TrackingUnit } | null;
  householdId: string;
  operationId: string;
  product: { displayName: string; note?: string | null; productGroupId?: string | null; targetPolicy?: TargetPolicy | null };
  requestFingerprint: string;
}

export class MongoProductComposerRepository {
  private readonly batches: MongoCollectionLike<StockBatch>;
  private readonly groups: MongoCollectionLike<ProductGroup>;
  private readonly operations: MongoCollectionLike<DomainOperation>;
  private readonly products: MongoCollectionLike<HouseholdProduct>;
  private readonly movements: MongoCollectionLike<StockMovement>;

  constructor(private readonly database: MongoDatabaseLike, private readonly transactionClient: MongoTransactionClientLike) {
    this.batches = database.collection("household_stock_batches");
    this.groups = database.collection("household_product_groups");
    this.operations = database.collection("household_domain_operations");
    this.products = database.collection("household_products");
    this.movements = database.collection("household_stock_movements");
  }

  async createProductWithBatch(input: CreateProductWithBatchInput): Promise<{ batchId: string; operationId: string; productGroupId: string | null; productId: string }> {
    return await runMongoTransaction(this.transactionClient, async (session) => {
      const existing = await this.operations.findOne({ householdId: input.householdId, id: input.operationId }, { session });
      if (existing) {
        if (existing.requestFingerprint !== input.requestFingerprint) throw new Error("idempotency_conflict");
        if (existing.status === "completed" && existing.resultIdentifiers) return { batchId: existing.resultIdentifiers["batchId"]!, operationId: input.operationId, productGroupId: existing.resultIdentifiers["productGroupId"] === "null" ? null : existing.resultIdentifiers["productGroupId"] ?? null, productId: existing.resultIdentifiers["productId"]! };
        throw new Error("operation_in_progress");
      }
      const now = new Date().toISOString();
      let productGroupId = input.product.productGroupId ?? null;
      if (!productGroupId && input.group) {
        productGroupId = `product-group:${input.householdId}:${slug(input.group.displayName)}:${input.operationId}`;
        const group: ProductGroup = { createdAt: now, createdByUserId: input.actorUserId, displayName: input.group.displayName.trim(), householdId: input.householdId, id: productGroupId, parentProductGroupId: null, revision: 0, status: "active", targetPolicy: input.group.targetPolicy ?? null, trackingUnit: input.group.trackingUnit, updatedAt: now, updatedByUserId: input.actorUserId };
        await this.groups.insertOne(group, { session });
      } else if (productGroupId && !(await this.groups.findOne({ householdId: input.householdId, id: productGroupId, status: "active" }, { session }))) {
        throw new Error("product_group_not_found");
      }
      const productId = `household-product:${input.householdId}:${slug(input.product.displayName)}:${input.operationId}`;
      const product: HouseholdProduct = { classificationRevision: 0, createdAt: now, createdByUserId: input.actorUserId, directAttributes: [], directConcepts: [], displayName: input.product.displayName.trim(), householdId: input.householdId, id: productId, identityKind: "manual", identitySnapshot: {}, note: input.product.note ?? null, productGroupId, revision: 0, status: "active", targetPolicy: input.product.targetPolicy ?? null, updatedAt: now, updatedByUserId: input.actorUserId };
      const batchId = `stock-batch:${input.householdId}:${input.operationId}`;
      const batch: StockBatch = { acquiredOn: input.batch.acquiredOn, acquisitionSnapshot: { displayName: product.displayName }, classificationSnapshot: { capturedAt: now, directAttributes: [], directConcepts: [], effectiveConcepts: [], source: "household" }, createdAt: now, createdByUserId: input.actorUserId, expiryOn: input.batch.expiryOn ?? null, householdId: input.householdId, householdProductId: productId, id: batchId, originalQuantity: input.batch.originalQuantity, remainingQuantity: input.batch.originalQuantity, revision: 0, status: "available", unit: input.batch.unit, updatedAt: now, updatedByUserId: input.actorUserId };
      const operation: DomainOperation = { actorUserId: input.actorUserId, createdAt: now, householdId: input.householdId, id: input.operationId, operationType: "product_composer.create_product_with_batch", requestFingerprint: input.requestFingerprint, status: "started", updatedAt: now };
      await this.operations.insertOne(operation, { session });
      await this.products.insertOne(product, { session });
      await this.batches.insertOne(batch, { session });
      const movement: StockMovement = { actorUserId: input.actorUserId, createdAt: now, householdId: input.householdId, id: `movement:${input.operationId}`, kind: "acquisition", occurrenceAt: batch.acquiredOn, operationId: input.operationId, quantityDelta: batch.originalQuantity, resultingQuantity: batch.remainingQuantity, stockBatchId: batch.id, stockTargetId: null, unit: batch.unit };
      await this.movements.insertOne(movement, { session });
      await this.operations.updateOne({ householdId: input.householdId, id: input.operationId }, { $set: { resultIdentifiers: { batchId, productGroupId: productGroupId ?? "null", productId }, status: "completed", updatedAt: now } }, { session });
      return { batchId, operationId: input.operationId, productGroupId, productId };
    });
  }
}

function slug(value: string): string { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unnamed"; }
