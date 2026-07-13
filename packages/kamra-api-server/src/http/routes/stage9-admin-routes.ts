import { MongoIngestionSubmissionRepository } from "../../household/v2/mongo-ingestion-submission-repository.js";
import { MongoShopMarketRepository } from "../../household/v2/mongo-shop-market-repository.js";
import { MongoShopProductRepository } from "../../household/v2/mongo-shop-product-repository.js";
import { MongoPriceObservationRepository } from "../../household/v2/mongo-price-observation-repository.js";
import type {
  PriceObservationCandidate,
  ShopProductRecord
} from "../../household/v2/stage9-contracts.js";
import type { ShopMarket } from "../../household/v2/contracts.js";
import { json, unauthorized, type AppRoute } from "../app-route-context.js";
import { pageResponse, readApiPageRequest } from "../pagination.js";

export const adminShopMarketsRoute: AppRoute = {
  match: (request) =>
    (request.method === "GET" || request.method === "POST") &&
    request.path === "/api/admin/shop-markets",
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user || user.role !== "admin") return unauthorized("apiErrors.adminRequired");
    const database = await getDatabase(context);
    if (!database) return json(503, { error: "catalog_not_configured" });
    const repository = new MongoShopMarketRepository(database);
    if (request.method === "GET") return json(200, { markets: await repository.list() });
    const body = parseObject(request.bodyText);
    if (
      !body ||
      typeof body["id"] !== "string" ||
      typeof body["displayName"] !== "string" ||
      typeof body["countryCode"] !== "string" ||
      typeof body["currencyCode"] !== "string"
    )
      return json(400, { error: "invalid_shop_market" });
    const now = new Date().toISOString();
    const market: ShopMarket = {
      aliases: Array.isArray(body["aliases"]) ? body["aliases"].filter(isString) : [],
      countryCode: body["countryCode"],
      createdAt: now,
      createdByUserId: user.email,
      currencyCode: body["currencyCode"],
      displayName: body["displayName"].trim(),
      id: body["id"],
      revision: 0,
      status: "active",
      updatedAt: now,
      updatedByUserId: user.email
    };
    try {
      return json(201, { market: await repository.create(market) });
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      return json(409, { error: "shop_market_already_exists" });
    }
  }
};

export const adminIngestionSubmissionsRoute: AppRoute = {
  match: (request) =>
    (request.method === "GET" || request.method === "PATCH") &&
    /^\/api\/admin\/ingestion-submissions(?:\/[^/]+)?$/.test(request.path),
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user || user.role !== "admin") return unauthorized("apiErrors.adminRequired");
    const database = await getDatabase(context);
    if (!database) return json(503, { error: "catalog_not_configured" });
    const repository = new MongoIngestionSubmissionRepository(database);
    if (request.method === "GET") {
      const status = contextualStatus(request.query?.["status"]);
      const page = readApiPageRequest(request.query);
      const result = await repository.listPage(status, page);
      return json(200, {
        pagination: pageResponse(page, result),
        submissions: result.items
      });
    }
    const id = request.path.match(/^\/api\/admin\/ingestion-submissions\/([^/]+)$/)?.[1];
    const body = parseObject(request.bodyText);
    if (
      !id ||
      !body ||
      !Number.isInteger(body["expectedRevision"]) ||
      !isReviewStatus(body["status"])
    )
      return json(400, { error: "invalid_ingestion_review" });
    try {
      return json(200, {
        submission: await repository.review({
          expectedRevision: body["expectedRevision"] as number,
          id: decodeURIComponent(id),
          note: typeof body["note"] === "string" ? body["note"] : null,
          reviewerId: user.email,
          status: body["status"],
          reviewedAt: new Date().toISOString()
        })
      });
    } catch (error) {
      if (isIngestionReviewConflict(error))
        return json(409, {
          error: error.message
        });
      throw error;
    }
  }
};

