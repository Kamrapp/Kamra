import { json, unauthorized, type AppRoute } from "../app-route-context.js";
import { MongoStockReadRepository } from "../../household/v2/mongo-stock-read-repository.js";
import { MongoStockCommandRepository } from "../../household/v2/mongo-stock-command-repository.js";
import { schemaVersion, type CreateManualStockBatchRequest } from "../../household/v2/contracts.js";
import { assertCreateManualStockBatchRequest } from "../../household/v2/validation.js";

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

function parseJsonObject(bodyText: string | undefined): Record<string, unknown> | null { if (!bodyText) return null; try { const value: unknown = JSON.parse(bodyText); return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; } catch { return null; } }
function commandError(error: unknown): ReturnType<typeof json> { const code = error instanceof Error ? error.message : "stock_command_failed"; const status = code === "idempotency_conflict" ? 409 : code === "operation_in_progress" ? 409 : 500; return json(status, { error: code }); }
