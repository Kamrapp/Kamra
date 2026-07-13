import { strict as assert } from "node:assert";
import { randomUUID } from "node:crypto";

import type { Db } from "mongodb";
import { createUserToken } from "../packages/kamra-api-server/src/auth/user-token.js";
import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import type {
  HouseholdProduct,
  AcceptanceCriteria,
  ShoppingNeedList
} from "../packages/kamra-api-server/src/household/v2/contracts.js";
import { MongoHouseholdProductRepository } from "../packages/kamra-api-server/src/household/v2/mongo-household-product-repository.js";
import { MongoShoppingNeedRepository } from "../packages/kamra-api-server/src/household/v2/mongo-shopping-need-repository.js";
import { MongoShoppingTripRepository } from "../packages/kamra-api-server/src/household/v2/mongo-shopping-trip-repository.js";
import {
  handleAppRequest,
  type AppRequest,
  type AppResponse
} from "../packages/kamra-api-server/src/http/app-handler.js";
import {
  closeMongoClient,
  getMongoClient
} from "../packages/kamra-api-server/src/db/mongo-client.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";

const allowedDatabasePattern = /^kamra_(dev|test|smoke)$/;

async function runShoppingTripSmoke(): Promise<void> {
  const runId = `stage11-shopping-trip-${randomUUID()}`;
  if (!process.env["AUTH_TOKEN_SECRET"]?.trim()) {
    process.env["AUTH_TOKEN_SECRET"] = runId;
  }
  const config = readAppConfig();
  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    throw new Error("MongoDB configuration is required for Shopping Trip smoke validation.");
  }
  if (!allowedDatabasePattern.test(config.mongodb.databaseName)) {
    throw new Error(
      `Refusing to write Shopping Trip smoke data to database '${config.mongodb.databaseName}'. Use kamra_dev, kamra_test, or kamra_smoke.`
    );
  }

  const actorUserId = `${runId}@kamra.test`;
  const householdId = `household:${runId}`;
  const marketId = `shop-market:${runId}`;
  const shopProductId = `shop-product:${runId}`;
  const priceObservationId = `price-observation:${runId}`;
  const householdProductId = `household-product:${runId}:milk`;
  const shoppingNeedListId = `shopping-needs:${runId}`;
  const milkNeedId = `need:${runId}:milk`;
  const breadNeedId = `need:${runId}:bread`;
  const completionOperationId = `trip-complete:${runId}:milk`;
  const database = (await getMongoClient(config.mongodb.uri, config.mongodb.dnsServers)).db(
    config.mongodb.databaseName
  );
  let tripId = "";
  const createdAt = new Date().toISOString();
  const authToken = createUserToken({
    email: actorUserId,
    maxAgeSeconds: 60 * 60,
    role: "admin",
    secret: process.env["AUTH_TOKEN_SECRET"]!
  });

  try {
    await database.collection("households").insertOne({
      allowExpiredItems: true,
      createdAt,
      createdByUserId: actorUserId,
      groupTargetShoppingMode: "add_products_and_group_item",
      id: householdId,
      name: `Shopping Trip smoke ${runId}`,
      status: "active",
      updatedAt: createdAt
    });
    await database.collection("household_memberships").insertOne({
      createdAt,
      householdId,
      id: `membership:${runId}`,
      role: "owner",
      status: "active",
      updatedAt: createdAt,
      userId: actorUserId
    });

    await Promise.all([
      new MongoHouseholdProductRepository(database).setupCollections(),
      new MongoShoppingNeedRepository(database).setupCollections(),
      new MongoShoppingTripRepository(database).setupCollections()
    ]);

    const product: HouseholdProduct = {
      catalogProductId: `catalog-product:${runId}:milk`,
      classificationRevision: 0,
      createdAt,
      createdByUserId: actorUserId,
      defaultTrackingUnit: "l",
      directAttributes: [],
      directConcepts: [],
      displayName: "Smoke milk",
      householdId,
      id: householdProductId,
      identityKind: "manual",
      identitySnapshot: {},
      note: null,
      productGroupId: null,
      revision: 0,
      status: "active",
      targetPolicy: null,
      updatedAt: createdAt,
      updatedByUserId: actorUserId
    };
    await database.collection<HouseholdProduct>("household_products").insertOne(product);

    const acceptanceCriteria: AcceptanceCriteria = {
      acceptedAttributesAny: [],
      acceptedConceptsAny: [],
      excludedAttributesAny: [],
      requiredAttributesAll: [],
      requiredConceptsAll: []
    };
    const needs: ShoppingNeedList = {
      createdAt,
      createdByUserId: actorUserId,
      householdId,
      id: shoppingNeedListId,
      items: [
        {
          acceptanceCriteriaSnapshot: acceptanceCriteria,
          id: milkNeedId,
          ownerDisplayNameSnapshot: product.displayName,
          ownerId: householdProductId,
          ownerKind: "household_product",
          plannedQuantity: 2,
          preferredProductId: product.catalogProductId,
          preferredProductNameSnapshot: product.displayName,
          reasonCode: "below_minimum",
          revision: 0,
          state: "open",
          unit: "l"
        },
        {
          acceptanceCriteriaSnapshot: acceptanceCriteria,
          id: breadNeedId,
          ownerDisplayNameSnapshot: "Smoke bread",
          ownerKind: "manual",
          plannedQuantity: 1,
          reasonCode: "manual",
          revision: 0,
          state: "open",
          unit: "l"
        }
      ],
      updatedAt: createdAt,
      updatedByUserId: actorUserId
    };
    await database.collection<ShoppingNeedList>("household_shopping_need_lists").insertOne(needs);

    const market = await send(authToken, {
      bodyText: JSON.stringify({
        aliases: ["stage11-smoke"],
        countryCode: "HU",
        currencyCode: "HUF",
        displayName: "Stage 11 Smoke Market",
        id: marketId
      }),
      method: "POST",
      path: "/api/admin/shop-markets"
    });
    assert.equal(market.status, 201, market.body);

    const shopProduct = await send(authToken, {
      bodyText: JSON.stringify({
        displayName: "Smoke milk 1 l",
        id: shopProductId,
        packageQuantity: 1,
        packageUnit: "l",
        productId: product.catalogProductId,
        shopMarketId: marketId
      }),
      method: "POST",
      path: "/api/admin/shop-products"
    });
    assert.equal(shopProduct.status, 201, shopProduct.body);

    const price = await send(authToken, {
      bodyText: JSON.stringify({
        currencyCode: "HUF",
        id: priceObservationId,
        kind: "base",
        observedAt: createdAt,
        price: 499,
        shopProductId
      }),
      method: "POST",
      path: "/api/admin/price-observations"
    });
    assert.equal(price.status, 201, price.body);

    const tripResponse = await send(authToken, {
      bodyText: JSON.stringify({
        plannedDate: "2026-07-13",
        shopMarketId: marketId,
        shoppingNeedListId
      }),
      method: "POST",
      path: `/api/households/${encodeURIComponent(householdId)}/shopping-trips`
    });
    assert.equal(tripResponse.status, 201, tripResponse.body);
    const createdTrip = readResult(tripResponse);
    tripId = createdTrip.id;
    assert.equal(createdTrip.items.length, 2);
    assert.equal(
      createdTrip.items.every((item) => item.planStatus === "selected"),
      true
    );

    const transitions = ["matching", "ready", "in_progress"] as const;
    let tripRevision = createdTrip.revision;
    for (const transition of transitions) {
      const response = await send(authToken, {
        bodyText: JSON.stringify({ expectedRevision: tripRevision, transition }),
        method: "PATCH",
        path: `/api/households/${encodeURIComponent(householdId)}/shopping-trips/${encodeURIComponent(tripId)}`
      });
      assert.equal(response.status, 200, response.body);
      tripRevision = readResult(response).revision;
    }

    const completion = await send(authToken, {
      bodyText: JSON.stringify({
        items: [
          {
            acquiredOn: "2026-07-13",
            actualCurrencyCode: "HUF",
            actualPaidPrice: 499,
            actualQuantity: 2,
            actualUnit: "l",
            expiryOn: "2026-07-20",
            householdProductId,
            itemId: tripItemId(createdTrip.items, milkNeedId),
            resultStatus: "bought"
          }
        ],
        operationId: completionOperationId
      }),
      method: "POST",
      path: `/api/households/${encodeURIComponent(householdId)}/shopping-trips/${encodeURIComponent(tripId)}/complete`
    });
    assert.equal(completion.status, 200, completion.body);
    assert.equal(readResult(completion).status, "partially_processed");

    const submissionId = `ingestion-submission:${tripId}:${tripItemId(createdTrip.items, milkNeedId)}`;
    const review = await send(authToken, {
      bodyText: JSON.stringify({ expectedRevision: 0, note: "Smoke accepted", status: "accepted" }),
      method: "PATCH",
      path: `/api/admin/ingestion-submissions/${encodeURIComponent(submissionId)}`
    });
    assert.equal(review.status, 200, review.body);

    const staleReview = await send(authToken, {
      bodyText: JSON.stringify({ expectedRevision: 0, status: "rejected" }),
      method: "PATCH",
      path: `/api/admin/ingestion-submissions/${encodeURIComponent(submissionId)}`
    });
    assert.equal(staleReview.status, 409, staleReview.body);

    const retry = await send(authToken, {
      bodyText: JSON.stringify({
        items: [
          {
            acquiredOn: "2026-07-13",
            actualCurrencyCode: "HUF",
            actualPaidPrice: 499,
            actualQuantity: 2,
            actualUnit: "l",
            expiryOn: "2026-07-20",
            householdProductId,
            itemId: tripItemId(createdTrip.items, milkNeedId),
            resultStatus: "bought"
          }
        ],
        operationId: completionOperationId
      }),
      method: "POST",
      path: `/api/households/${encodeURIComponent(householdId)}/shopping-trips/${encodeURIComponent(tripId)}/complete`
    });
    assert.equal(retry.status, 200, retry.body);
    assert.equal(readResult(retry).status, "partially_processed");

    const finish = await send(authToken, {
      bodyText: JSON.stringify({
        items: [
          {
            itemId: tripItemId(createdTrip.items, breadNeedId),
            resultStatus: "not_bought"
          }
        ],
        operationId: `${completionOperationId}:finish`
      }),
      method: "POST",
      path: `/api/households/${encodeURIComponent(householdId)}/shopping-trips/${encodeURIComponent(tripId)}/complete`
    });
    assert.equal(finish.status, 200, finish.body);
    assert.equal(readResult(finish).status, "completed");

    const [batchCount, submissionCount, operationCount, storedSubmission] = await Promise.all([
      database.collection("household_stock_batches").countDocuments({ householdId }),
      database.collection("ingestion_submissions").countDocuments({ householdId }),
      database.collection("household_domain_operations").countDocuments({ householdId }),
      database.collection("ingestion_submissions").findOne({ id: submissionId })
    ]);
    assert.equal(batchCount, 1);
    assert.equal(submissionCount, 1);
    assert.equal(operationCount, 1);
    assert.deepEqual(storedSubmission?.["facts"], {
      acquiredOn: "2026-07-13",
      currencyCode: "HUF",
      displayName: product.displayName,
      expiryOn: "2026-07-20",
      paidPrice: 499,
      productId: householdProductId,
      quantity: 2,
      shopMarketId: marketId,
      shopProductId,
      unit: "l"
    });

    writeServerLog("info", "Shopping Trip smoke validation completed", {
      databaseName: database.databaseName,
      householdId,
      runId,
      tripId
    });
  } finally {
    await cleanup(database, {
      householdId,
      marketId,
      priceObservationId,
      shopProductId
    });
  }
}

