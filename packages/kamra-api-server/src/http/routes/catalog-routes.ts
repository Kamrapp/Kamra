import {
  createDefaultCatalogRepository,
  json,
  unauthorized,
  type AppResponse,
  type AppRoute
} from "../app-route-context.js";
import type { ProductMeasurement } from "../../catalog/v1/contracts.js";

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

export const catalogProductRoute: AppRoute = {
  match: (request) => ["DELETE", "GET", "PATCH"].includes(request.method) && request.path === "/api/catalog/product",
  handle: async (request, context) => {
    const repositoryResult = await createCatalogRepositoryForAdminRequest(request, context);
    if ("response" in repositoryResult) {
      return repositoryResult.response;
    }

    if (request.method === "GET") {
      const id = readSingleString(request.query?.["id"]);
      if (!id) {
        return json(400, { error: "missing_product_id" });
      }

      const product = repositoryResult.repository.findCatalogProductForReview
        ? await repositoryResult.repository.findCatalogProductForReview(id)
        : null;

      return product
        ? json(200, { product })
        : json(404, { error: "product_not_found" });
    }

    if (request.method === "DELETE") {
      const id = readSingleString(request.query?.["id"]);
      if (!id) {
        return json(400, { error: "missing_product_id" });
      }

      const result = repositoryResult.repository.deleteCatalogProduct
        ? await repositoryResult.repository.deleteCatalogProduct(id)
        : null;

      return result
        ? json(200, { id, result })
        : json(501, { error: "catalog_product_delete_not_supported" });
    }

    const body = parseJsonObject(request.bodyText);
    if (!body) {
      return json(400, { error: "invalid_json_body" });
    }

    const id = readBodyString(body["id"]);
    if (!id) {
      return json(400, { error: "missing_product_id" });
    }

    const update = parseProductUpdateBody(body);
    if (!update) {
      return json(400, { error: "invalid_product_update" });
    }

    const product = repositoryResult.repository.updateCatalogProduct
      ? await repositoryResult.repository.updateCatalogProduct({
          ...update,
          id,
          updatedAt: new Date().toISOString()
        })
      : null;

    return product
      ? json(200, { product })
      : json(404, { error: "product_not_found" });
  }
};

export const catalogProductValidationRoute: AppRoute = {
  match: (request) => request.method === "POST"
    && (
      request.path === "/api/catalog/product/validate"
      || request.path === "/api/catalog/product/invalidate"
    ),
  handle: async (request, context) => {
    const repositoryResult = await createCatalogRepositoryForAdminRequest(request, context);
    if ("response" in repositoryResult) {
      return repositoryResult.response;
    }

    const body = parseJsonObject(request.bodyText);
    if (!body) {
      return json(400, { error: "invalid_json_body" });
    }

    const id = readBodyString(body["id"]);
    if (!id) {
      return json(400, { error: "missing_product_id" });
    }

    const status = request.path.endsWith("/validate") ? "validated" : "invalid";
    const product = repositoryResult.repository.setCatalogProductValidationStatus
      ? await repositoryResult.repository.setCatalogProductValidationStatus({
          id,
          note: readOptionalBodyString(body["note"]),
          reviewedAt: new Date().toISOString(),
          reviewerId: repositoryResult.user.email,
          status
        })
      : null;

    return product
      ? json(200, { product })
      : json(404, { error: "product_not_found" });
  }
};

function readStringList(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];

  return values
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter((item, index, items) => item.length > 0 && items.indexOf(item) === index);
}

async function createCatalogRepositoryForAdminRequest(
  request: Parameters<AppRoute["handle"]>[0],
  context: Parameters<AppRoute["handle"]>[1]
): Promise<
  | { response: AppResponse }
  | {
      repository: ReturnType<NonNullable<typeof context.dependencies.createCatalogRepository>>;
      user: NonNullable<ReturnType<typeof context.authenticateRequestUser>>;
    }
> {
  const user = context.authenticateRequestUser(request);
  if (!user || user.role !== "admin") {
    return {
      response: unauthorized("Sign in as an admin to view this resource.")
    };
  }

  const config = context.config;
  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    return {
      response: json(503, { error: "catalog_not_configured" })
    };
  }

  const client = await context.getMongoClient(
    config.mongodb.uri,
    config.mongodb.dnsServers
  );
  const repository = context.dependencies.createCatalogRepository
    ? context.dependencies.createCatalogRepository(client.db(config.mongodb.databaseName))
    : createDefaultCatalogRepository(client.db(config.mongodb.databaseName));

  return { repository, user };
}

function parseJsonObject(bodyText: string | undefined): Record<string, unknown> | null {
  if (!bodyText) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(bodyText);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function parseProductUpdateBody(body: Record<string, unknown>): {
  brandName?: string | null;
  measurements?: ProductMeasurement[];
  name?: string;
  primaryCategoryKey?: string | null;
  validationNote?: string | null;
} | null {
  const update: {
    brandName?: string | null;
    measurements?: ProductMeasurement[];
    name?: string;
    primaryCategoryKey?: string | null;
    validationNote?: string | null;
  } = {};

  if ("brandName" in body) {
    update.brandName = readNullableBodyString(body["brandName"]);
  }

  if ("measurements" in body) {
    if (!Array.isArray(body["measurements"]) || !body["measurements"].every(isProductMeasurement)) {
      return null;
    }
    update.measurements = body["measurements"];
  }

  if ("name" in body) {
    const name = readBodyString(body["name"]);
    if (!name) {
      return null;
    }
    update.name = name;
  }

  if ("primaryCategoryKey" in body) {
    update.primaryCategoryKey = readNullableBodyString(body["primaryCategoryKey"]);
  }

  if ("validationNote" in body) {
    update.validationNote = readNullableBodyString(body["validationNote"]);
  }

  return update;
}

function isProductMeasurement(value: unknown): value is ProductMeasurement {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const normalizedUnit = candidate["normalizedUnit"];
  const normalizedValue = candidate["normalizedValue"];

  return typeof candidate["unit"] === "string"
    && candidate["unit"].trim().length > 0
    && typeof candidate["value"] === "number"
    && Number.isFinite(candidate["value"])
    && (normalizedUnit === undefined || normalizedUnit === null || typeof normalizedUnit === "string")
    && (normalizedValue === undefined || normalizedValue === null || typeof normalizedValue === "number");
}

function readBodyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function readNullableBodyString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function readOptionalBodyString(value: unknown): string | null {
  return value === undefined ? null : readNullableBodyString(value);
}

function readSingleString(value: string | string[] | undefined): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && candidate.trim().length > 0
    ? candidate.trim()
    : null;
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
