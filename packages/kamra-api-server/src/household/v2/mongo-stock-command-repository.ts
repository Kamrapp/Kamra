import type { MongoCollectionLike, MongoDatabaseLike, MongoTransactionClientLike } from "../../db/mongo-like.js";
import { runMongoTransaction } from "../../db/mongo-transaction.js";
import type { DomainOperation, StockAllocation, StockBatch, StockMovement, StockTarget } from "./contracts.js";
import { areUnitsCompatible, matchAcceptanceCriteria, planConsumption } from "./domain.js";

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
  private readonly allocations: MongoCollectionLike<StockAllocation>;
  private readonly targets: MongoCollectionLike<StockTarget>;
  private readonly households: MongoCollectionLike<{ id: string; allowExpiredItems?: boolean | null }>;

  constructor(private readonly database: MongoDatabaseLike, private readonly transactionClient: MongoTransactionClientLike) {
    this.batches = database.collection("household_stock_batches");
    this.movements = database.collection("household_stock_movements");
    this.operations = database.collection("household_domain_operations");
    this.allocations = database.collection("household_stock_allocations");
    this.targets = database.collection("household_stock_targets");
    this.households = database.collection("households");
  }

  async setupCollections(): Promise<void> {
    await Promise.all([
      this.operations.createIndex({ householdId: 1, id: 1 }, { name: "household_domain_operations_household_id_unique", unique: true }),
      this.operations.createIndex({ householdId: 1, requestFingerprint: 1 }, { name: "household_domain_operations_household_fingerprint" }),
      this.movements.createIndex({ operationId: 1 }, { name: "household_stock_movements_operation_unique", unique: true })
    ]);
  }

  async allocateBatch(input: { allocation: StockAllocation; operationId: string; requestFingerprint: string }): Promise<{ allocationId: string; operationId: string }> {
    return await runMongoTransaction(this.transactionClient, async (session) => {
      const { allocation } = input;
      const existing = await this.operations.findOne({ householdId: allocation.householdId, id: input.operationId }, { session });
      if (existing) {
        if (existing.requestFingerprint !== input.requestFingerprint) throw new Error("idempotency_conflict");
        if (existing.status === "completed" && existing.resultIdentifiers?.["allocationId"]) return { allocationId: existing.resultIdentifiers["allocationId"], operationId: input.operationId };
        throw new Error("operation_in_progress");
      }
      const batch = await this.batches.findOne({ householdId: allocation.householdId, id: allocation.stockBatchId }, { session });
      const target = await this.targets.findOne({ householdId: allocation.householdId, id: allocation.stockTargetId }, { session });
      if (!batch || !target) throw new Error("stock_resource_not_found");
      if (batch.status !== "available") throw new Error("stock_batch_not_available");
      if (!areUnitsCompatible(batch.unit, target.trackingUnit) || !areUnitsCompatible(allocation.unit, target.trackingUnit)) throw new Error("incompatible_tracking_unit");
      if (allocation.allocatedQuantity !== batch.remainingQuantity) throw new Error("allocation_must_cover_full_batch");
      const activeAllocation = await this.allocations.findOne({ householdId: allocation.householdId, stockBatchId: allocation.stockBatchId, status: "active" }, { session });
      if (activeAllocation) throw new Error("active_allocation_exists");
      const match = matchAcceptanceCriteria(target.acceptanceCriteria, batch.classificationSnapshot);
      if (!match.accepted && allocation.acceptanceResult !== "overridden") throw new Error("stock_batch_does_not_match_criteria");
      const now = batch.updatedAt;
      await this.operations.insertOne({ actorUserId: allocation.updatedByUserId, createdAt: now, householdId: allocation.householdId, id: input.operationId, operationType: "stock_batch.allocate", requestFingerprint: input.requestFingerprint, status: "started", updatedAt: now }, { session });
      await this.allocations.insertOne(allocation, { session });
      await this.operations.updateOne({ householdId: allocation.householdId, id: input.operationId }, { $set: { resultIdentifiers: { allocationId: allocation.id }, status: "completed", updatedAt: now } }, { session });
      return { allocationId: allocation.id, operationId: input.operationId };
    });
  }

  async consume(input: { householdId: string; operationId: string; requestFingerprint: string; requestedQuantity: number; stockTargetId: string; expectedTargetRevision: number; selectedBatchIds?: readonly string[]; actorUserId: string; occurredAt: string }): Promise<{ operationId: string; consumedQuantity: number }> {
    return await runMongoTransaction(this.transactionClient, async (session) => {
      const existing = await this.operations.findOne({ householdId: input.householdId, id: input.operationId }, { session });
      if (existing) {
        if (existing.requestFingerprint !== input.requestFingerprint) throw new Error("idempotency_conflict");
        if (existing.status === "completed") return { operationId: input.operationId, consumedQuantity: input.requestedQuantity };
        throw new Error("operation_in_progress");
      }
      const target = await this.targets.findOne({ householdId: input.householdId, id: input.stockTargetId }, { session });
      if (!target) throw new Error("stock_target_not_found");
      if (target.revision !== input.expectedTargetRevision) throw new Error("stale_revision");
      const allocations = await this.allocations.find({ householdId: input.householdId, stockTargetId: target.id, status: "active" }, { session }).toArray();
      const batches = (await Promise.all(allocations.map((allocation) => this.batches.findOne({ householdId: input.householdId, id: allocation.stockBatchId }, { session })))).filter((batch): batch is StockBatch => Boolean(batch));
      const household = await this.households.findOne({ id: input.householdId }, { session });
      const plan = planConsumption(target, batches, allocations, input.requestedQuantity, input.selectedBatchIds, household?.allowExpiredItems ?? true, input.occurredAt.slice(0, 10));
      await this.operations.insertOne({ actorUserId: input.actorUserId, createdAt: input.occurredAt, householdId: input.householdId, id: input.operationId, operationType: "stock_target.consume", requestFingerprint: input.requestFingerprint, status: "started", updatedAt: input.occurredAt }, { session });
      for (const line of plan) {
        const batch = batches.find((candidate) => candidate.id === line.batchId)!;
        const remainingQuantity = batch.remainingQuantity - line.quantity;
        await this.batches.updateOne({ householdId: input.householdId, id: batch.id, revision: batch.revision }, { $set: { remainingQuantity, revision: batch.revision + 1, status: remainingQuantity === 0 ? "depleted" : "available", updatedAt: input.occurredAt, updatedByUserId: input.actorUserId } }, { session });
        const allocation = allocations.find((candidate) => candidate.stockBatchId === batch.id)!;
        await this.allocations.updateOne({ householdId: input.householdId, id: allocation.id, revision: allocation.revision }, { $set: { allocatedQuantity: allocation.allocatedQuantity - line.quantity, revision: allocation.revision + 1, updatedAt: input.occurredAt, updatedByUserId: input.actorUserId } }, { session });
        await this.movements.insertOne({ actorUserId: input.actorUserId, createdAt: input.occurredAt, householdId: input.householdId, id: `movement:${input.operationId}:${batch.id}`, kind: "consumption", occurrenceAt: input.occurredAt, operationId: input.operationId, quantityDelta: -line.quantity, resultingQuantity: remainingQuantity, stockBatchId: batch.id, stockTargetId: target.id, unit: line.unit }, { session });
      }
      await this.targets.updateOne({ householdId: input.householdId, id: target.id, revision: input.expectedTargetRevision }, { $set: { revision: target.revision + 1, updatedAt: input.occurredAt, updatedByUserId: input.actorUserId } }, { session });
      await this.operations.updateOne({ householdId: input.householdId, id: input.operationId }, { $set: { resultIdentifiers: { stockTargetId: target.id }, status: "completed", updatedAt: input.occurredAt } }, { session });
      return { consumedQuantity: input.requestedQuantity, operationId: input.operationId };
    });
  }

  async correctBatch(input: { acquiredOn?: string; batchId: string; expiryOn?: string | null; householdId: string; operationId: string; requestFingerprint: string; resultingQuantity: number; expectedBatchRevision: number; actorUserId: string; occurredAt: string; reasonCode?: string }): Promise<{ batchId: string; operationId: string }> {
    return await runMongoTransaction(this.transactionClient, async (session) => {
      const existing = await this.operations.findOne({ householdId: input.householdId, id: input.operationId }, { session });
      if (existing) {
        if (existing.requestFingerprint !== input.requestFingerprint) throw new Error("idempotency_conflict");
        if (existing.status === "completed") return { batchId: input.batchId, operationId: input.operationId };
        throw new Error("operation_in_progress");
      }
      const batch = await this.batches.findOne({ householdId: input.householdId, id: input.batchId }, { session });
      if (!batch) throw new Error("stock_batch_not_found");
      if (batch.revision !== input.expectedBatchRevision) throw new Error("stale_revision");
      if (!Number.isFinite(input.resultingQuantity) || input.resultingQuantity < 0) throw new Error("invalid_correction_quantity");
      const allocation = await this.allocations.findOne({ householdId: input.householdId, stockBatchId: batch.id, status: "active" }, { session });
      const delta = input.resultingQuantity - batch.remainingQuantity;
      const now = input.occurredAt;
      await this.operations.insertOne({ actorUserId: input.actorUserId, createdAt: now, householdId: input.householdId, id: input.operationId, operationType: "stock_batch.correct", requestFingerprint: input.requestFingerprint, status: "started", updatedAt: now }, { session });
      const acquiredOn = input.acquiredOn ?? batch.acquiredOn;
      const expiryOn: string | null = input.expiryOn === undefined ? batch.expiryOn ?? null : input.expiryOn;
      await this.batches.updateOne({ householdId: input.householdId, id: batch.id, revision: batch.revision }, { $set: { acquiredOn, expiryOn, remainingQuantity: input.resultingQuantity, revision: batch.revision + 1, status: input.resultingQuantity === 0 ? "depleted" : "available", updatedAt: now, updatedByUserId: input.actorUserId } }, { session });
      if (allocation) await this.allocations.updateOne({ householdId: input.householdId, id: allocation.id, revision: allocation.revision }, { $set: { allocatedQuantity: input.resultingQuantity, revision: allocation.revision + 1, updatedAt: now, updatedByUserId: input.actorUserId } }, { session });
      await this.movements.insertOne({ actorUserId: input.actorUserId, createdAt: now, householdId: input.householdId, id: `movement:${input.operationId}`, kind: "correction", occurrenceAt: now, operationId: input.operationId, quantityDelta: delta, reasonCode: input.reasonCode, resultingQuantity: input.resultingQuantity, stockBatchId: batch.id, stockTargetId: allocation?.stockTargetId, unit: batch.unit }, { session });
      await this.operations.updateOne({ householdId: input.householdId, id: input.operationId }, { $set: { resultIdentifiers: { batchId: batch.id }, status: "completed", updatedAt: now } }, { session });
      return { batchId: batch.id, operationId: input.operationId };
    });
  }

  async discardBatch(input: { batchId: string; householdId: string; operationId: string; requestFingerprint: string; expectedBatchRevision: number; actorUserId: string; occurredAt: string; reasonCode?: string }): Promise<{ batchId: string; operationId: string }> {
    return await runMongoTransaction(this.transactionClient, async (session) => {
      const existing = await this.operations.findOne({ householdId: input.householdId, id: input.operationId }, { session });
      if (existing) {
        if (existing.requestFingerprint !== input.requestFingerprint) throw new Error("idempotency_conflict");
        if (existing.status === "completed") return { batchId: input.batchId, operationId: input.operationId };
        throw new Error("operation_in_progress");
      }
      const batch = await this.batches.findOne({ householdId: input.householdId, id: input.batchId }, { session });
      if (!batch) throw new Error("stock_batch_not_found");
      if (batch.revision !== input.expectedBatchRevision) throw new Error("stale_revision");
      if (batch.status !== "available") throw new Error("stock_batch_not_available");
      const allocation = await this.allocations.findOne({ householdId: input.householdId, stockBatchId: batch.id, status: "active" }, { session });
      const now = input.occurredAt;
      await this.operations.insertOne({ actorUserId: input.actorUserId, createdAt: now, householdId: input.householdId, id: input.operationId, operationType: "stock_batch.discard", requestFingerprint: input.requestFingerprint, status: "started", updatedAt: now }, { session });
      await this.batches.updateOne({ householdId: input.householdId, id: batch.id, revision: batch.revision }, { $set: { discardedAt: now, remainingQuantity: 0, revision: batch.revision + 1, status: "discarded", updatedAt: now, updatedByUserId: input.actorUserId } }, { session });
      if (allocation) await this.allocations.updateOne({ householdId: input.householdId, id: allocation.id, revision: allocation.revision }, { $set: { allocatedQuantity: 0, revision: allocation.revision + 1, status: "released", updatedAt: now, updatedByUserId: input.actorUserId } }, { session });
      await this.movements.insertOne({ actorUserId: input.actorUserId, createdAt: now, householdId: input.householdId, id: `movement:${input.operationId}`, kind: "discard", occurrenceAt: now, operationId: input.operationId, quantityDelta: -batch.remainingQuantity, reasonCode: input.reasonCode, resultingQuantity: 0, stockBatchId: batch.id, stockTargetId: allocation?.stockTargetId, unit: batch.unit }, { session });
      await this.operations.updateOne({ householdId: input.householdId, id: input.operationId }, { $set: { resultIdentifiers: { batchId: batch.id }, status: "completed", updatedAt: now } }, { session });
      return { batchId: batch.id, operationId: input.operationId };
    });
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
