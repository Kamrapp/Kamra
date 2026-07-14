import type { Db } from "mongodb";

import type { PriceObservationRecord } from "../../catalog/v1/contracts.js";
import type {
  HouseholdShoppingListLineRecord,
  HouseholdShoppingListRecord
} from "../../household/v1/contracts.js";
import { buildShoppingListStockUpdatePlan } from "../../household/current/shopping-list-completion.js";
import { generateHouseholdShoppingListPreview } from "../../household/current/shopping-list.js";
import { MongoHouseholdProductRepository } from "../../household/v2/mongo-household-product-repository.js";
import { MongoProductGroupReadRepository } from "../../household/v2/mongo-product-group-read-repository.js";
import { MongoShoppingNeedRepository } from "../../household/v2/mongo-shopping-need-repository.js";
import { MongoStockCommandRepository } from "../../household/v2/mongo-stock-command-repository.js";
import { generateProductGroupShoppingNeeds } from "../../household/v2/shopping-needs.js";
import type { HouseholdProduct, StockBatch } from "../../household/v2/contracts.js";
import type { MongoTransactionClientLike } from "../../db/mongo-like.js";
import {
  householdResetScopes,
  type HouseholdResetScope
} from "../../household/current/mongo-household-repository.js";
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
  groupTargetShoppingDistributionModes,
  groupTargetShoppingModes
} from "../../household/v1/contracts.js";
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
    (request.method === "GET" || request.method === "POST") && request.path === "/api/households",
  handle: async (request, context) => {
    const repositoryResult = await createHouseholdRepositoryForUserRequest(request, context);
    if ("response" in repositoryResult) {
      return repositoryResult.response;
    }

    if (request.method === "GET") {
      const households = await repositoryResult.repository.listHouseholdsForUser(
        repositoryResult.user.email
      );

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

export const householdSettingsRoute: AppRoute = {
  match: (request) =>
    request.method === "PATCH" && /^\/api\/households\/[^/]+\/settings$/.test(request.path),
  handle: async (request, context) => {
    const repositoryResult = await createHouseholdRepositoryForUserRequest(request, context);
    if ("response" in repositoryResult) return repositoryResult.response;
    const householdId = request.path.match(/^\/api\/households\/([^/]+)\/settings$/)?.[1];
    const body = parseJsonObject(request.bodyText);
    const allowExpiredItems =
      typeof body?.["allowExpiredItems"] === "boolean" ? body["allowExpiredItems"] : undefined;
    const defaultCalculatedMaxLimitMultiplier =
      typeof body?.["defaultCalculatedMaxLimitMultiplier"] === "number" &&
      Number.isFinite(body["defaultCalculatedMaxLimitMultiplier"]) &&
      body["defaultCalculatedMaxLimitMultiplier"] >= 0
        ? body["defaultCalculatedMaxLimitMultiplier"]
        : undefined;
    const groupTargetShoppingMode = groupTargetShoppingModes.includes(
      body?.["groupTargetShoppingMode"] as (typeof groupTargetShoppingModes)[number]
    )
      ? (body?.["groupTargetShoppingMode"] as (typeof groupTargetShoppingModes)[number])
      : undefined;
    const groupTargetShoppingDistributionMode = groupTargetShoppingDistributionModes.includes(
      body?.[
        "groupTargetShoppingDistributionMode"
      ] as (typeof groupTargetShoppingDistributionModes)[number]
    )
      ? (body?.[
          "groupTargetShoppingDistributionMode"
        ] as (typeof groupTargetShoppingDistributionModes)[number])
      : undefined;
    const name =
      typeof body?.["name"] === "string" && body["name"].trim().length > 0
        ? body["name"].trim()
        : undefined;
    if (
      !householdId ||
      !body ||
      (allowExpiredItems === undefined &&
        defaultCalculatedMaxLimitMultiplier === undefined &&
        groupTargetShoppingMode === undefined &&
        groupTargetShoppingDistributionMode === undefined &&
        name === undefined)
    )
      return json(400, { error: "invalid_household_settings_request" });
    try {
      const result = await repositoryResult.repository.updateHouseholdSettings({
        allowExpiredItems,
        defaultCalculatedMaxLimitMultiplier,
        groupTargetShoppingMode,
        groupTargetShoppingDistributionMode,
        householdId,
        name,
        updatedAt: new Date().toISOString(),
        userId: repositoryResult.user.email
      });
      return json(200, result);
    } catch (error) {
      const code = error instanceof Error ? error.message : "household_settings_update_failed";
      return json(
        code === "household_not_found" ? 404 : code === "household_owner_required" ? 403 : 500,
        { error: code }
      );
    }
  }
};

export const householdResetRoute: AppRoute = {
  match: (request) =>
    request.method === "POST" && /^\/api\/households\/[^/]+\/reset$/.test(request.path),
  handle: async (request, context) => {
    const repositoryResult = await createHouseholdRepositoryForUserRequest(request, context);
    if ("response" in repositoryResult) return repositoryResult.response;
    const householdId = request.path.match(/^\/api\/households\/([^/]+)\/reset$/)?.[1];
    const body = parseJsonObject(request.bodyText);
    const scope = body?.["scope"];
    if (
      !householdId ||
      !body ||
      typeof scope !== "string" ||
      !householdResetScopes.includes(scope as HouseholdResetScope)
    ) {
      return json(400, { error: "invalid_household_reset_request" });
    }

    try {
      const result = await repositoryResult.repository.resetHouseholdContent({
        householdId,
        scope: scope as HouseholdResetScope,
        transactionClient: repositoryResult.client,
        userId: repositoryResult.user.email
      });
      return json(200, result);
    } catch (error) {
      const code = error instanceof Error ? error.message : "household_reset_failed";
      return json(
        code === "household_not_found" ? 404 : code === "household_owner_required" ? 403 : 500,
        { error: code }
      );
    }
  }
};

export const householdStockRoute: AppRoute = {
  match: (request) =>
    (request.method === "DELETE" ||
      request.method === "GET" ||
      request.method === "PATCH" ||
      request.method === "POST") &&
    request.path === "/api/household/items",
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

      return page ? json(200, page) : json(404, { error: "household_not_found" });
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
          message:
            error instanceof Error ? error.message : "Household stock delete request is invalid."
        });
      }

      const page = await repositoryResult.repository.archiveHouseholdStockItem({
        householdId: payload.householdId,
        id: payload.id,
        updatedAt: new Date().toISOString(),
        updatedByUserId: repositoryResult.user.email,
        userId: repositoryResult.user.email
      });

      return page ? json(200, page) : json(404, { error: "household_stock_item_not_found" });
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
          message:
            error instanceof Error ? error.message : "Household stock create request is invalid."
        });
      }

      const page = await repositoryResult.repository.createHouseholdStockItem({
        ...body,
        createdAt: new Date().toISOString(),
        createdByUserId: repositoryResult.user.email,
        userId: repositoryResult.user.email
      });

      return page ? json(200, page) : json(404, { error: "household_or_local_product_not_found" });
    }

    try {
      assertUpdateHouseholdStockItemRequest(body);
    } catch (error: unknown) {
      return json(400, {
        error: "invalid_household_stock_update_request",
        message:
          error instanceof Error ? error.message : "Household stock update request is invalid."
      });
    }

    const page = await repositoryResult.repository.updateHouseholdStockItem({
      ...body,
      updatedAt: new Date().toISOString(),
      updatedByUserId: repositoryResult.user.email,
      userId: repositoryResult.user.email
    });

    return page ? json(200, page) : json(404, { error: "household_stock_item_not_found" });
  }
};

