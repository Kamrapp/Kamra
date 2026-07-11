import { describe, expect, it } from "vitest";
import { createFakeDb } from "../../test-support/fake-mongo.js";
import type { MongoTransactionClientLike } from "../../db/mongo-like.js";
import { MongoStockCommandRepository } from "./mongo-stock-command-repository.js";
import type { StockBatch } from "./contracts.js";

const batch: StockBatch = { acquiredOn: "2026-07-11", acquisitionSnapshot: { displayName: "Milk" }, classificationSnapshot: { capturedAt: "2026-07-11T00:00:00.000Z", directAttributes: [], directConcepts: [], effectiveConcepts: [], source: "manual" }, createdAt: "2026-07-11T00:00:00.000Z", createdByUserId: "u", expiryOn: null, householdId: "h", id: "batch-1", originalQuantity: 2, remainingQuantity: 2, revision: 0, status: "available", unit: "l", updatedAt: "2026-07-11T00:00:00.000Z", updatedByUserId: "u" };
const transactionClient: MongoTransactionClientLike = { startSession: () => ({ abortTransaction: async () => undefined, commitTransaction: async () => undefined, endSession: async () => undefined, startTransaction: () => undefined }) };

describe("MongoStockCommandRepository", () => {
  it("acquires a batch with one movement and replays an identical retry", async () => {
    const db = createFakeDb(); const repository = new MongoStockCommandRepository(db, transactionClient); await repository.setupCollections();
    const input = { batch, operationId: "op-1", requestFingerprint: "fingerprint" };
    expect(await repository.acquireBatch(input)).toEqual({ batchId: "batch-1", operationId: "op-1" });
    expect(await repository.acquireBatch(input)).toEqual({ batchId: "batch-1", operationId: "op-1" });
    expect(db.__collections["household_stock_batches"]!.docs).toHaveLength(1); expect(db.__collections["household_stock_movements"]!.docs).toHaveLength(1);
    await expect(repository.acquireBatch({ ...input, requestFingerprint: "different" })).rejects.toThrow("idempotency_conflict");
  });
});
