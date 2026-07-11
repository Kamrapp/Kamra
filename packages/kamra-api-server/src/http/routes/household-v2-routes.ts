import { json, unauthorized, type AppRoute } from "../app-route-context.js";
import { MongoStockReadRepository } from "../../household/v2/mongo-stock-read-repository.js";
import { schemaVersion } from "../../household/v2/contracts.js";

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
