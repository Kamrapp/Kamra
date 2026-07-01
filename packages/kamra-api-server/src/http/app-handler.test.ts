import { afterEach, describe, expect, it, vi } from "vitest";

import { createUserToken } from "../auth/user-token.js";
import { handleAppRequest } from "./app-handler.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("handleAppRequest auth guards", () => {
  it("rejects health checks without a user token", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");

    const response = await handleAppRequest({
      headers: {},
      method: "GET",
      path: "/api/health"
    });

    expect(response.status).toBe(401);
    expect(JSON.parse(response.body)).toEqual({
      error: "unauthorized",
      message: "Sign in as an admin to view this resource."
    });
  });

  it("allows health checks with a valid admin user token", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");

    const token = createUserToken({
      email: "admin@kamra.test",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "admin",
      secret: "test-secret"
    });

    const response = await handleAppRequest({
      headers: {
        authorization: `Bearer ${token}`
      },
      method: "GET",
      path: "/api/health"
    });

    expect(response.status).toBe(503);
    expect(JSON.parse(response.body)).toMatchObject({
      checks: {
        api: {
          status: "ok"
        },
        database: {
          status: "not_configured"
        }
      },
      status: "degraded"
    });
  });

  it("allows current-user lookup with a valid non-admin token", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");

    const token = createUserToken({
      email: "user@kamra.test",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "user",
      secret: "test-secret"
    });

    const response = await handleAppRequest({
      headers: {
        authorization: `Bearer ${token}`
      },
      method: "GET",
      path: "/api/admin/me"
    });

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      user: {
        email: "user@kamra.test",
        role: "user"
      }
    });
  });

  it("rejects health checks for a valid non-admin token", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");

    const token = createUserToken({
      email: "user@kamra.test",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "user",
      secret: "test-secret"
    });

    const response = await handleAppRequest({
      headers: {
        authorization: `Bearer ${token}`
      },
      method: "GET",
      path: "/api/health"
    });

    expect(response.status).toBe(401);
    expect(JSON.parse(response.body)).toEqual({
      error: "unauthorized",
      message: "Sign in as an admin to view this resource."
    });
  });

  it("rejects admin product list requests for a valid non-admin token", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");

    const token = createUserToken({
      email: "user@kamra.test",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "user",
      secret: "test-secret"
    });

    const response = await handleAppRequest({
      headers: {
        authorization: `Bearer ${token}`
      },
      method: "GET",
      path: "/api/catalog/products"
    });

    expect(response.status).toBe(401);
    expect(JSON.parse(response.body)).toEqual({
      error: "unauthorized",
      message: "Sign in as an admin to view this resource."
    });
  });

  it("returns admin products with a valid admin token", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");
    vi.stubEnv("MONGODB_URI", "mongodb+srv://example.mongodb.net/kamra");
    vi.stubEnv("MONGODB_DB_NAME", "kamra_test");

    const token = createUserToken({
      email: "admin@kamra.test",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "admin",
      secret: "test-secret"
    });

    const response = await handleAppRequest(
      {
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "GET",
        path: "/api/catalog/products"
      },
      {
        createCatalogRepository: () => ({
          listCatalogProductsForReview: async () => [
            {
              householdStockCount: 1,
              id: "product_uht_milk_2_8_1l",
              measurements: [],
              name: "UHT tej 2,8%",
              offers: [
                {
                  identifiers: [
                    {
                      kind: "retailer_product_id",
                      value: "lidl-pilos-uht-tej-28-1l"
                    }
                  ],
                  latestObservedAt: "2026-06-23T12:00:00.000Z",
                  locationKey: "availability:lidl-hu",
                  locationLabel: "Lidl Hungary",
                  prices: {
                    base: {
                      amount: 469,
                      currencyCode: "HUF",
                      observedAt: "2026-06-23T12:00:00.000Z",
                      unitPriceLabel: "469 Ft/l"
                    }
                  },
                  productSourceId: "product_source_lidl_hu_pilos_uht_28_1l",
                  sourceName: "lidl-hu",
                  sourceProductKey: "lidl-pilos-uht-tej-28-1l",
                  sourceProductName: "Pilos UHT tej 2,8% 1 l",
                  storeBrandKey: "lidl"
                }
              ],
              sourceNames: ["lidl-hu"],
              tagKeys: ["category.kitchen.dairy"]
            }
          ]
        }),
        getMongoClient: async () => ({
          db: () => ({})
        } as never)
      }
    );

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      products: [
          {
            householdStockCount: 1,
            id: "product_uht_milk_2_8_1l",
            measurements: [],
            name: "UHT tej 2,8%",
            offers: [
              {
                identifiers: [
                  {
                    kind: "retailer_product_id",
                    value: "lidl-pilos-uht-tej-28-1l"
                  }
                ],
                latestObservedAt: "2026-06-23T12:00:00.000Z",
                locationKey: "availability:lidl-hu",
                locationLabel: "Lidl Hungary",
                prices: {
                  base: {
                    amount: 469,
                    currencyCode: "HUF",
                    observedAt: "2026-06-23T12:00:00.000Z",
                    unitPriceLabel: "469 Ft/l"
                  }
                },
                productSourceId: "product_source_lidl_hu_pilos_uht_28_1l",
                sourceName: "lidl-hu",
                sourceProductKey: "lidl-pilos-uht-tej-28-1l",
                sourceProductName: "Pilos UHT tej 2,8% 1 l",
                storeBrandKey: "lidl"
              }
            ],
            sourceNames: ["lidl-hu"],
            tagKeys: ["category.kitchen.dairy"]
          }
      ]
    });
  });
});
