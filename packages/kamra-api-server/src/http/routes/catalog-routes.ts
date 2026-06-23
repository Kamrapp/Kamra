import {
  createDefaultCatalogRepository,
  json,
  unauthorized,
  type AppRoute
} from "../app-route-context.js";

export const catalogProductsRoute: AppRoute = {
  match: (request) => request.method === "GET" && request.path === "/api/catalog/products",
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user || user.role !== "admin") {
      return unauthorized("Sign in as an admin to view this resource.");
    }

    const config = context.config;
    if (!config.mongodb.uri || !config.mongodb.databaseName) {
      return json(503, { error: "catalog_not_configured" });
    }

    const client = await context.getMongoClient(
      config.mongodb.uri,
      config.mongodb.dnsServers
    );
    const repository = context.dependencies.createCatalogRepository
      ? context.dependencies.createCatalogRepository(client.db(config.mongodb.databaseName))
      : createDefaultCatalogRepository(client.db(config.mongodb.databaseName));
    const products = await repository.listCatalogProductsForReview();

    return json(200, { products });
  }
};
