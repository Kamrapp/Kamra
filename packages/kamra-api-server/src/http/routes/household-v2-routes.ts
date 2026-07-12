import type { Db } from "mongodb";
import { json, unauthorized, type AppRoute } from "../app-route-context.js";
import { MongoStockReadRepository } from "../../household/v2/mongo-stock-read-repository.js";
import { MongoStockCommandRepository } from "../../household/v2/mongo-stock-command-repository.js";
import { MongoShoppingNeedRepository } from "../../household/v2/mongo-shopping-need-repository.js";
import { createAdHocShoppingNeed } from "../../household/v2/shopping-needs.js";
import { MongoStockTargetRepository } from "../../household/v2/mongo-stock-target-repository.js";
import { MongoHouseholdProductRepository } from "../../household/v2/mongo-household-product-repository.js";
import { MongoProductGroupReadRepository } from "../../household/v2/mongo-product-group-read-repository.js";
import { MongoProductGroupRepository } from "../../household/v2/mongo-product-group-repository.js";
import { MongoProductComposerRepository } from "../../household/v2/mongo-product-composer-repository.js";
import { MongoHouseholdProductConceptRepository } from "../../household/v2/mongo-household-product-concept-repository.js";
import { FeatureFlagService } from "../../feature-toggles/service.js";
import { MongoFeatureFlagStore } from "../../feature-toggles/mongo-store.js";
import { schemaVersion, type CreateHouseholdProductRequest, type CreateManualStockBatchRequest, type CreateProductGroupRequest, type CreateStockTargetRequest, type ProductGroup, type StockTarget, type TargetPolicy, type TrackingUnit } from "../../household/v2/contracts.js";
import { assertCreateHouseholdProductRequest, assertCreateManualStockBatchRequest, assertCreateProductGroupRequest, assertCreateStockTargetRequest, assertProductGroup, assertTargetPolicy, assertTrackingUnit } from "../../household/v2/validation.js";

export const householdV2WorkspaceRoute: AppRoute = {
  match: (request) => request.method === "GET" && /^\/api\/households\/[^/]+\/stock-workspace$/.test(request.path),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user) return unauthorized("apiErrors.signInRequired");
    const householdId = pathSegment(request.path.match(/^\/api\/households\/([^/]+)\/stock-workspace$/)?.[1]);
    if (!householdId) return json(400, { error: "invalid_household_path" });
    return await withHouseholdDatabase(context, householdId, user.email, async (database) => json(200, {
      productGroupWorkspace: { ...(await new MongoProductGroupReadRepository(database).getWorkspace(householdId, new Date().toISOString().slice(0, 10))), useAbbreviatedUiLabels: (await new FeatureFlagService(new MongoFeatureFlagStore(database)).evaluate("useAbbreviatedUiLabels")).enabled },
      schemaVersion,
      workspace: await new MongoStockReadRepository(database).getWorkspace(householdId, new Date().toISOString().slice(0, 10))
    }));
  }
};

export const householdV2HouseholdProductCollectionRoute: AppRoute = {
  match: (request) => (request.method === "GET" || request.method === "POST") && /^\/api\/households\/[^/]+\/products$/.test(request.path),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user) return unauthorized("apiErrors.signInRequired");
    const householdId = pathSegment(request.path.match(/^\/api\/households\/([^/]+)\/products$/)?.[1]);
    const body = request.method === "POST" ? parseJsonObject(request.bodyText) : null;
    if (!householdId || (request.method === "POST" && !body)) return json(400, { error: "invalid_household_product_request" });
    if (body) {
      try { assertCreateHouseholdProductRequest(body); } catch (error) { return json(400, { error: "invalid_household_product_request", message: error instanceof Error ? error.message : "Household Product request is invalid." }); }
    }
    return await withHouseholdDatabase(context, householdId, user.email, async (database) => {
      const repository = new MongoHouseholdProductRepository(database);
      if (request.method === "GET") return json(200, { products: await repository.list(householdId), schemaVersion });
      const input = body as CreateHouseholdProductRequest;
      const now = new Date().toISOString();
      if (input.productGroupId && !(await new MongoProductGroupRepository(database).get(householdId, input.productGroupId))) return json(404, { error: "product_group_not_found" });
      const product = { ...input, classificationRevision: 0, createdAt: now, createdByUserId: user.email, directAttributes: input.directAttributes ?? [], directConcepts: input.directConcepts ?? [], householdId, id: `household-product:${householdId}:${slug(input.displayName)}`, identitySnapshot: input.identitySnapshot ?? {}, revision: 0, status: "active" as const, updatedAt: now, updatedByUserId: user.email };
      try { return json(201, { product: await repository.create(product), schemaVersion }); } catch (error) { return commandError(error); }
    });
  }
};

