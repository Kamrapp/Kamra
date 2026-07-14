import { describe, expect, it } from "vitest";
import type { OptionalUnlessRequiredId } from "mongodb";
import type { AuthenticatedUser } from "../../auth/user-auth.js";
import type { AppConfig } from "../../config/app-config.js";
import type { AppRequest, AppRouteContext } from "../app-route-context.js";
import { createFakeDb, FakeCollection } from "../../test-support/fake-mongo.js";
import {
  adminIngestionSubmissionsRoute,
  adminPriceObservationsRoute,
  adminShopMarketsRoute,
  adminShopProductsRoute
} from "./stage9-admin-routes.js";
import { householdV2ShopMarketsRoute } from "./household-v2-routes.js";

const householdId = "household:demo";

describe("Stage 9 route contracts", () => {
  it("requires household membership before listing active Shop Markets", async () => {
    const database = createFakeDb({
      household_memberships: new FakeCollection("household_memberships", [
        { householdId, status: "active", userId: "member@example.test" }
      ]),
      shop_markets: new FakeCollection("shop_markets", [
        {
          countryCode: "HU",
          displayName: "Archived market",
          id: "market:archived",
          status: "archived"
        },
        {
          countryCode: "HU",
          displayName: "Lidl Hungary",
          id: "market:lidl-hu",
          status: "active"
        }
      ])
    });
    const request: AppRequest = {
      headers: {},
      method: "GET",
      path: `/api/households/${encodeURIComponent(householdId)}/shop-markets`
    };

    const denied = await householdV2ShopMarketsRoute.handle(
      request,
      createContext(database, { email: "outsider@example.test", role: "user" })
    );
    expect(denied.status).toBe(403);

    const allowed = await householdV2ShopMarketsRoute.handle(
      request,
      createContext(database, { email: "member@example.test", role: "user" })
    );
    expect(allowed.status).toBe(200);
    expect(JSON.parse(allowed.body)).toEqual({
      markets: [
        {
          countryCode: "HU",
          currencyCode: undefined,
          displayName: "Lidl Hungary",
          id: "market:lidl-hu",
          status: "active"
        }
      ]
    });
  });

  it("keeps ingestion review admin-only and returns bounded history metadata", async () => {
    const database = createFakeDb({
      ingestion_submissions: new FakeCollection("ingestion_submissions", [
        {
          createdAt: "2026-07-13T01:00:00.000Z",
          id: "submission:1",
          status: "pending"
        },
        {
          createdAt: "2026-07-13T00:00:00.000Z",
          id: "submission:2",
          status: "pending"
        }
      ])
    });
    const request: AppRequest = {
      headers: {},
      method: "GET",
      path: "/api/admin/ingestion-submissions",
      query: { page: "1", pageSize: "1", status: "pending" }
    };

    const denied = await adminIngestionSubmissionsRoute.handle(
      request,
      createContext(database, { email: "member@example.test", role: "user" })
    );
    expect(denied.status).toBe(401);

    const allowed = await adminIngestionSubmissionsRoute.handle(
      request,
      createContext(database, { email: "admin@example.test", role: "admin" })
    );
    expect(allowed.status).toBe(200);
    expect(JSON.parse(allowed.body)).toMatchObject({
      pagination: { hasNextPage: true, page: 1, pageSize: 1 },
      submissions: [{ id: "submission:1" }]
    });
  });

  it("validates and maps the Shop Market, Shop Product, and Price Observation admin contracts", async () => {
    const database = createFakeDb({
      shop_markets: new UniqueIdCollection("shop_markets"),
      shop_products: new UniqueIdCollection("shop_products"),
      shop_price_observations: new UniqueIdCollection("shop_price_observations")
    });
    const context = createContext(database, { email: "admin@example.test", role: "admin" });

    expect(
      (
        await adminShopMarketsRoute.handle(
          request("POST", "/api/admin/shop-markets", { id: "", displayName: "Lidl" }),
          context
        )
      ).status
    ).toBe(400);
    expect(
      (
        await adminShopMarketsRoute.handle(
          request("POST", "/api/admin/shop-markets", {
            countryCode: "HU",
            currencyCode: "HUF",
            displayName: "Lidl Hungary",
            id: "market:lidl"
          }),
          context
        )
      ).status
    ).toBe(201);
    expect(
      (
        await adminShopMarketsRoute.handle(
          request("POST", "/api/admin/shop-markets", {
            countryCode: "HU",
            currencyCode: "HUF",
            displayName: "Lidl Hungary",
            id: "market:lidl"
          }),
          context
        )
      ).status
    ).toBe(409);

    expect(
      (
        await adminShopProductsRoute.handle(
          request("POST", "/api/admin/shop-products", {
            displayName: "Milk",
            id: "shop-product:milk",
            packageQuantity: 0,
            packageUnit: "l",
            productId: "product:milk",
            shopMarketId: "market:lidl"
          }),
          context
        )
      ).status
    ).toBe(400);
    expect(
      (
        await adminShopProductsRoute.handle(
          request("POST", "/api/admin/shop-products", {
            displayName: "Milk",
            id: "shop-product:milk",
            packageQuantity: 1,
            packageUnit: "l",
            productId: "product:milk",
            shopMarketId: "market:lidl"
          }),
          context
        )
      ).status
    ).toBe(201);
    expect(
      (
        await adminShopProductsRoute.handle(
          request("POST", "/api/admin/shop-products", {
            displayName: "Milk",
            id: "shop-product:milk",
            packageQuantity: 1,
            packageUnit: "l",
            productId: "product:milk",
            shopMarketId: "market:lidl"
          }),
          context
        )
      ).status
    ).toBe(409);

    const invalidPrice = await adminPriceObservationsRoute.handle(
      request("POST", "/api/admin/price-observations", {
        currencyCode: "HUF",
        id: "price:milk",
        kind: "unknown",
        observedAt: "2026-07-13T10:00:00.000Z",
        price: 499,
        shopProductId: "shop-product:milk"
      }),
      context
    );
    expect(invalidPrice.status).toBe(400);

    const validPriceRequest = request("POST", "/api/admin/price-observations", {
      currencyCode: "HUF",
      id: "price:milk",
      kind: "base",
      observedAt: "2026-07-13T10:00:00.000Z",
      price: 499,
      shopProductId: "shop-product:milk"
    });
    expect((await adminPriceObservationsRoute.handle(validPriceRequest, context)).status).toBe(201);
    expect((await adminPriceObservationsRoute.handle(validPriceRequest, context)).status).toBe(409);
  });

  it("preserves submitted facts across accepted, corrected, and rejected reviews", async () => {
    const database = createFakeDb({
      ingestion_submissions: new FakeCollection("ingestion_submissions", [
        createSubmission("accepted"),
        createSubmission("corrected"),
        createSubmission("rejected")
      ])
    });
    const adminContext = createContext(database, { email: "admin@example.test", role: "admin" });
    const memberContext = createContext(database, { email: "member@example.test", role: "user" });

    const denied = await adminIngestionSubmissionsRoute.handle(
      request("PATCH", "/api/admin/ingestion-submissions/submission:accepted", {
        expectedRevision: 0,
        status: "accepted"
      }),
      memberContext
    );
    expect(denied.status).toBe(401);

    for (const status of ["accepted", "corrected", "rejected"] as const) {
      const response = await adminIngestionSubmissionsRoute.handle(
        request("PATCH", `/api/admin/ingestion-submissions/submission:${status}`, {
          expectedRevision: 0,
          note: `${status} note`,
          status
        }),
        adminContext
      );
      expect(response.status).toBe(200);
      expect(JSON.parse(response.body)).toMatchObject({
        submission: {
          facts: { actualPaidPrice: 799, displayName: "Milk 1 l", quantity: 2 },
          reviewNote: `${status} note`,
          status
        }
      });
    }

    const stale = await adminIngestionSubmissionsRoute.handle(
      request("PATCH", "/api/admin/ingestion-submissions/submission:accepted", {
        expectedRevision: 0,
        status: "rejected"
      }),
      adminContext
    );
    expect(stale.status).toBe(409);
    expect(JSON.parse(stale.body)).toEqual({ error: "ingestion_submission_revision_conflict" });

    const alreadyReviewed = await adminIngestionSubmissionsRoute.handle(
      request("PATCH", "/api/admin/ingestion-submissions/submission:accepted", {
        expectedRevision: 1,
        status: "rejected"
      }),
      adminContext
    );
    expect(alreadyReviewed.status).toBe(409);
    expect(JSON.parse(alreadyReviewed.body)).toEqual({
      error: "ingestion_submission_already_reviewed"
    });
  });
});

