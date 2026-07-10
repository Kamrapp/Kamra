import type { Db } from "mongodb";

import type { PriceObservationRecord } from "../../catalog/v1/contracts.js";
import {
  buildShoppingListStockUpdatePlan
} from "../../household/current/shopping-list-completion.js";
import {
  generateHouseholdShoppingListPreview
} from "../../household/current/shopping-list.js";
import {
  assertCreateHouseholdShoppingListRequest,
  assertCreateHouseholdStockItemRequest,
  assertDeleteHouseholdStockItemRequest,
  assertHouseholdCreateRequest,
  assertHouseholdShoppingListPreviewRequest,
  assertHouseholdStockPageRequest,
  assertUpdateHouseholdShoppingListRequest,
  assertUpdateHouseholdShoppingListStocksRequest,
  assertUpdateHouseholdStockItemRequest
} from "../../household/v1/validation.js";
import {
  createDefaultCatalogRepository,
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

export const householdShoppingListPreviewRoute: AppRoute = {
  match: (request) =>
    request.method === "POST"
    && request.path === "/api/household/shopping-list/preview",
  handle: async (request, context) => {
    const repositoryResult = await createHouseholdRepositoryForUserRequest(request, context);
    if ("response" in repositoryResult) {
      return repositoryResult.response;
    }

    const body = parseJsonObject(request.bodyText);
    if (!body) {
      return json(400, { error: "invalid_json_body" });
    }

    try {
      assertHouseholdShoppingListPreviewRequest(body);
    } catch (error: unknown) {
      return json(400, {
        error: "invalid_household_shopping_list_preview_request",
        message: error instanceof Error ? error.message : "Shopping list preview request is invalid."
      });
    }

    const stockPage = await repositoryResult.repository.getHouseholdStockPage({
      householdId: body.householdId,
      userId: repositoryResult.user.email
    });
    if (!stockPage) {
      return json(404, { error: "household_not_found" });
    }

    return json(200, generateHouseholdShoppingListPreview({
      household: {
        defaultCalculatedMaxLimitMultiplier: stockPage.household.defaultCalculatedMaxLimitMultiplier ?? 2,
        id: stockPage.household.id
      },
      scale: body.scale,
      stockItems: stockPage.stockItems
    }));
  }
};

export const householdShoppingListsRoute: AppRoute = {
  match: (request) =>
    (request.method === "PATCH" || request.method === "POST")
    && request.path === "/api/household/shopping-lists",
  handle: async (request, context) => {
    const repositoryResult = await createHouseholdRepositoryForUserRequest(request, context);
    if ("response" in repositoryResult) {
      return repositoryResult.response;
    }

    const body = parseJsonObject(request.bodyText);
    if (!body) {
      return json(400, { error: "invalid_json_body" });
    }

    if (request.method === "POST") {
      try {
        assertCreateHouseholdShoppingListRequest(body);
      } catch (error: unknown) {
        return json(400, {
          error: "invalid_household_shopping_list_create_request",
          message: error instanceof Error ? error.message : "Shopping list create request is invalid."
        });
      }

      if (body.shopId) {
        const shop = await repositoryResult.repository.findShopById(body.shopId);
        if (!shop) {
          return json(404, { error: "shop_not_found" });
        }
      }

      const stockPage = await repositoryResult.repository.getHouseholdStockPage({
        householdId: body.householdId,
        userId: repositoryResult.user.email
      });
      if (!stockPage) {
        return json(404, { error: "household_not_found" });
      }

      const preview = generateHouseholdShoppingListPreview({
        household: {
          defaultCalculatedMaxLimitMultiplier: stockPage.household.defaultCalculatedMaxLimitMultiplier ?? 2,
          id: stockPage.household.id
        },
        scale: body.scale,
        stockItems: stockPage.stockItems
      });

      const now = new Date().toISOString();
      const shoppingListId = createShoppingListId(body.householdId);
      const shoppingList = await repositoryResult.repository.createShoppingList({
        createdAt: now,
        createdByUserId: repositoryResult.user.email,
        householdId: body.householdId,
        id: shoppingListId,
        items: preview.items.map((item, index) => ({
          ...item,
          id: createShoppingListLineId(shoppingListId, index, item.displayName),
          observedPrice: null,
          plannedAmount: item.suggestedBuyAmount,
          purchasedAmount: 0,
          sourceKind: "generated",
          status: "not_applied",
          ticked: false
        })),
        schemaVersion: "shopping_list_v1",
        scale: body.scale,
        shopId: body.shopId ?? null,
        status: "active",
        updatedAt: now,
        updatedByUserId: repositoryResult.user.email,
        userId: repositoryResult.user.email
      });

      return shoppingList
        ? json(201, { shoppingList })
        : json(404, { error: "household_not_found" });
    }

    try {
      assertUpdateHouseholdShoppingListRequest(body);
    } catch (error: unknown) {
      return json(400, {
        error: "invalid_household_shopping_list_update_request",
        message: error instanceof Error ? error.message : "Shopping list update request is invalid."
      });
    }

    if (body.shopId) {
      const shop = await repositoryResult.repository.findShopById(body.shopId);
      if (!shop) {
        return json(404, { error: "shop_not_found" });
      }
    }

    const shoppingList = await repositoryResult.repository.updateShoppingList({
      householdId: body.householdId,
      id: body.id,
      items: body.items,
      shopId: body.shopId,
      updatedAt: new Date().toISOString(),
      updatedByUserId: repositoryResult.user.email,
      userId: repositoryResult.user.email
    });

    return shoppingList
      ? json(200, { shoppingList })
      : json(404, { error: "shopping_list_not_found" });
  }
};

export const latestHouseholdShoppingListRoute: AppRoute = {
  match: (request) =>
    request.method === "GET"
    && request.path === "/api/household/shopping-lists/latest",
  handle: async (request, context) => {
    const repositoryResult = await createHouseholdRepositoryForUserRequest(request, context);
    if ("response" in repositoryResult) {
      return repositoryResult.response;
    }

    const payload = {
      householdId: readSingleString(request.query?.["householdId"])
    };

    try {
      assertHouseholdStockPageRequest(payload);
    } catch (error: unknown) {
      return json(400, {
        error: "invalid_household_shopping_list_latest_request",
        message: error instanceof Error ? error.message : "Latest shopping list request is invalid."
      });
    }

    const shoppingList = await repositoryResult.repository.getLatestShoppingList({
      householdId: payload.householdId,
      userId: repositoryResult.user.email
    });

    return shoppingList
      ? json(200, { shoppingList })
      : json(404, { error: "shopping_list_not_found" });
  }
};

export const householdShoppingListUpdateStocksRoute: AppRoute = {
  match: (request) =>
    request.method === "POST"
    && request.path === "/api/household/shopping-lists/update-stocks",
  handle: async (request, context) => {
    const repositoryResult = await createHouseholdRepositoryForUserRequest(request, context);
    if ("response" in repositoryResult) {
      return repositoryResult.response;
    }

    const body = parseJsonObject(request.bodyText);
    if (!body) {
      return json(400, { error: "invalid_json_body" });
    }

    try {
      assertUpdateHouseholdShoppingListStocksRequest(body);
    } catch (error: unknown) {
      return json(400, {
        error: "invalid_household_shopping_list_stock_update_request",
        message: error instanceof Error ? error.message : "Shopping list stock update request is invalid."
      });
    }

    const shoppingList = await repositoryResult.repository.getShoppingList({
      householdId: body.householdId,
      id: body.id,
      userId: repositoryResult.user.email
    });
    if (!shoppingList) {
      return json(404, { error: "shopping_list_not_found" });
    }

    const stockPage = await repositoryResult.repository.getHouseholdStockPage({
      householdId: body.householdId,
      userId: repositoryResult.user.email
    });
    if (!stockPage) {
      return json(404, { error: "household_not_found" });
    }

    const shop = shoppingList.shopId
      ? await repositoryResult.repository.findShopById(shoppingList.shopId)
      : null;
    const completion = buildShoppingListStockUpdatePlan({
      allowAutoTickingAllShoppingListEntries: (
        await repositoryResult.repository.readFeatureFlag("allowAutoTickingAllShoppingListEntries", true)
      ).enabled,
      confirmationMode: body.confirmationMode ?? null,
      householdId: body.householdId,
      shoppingList,
      shop,
      stockAppliedAt: body.stockAppliedAt,
      stockPage
    });

    if (completion.kind === "confirmation_required") {
      return json(409, completion.response);
    }

    for (const update of completion.plan.stockUpdates) {
      await repositoryResult.repository.updateHouseholdStockItem({
        currentAmount: update.currentAmount,
        householdId: update.householdId,
        id: update.id,
        updatedAt: new Date().toISOString(),
        updatedByUserId: repositoryResult.user.email,
        userId: repositoryResult.user.email
      });
    }

    for (const createInput of completion.plan.stockCreates) {
      await repositoryResult.repository.createHouseholdStockItem({
        createdAt: new Date().toISOString(),
        createdByUserId: repositoryResult.user.email,
        currentAmount: createInput.currentAmount,
        displayName: createInput.displayName,
        householdId: createInput.householdId,
        householdProductId: createInput.householdProductId ?? undefined,
        idealMaxLimit: createInput.idealMaxLimit ?? undefined,
        minLimit: createInput.minLimit,
        productSourceId: createInput.productSourceId ?? undefined,
        stockedAt: createInput.stockedAt,
        stockGroupKey: createInput.stockGroupKey,
        unit: createInput.unit,
        userId: repositoryResult.user.email
      });
    }

    if (completion.plan.householdPurchasePriceObservations.length > 0) {
      await repositoryResult.repository.upsertHouseholdPurchasePriceObservations(
        completion.plan.householdPurchasePriceObservations
      );
    }

    if (completion.plan.catalogPriceObservations.length > 0) {
      const catalogRepository = createCatalogRepository(context, repositoryResult.database);
      if (catalogRepository?.upsertPriceObservations) {
        await catalogRepository.upsertPriceObservations(completion.plan.catalogPriceObservations);
      } else {
        await repositoryResult.repository.upsertHouseholdPurchasePriceObservations(
          completion.plan.catalogPriceObservations.map((observation) =>
            mapCatalogObservationToHouseholdPurchaseObservation(
              observation,
              body.householdId,
              shoppingList.id
            )
          )
        );
      }
    }

    const updatedShoppingList = await repositoryResult.repository.updateShoppingList({
      householdId: body.householdId,
      id: body.id,
      items: completion.plan.updatedShoppingList.items,
      status: completion.plan.updatedShoppingList.status,
      stockAppliedAt: completion.plan.updatedShoppingList.stockAppliedAt ?? null,
      updatedAt: new Date().toISOString(),
      updatedByUserId: repositoryResult.user.email,
      userId: repositoryResult.user.email
    });
    const updatedStockPage = await repositoryResult.repository.getHouseholdStockPage({
      householdId: body.householdId,
      userId: repositoryResult.user.email
    });

    return updatedShoppingList && updatedStockPage
      ? json(200, {
        appliedLineCount: completion.plan.updatedShoppingList.items.filter((item) => item.status === "applied").length,
        confirmationRequired: false,
        householdStockPage: updatedStockPage,
        shoppingList: updatedShoppingList
      })
      : json(404, { error: "shopping_list_not_found" });
  }
};

export const shopsRoute: AppRoute = {
  match: (request) =>
    request.method === "GET"
    && request.path === "/api/shops",
  handle: async (request, context) => {
    const repositoryResult = await createHouseholdRepositoryForUserRequest(request, context);
    if ("response" in repositoryResult) {
      return repositoryResult.response;
    }

    return json(200, {
      shops: await repositoryResult.repository.listShops()
    });
  }
};

async function createHouseholdRepositoryForUserRequest(
  request: Parameters<AppRoute["handle"]>[0],
  context: Parameters<AppRoute["handle"]>[1]
): Promise<
  | { response: AppResponse }
  | {
      database: Db;
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
  const database = client.db(config.mongodb.databaseName);
  const repository = context.dependencies.createHouseholdRepository
    ? context.dependencies.createHouseholdRepository(database)
    : createDefaultHouseholdRepository(database);

  return {
    database,
    repository,
    user
  };
}

function createCatalogRepository(
  context: Parameters<AppRoute["handle"]>[1],
  database: Db
):
  | {
      upsertPriceObservations?(records: readonly PriceObservationRecord[]): Promise<void>;
    }
  | null {
  return context.dependencies.createCatalogRepository
    ? context.dependencies.createCatalogRepository(database)
    : createDefaultCatalogRepository(database);
}

function mapCatalogObservationToHouseholdPurchaseObservation(
  observation: PriceObservationRecord,
  householdId: string,
  shoppingListId: string
) {
  return {
    catalogProductId: observation.productId,
    catalogProductNameSnapshot: null,
    createdAt: observation.createdAt,
    displayName: observation.sourceProductKey,
    gtin: null,
    householdId,
    householdProductId: null,
    householdStockItemId: null,
    id: `household_purchase_fallback_${stableSlug(observation.id)}`,
    observedAt: observation.observedAt,
    price: {
      amount: observation.price.amount,
      currencyCode: observation.price.currencyCode,
      observedAt: observation.observedAt
    },
    productSourceId: observation.productSourceId,
    shopId: null,
    shoppingListId,
    shoppingListLineId: null,
    sourceName: observation.sourceName,
    sourceProductUrl: null,
    stockGroupKey: null,
    unit: observation.unitPriceLabel ?? "unit",
    updatedAt: observation.updatedAt
  };
}

function createHouseholdId(name: string): string {
  return `household_${stableSlug(name)}_${Date.now().toString(36)}`;
}

function createShoppingListId(householdId: string): string {
  return `shopping_list_${stableSlug(householdId)}_${Date.now().toString(36)}`;
}

function createShoppingListLineId(shoppingListId: string, index: number, displayName: string): string {
  return `shopping_list_line_${stableSlug(shoppingListId)}_${index + 1}_${stableSlug(displayName)}`;
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