export const householdV2HouseholdConceptsRoute: AppRoute = {
  match: (request) => (request.method === "GET" || request.method === "POST") && /^\/api\/households\/[^/]+\/concepts$/.test(request.path),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user) return unauthorized("apiErrors.signInRequired");
    const householdId = pathSegment(request.path.match(/^\/api\/households\/([^/]+)\/concepts$/)?.[1]);
    const body = request.method === "POST" ? parseJsonObject(request.bodyText) : null;
    if (!householdId || (request.method === "POST" && (!body || typeof body["label"] !== "string" || body["label"].trim().length === 0))) return json(400, { error: "invalid_household_concept_request" });
    return await withHouseholdDatabase(context, householdId, user.email, async (database) => {
      const repository = new MongoHouseholdProductConceptRepository(database);
      if (request.method === "GET") return json(200, { concepts: await repository.list(householdId), schemaVersion });
      const label = (body!["label"] as string).trim(); const now = new Date().toISOString(); const key = slug(label);
      try { const concept = await repository.create({ createdAt: now, createdByUserId: user.email, householdId, key, label, revision: 0, status: "active", updatedAt: now, updatedByUserId: user.email }); return json(201, { concept, schemaVersion }); } catch (error) { return commandError(error); }
    });
  }
};

export const householdV2HouseholdProductClassificationRoute: AppRoute = {
  match: (request) => request.method === "PATCH" && /^\/api\/households\/[^/]+\/products\/[^/]+\/classification$/.test(request.path),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user) return unauthorized("apiErrors.signInRequired");
    const match = request.path.match(/^\/api\/households\/([^/]+)\/products\/([^/]+)\/classification$/);
    const householdId = pathSegment(match?.[1]); const productId = pathSegment(match?.[2]); const body = parseJsonObject(request.bodyText);
    if (!householdId || !productId || !body || !Number.isInteger(body["expectedRevision"]) || (body["expectedRevision"] as number) < 0) return json(400, { error: "invalid_household_product_classification_request" });
    try { assertCreateHouseholdProductRequest({ displayName: "classification", identityKind: "manual", directConcepts: body["directConcepts"] ?? [], directAttributes: body["directAttributes"] ?? [] }); } catch (error) { return json(400, { error: "invalid_household_product_classification_request", message: error instanceof Error ? error.message : "Classification request is invalid." }); }
    return await withHouseholdDatabase(context, householdId, user.email, async (database) => {
      try { const product = await new MongoHouseholdProductRepository(database).updateClassification({ directAttributes: body["directAttributes"] as never[], directConcepts: body["directConcepts"] as never[], expectedRevision: body["expectedRevision"] as number, householdId, id: productId, updatedAt: new Date().toISOString(), updatedByUserId: user.email }); return json(200, { product, schemaVersion }); } catch (error) { return commandError(error); }
    });
  }
};

