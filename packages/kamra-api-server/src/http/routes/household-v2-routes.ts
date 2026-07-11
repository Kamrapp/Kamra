import { json, unauthorized, type AppRoute } from "../app-route-context.js";
import { MongoStockReadRepository } from "../../household/v2/mongo-stock-read-repository.js";
import { MongoStockCommandRepository } from "../../household/v2/mongo-stock-command-repository.js";
import { MongoShoppingNeedRepository } from "../../household/v2/mongo-shopping-need-repository.js";
import { createAdHocShoppingNeed } from "../../household/v2/shopping-needs.js";
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

export const householdV2ConsumeRoute: AppRoute = {
  match: (request) => request.method === "POST" && /^\/api\/households\/[^/]+\/stock-targets\/[^/]+\/consume$/.test(request.path),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user) return unauthorized("apiErrors.signInRequired");
    const match = request.path.match(/^\/api\/households\/([^/]+)\/stock-targets\/([^/]+)\/consume$/); const householdId = match?.[1]; const stockTargetId = match?.[2]; const body = parseJsonObject(request.bodyText);
    if (!householdId || !stockTargetId || !body || typeof body["operationId"] !== "string" || typeof body["requestFingerprint"] !== "string" || typeof body["requestedQuantity"] !== "number" || !Number.isFinite(body["requestedQuantity"]) || body["requestedQuantity"] <= 0 || !Number.isInteger(body["expectedTargetRevision"]) || (body["expectedTargetRevision"] as number) < 0) return json(400, { error: "invalid_stock_consumption_request" });
    if (body["selectedBatchIds"] !== undefined && (!Array.isArray(body["selectedBatchIds"]) || !(body["selectedBatchIds"] as unknown[]).every((id) => typeof id === "string"))) return json(400, { error: "invalid_stock_consumption_request" });
    if (!context.config.mongodb.uri || !context.config.mongodb.databaseName) return json(503, { error: "household_not_configured" });
    const client = await context.getMongoClient(context.config.mongodb.uri, context.config.mongodb.dnsServers); const database = client.db(context.config.mongodb.databaseName);
    const membership = await database.collection<{ householdId: string; status: string; userId: string }>("household_memberships").findOne({ householdId, status: "active", userId: user.email });
    if (!membership) return json(403, { error: "household_membership_required" });
    try {
      const result = await new MongoStockCommandRepository(database, client).consume({ actorUserId: user.email, expectedTargetRevision: body["expectedTargetRevision"] as number, householdId, occurredAt: new Date().toISOString(), operationId: body["operationId"], requestFingerprint: body["requestFingerprint"], requestedQuantity: body["requestedQuantity"], selectedBatchIds: body["selectedBatchIds"] as string[] | undefined, stockTargetId });
      return json(200, { result, schemaVersion });
    } catch (error) { return commandError(error); }
  }
};

export const householdV2CorrectBatchRoute: AppRoute = {
  match: (request) => request.method === "POST" && /^\/api\/households\/[^/]+\/batches\/[^/]+\/correct$/.test(request.path),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request); if (!user) return unauthorized("apiErrors.signInRequired");
    const match = request.path.match(/^\/api\/households\/([^/]+)\/batches\/([^/]+)\/correct$/); const householdId = match?.[1]; const batchId = match?.[2]; const body = parseJsonObject(request.bodyText);
    if (!householdId || !batchId || !body || typeof body["operationId"] !== "string" || typeof body["requestFingerprint"] !== "string" || typeof body["resultingQuantity"] !== "number" || !Number.isFinite(body["resultingQuantity"]) || !Number.isInteger(body["expectedBatchRevision"]) || (body["expectedBatchRevision"] as number) < 0) return json(400, { error: "invalid_stock_correction_request" });
    return await runBatchCommand(context, user.email, householdId, batchId, body, "correct");
  }
};

export const householdV2DiscardBatchRoute: AppRoute = {
  match: (request) => request.method === "POST" && /^\/api\/households\/[^/]+\/batches\/[^/]+\/discard$/.test(request.path),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request); if (!user) return unauthorized("apiErrors.signInRequired");
    const match = request.path.match(/^\/api\/households\/([^/]+)\/batches\/([^/]+)\/discard$/); const householdId = match?.[1]; const batchId = match?.[2]; const body = parseJsonObject(request.bodyText);
    if (!householdId || !batchId || !body || typeof body["operationId"] !== "string" || typeof body["requestFingerprint"] !== "string" || !Number.isInteger(body["expectedBatchRevision"]) || (body["expectedBatchRevision"] as number) < 0) return json(400, { error: "invalid_stock_discard_request" });
    return await runBatchCommand(context, user.email, householdId, batchId, body, "discard");
  }
};