export const householdShoppingListPreviewRoute: AppRoute = {
  match: (request) =>
    request.method === "POST" && request.path === "/api/household/shopping-list/preview",
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
        message:
          error instanceof Error ? error.message : "Shopping list preview request is invalid."
      });
    }

    const stockPage = await repositoryResult.repository.getHouseholdStockPage({
      householdId: body.householdId,
      userId: repositoryResult.user.email
    });
    if (!stockPage) {
      return json(404, { error: "household_not_found" });
    }

    return json(
      200,
      generateHouseholdShoppingListPreview({
        household: {
          defaultCalculatedMaxLimitMultiplier:
            stockPage.household.defaultCalculatedMaxLimitMultiplier ?? 2,
          id: stockPage.household.id
        },
        scale: body.scale,
        stockItems: stockPage.stockItems
      })
    );
  }
};

export const householdShoppingListsRoute: AppRoute = {
  match: (request) =>
    (request.method === "PATCH" || request.method === "POST") &&
    request.path === "/api/household/shopping-lists",
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
          message:
            error instanceof Error ? error.message : "Shopping list create request is invalid."
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

      const v2Workspace = await new MongoProductGroupReadRepository(
        repositoryResult.database
      ).getWorkspace(body.householdId, new Date().toISOString().slice(0, 10));
      const hasV2Products =
        v2Workspace.productGroups.length > 0 || v2Workspace.unassignedProducts.length > 0;
      const selectedOwnerIds =
        body.selectedOwnerIds !== undefined ? new Set(body.selectedOwnerIds) : null;
      const v2Needs = hasV2Products
        ? generateProductGroupShoppingNeeds({
            distributionMode:
              stockPage.household.groupTargetShoppingDistributionMode ?? "split_evenly",
            mode: stockPage.household.groupTargetShoppingMode ?? "add_products_and_group_item",
            needIdPrefix: `shopping-needs:${body.householdId}`,
            selectedOwnerIds,
            workspace: v2Workspace
          })
        : [];
      if (hasV2Products) {
        await new MongoShoppingNeedRepository(repositoryResult.database).replaceGeneratedNeeds({
          actorUserId: repositoryResult.user.email,
          householdId: body.householdId,
          needs: v2Needs,
          now: new Date().toISOString()
        });
      }
      const preview = generateHouseholdShoppingListPreview({
        household: {
          defaultCalculatedMaxLimitMultiplier:
            stockPage.household.defaultCalculatedMaxLimitMultiplier ?? 2,
          id: stockPage.household.id
        },
        scale: body.scale,
        stockItems: stockPage.stockItems
      });
      const selectedStockItemIds = body.selectedStockItemIds
        ? new Set(body.selectedStockItemIds)
        : null;
      const selectedPreviewItems = selectedStockItemIds
        ? preview.items.filter(
            (item) =>
              typeof item.householdStockItemId === "string" &&
              selectedStockItemIds.has(item.householdStockItemId)
          )
        : preview.items;

      const now = new Date().toISOString();
      const shoppingListId = createShoppingListId(body.householdId);
      const shoppingList = await repositoryResult.repository.createShoppingList({
        createdAt: now,
        createdByUserId: repositoryResult.user.email,
        householdId: body.householdId,
        id: shoppingListId,
        items: hasV2Products
          ? createV2CompatibleShoppingLines(v2Needs, v2Workspace, shoppingListId)
          : selectedPreviewItems.map((item, index) => ({
              ...item,
              id: createShoppingListLineId(shoppingListId, index, item.displayName),
              observedPrice: null,
              plannedAmount: item.suggestedBuyAmount,
              purchasedAmount: 0,
              sourceKind: "generated",
              status: "not_applied",
              ticked: false
            })),
        schemaVersion: hasV2Products ? "shopping_list_v2_compat" : "shopping_list_v1",
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
      status: body.status,
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
    request.method === "GET" && request.path === "/api/household/shopping-lists/latest",
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
    request.method === "POST" && request.path === "/api/household/shopping-lists/update-stocks",
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
        message:
          error instanceof Error ? error.message : "Shopping list stock update request is invalid."
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

    if (shoppingList.schemaVersion === "shopping_list_v2_compat") {
      if (!context.config.mongodb.uri || !context.config.mongodb.databaseName)
        return json(503, { error: "household_not_configured" });
      const updatedShoppingList = await applyV2CompatibleShoppingList({
        database: repositoryResult.database,
        shoppingList,
        stockAppliedAt: body.stockAppliedAt,
        transactionClient: repositoryResult.client,
        userId: repositoryResult.user.email
      });
      const householdStockPage = await repositoryResult.repository.getHouseholdStockPage({
        householdId: body.householdId,
        userId: repositoryResult.user.email
      });
      return json(200, {
        appliedLineCount: updatedShoppingList.items.filter((item) => item.status === "applied")
          .length,
        confirmationRequired: false,
        householdStockPage,
        shoppingList: updatedShoppingList
      });
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
        await repositoryResult.repository.readFeatureFlag(
          "allowAutoTickingAllShoppingListEntries",
          true
        )
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
          appliedLineCount: completion.plan.updatedShoppingList.items.filter(
            (item) => item.status === "applied"
          ).length,
          confirmationRequired: false,
          householdStockPage: updatedStockPage,
          shoppingList: updatedShoppingList
        })
      : json(404, { error: "shopping_list_not_found" });
  }
};

