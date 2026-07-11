import { describe, expect, it } from "vitest";
import { createFakeDb, FakeCollection } from "../../test-support/fake-mongo.js";
import type { MongoTransactionClientLike } from "../../db/mongo-like.js";
import { MongoStockCommandRepository } from "./mongo-stock-command-repository.js";
import type { StockAllocation, StockBatch, StockTarget } from "./contracts.js";

const batch: StockBatch = { acquiredOn: "2026-07-11", acquisitionSnapshot: { displayName: "Milk" }, classificationSnapshot: { capturedAt: "2026-07-11T00:00:00.000Z", directAttributes: [], directConcepts: [], effectiveConcepts: [], source: "manual" }, createdAt: "2026-07-11T00:00:00.000Z", createdByUserId: "u", expiryOn: null, householdId: "h", id: "batch-1", originalQuantity: 2, remainingQuantity: 2, revision: 0, status: "available", unit: "l", updatedAt: "2026-07-11T00:00:00.000Z", updatedByUserId: "u" };
const transactionClient: MongoTransactionClientLike = { startSession: () => ({ abortTransaction: async () => undefined, commitTransaction: async () => undefined, endSession: async () => undefined, startTransaction: () => undefined }) };
const target: StockTarget = { acceptanceCriteria: { acceptedAttributesAny: [], acceptedConceptsAny: [], excludedAttributesAny: [], requiredAttributesAll: [], requiredConceptsAll: [] }, consumptionPolicy: "earliest_expiry_first", createdAt: batch.createdAt, createdByUserId: "u", displayName: "Milk", expiryWarningDays: 0, householdId: "h", id: "target-1", minimumQuantity: 1, revision: 0, status: "active", targetQuantity: 2, trackingUnit: "l", updatedAt: batch.updatedAt, updatedByUserId: "u" };

describe("MongoStockCommandRepository", () => {
  it("acquires a batch with one movement and replays an identical retry", async () => {
    const db = createFakeDb(); const repository = new MongoStockCommandRepository(db, transactionClient); await repository.setupCollections();
    const input = { batch, operationId: "op-1", requestFingerprint: "fingerprint" };
    expect(await repository.acquireBatch(input)).toEqual({ batchId: "batch-1", operationId: "op-1" });
    expect(await repository.acquireBatch(input)).toEqual({ batchId: "batch-1", operationId: "op-1" });
    expect(db.__collections["household_stock_batches"]!.docs).toHaveLength(1); expect(db.__collections["household_stock_movements"]!.docs).toHaveLength(1);
    await expect(repository.acquireBatch({ ...input, requestFingerprint: "different" })).rejects.toThrow("idempotency_conflict");
  });

  it("allocates a full batch once and rejects a second active allocation", async () => {
    const db = createFakeDb({ household_stock_targets: new FakeCollection<Record<string, unknown>>("household_stock_targets", [target as unknown as Record<string, unknown>]) }); const repository = new MongoStockCommandRepository(db, transactionClient);
    await repository.acquireBatch({ batch, operationId: "op-acquire", requestFingerprint: "acquire" });
    const allocation: StockAllocation = { acceptanceResult: "accepted", allocatedQuantity: 2, createdAt: batch.createdAt, createdByUserId: "u", householdId: "h", id: "allocation-1", revision: 0, status: "active", stockBatchId: batch.id, stockTargetId: target.id, unit: "l", updatedAt: batch.updatedAt, updatedByUserId: "u" };
    expect(await repository.allocateBatch({ allocation, operationId: "op-allocate", requestFingerprint: "allocate" })).toEqual({ allocationId: "allocation-1", operationId: "op-allocate" });
    await expect(repository.allocateBatch({ allocation: { ...allocation, id: "allocation-2" }, operationId: "op-allocate-2", requestFingerprint: "allocate-2" })).rejects.toThrow("active_allocation_exists");
  });

  it("consumes across allocated batches and records movements", async () => {
    const db = createFakeDb({ household_stock_targets: new FakeCollection<Record<string, unknown>>("household_stock_targets", [target as unknown as Record<string, unknown>]) }); const repository = new MongoStockCommandRepository(db, transactionClient);
    await repository.acquireBatch({ batch, operationId: "op-acquire", requestFingerprint: "acquire" });
    const allocation: StockAllocation = { acceptanceResult: "accepted", allocatedQuantity: 2, createdAt: batch.createdAt, createdByUserId: "u", householdId: "h", id: "allocation-1", revision: 0, status: "active", stockBatchId: batch.id, stockTargetId: target.id, unit: "l", updatedAt: batch.updatedAt, updatedByUserId: "u" };
    await repository.allocateBatch({ allocation, operationId: "op-allocate", requestFingerprint: "allocate" });
    expect(await repository.consume({ actorUserId: "u", expectedTargetRevision: 0, householdId: "h", occurredAt: batch.updatedAt, operationId: "op-consume", requestFingerprint: "consume", requestedQuantity: 1, stockTargetId: target.id })).toEqual({ consumedQuantity: 1, operationId: "op-consume" });
    expect(db.__collections["household_stock_batches"]!.docs[0]).toMatchObject({ remainingQuantity: 1, status: "available", revision: 1 });
    expect(db.__collections["household_stock_movements"]!.docs).toHaveLength(2);
    await expect(repository.consume({ actorUserId: "u", expectedTargetRevision: 0, householdId: "h", occurredAt: batch.updatedAt, operationId: "op-stale", requestFingerprint: "stale", requestedQuantity: 1, stockTargetId: target.id })).rejects.toThrow("stale_revision");
  });
});