export const householdV2ShoppingNeedsRoute: AppRoute = {
  match: (request) => (request.method === "GET" || request.method === "POST") && /^\/api\/households\/[^/]+\/shopping-needs$/.test(request.path),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request); if (!user) return unauthorized("apiErrors.signInRequired");
    const householdId = request.path.match(/^\/api\/households\/([^/]+)\/shopping-needs$/)?.[1]; if (!householdId) return json(400, { error: "invalid_household_path" });
    const body = request.method === "POST" ? parseJsonObject(request.bodyText) : null;
    if (request.method === "POST" && (!body || typeof body["needId"] !== "string" || typeof body["plannedQuantity"] !== "number" || typeof body["unit"] !== "string")) return json(400, { error: "invalid_shopping_need_request" });
    if (!context.config.mongodb.uri || !context.config.mongodb.databaseName) return json(503, { error: "household_not_configured" });
    const client = await context.getMongoClient(context.config.mongodb.uri, context.config.mongodb.dnsServers); const database = client.db(context.config.mongodb.databaseName); const membership = await database.collection<{ householdId: string; status: string; userId: string }>("household_memberships").findOne({ householdId, status: "active", userId: user.email });
    if (!membership) return json(403, { error: "household_membership_required" });
    const repository = new MongoShoppingNeedRepository(database); const now = new Date().toISOString();
    try {
      const result = request.method === "GET" ? await repository.getOrCreateList(householdId, user.email, now) : await repository.upsertNeed({ actorUserId: user.email, householdId, need: createAdHocShoppingNeed({ id: body!["needId"] as string, plannedQuantity: body!["plannedQuantity"] as number, unit: body!["unit"] as never }), now });
      return json(200, { result, schemaVersion });
    } catch (error) { return commandError(error); }
  }
};

export const householdV2ShoppingNeedTransitionRoute: AppRoute = {
  match: (request) => request.method === "PATCH" && /^\/api\/households\/[^/]+\/shopping-needs\/[^/]+$/.test(request.path),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request); if (!user) return unauthorized("apiErrors.signInRequired"); const match = request.path.match(/^\/api\/households\/([^/]+)\/shopping-needs\/([^/]+)$/); const householdId = match?.[1]; const needId = match?.[2]; const body = parseJsonObject(request.bodyText);
    if (!householdId || !needId || !body || (body["state"] !== "open" && body["state"] !== "skipped") || !Number.isInteger(body["expectedRevision"])) return json(400, { error: "invalid_shopping_need_transition" });
    if (!context.config.mongodb.uri || !context.config.mongodb.databaseName) return json(503, { error: "household_not_configured" }); const client = await context.getMongoClient(context.config.mongodb.uri, context.config.mongodb.dnsServers); const database = client.db(context.config.mongodb.databaseName); const membership = await database.collection<{ householdId: string; status: string; userId: string }>("household_memberships").findOne({ householdId, status: "active", userId: user.email }); if (!membership) return json(403, { error: "household_membership_required" });
    try { const result = await new MongoShoppingNeedRepository(database).transitionNeed({ actorUserId: user.email, expectedRevision: body["expectedRevision"] as number, householdId, needId, now: new Date().toISOString(), state: body["state"] }); return json(200, { result, schemaVersion }); } catch (error) { return commandError(error); }
  }
};

async function runBatchCommand(context: Parameters<AppRoute["handle"]>[1], userId: string, householdId: string, batchId: string, body: Record<string, unknown>, command: "correct" | "discard"): Promise<ReturnType<typeof json>> {
  if (!context.config.mongodb.uri || !context.config.mongodb.databaseName) return json(503, { error: "household_not_configured" });
  const client = await context.getMongoClient(context.config.mongodb.uri, context.config.mongodb.dnsServers); const database = client.db(context.config.mongodb.databaseName);
  const membership = await database.collection<{ householdId: string; status: string; userId: string }>("household_memberships").findOne({ householdId, status: "active", userId: userId });
  if (!membership) return json(403, { error: "household_membership_required" });
  try {
    const common = { actorUserId: userId, batchId, householdId, expectedBatchRevision: body["expectedBatchRevision"] as number, occurredAt: new Date().toISOString(), operationId: body["operationId"] as string, requestFingerprint: body["requestFingerprint"] as string };
    const repository = new MongoStockCommandRepository(database, client);
    const result = command === "correct" ? await repository.correctBatch({ ...common, resultingQuantity: body["resultingQuantity"] as number, reasonCode: typeof body["reasonCode"] === "string" ? body["reasonCode"] : undefined }) : await repository.discardBatch({ ...common, reasonCode: typeof body["reasonCode"] === "string" ? body["reasonCode"] : undefined });
    return json(200, { result, schemaVersion });
  } catch (error) { return commandError(error); }
}

function parseJsonObject(bodyText: string | undefined): Record<string, unknown> | null { if (!bodyText) return null; try { const value: unknown = JSON.parse(bodyText); return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; } catch { return null; } }
function commandError(error: unknown): ReturnType<typeof json> { const code = error instanceof Error ? error.message : "stock_command_failed"; const status = code === "idempotency_conflict" ? 409 : code === "operation_in_progress" ? 409 : 500; return json(status, { error: code }); }
