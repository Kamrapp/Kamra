import { MongoIngestionSubmissionRepository } from "../../household/v2/mongo-ingestion-submission-repository.js";
import { MongoShopMarketRepository } from "../../household/v2/mongo-shop-market-repository.js";
import type { ShopMarket } from "../../household/v2/contracts.js";
import { json, unauthorized, type AppRoute } from "../app-route-context.js";

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
    } catch {
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
      return json(200, { submissions: await repository.list(status) });
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
      return json(409, {
        error: error instanceof Error ? error.message : "ingestion_review_failed"
      });
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