export const householdV2HouseholdProductIdentityRoute: AppRoute = {
  match: (request) => (request.method === "PATCH" || request.method === "DELETE") && /^\/api\/households\/[^/]+\/products\/[^/]+$/.test(request.path),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user) return unauthorized("apiErrors.signInRequired");
    const match = request.path.match(/^\/api\/households\/([^/]+)\/products\/([^/]+)$/); const householdId = pathSegment(match?.[1]); const productId = pathSegment(match?.[2]); const body = parseJsonObject(request.bodyText);
    if (!householdId || !productId || !body || !Number.isInteger(body["expectedRevision"]) || (body["expectedRevision"] as number) < 0) return json(400, { error: "invalid_household_product_identity_request" });
    if (request.method === "DELETE") return await withHouseholdDatabase(context, householdId, user.email, async (database) => { try { return json(200, { result: await new MongoHouseholdProductRepository(database).deleteProduct({ expectedRevision: body["expectedRevision"] as number, householdId, id: productId }), schemaVersion }); } catch (error) { return commandError(error); } });
    if (typeof body["displayName"] !== "string" || body["displayName"].trim().length === 0 || (!!body["identitySnapshot"] && (typeof body["identitySnapshot"] !== "object" || Array.isArray(body["identitySnapshot"])))) return json(400, { error: "invalid_household_product_identity_request" });
    try { assertCreateHouseholdProductRequest({ displayName: body["displayName"], identityKind: "manual", defaultTrackingUnit: body["defaultTrackingUnit"], note: body["note"], productGroupId: body["productGroupId"], targetPolicy: body["targetPolicy"] }); } catch (error) { return json(400, { error: "invalid_household_product_identity_request", message: error instanceof Error ? error.message : "Household Product details are invalid." }); }
    const displayName = body["displayName"] as string;
    return await withHouseholdDatabase(context, householdId, user.email, async (database) => {
      if (body["productGroupId"] && !(await new MongoProductGroupRepository(database).get(householdId, body["productGroupId"] as string))) return json(404, { error: "product_group_not_found" });
      try { const product = await new MongoHouseholdProductRepository(database).updateIdentity({ catalogProductId: typeof body["catalogProductId"] === "string" ? body["catalogProductId"] : undefined, defaultTrackingUnit: body["defaultTrackingUnit"] as never, displayName: displayName.trim(), expectedRevision: body["expectedRevision"] as number, householdId, id: productId, identitySnapshot: body["identitySnapshot"] as never, note: body["note"] as string | null | undefined, productGroupId: body["productGroupId"] as string | null | undefined, targetPolicy: body["targetPolicy"] as TargetPolicy | null | undefined, updatedAt: new Date().toISOString(), updatedByUserId: user.email }); return json(200, { product, schemaVersion }); } catch (error) { return commandError(error); }
    });
  }
};

export const householdV2ProductGroupCollectionRoute: AppRoute = {
  match: (request) => (request.method === "GET" || request.method === "POST") && /^\/api\/households\/[^/]+\/product-groups$/.test(request.path),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request); if (!user) return unauthorized("apiErrors.signInRequired");
    const householdId = pathSegment(request.path.match(/^\/api\/households\/([^/]+)\/product-groups$/)?.[1]); const body = request.method === "POST" ? parseJsonObject(request.bodyText) : null;
    if (!householdId || (request.method === "POST" && !body)) return json(400, { error: "invalid_product_group_request" });
    if (body) { try { assertCreateProductGroupRequest(body); } catch (error) { return json(400, { error: "invalid_product_group_request", message: error instanceof Error ? error.message : "Product Group request is invalid." }); } }
    return await withHouseholdDatabase(context, householdId, user.email, async (database) => {
      const repository = new MongoProductGroupRepository(database);
      if (request.method === "GET") return json(200, { productGroups: await repository.list(householdId), schemaVersion });
      const input = body as CreateProductGroupRequest;
      if (input.targetPolicy && input.targetPolicy.trackingUnit !== input.trackingUnit) return json(400, { error: "product_group_target_unit_mismatch" });
      if (input.parentProductGroupId && !(await repository.get(householdId, input.parentProductGroupId))) return json(404, { error: "parent_product_group_not_found" });
      const now = new Date().toISOString(); const group: ProductGroup = { createdAt: now, createdByUserId: user.email, displayName: input.displayName.trim(), householdId, id: `product-group:${householdId}:${slug(input.displayName)}`, parentProductGroupId: input.parentProductGroupId ?? null, revision: 0, status: "active", targetPolicy: input.targetPolicy ?? null, trackingUnit: input.trackingUnit, updatedAt: now, updatedByUserId: user.email };
      try { assertProductGroup(group); return json(201, { productGroup: await repository.create(group), schemaVersion }); } catch (error) { return commandError(error); }
    });
  }
};