function request(
  method: "PATCH" | "POST",
  path: string,
  body: Record<string, unknown>
): AppRequest {
  return {
    bodyText: JSON.stringify(body),
    headers: {},
    method,
    path
  };
}

function createSubmission(id: "accepted" | "corrected" | "rejected") {
  return {
    createdAt: "2026-07-13T10:00:00.000Z",
    facts: {
      acquiredOn: "2026-07-13",
      actualPaidPrice: 799,
      currencyCode: "HUF",
      displayName: "Milk 1 l",
      expiryOn: "2026-07-20",
      quantity: 2,
      shopMarketId: "market:lidl",
      unit: "l"
    },
    householdId,
    id: `submission:${id}`,
    revision: 0,
    shoppingTripId: "trip:1",
    shoppingTripItemId: `trip-item:${id}`,
    status: "pending",
    submittedByUserId: "member@example.test",
    updatedAt: "2026-07-13T10:00:00.000Z"
  };
}

class UniqueIdCollection extends FakeCollection<Record<string, unknown>> {
  override async insertOne(doc: OptionalUnlessRequiredId<Record<string, unknown>>) {
    if (this.docs.some((existing) => existing["id"] === doc["id"])) {
      throw Object.assign(new Error("duplicate key"), { code: 11000 });
    }
    return await super.insertOne(doc);
  }
}

function createContext(
  database: ReturnType<typeof createFakeDb>,
  user: Partial<AuthenticatedUser>
) {
  return {
    authenticateRequestUser: () => ({
      email: user.email ?? "user@example.test",
      profile: {},
      role: user.role ?? "user"
    }),
    config: {
      mongodb: {
        databaseName: "kamra_test",
        dnsServers: [],
        uri: "mongodb://example.test"
      }
    } as unknown as AppConfig,
    dependencies: {},
    getMongoClient: async () => ({ db: () => database })
  } as unknown as AppRouteContext;
}
