import {
  createDefaultCatalogRepository,
  json,
  unauthorized,
  type AppRoute
} from "../app-route-context.js";

const defaultProductPage = 1;
const defaultProductPageSize = 100;
const maxProductPageSize = 250;

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
    const page = readPositiveInteger(request.query?.["page"], defaultProductPage);
    const pageSize = Math.min(
      readPositiveInteger(request.query?.["pageSize"], defaultProductPageSize),
      maxProductPageSize
    );
    const offset = (page - 1) * pageSize;
    const sourceNames = readStringList(request.query?.["source"]);
    const result = await repository.listCatalogProductsForReview({
      limit: pageSize,
      offset,
      sourceNames
    });
    const totalPages = Math.ceil(result.totalCount / pageSize);

    return json(200, {
      pagination: {
        page,
        pageSize,
        totalCount: result.totalCount,
        totalPages
      },
      products: result.products
    });
  }
};

export const catalogSourcesRoute: AppRoute = {
  match: (request) => request.method === "GET" && request.path === "/api/catalog/sources",
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
    const sourceNames = repository.listCatalogOfferSourceNames
      ? await repository.listCatalogOfferSourceNames()
      : [];

    return json(200, { sourceNames });
  }
};

function readStringList(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];

  return values
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter((item, index, items) => item.length > 0 && items.indexOf(item) === index);
}

function readPositiveInteger(
  value: string | string[] | undefined,
  fallback: number
): number {
  const candidateValue = Array.isArray(value) ? value[0] : value;

  if (!candidateValue) {
    return fallback;
  }

  const candidate = Number(candidateValue);

  if (!Number.isInteger(candidate) || candidate < 1) {
    return fallback;
  }

  return candidate;
}
