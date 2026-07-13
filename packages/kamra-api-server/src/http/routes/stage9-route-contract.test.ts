import { describe, expect, it } from "vitest";
import type { AuthenticatedUser } from "../../auth/user-auth.js";
import type { AppConfig } from "../../config/app-config.js";
import type { AppRequest, AppRouteContext } from "../app-route-context.js";
import { createFakeDb, FakeCollection } from "../../test-support/fake-mongo.js";
import { adminIngestionSubmissionsRoute } from "./stage9-admin-routes.js";
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
});

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