export const householdV2ProductGroupMutationRoute: AppRoute = {
  match: (request) => (request.method === "PATCH" || request.method === "DELETE") && /^\/api\/households\/[^/]+\/product-groups\/[^/]+$/.test(request.path),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request); if (!user) return unauthorized("apiErrors.signInRequired");
    const match = request.path.match(/^\/api\/households\/([^/]+)\/product-groups\/([^/]+)$/); const householdId = pathSegment(match?.[1]); const groupId = pathSegment(match?.[2]); const body = parseJsonObject(request.bodyText);
    if (!householdId || !groupId || !body || !Number.isInteger(body["expectedRevision"])) return json(400, { error: "invalid_product_group_request" });
    if (request.method === "DELETE") return await withHouseholdDatabase(context, householdId, user.email, async (database) => { try { return json(200, { result: await new MongoProductGroupRepository(database).deleteGroup({ expectedRevision: body["expectedRevision"] as number, householdId, id: groupId }), schemaVersion }); } catch (error) { return commandError(error); } });
    if (typeof body["displayName"] !== "string" || typeof body["trackingUnit"] !== "string") return json(400, { error: "invalid_product_group_request" });
    try { assertTrackingUnit(body["trackingUnit"]); if (body["targetPolicy"] !== undefined && body["targetPolicy"] !== null) assertTargetPolicy(body["targetPolicy"]); } catch (error) { return json(400, { error: "invalid_product_group_request", message: error instanceof Error ? error.message : "Product Group request is invalid." }); }
    return await withHouseholdDatabase(context, householdId, user.email, async (database) => {
      const repository = new MongoProductGroupRepository(database); if (body["targetPolicy"] && (body["targetPolicy"] as TargetPolicy).trackingUnit !== body["trackingUnit"]) return json(400, { error: "product_group_target_unit_mismatch" }); if (body["parentProductGroupId"] && !(await repository.get(householdId, body["parentProductGroupId"] as string))) return json(404, { error: "parent_product_group_not_found" });
      try { const group = await repository.update({ displayName: (body["displayName"] as string).trim(), expectedRevision: body["expectedRevision"] as number, householdId, id: groupId, parentProductGroupId: body["parentProductGroupId"] as string | null | undefined, targetPolicy: body["targetPolicy"] as TargetPolicy | null | undefined, trackingUnit: body["trackingUnit"] as ProductGroup["trackingUnit"], updatedAt: new Date().toISOString(), updatedByUserId: user.email }); return json(200, { productGroup: group, schemaVersion }); } catch (error) { return commandError(error); }
    });
  }
};

