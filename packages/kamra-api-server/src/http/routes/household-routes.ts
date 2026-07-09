import {
  assertCreateHouseholdStockItemRequest,
  assertDeleteHouseholdStockItemRequest,
  assertHouseholdCreateRequest,
  assertHouseholdStockPageRequest,
  assertUpdateHouseholdStockItemRequest
} from "../../household/v1/validation.js";
import {
  createDefaultHouseholdRepository,
  json,
  unauthorized,
  type AppResponse,
  type AppRoute
} from "../app-route-context.js";

export const householdsRoute: AppRoute = {
  match: (request) =>
    (request.method === "GET" || request.method === "POST")
    && request.path === "/api/households",
  handle: async (request, context) => {
    const repositoryResult = await createHouseholdRepositoryForUserRequest(request, context);
    if ("response" in repositoryResult) {
      return repositoryResult.response;
    }

    if (request.method === "GET") {
      const households = await repositoryResult.repository.listHouseholdsForUser(repositoryResult.user.email);

      return json(200, {
        households
      });
    }

    const body = parseJsonObject(request.bodyText);
    if (!body) {
      return json(400, { error: "invalid_json_body" });
    }

    try {
      assertHouseholdCreateRequest(body);
    } catch (error: unknown) {
      return json(400, {
        error: "invalid_household_create_request",
        message: error instanceof Error ? error.message : "Household payload is invalid."
      });
    }

    const createdAt = new Date().toISOString();
    const result = await repositoryResult.repository.createHousehold({
      createdAt,
      createdByUserId: repositoryResult.user.email,
      id: createHouseholdId(body.name),
      name: body.name.trim()
    });

    return json(201, result);
  }
};

export const householdStockRoute: AppRoute = {
  match: (request) =>
    (request.method === "DELETE" || request.method === "GET" || request.method === "PATCH" || request.method === "POST")
    && request.path === "/api/household/items",
  handle: async (request, context) => {
    const repositoryResult = await createHouseholdRepositoryForUserRequest(request, context);
    if ("response" in repositoryResult) {
      return repositoryResult.response;
    }

    if (request.method === "GET") {
      const payload = {
        householdId: readSingleString(request.query?.["householdId"])
      };

      try {
        assertHouseholdStockPageRequest(payload);
      } catch (error: unknown) {
        return json(400, {
          error: "invalid_household_stock_request",
          message: error instanceof Error ? error.message : "Household stock request is invalid."
        });
      }

      const page = await repositoryResult.repository.getHouseholdStockPage({
        householdId: payload.householdId,
        userId: repositoryResult.user.email
      });

      return page
        ? json(200, page)
        : json(404, { error: "household_not_found" });
    }

    if (request.method === "DELETE") {
      const payload = {
        householdId: readSingleString(request.query?.["householdId"]),
        id: readSingleString(request.query?.["id"])
      };

      try {
        assertDeleteHouseholdStockItemRequest(payload);
      } catch (error: unknown) {
        return json(400, {
          error: "invalid_household_stock_delete_request",
          message: error instanceof Error ? error.message : "Household stock delete request is invalid."
        });
      }

      const page = await repositoryResult.repository.archiveHouseholdStockItem({
        householdId: payload.householdId,
        id: payload.id,
        updatedAt: new Date().toISOString(),
        updatedByUserId: repositoryResult.user.email,
        userId: repositoryResult.user.email
      });

      return page
        ? json(200, page)
        : json(404, { error: "household_stock_item_not_found" });
    }

    const body = parseJsonObject(request.bodyText);
    if (!body) {
      return json(400, { error: "invalid_json_body" });
    }

    if (request.method === "POST") {
      try {
        assertCreateHouseholdStockItemRequest(body);
      } catch (error: unknown) {
        return json(400, {
          error: "invalid_household_stock_create_request",
          message: error instanceof Error ? error.message : "Household stock create request is invalid."
        });
      }

      const page = await repositoryResult.repository.createHouseholdStockItem({
        ...body,
        createdAt: new Date().toISOString(),
        createdByUserId: repositoryResult.user.email,
        userId: repositoryResult.user.email
      });

      return page
        ? json(200, page)
        : json(404, { error: "household_or_local_product_not_found" });
    }

    try {
      assertUpdateHouseholdStockItemRequest(body);
    } catch (error: unknown) {
      return json(400, {
        error: "invalid_household_stock_update_request",
        message: error instanceof Error ? error.message : "Household stock update request is invalid."
      });
    }

    const page = await repositoryResult.repository.updateHouseholdStockItem({
      ...body,
      updatedAt: new Date().toISOString(),
      updatedByUserId: repositoryResult.user.email,
      userId: repositoryResult.user.email
    });

    return page
      ? json(200, page)
      : json(404, { error: "household_stock_item_not_found" });
  }
};

async function createHouseholdRepositoryForUserRequest(
  request: Parameters<AppRoute["handle"]>[0],
  context: Parameters<AppRoute["handle"]>[1]
): Promise<
  | { response: AppResponse }
  | {
      repository: ReturnType<NonNullable<typeof context.dependencies.createHouseholdRepository>>;
      user: NonNullable<ReturnType<typeof context.authenticateRequestUser>>;
    }
> {
  const user = context.authenticateRequestUser(request);
  if (!user) {
    return {
      response: unauthorized()
    };
  }

  const config = context.config;
  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    return {
      response: json(503, { error: "household_not_configured" })
    };
  }

  const client = await context.getMongoClient(
    config.mongodb.uri,
    config.mongodb.dnsServers
  );
  const repository = context.dependencies.createHouseholdRepository
    ? context.dependencies.createHouseholdRepository(client.db(config.mongodb.databaseName))
    : createDefaultHouseholdRepository(client.db(config.mongodb.databaseName));

  return {
    repository,
    user
  };
}

function createHouseholdId(name: string): string {
  return `household_${stableSlug(name)}_${Date.now().toString(36)}`;
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

function readSingleString(value: string | string[] | undefined): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;

  return typeof candidate === "string" && candidate.trim().length > 0
    ? candidate.trim()
    : null;
}

function stableSlug(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

  return slug || "household";
}