async function send(token: string, request: Omit<AppRequest, "headers">): Promise<AppResponse> {
  return await handleAppRequest({
    ...request,
    headers: { authorization: `Bearer ${token}` }
  });
}

function readResult(response: AppResponse): {
  id: string;
  items: Array<{ id: string; needId: string; planStatus: string }>;
  revision: number;
  status: string;
} {
  const body = JSON.parse(response.body) as { result?: unknown };
  if (!body.result || typeof body.result !== "object") {
    throw new Error(`Shopping Trip smoke response has no result: ${response.body}`);
  }
  return body.result as {
    id: string;
    items: Array<{ id: string; needId: string; planStatus: string }>;
    revision: number;
    status: string;
  };
}

function tripItemId(items: Array<{ id: string; needId: string }>, needId: string): string {
  const item = items.find((candidate) => candidate.needId === needId);
  if (!item) throw new Error(`Shopping Trip smoke item '${needId}' is missing.`);
  return item.id;
}

async function cleanup(
  database: Db,
  ids: {
    householdId: string;
    marketId: string;
    priceObservationId: string;
    shopProductId: string;
  }
): Promise<void> {
  const householdCollections = [
    "household_domain_operations",
    "household_memberships",
    "household_products",
    "household_shopping_need_lists",
    "household_shopping_trips",
    "household_stock_batches",
    "household_stock_movements",
    "ingestion_submissions"
  ];
  for (const collectionName of householdCollections) {
    await database.collection(collectionName).deleteMany({ householdId: ids.householdId });
  }
  await database.collection("households").deleteMany({ id: ids.householdId });
  await database.collection("shop_price_observations").deleteMany({
    id: ids.priceObservationId,
    shopProductId: ids.shopProductId
  });
  await database.collection("shop_products").deleteMany({ id: ids.shopProductId });
  await database.collection("shop_markets").deleteMany({ id: ids.marketId });
}

try {
  await runShoppingTripSmoke();
} catch (error) {
  writeServerLog("error", "Shopping Trip smoke validation failed", error);
  process.exitCode = 1;
} finally {
  await closeMongoClient();
}