export const householdV2ProductComposerRoute: AppRoute = {
  match: (request) => request.method === "POST" && /^\/api\/households\/[^/]+\/product-composer$/.test(request.path),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request); if (!user) return unauthorized("apiErrors.signInRequired");
    const householdId = pathSegment(request.path.match(/^\/api\/households\/([^/]+)\/product-composer$/)?.[1]); const body = parseJsonObject(request.bodyText);
    const product = body?.["product"] as Record<string, unknown> | undefined; const batch = body?.["batch"] as Record<string, unknown> | undefined; const group = body?.["group"] as Record<string, unknown> | null | undefined;
    if (!householdId || !body || typeof body["operationId"] !== "string" || typeof body["requestFingerprint"] !== "string" || !product || !batch || typeof product["displayName"] !== "string" || typeof batch["displayName"] !== "string" || typeof batch["acquiredOn"] !== "string" || typeof batch["unit"] !== "string" || typeof batch["originalQuantity"] !== "number") return json(400, { error: "invalid_product_composer_request" });
    try { assertTrackingUnit(batch["unit"]); if (product["defaultTrackingUnit"] !== undefined && product["defaultTrackingUnit"] !== null) assertTrackingUnit(product["defaultTrackingUnit"]); if (product["targetPolicy"] !== undefined && product["targetPolicy"] !== null) { assertTargetPolicy(product["targetPolicy"]); if (product["defaultTrackingUnit"] !== undefined && (product["targetPolicy"] as TargetPolicy).trackingUnit !== product["defaultTrackingUnit"]) throw new Error("product target unit does not match product tracking unit"); } if (group) { if (typeof group["displayName"] !== "string" || typeof group["trackingUnit"] !== "string") throw new Error("group details are invalid"); assertTrackingUnit(group["trackingUnit"]); if (group["targetPolicy"] !== undefined && group["targetPolicy"] !== null) assertTargetPolicy(group["targetPolicy"]); } } catch (error) { return json(400, { error: "invalid_product_composer_request", message: error instanceof Error ? error.message : "Product composer request is invalid." }); }
    if (!Number.isFinite(batch["originalQuantity"]) || (batch["originalQuantity"] as number) <= 0 || !isIsoDate(batch["acquiredOn"]) || (batch["expiryOn"] !== undefined && batch["expiryOn"] !== null && !isIsoDate(batch["expiryOn"]))) return json(400, { error: "invalid_product_composer_request" });
    if (!context.config.mongodb.uri || !context.config.mongodb.databaseName) return json(503, { error: "household_not_configured" });
    const client = await context.getMongoClient(context.config.mongodb.uri, context.config.mongodb.dnsServers); const database = client.db(context.config.mongodb.databaseName);
    const membership = await database.collection<{ householdId: string; status: string; userId: string }>("household_memberships").findOne({ householdId, status: "active", userId: user.email }); if (!membership) return json(403, { error: "household_membership_required" });
    try { const result = await new MongoProductComposerRepository(database, client).createProductWithBatch({ actorUserId: user.email, batch: { acquiredOn: batch["acquiredOn"] as string, displayName: batch["displayName"] as string, expiryOn: batch["expiryOn"] as string | null | undefined, originalQuantity: batch["originalQuantity"] as number, unit: batch["unit"] as TrackingUnit }, group: group ? { displayName: group["displayName"] as string, targetPolicy: group["targetPolicy"] as TargetPolicy | null | undefined, trackingUnit: group["trackingUnit"] as TrackingUnit } : null, householdId, operationId: body["operationId"], product: { defaultTrackingUnit: product["defaultTrackingUnit"] as TrackingUnit | null | undefined, displayName: product["displayName"] as string, note: typeof product["note"] === "string" ? product["note"] : null, productGroupId: typeof product["productGroupId"] === "string" ? product["productGroupId"] : null, targetPolicy: product["targetPolicy"] as TargetPolicy | null | undefined }, requestFingerprint: body["requestFingerprint"] }); return json(201, { result, schemaVersion }); } catch (error) { return commandError(error); }
  }
};

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

export const householdV2StockTargetCollectionRoute: AppRoute = {
  match: (request) => request.method === "POST" && /^\/api\/households\/[^/]+\/stock-targets$/.test(request.path),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user) return unauthorized("apiErrors.signInRequired");
    const householdId = request.path.match(/^\/api\/households\/([^/]+)\/stock-targets$/)?.[1];
    const body = parseJsonObject(request.bodyText);
    if (!householdId || !body) return json(400, { error: "invalid_stock_target_request" });
    try { assertCreateStockTargetRequest(body); } catch (error) { return json(400, { error: "invalid_stock_target_request", message: error instanceof Error ? error.message : "Stock Target request is invalid." }); }
    return await withHouseholdDatabase(context, householdId, user.email, async (database) => {
      const input = body as CreateStockTargetRequest; const now = new Date().toISOString(); const id = `stock-target:${householdId}:${slug(input.displayName)}`;
      try { const target = await new MongoStockTargetRepository(database).create({ ...input, createdAt: now, createdByUserId: user.email, householdId, id, revision: 0, status: "active", updatedAt: now, updatedByUserId: user.email }); return json(201, { schemaVersion, target }); } catch (error) { return commandError(error); }
    });
  }
};

