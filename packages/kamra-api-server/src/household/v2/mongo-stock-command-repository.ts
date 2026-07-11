import type { MongoCollectionLike, MongoDatabaseLike, MongoTransactionClientLike } from "../../db/mongo-like.js";
import { runMongoTransaction } from "../../db/mongo-transaction.js";
import type { DomainOperation, StockBatch, StockMovement } from "./contracts.js";

interface BatchAcquisitionInput {
  batch: StockBatch;
  operationId: string;
  requestFingerprint: string;
}

interface CommandResult { batchId: string; operationId: string; }

export class MongoStockCommandRepository {
  private readonly batches: MongoCollectionLike<StockBatch>;
  private readonly movements: MongoCollectionLike<StockMovement>;
  private readonly operations: MongoCollectionLike<DomainOperation>;

  constructor(private readonly database: MongoDatabaseLike, private readonly transactionClient: MongoTransactionClientLike) {
    this.batches = database.collection("household_stock_batches");
    this.movements = database.collection("household_stock_movements");
    this.operations = database.collection("household_domain_operations");
  }

  async setupCollections(): Promise<void> {
    await Promise.all([
      this.operations.createIndex({ householdId: 1, id: 1 }, { name: "household_domain_operations_household_id_unique", unique: true }),
      this.operations.createIndex({ householdId: 1, requestFingerprint: 1 }, { name: "household_domain_operations_household_fingerprint" }),
      this.movements.createIndex({ operationId: 1 }, { name: "household_stock_movements_operation_unique", unique: true })
    ]);
  }

  async acquireBatch(input: BatchAcquisitionInput): Promise<CommandResult> {
    return await runMongoTransaction(this.transactionClient, async (session) => {
      const existing = await this.operations.findOne({ householdId: input.batch.householdId, id: input.operationId }, { session });
      if (existing) {
        if (existing.requestFingerprint !== input.requestFingerprint) throw new Error("idempotency_conflict");
        if (existing.status === "completed" && existing.resultIdentifiers?.["batchId"]) return { batchId: existing.resultIdentifiers["batchId"], operationId: input.operationId };
        throw new Error("operation_in_progress");
      }
      const now = input.batch.updatedAt;
      const operation: DomainOperation = { actorUserId: input.batch.updatedByUserId, createdAt: now, householdId: input.batch.householdId, id: input.operationId, operationType: "stock_batch.acquire", requestFingerprint: input.requestFingerprint, status: "started", updatedAt: now };
      await this.operations.insertOne(operation, { session });
      await this.batches.insertOne(input.batch, { session });
      const movement: StockMovement = { actorUserId: input.batch.updatedByUserId, createdAt: now, householdId: input.batch.householdId, id: `movement:${input.operationId}`, kind: "acquisition", occurrenceAt: input.batch.acquiredOn, operationId: input.operationId, quantityDelta: input.batch.originalQuantity, resultingQuantity: input.batch.remainingQuantity, stockBatchId: input.batch.id, unit: input.batch.unit };
      await this.movements.insertOne(movement, { session });
      await this.operations.updateOne({ householdId: input.batch.householdId, id: input.operationId }, { $set: { resultIdentifiers: { batchId: input.batch.id }, status: "completed", updatedAt: now } }, { session });
      return { batchId: input.batch.id, operationId: input.operationId };
    });
  }
}