export const shopsRoute: AppRoute = {
  match: (request) => request.method === "GET" && request.path === "/api/shops",
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
      client: MongoTransactionClientLike;
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

  const client = await context.getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
  const database = client.db(config.mongodb.databaseName);
  const repository = context.dependencies.createHouseholdRepository
    ? context.dependencies.createHouseholdRepository(database)
    : createDefaultHouseholdRepository(database);

  return {
    client,
    database,
    repository,
    user
  };
}

function createCatalogRepository(
  context: Parameters<AppRoute["handle"]>[1],
  database: Db
): {
  upsertPriceObservations?(records: readonly PriceObservationRecord[]): Promise<void>;
} | null {
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

function createV2CompatibleShoppingLines(
  needs: ReturnType<typeof generateProductGroupShoppingNeeds>,
  workspace: Awaited<ReturnType<MongoProductGroupReadRepository["getWorkspace"]>>,
  shoppingListId: string
): HouseholdShoppingListLineRecord[] {
  const productRows = [
    ...workspace.productGroups.flatMap((group) => group.products),
    ...workspace.unassignedProducts
  ];
  const products = new Map(productRows.map((row) => [row.product.id, row]));
  return needs.map((need, index) => {
    const product =
      need.ownerKind === "household_product" ? products.get(need.ownerId ?? "") : null;
    const currentAmount = product?.aggregate.availableQuantity ?? 0;
    const productGroupId =
      need.ownerKind === "product_group" ? need.ownerId : (product?.product.productGroupId ?? null);
    return {
      catalogProductId: product?.product.catalogProductId ?? null,
      catalogProductNameSnapshot: null,
      currentAmount,
      displayName: need.ownerDisplayNameSnapshot ?? "Shopping item",
      gtin: product?.product.identitySnapshot?.gtin ?? null,
      householdProductId: product?.product.id ?? null,
      householdStockItemId: null,
      id: createShoppingListLineId(shoppingListId, index, need.ownerDisplayNameSnapshot ?? need.id),
      idealMaxLimit: null,
      minLimit: null,
      observedPrice: null,
      plannedAmount: need.plannedQuantity,
      productGroupId,
      productSourceId: null,
      purchasedAmount: 0,
      reasonCode: "below_minimum",
      sourceKind: "generated",
      sourceName: null,
      sourceProductUrl: null,
      status: "not_applied",
      stockGroupKey: need.ownerId ?? null,
      stockStatus: "below_limit",
      suggestedBuyAmount: need.plannedQuantity,
      targetAmount: currentAmount + need.plannedQuantity,
      ticked: false,
      uncertaintyFlags: product ? [] : ["missing_catalog_product", "missing_product_source"],
      unit: need.unit
    };
  });
}

async function applyV2CompatibleShoppingList(input: {
  database: Db;
  shoppingList: HouseholdShoppingListRecord;
  stockAppliedAt: string;
  transactionClient: MongoTransactionClientLike;
  userId: string;
}): Promise<HouseholdShoppingListRecord> {
  const productRepository = new MongoHouseholdProductRepository(input.database);
  const groupCollection = input.database.collection<{ id: string; householdId: string }>(
    "household_product_groups"
  );
  const commandRepository = new MongoStockCommandRepository(
    input.database,
    input.transactionClient
  );
  const now = new Date().toISOString();
  const items = [...input.shoppingList.items];

  for (const [index, item] of items.entries()) {
    if (!item.ticked || item.status === "applied") continue;
    const quantity = item.purchasedAmount > 0 ? item.purchasedAmount : item.plannedAmount;
    if (quantity <= 0) continue;

    const deterministicProductId = `household-product:${input.shoppingList.householdId}:purchase:${stableSlug(item.id)}`;
    let product: HouseholdProduct | null = item.householdProductId
      ? await productRepository.get(input.shoppingList.householdId, item.householdProductId)
      : await productRepository.get(input.shoppingList.householdId, deterministicProductId);
    if (!product) {
      if (item.productGroupId) {
        const group = await groupCollection.findOne({
          householdId: input.shoppingList.householdId,
          id: item.productGroupId
        });
        if (!group) throw new Error("product_group_not_found");
      }
      product = {
        classificationRevision: 0,
        createdAt: now,
        createdByUserId: input.userId,
        defaultTrackingUnit: item.unit as HouseholdProduct["defaultTrackingUnit"],
        directAttributes: [],
        directConcepts: [],
        displayName: item.displayName,
        householdId: input.shoppingList.householdId,
        id: deterministicProductId,
        identityKind: "manual",
        identitySnapshot: { gtin: item.gtin ?? null },
        note: null,
        productGroupId: item.productGroupId ?? null,
        revision: 0,
        status: "active",
        updatedAt: now,
        updatedByUserId: input.userId
      };
      await productRepository.create(product);
    }

    const batchId = `stock-batch:${input.shoppingList.householdId}:purchase:${stableSlug(item.id)}`;
    const operationId = `purchase:${input.shoppingList.id}:${item.id}`;
    const batch: StockBatch = {
      acquiredOn: input.stockAppliedAt,
      acquisitionSnapshot: {
        displayName: product.displayName,
        gtin: product.identitySnapshot.gtin ?? null
      },
      classificationSnapshot: {
        capturedAt: now,
        directAttributes: product.directAttributes,
        directConcepts: product.directConcepts,
        effectiveConcepts: product.directConcepts,
        source: "household"
      },
      createdAt: now,
      createdByUserId: input.userId,
      expiryOn: null,
      householdId: input.shoppingList.householdId,
      householdProductId: product.id,
      id: batchId,
      originalQuantity: quantity,
      productId: product.id,
      purchaseOperationId: operationId,
      remainingQuantity: quantity,
      revision: 0,
      shopProductId: null,
      shoppingNeedId: item.id,
      shoppingNeedListId: input.shoppingList.id,
      status: "available",
      unit: item.unit as StockBatch["unit"],
      updatedAt: now,
      updatedByUserId: input.userId
    };
    await commandRepository.acquireBatch({
      batch,
      operationId,
      requestFingerprint: `purchase:${input.shoppingList.id}:${item.id}`
    });
    items[index] = {
      ...item,
      householdProductId: product.id,
      purchasedAmount: quantity,
      status: "applied",
      ticked: true
    };
  }

  const updated = {
    ...input.shoppingList,
    items,
    status: "completed" as const,
    stockAppliedAt: input.stockAppliedAt,
    updatedAt: now,
    updatedByUserId: input.userId
  };
  await input.database
    .collection<HouseholdShoppingListRecord>("household_shopping_lists")
    .updateOne(
      { householdId: input.shoppingList.householdId, id: input.shoppingList.id },
      {
        $set: {
          items: updated.items,
          status: updated.status,
          stockAppliedAt: updated.stockAppliedAt,
          updatedAt: updated.updatedAt,
          updatedByUserId: updated.updatedByUserId
        }
      }
    );
  return updated;
}

function createShoppingListId(householdId: string): string {
  return `shopping_list_${stableSlug(householdId)}_${Date.now().toString(36)}`;
}

function createShoppingListLineId(
  shoppingListId: string,
  index: number,
  displayName: string
): string {
  return `shopping_list_line_${stableSlug(shoppingListId)}_${index + 1}_${stableSlug(displayName)}`;
}

function parseJsonObject(bodyText: string | undefined): Record<string, unknown> | null {
  if (!bodyText) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(bodyText);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function readSingleString(value: string | string[] | undefined): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;

  return typeof candidate === "string" && candidate.trim().length > 0 ? candidate.trim() : null;
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