export const householdV2StockTargetMutationRoute: AppRoute = {
  match: (request) => (request.method === "PATCH" || request.method === "POST") && /^\/api\/households\/[^/]+\/stock-targets\/[^/]+(\/archive)?$/.test(request.path),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request); if (!user) return unauthorized("apiErrors.signInRequired");
    const match = request.path.match(/^\/api\/households\/([^/]+)\/stock-targets\/([^/]+)(\/archive)?$/); const householdId = match?.[1]; const id = match?.[2]; const isArchive = Boolean(match?.[3]); const body = parseJsonObject(request.bodyText);
    if (!householdId || !id || !body || !Number.isInteger(body["expectedRevision"]) || (body["expectedRevision"] as number) < 0 || (!isArchive && (!body["patch"] || typeof body["patch"] !== "object" || Array.isArray(body["patch"])))) return json(400, { error: "invalid_stock_target_update_request" });
    return await withHouseholdDatabase(context, householdId, user.email, async (database) => {
      try { const repository = new MongoStockTargetRepository(database); const now = new Date().toISOString(); const target = isArchive ? await repository.archive({ expectedRevision: body["expectedRevision"] as number, householdId, id, updatedAt: now, updatedByUserId: user.email }) : await repository.update({ expectedRevision: body["expectedRevision"] as number, householdId, id, patch: body["patch"] as Partial<Pick<StockTarget, "acceptanceCriteria" | "consumptionPolicy" | "displayName" | "expiryWarningDays" | "minimumQuantity" | "preferredProductId" | "preferredProductNameSnapshot" | "status" | "targetQuantity" | "trackingUnit">>, updatedAt: now, updatedByUserId: user.email }); return json(200, { schemaVersion, target }); } catch (error) { return commandError(error); }
    });
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
      const householdProduct = input.householdProductId ? await new MongoHouseholdProductRepository(database).get(householdId, input.householdProductId) : null;
      if (input.householdProductId && !householdProduct) return json(404, { error: "household_product_not_found" });
      const directAttributes = householdProduct?.directAttributes ?? input.directAttributes ?? [];
      const directConcepts = householdProduct?.directConcepts ?? input.directConcepts ?? [];
      const result = await new MongoStockCommandRepository(database, client).acquireBatch({ batch: { acquiredOn: input.acquiredOn, acquisitionSnapshot: { displayName: householdProduct?.displayName ?? input.displayName }, classificationSnapshot: { capturedAt: now, directAttributes, directConcepts, effectiveConcepts: directConcepts, source: householdProduct ? "household" : "manual" }, createdAt: now, createdByUserId: user.email, expiryOn: input.expiryOn ?? null, householdId, householdProductId: input.householdProductId ?? null, id: batchId, originalQuantity: input.originalQuantity, remainingQuantity: input.originalQuantity, revision: 0, status: "available", unit: input.unit, updatedAt: now, updatedByUserId: user.email }, operationId: input.operationId, requestFingerprint: input.requestFingerprint });
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
    const match = request.path.match(/^\/api\/households\/([^/]+)\/batches\/([^/]+)\/correct$/); const householdId = pathSegment(match?.[1]); const batchId = pathSegment(match?.[2]); const body = parseJsonObject(request.bodyText);
    if (!householdId || !batchId || !body || typeof body["operationId"] !== "string" || typeof body["requestFingerprint"] !== "string" || typeof body["resultingQuantity"] !== "number" || !Number.isFinite(body["resultingQuantity"]) || !Number.isInteger(body["expectedBatchRevision"]) || (body["expectedBatchRevision"] as number) < 0 || (body["acquiredOn"] !== undefined && !isIsoDate(body["acquiredOn"])) || (body["expiryOn"] !== undefined && body["expiryOn"] !== null && !isIsoDate(body["expiryOn"]))) return json(400, { error: "invalid_stock_correction_request" });
    return await runBatchCommand(context, user.email, householdId, batchId, body, "correct");
  }
};

