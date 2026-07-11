import { json, unauthorized, type AppRoute } from "../app-route-context.js";
import { MongoStockReadRepository } from "../../household/v2/mongo-stock-read-repository.js";
import { MongoStockCommandRepository } from "../../household/v2/mongo-stock-command-repository.js";
import { schemaVersion, type CreateManualStockBatchRequest } from "../../household/v2/contracts.js";
import { assertCreateManualStockBatchRequest, assertTrackingUnit } from "../../household/v2/validation.js";

export const householdV2StockTargetRoute: AppRoute = {
  match: (request) => request.method === "GET" && /^\/api\/households\/[^/]+\/stock-targets\/[^/]+$/.test(request.path),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user) return unauthorized("apiErrors.signInRequired");
    const match = request.path.match(/^\/api\/households\/([^/]+)\/stock-targets\/([^/]+)$/);
    const householdId = match?.[1];
    const targetId = match?.[2];
    if (!householdId || !targetId) return json(400, { error: "invalid_stock_target_path" });
    if (!context.config.mongodb.uri || !context.config.mongodb.databaseName) return json(503, { error: "household_not_configured" });
    const client = await context.getMongoClient(context.config.mongodb.uri, context.config.mongodb.dnsServers);
    const database = client.db(context.config.mongodb.databaseName);
    const membership = await database.collection<{ householdId: string; status: string; userId: string }>("household_memberships").findOne({ householdId, status: "active", userId: user.email });
    if (!membership) return json(403, { error: "household_membership_required" });
    const result = await new MongoStockReadRepository(database).getTarget(householdId, targetId, new Date().toISOString().slice(0, 10));
    return result ? json(200, { schemaVersion, ...result }) : json(404, { error: "stock_target_not_found" });
  }
};

export const householdV2ManualBatchRoute: AppRoute = {
  match: (request) => request.method === "POST" && /^\/api\/households\/[^/]+\/batches$/.test(request.path),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user) return unauthorized("apiErrors.signInRequired");
    const householdId = request.path.match(/^\/api\/households\/([^/]+)\/batches$/)?.[1];
    if (!householdId) return json(400, { error: "invalid_household_path" });
    const body = parseJsonObject(request.bodyText);
    if (!body) return json(400, { error: "invalid_json_body" });
    try { assertCreateManualStockBatchRequest(body); } catch (error) { return json(400, { error: "invalid_stock_batch_request", message: error instanceof Error ? error.message : "Stock Batch request is invalid." }); }
    if (!context.config.mongodb.uri || !context.config.mongodb.databaseName) return json(503, { error: "household_not_configured" });
    const client = await context.getMongoClient(context.config.mongodb.uri, context.config.mongodb.dnsServers);
    const database = client.db(context.config.mongodb.databaseName);
    const membership = await database.collection<{ householdId: string; status: string; userId: string }>("household_memberships").findOne({ householdId, status: "active", userId: user.email });
    if (!membership) return json(403, { error: "household_membership_required" });
    const now = new Date().toISOString();
    const input = body as CreateManualStockBatchRequest;
    const batchId = `stock-batch:${input.operationId}`;
    try {
      const result = await new MongoStockCommandRepository(database, client).acquireBatch({ batch: { acquiredOn: input.acquiredOn, acquisitionSnapshot: { displayName: input.displayName }, classificationSnapshot: { capturedAt: now, directAttributes: input.directAttributes ?? [], directConcepts: input.directConcepts ?? [], effectiveConcepts: input.directConcepts ?? [], source: "manual" }, createdAt: now, createdByUserId: user.email, expiryOn: input.expiryOn ?? null, householdId, id: batchId, originalQuantity: input.originalQuantity, remainingQuantity: input.originalQuantity, revision: 0, status: "available", unit: input.unit, updatedAt: now, updatedByUserId: user.email }, operationId: input.operationId, requestFingerprint: input.requestFingerprint });
      return json(201, { result, schemaVersion });
    } catch (error) { return commandError(error); }
  }
};

export const householdV2AllocateBatchRoute: AppRoute = {
  match: (request) => request.method === "POST" && /^\/api\/households\/[^/]+\/batches\/[^/]+\/allocate$/.test(request.path),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user) return unauthorized("apiErrors.signInRequired");
    const match = request.path.match(/^\/api\/households\/([^/]+)\/batches\/([^/]+)\/allocate$/);
    const householdId = match?.[1]; const batchId = match?.[2];
    const body = parseJsonObject(request.bodyText);
    if (!householdId || !batchId || !body || typeof body["operationId"] !== "string" || typeof body["requestFingerprint"] !== "string" || typeof body["stockTargetId"] !== "string") return json(400, { error: "invalid_stock_allocation_request" });
    if (!context.config.mongodb.uri || !context.config.mongodb.databaseName) return json(503, { error: "household_not_configured" });
    const client = await context.getMongoClient(context.config.mongodb.uri, context.config.mongodb.dnsServers); const database = client.db(context.config.mongodb.databaseName);
    const membership = await database.collection<{ householdId: string; status: string; userId: string }>("household_memberships").findOne({ householdId, status: "active", userId: user.email });
    if (!membership) return json(403, { error: "household_membership_required" });
    const batch = await database.collection<{ id: string; householdId: string; remainingQuantity: number; revision: number; unit: string; status: string }>("household_stock_batches").findOne({ householdId, id: batchId });
    if (!batch) return json(404, { error: "stock_batch_not_found" });
    try { assertTrackingUnit(batch.unit); } catch { return json(500, { error: "stored_stock_batch_unit_invalid" }); }
    if (body["acceptanceResult"] === "overridden" && (typeof body["overrideReason"] !== "string" || body["overrideReason"].trim().length === 0 || body["overrideReason"].length > 300)) return json(400, { error: "invalid_stock_allocation_override_reason" });
    try {
      const now = new Date().toISOString();
      const result = await new MongoStockCommandRepository(database, client).allocateBatch({ allocation: { acceptanceResult: body["acceptanceResult"] === "overridden" ? "overridden" : "accepted", allocatedQuantity: batch.remainingQuantity, createdAt: now, createdByUserId: user.email, householdId, id: `stock-allocation:${body["operationId"]}`, overrideReason: typeof body["overrideReason"] === "string" ? body["overrideReason"].trim() : null, revision: 0, status: "active", stockBatchId: batchId, stockTargetId: body["stockTargetId"], unit: batch.unit, updatedAt: now, updatedByUserId: user.email }, operationId: body["operationId"], requestFingerprint: body["requestFingerprint"] });
      return json(201, { result, schemaVersion });
    } catch (error) { return commandError(error); }
  }
};

function parseJsonObject(bodyText: string | undefined): Record<string, unknown> | null { if (!bodyText) return null; try { const value: unknown = JSON.parse(bodyText); return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; } catch { return null; } }
function commandError(error: unknown): ReturnType<typeof json> { const code = error instanceof Error ? error.message : "stock_command_failed"; const status = code === "idempotency_conflict" ? 409 : code === "operation_in_progress" ? 409 : 500; return json(status, { error: code }); }