export const adminShopProductsRoute: AppRoute = {
  match: (request) =>
    (request.method === "GET" || request.method === "POST") &&
    request.path === "/api/admin/shop-products",
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user || user.role !== "admin") return unauthorized("apiErrors.adminRequired");
    const database = await getDatabase(context);
    if (!database) return json(503, { error: "catalog_not_configured" });
    const repository = new MongoShopProductRepository(database);
    if (request.method === "GET") {
      const marketId = queryValue(request.query?.["shopMarketId"]);
      return json(200, {
        products: marketId
          ? await repository.list(marketId, queryValue(request.query?.["name"]))
          : []
      });
    }
    const body = parseObject(request.bodyText);
    if (
      !body ||
      !isString(body["id"]) ||
      !isString(body["productId"]) ||
      !isString(body["shopMarketId"]) ||
      !isString(body["displayName"]) ||
      !isFiniteNumber(body["packageQuantity"]) ||
      !isString(body["packageUnit"])
    )
      return json(400, { error: "invalid_shop_product" });
    const product: ShopProductRecord = {
      id: body["id"],
      productId: body["productId"],
      shopMarketId: body["shopMarketId"],
      displayName: body["displayName"],
      aliases: [],
      packageQuantity: body["packageQuantity"],
      packageUnit: body["packageUnit"] as ShopProductRecord["packageUnit"],
      status: "active"
    };
    try {
      return json(201, { product: await repository.create(product) });
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      return json(409, { error: "shop_product_already_exists" });
    }
  }
};

export const adminPriceObservationsRoute: AppRoute = {
  match: (request) =>
    (request.method === "GET" || request.method === "POST") &&
    request.path === "/api/admin/price-observations",
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user || user.role !== "admin") return unauthorized("apiErrors.adminRequired");
    const database = await getDatabase(context);
    if (!database) return json(503, { error: "catalog_not_configured" });
    const repository = new MongoPriceObservationRepository(database);
    if (request.method === "GET") {
      const shopProductId = queryValue(request.query?.["shopProductId"]);
      return shopProductId
        ? json(200, { observations: await repository.list(shopProductId) })
        : json(400, { error: "shop_product_required" });
    }
    const body = parseObject(request.bodyText);
    if (
      !body ||
      !isString(body["id"]) ||
      !isString(body["shopProductId"]) ||
      !isString(body["currencyCode"]) ||
      !isString(body["kind"]) ||
      !isString(body["observedAt"]) ||
      !isFiniteNumber(body["price"])
    )
      return json(400, { error: "invalid_price_observation" });
    try {
      return json(201, {
        observation: await repository.append(body as unknown as PriceObservationCandidate)
      });
    } catch (error) {
      if (error instanceof Error && error.message === "invalid_price_observation")
        return json(400, { error: "invalid_price_observation" });
      if (isDuplicateKeyError(error))
        return json(409, { error: "price_observation_already_exists" });
      throw error;
    }
  }
};

async function getDatabase(context: Parameters<AppRoute["handle"]>[1]) {
  if (!context.config.mongodb.uri || !context.config.mongodb.databaseName) return null;
  const client = await context.getMongoClient(
    context.config.mongodb.uri,
    context.config.mongodb.dnsServers
  );
  return client.db(context.config.mongodb.databaseName);
}
function parseObject(bodyText: string | undefined): Record<string, unknown> | null {
  if (!bodyText) return null;
  try {
    const value = JSON.parse(bodyText);
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}
function isString(value: unknown): value is string {
  return typeof value === "string";
}
function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}
function isIngestionReviewConflict(error: unknown): error is Error {
  return (
    error instanceof Error &&
    [
      "ingestion_submission_already_reviewed",
      "ingestion_submission_not_found",
      "ingestion_submission_revision_conflict"
    ].includes(error.message)
  );
}
function queryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
function isReviewStatus(value: unknown): value is "accepted" | "corrected" | "rejected" {
  return value === "accepted" || value === "corrected" || value === "rejected";
}
function contextualStatus(
  value: string | string[] | undefined
): "pending" | "accepted" | "corrected" | "rejected" | undefined {
  const status = Array.isArray(value) ? value[0] : value;
  return status === "pending" ||
    status === "accepted" ||
    status === "corrected" ||
    status === "rejected"
    ? status
    : undefined;
}