export const householdV2DiscardBatchRoute: AppRoute = {
  match: (request) => request.method === "POST" && /^\/api\/households\/[^/]+\/batches\/[^/]+\/discard$/.test(request.path),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request); if (!user) return unauthorized("apiErrors.signInRequired");
    const match = request.path.match(/^\/api\/households\/([^/]+)\/batches\/([^/]+)\/discard$/); const householdId = pathSegment(match?.[1]); const batchId = pathSegment(match?.[2]); const body = parseJsonObject(request.bodyText);
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
    let adHocUnit: TrackingUnit | undefined;
    if (request.method === "POST") { try { assertTrackingUnit(body!["unit"]); adHocUnit = body!["unit"]; } catch { return json(400, { error: "invalid_shopping_need_unit" }); } }
    if (!context.config.mongodb.uri || !context.config.mongodb.databaseName) return json(503, { error: "household_not_configured" });
    const client = await context.getMongoClient(context.config.mongodb.uri, context.config.mongodb.dnsServers); const database = client.db(context.config.mongodb.databaseName); const membership = await database.collection<{ householdId: string; status: string; userId: string }>("household_memberships").findOne({ householdId, status: "active", userId: user.email });
    if (!membership) return json(403, { error: "household_membership_required" });
    const repository = new MongoShoppingNeedRepository(database); const now = new Date().toISOString();
    try {
      const result = request.method === "GET" ? await repository.getOrCreateList(householdId, user.email, now) : await repository.upsertNeed({ actorUserId: user.email, householdId, need: createAdHocShoppingNeed({ id: body!["needId"] as string, plannedQuantity: body!["plannedQuantity"] as number, unit: adHocUnit! }), now });
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
    const result = command === "correct" ? await repository.correctBatch({ ...common, acquiredOn: typeof body["acquiredOn"] === "string" ? body["acquiredOn"] : undefined, expiryOn: body["expiryOn"] === null || typeof body["expiryOn"] === "string" ? body["expiryOn"] : undefined, resultingQuantity: body["resultingQuantity"] as number, reasonCode: typeof body["reasonCode"] === "string" ? body["reasonCode"] : undefined }) : await repository.discardBatch({ ...common, reasonCode: typeof body["reasonCode"] === "string" ? body["reasonCode"] : undefined });
    return json(200, { result, schemaVersion });
  } catch (error) { return commandError(error); }
}

function parseJsonObject(bodyText: string | undefined): Record<string, unknown> | null { if (!bodyText) return null; try { const value: unknown = JSON.parse(bodyText); return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; } catch { return null; } }
function pathSegment(value: string | undefined): string | undefined { if (!value) return undefined; try { return decodeURIComponent(value); } catch { return undefined; } }
async function withHouseholdDatabase(context: Parameters<AppRoute["handle"]>[1], householdId: string, userId: string, action: (database: Db) => Promise<ReturnType<typeof json>>): Promise<ReturnType<typeof json>> {
  if (!context.config.mongodb.uri || !context.config.mongodb.databaseName) return json(503, { error: "household_not_configured" });
  const client = await context.getMongoClient(context.config.mongodb.uri, context.config.mongodb.dnsServers); const database = client.db(context.config.mongodb.databaseName); const membership = await database.collection<{ householdId: string; status: string; userId: string }>("household_memberships").findOne({ householdId, status: "active", userId }); if (!membership) return json(403, { error: "household_membership_required" }); return await action(database);
}
function slug(value: string): string { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "target"; }
function isIsoDate(value: unknown): value is string { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)); }
function commandError(error: unknown): ReturnType<typeof json> { const code = error instanceof Error ? error.message : "stock_command_failed"; const duplicate = typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === 11000; const status = code === "idempotency_conflict" || code === "operation_in_progress" || code === "stale_revision" || code === "household_concept_already_exists" || duplicate ? 409 : code === "invalid_correction_quantity" ? 400 : code.endsWith("_not_found") ? 404 : 500; return json(status, { error: duplicate ? "household_concept_already_exists" : code }); }
