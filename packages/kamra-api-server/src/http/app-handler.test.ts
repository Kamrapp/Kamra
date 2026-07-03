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

  it("rejects ingestion snapshot list requests for a valid non-admin token", async () => {
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
      path: "/api/admin/ingestion/snapshots"
    });

    expect(response.status).toBe(401);
    expect(JSON.parse(response.body)).toEqual({
      error: "unauthorized",
      message: "Sign in as an admin to view ingestion snapshots."
    });
  });

  it("returns ingestion snapshots with a valid admin token", async () => {
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
        path: "/api/admin/ingestion/snapshots"
      },
      {
        createCatalogRepository: () => ({
          findProcessingState: async () => ({
            attemptCount: 1,
            createdAt: "2026-07-02T09:00:00.000Z",
            id: "state_simple",
            lastProcessedAt: "2026-07-02T09:01:00.000Z",
            processorName: "SourceOfferProcessor",
            processorVersion: "0.1.0",
            recordFingerprint: "fingerprint",
            sourceName: "simple_html_table_shop",
            state: "processed",
            updatedAt: "2026-07-02T09:01:00.000Z"
          }),
          listCatalogProductsForReview: async () => []
        }),
        createIngestionRepository: () => ({
          findRawSnapshotById: async () => null,
          listRawSnapshots: async () => [createIngestionSnapshot()],
          setupCollections: async () => undefined
        }),
        getMongoClient: async () => ({
          db: () => ({})
        } as never)
      }
    );

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      snapshots: [
        {
          id: "simple_html_table_shop:weekly-html-table:2026-07-02",
          parsedRowCount: 1,
          processingState: {
            state: "processed"
          },
          rows: [
            {
              displayName: "Pilos UHT tej 2,8% 1 l",
              priceValue: 469,
              sourceProductKey: "simple-milk"
            }
          ],
          sourceName: "simple_html_table_shop"
        }
      ]
    });
  });

  it("processes one ingestion snapshot with a valid admin token", async () => {
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
    const upsertCatalogSeedDataset = vi.fn(async () => undefined);

    const response = await handleAppRequest(
      {
        bodyText: JSON.stringify({
          snapshotId: "simple_html_table_shop:weekly-html-table:2026-07-02"
        }),
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "POST",
        path: "/api/admin/ingestion/process-snapshot"
      },
      {
        createCatalogRepository: () => ({
          listCatalogProductsForReview: async () => [],
          setupCollections: async () => undefined,
          upsertCatalogSeedDataset
        }),
        createIngestionRepository: () => ({
          findRawSnapshotById: async () => createIngestionSnapshot(),
          listRawSnapshots: async () => [],
          setupCollections: async () => undefined
        }),
        getMongoClient: async () => ({
          db: () => ({})
        } as never)
      }
    );

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      processedRowCount: 1,
      skippedRowCount: 0,
      snapshotId: "simple_html_table_shop:weekly-html-table:2026-07-02"
    });
    expect(upsertCatalogSeedDataset).toHaveBeenCalledOnce();
  });
});

function createIngestionSnapshot() {
  return {
    capturedAt: "2026-07-02T09:00:00.000Z",
    contentHash: "abc123",
    contentType: "text/html",
    crawlDate: "2026-07-02",
    crawlRunId: "synthetic-html-table-shop:simple_html_table_shop:2026-07-02",
    id: "simple_html_table_shop:weekly-html-table:2026-07-02",
    parserName: "SimpleHtmlTableShopAdapter",
    parserVersion: "1.0.0",
    parsedRows: [
      {
        countryCode: "HU" as const,
        displayName: "Pilos UHT tej 2,8% 1 l",
        observedAt: "2026-07-02T09:00:00.000Z",
        priceObservations: [
          {
            currencyCode: "HUF" as const,
            observedAt: "2026-07-02T09:00:00.000Z",
            price: 469,
            priceKind: "base" as const
          }
        ],
        sourceName: "simple_html_table_shop",
        sourceProductKey: "simple-milk",
        sourceRecordId: "simple_html_table_shop:weekly-html-table:2026-07-02:row-1",
        stock: {
          availability: "infinite" as const,
          countryCode: "HU" as const
        },
        storeBrandKey: "simple-html-table-shop"
      }
    ],
    payloadText: "<table></table>",
    sourceName: "simple_html_table_shop",
    sourceRecordId: "weekly-html-table",
    sourceUrl: "https://example.invalid/simple-html-table-shop",
    workflowName: "synthetic-html-table-shop"
  };
}
