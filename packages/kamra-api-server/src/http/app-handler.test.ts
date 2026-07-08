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

  it("rejects legacy validation backfill without an admin token", async () => {
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
      method: "POST",
      path: "/api/health/backfill-unvalidated-products"
    });

    expect(response.status).toBe(401);
    expect(JSON.parse(response.body)).toEqual({
      error: "unauthorized",
      message: "Sign in as an admin to view this resource."
    });
  });

  it("backfills legacy products to unvalidated with a valid admin token", async () => {
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
        method: "POST",
        path: "/api/health/backfill-unvalidated-products"
      },
      {
        createCatalogRepository: () => ({
          markLegacyProductsUnvalidated: async () => {
            return {
              skippedCount: 0,
              status: "updated" as const,
              updatedCount: 42
            };
          },
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          })
        }),
        getMongoClient: async () => ({
          db: () => ({})
        } as never)
      }
    );

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      skippedCount: 0,
      status: "updated",
      updatedCount: 42
    });
  });

  it("upgrades catalog validators with a valid admin token", async () => {
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
        method: "POST",
        path: "/api/health/upgrade-catalog-validators"
      },
      {
        createCatalogRepository: () => ({
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          }),
          upgradeCatalogValidators: async () => ({
            createdCollections: [],
            databaseName: "kamra_test",
            upgradedCollections: ["products"]
          })
        }),
        getMongoClient: async () => ({
          db: () => ({})
        } as never)
      }
    );

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      createdCollections: [],
      databaseName: "kamra_test",
      upgradedCollections: ["products"]
    });
  });

  it("returns a stable error when catalog validator upgrade fails", async () => {
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
        method: "POST",
        path: "/api/health/upgrade-catalog-validators"
      },
      {
        createCatalogRepository: () => ({
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          }),
          upgradeCatalogValidators: async () => {
            throw new Error("collMod denied");
          }
        }),
        getMongoClient: async () => ({
          db: () => ({})
        } as never)
      }
    );

    expect(response.status).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: "catalog_validator_upgrade_failed",
      message: "Catalog collection validators could not be upgraded."
    });
  });

  it("reports validation fallback when the legacy product collection validator is old", async () => {
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
        method: "POST",
        path: "/api/health/backfill-unvalidated-products"
      },
      {
        createCatalogRepository: () => ({
          markLegacyProductsUnvalidated: async () => ({
            skippedCount: 12,
            status: "validator_incompatible" as const,
            updatedCount: 0
          }),
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          })
        }),
        getMongoClient: async () => ({
          db: () => ({})
        } as never)
      }
    );

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      skippedCount: 12,
      status: "validator_incompatible",
      updatedCount: 0
    });
  });

  it("returns a stable error when legacy validation backfill fails", async () => {
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
        method: "POST",
        path: "/api/health/backfill-unvalidated-products"
      },
      {
        createCatalogRepository: () => ({
          markLegacyProductsUnvalidated: async () => {
            throw new Error("Atlas rejected the product update.");
          },
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          })
        }),
        getMongoClient: async () => ({
          db: () => ({})
        } as never)
      }
    );

    expect(response.status).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: "catalog_backfill_failed",
      message: "Legacy products could not be marked as unvalidated."
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
    let requestedProductOptions: { limit?: number; nameIncludes?: string; offset?: number; sourceNames?: string[] } | undefined;

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
          listCatalogProductsForReview: async (options) => {
            requestedProductOptions = options;

            return {
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
              ],
              totalCount: 321
            };
          }
        }),
        getMongoClient: async () => ({
          db: () => ({})
        } as never)
      }
    );

    expect(response.status).toBe(200);
    expect(requestedProductOptions).toEqual({
      limit: 100,
      offset: 0,
      sourceNames: []
    });
    expect(JSON.parse(response.body)).toEqual({
      pagination: {
        page: 1,
        pageSize: 100,
        totalCount: 321,
        totalPages: 4
      },
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
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          })
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

  it("hides accepted product review rows from ingestion snapshots", async () => {
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
    const snapshot = createIngestionSnapshot([
      createParsedShopProductRow({
        displayName: "Accepted milk",
        sourceProductKey: "accepted-milk",
        sourceRecordId: "row-accepted"
      }),
      createParsedShopProductRow({
        displayName: "Pending bread",
        sourceProductKey: "pending-bread",
        sourceRecordId: "row-pending"
      })
    ]);

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
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          }),
          setupCollections: async () => undefined
        }),
        createIngestionRepository: () => ({
          findRawSnapshotById: async () => null,
          listProductReviewItems: async () => [
            {
              ...createProductReviewItem(),
              id: `${snapshot.id}:0`,
              rowIndex: 0,
              snapshotId: snapshot.id,
              status: "accepted" as const
            },
            {
              ...createProductReviewItem(),
              id: `${snapshot.id}:1`,
              rowIndex: 1,
              snapshotId: snapshot.id,
              status: "pending" as const
            }
          ],
          listRawSnapshots: async () => [snapshot],
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
          parsedRowCount: 1,
          rows: [
            {
              displayName: "Pending bread",
              sourceProductKey: "pending-bread"
            }
          ]
        }
      ]
    });
  });

  it("includes accepted product review rows when requested", async () => {
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
    const snapshot = createIngestionSnapshot([
      createParsedShopProductRow({
        displayName: "Accepted milk",
        sourceProductKey: "accepted-milk",
        sourceRecordId: "row-accepted"
      }),
      createParsedShopProductRow({
        displayName: "Pending bread",
        sourceProductKey: "pending-bread",
        sourceRecordId: "row-pending"
      })
    ]);

    const response = await handleAppRequest(
      {
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "GET",
        path: "/api/admin/ingestion/snapshots",
        query: {
          includeAccepted: "true"
        }
      },
      {
        createCatalogRepository: () => ({
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          }),
          setupCollections: async () => undefined
        }),
        createIngestionRepository: () => ({
          findRawSnapshotById: async () => null,
          listProductReviewItems: async () => [
            {
              ...createProductReviewItem(),
              id: `${snapshot.id}:0`,
              rowIndex: 0,
              snapshotId: snapshot.id,
              status: "accepted" as const
            }
          ],
          listRawSnapshots: async () => [snapshot],
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
          parsedRowCount: 2,
          rows: [
            {
              displayName: "Accepted milk",
              sourceProductKey: "accepted-milk"
            },
            {
              displayName: "Pending bread",
              sourceProductKey: "pending-bread"
            }
          ]
        }
      ]
    });
  });

  it("hides ingestion snapshots when all review rows are accepted", async () => {
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
    const snapshot = createIngestionSnapshot();

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
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          }),
          setupCollections: async () => undefined
        }),
        createIngestionRepository: () => ({
          findRawSnapshotById: async () => null,
          listProductReviewItems: async () => [
            {
              ...createProductReviewItem(),
              snapshotId: snapshot.id,
              status: "accepted" as const
            }
          ],
          listRawSnapshots: async () => [snapshot],
          setupCollections: async () => undefined
        }),
        getMongoClient: async () => ({
          db: () => ({})
        } as never)
      }
    );

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      snapshots: []
    });
  });

  it("passes catalog product pagination query values to the repository", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");
    vi.stubEnv("MONGODB_URI", "mongodb+srv://example.mongodb.net/kamra");
    vi.stubEnv("MONGODB_DB_NAME", "kamra_test");
    let requestedProductOptions: { limit?: number; offset?: number } | undefined;

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
        path: "/api/catalog/products",
        query: {
          nameIncludes: "tej",
          page: "3",
          pageSize: "50",
          source: "penny_hu_offers"
        }
      },
      {
        createCatalogRepository: () => ({
          listCatalogProductsForReview: async (options) => {
            requestedProductOptions = options;

            return {
              products: [],
              totalCount: 321
            };
          }
        }),
        getMongoClient: async () => ({
          db: () => ({})
        } as never)
      }
    );

    expect(response.status).toBe(200);
    expect(requestedProductOptions).toEqual({
      limit: 50,
      nameIncludes: "tej",
      offset: 100,
      sourceNames: ["penny_hu_offers"]
    });
    expect(JSON.parse(response.body)).toEqual({
      pagination: {
        page: 3,
        pageSize: 50,
        totalCount: 321,
        totalPages: 7
      },
      products: []
    });
  });

  it("returns catalog offer source names independently from product pages", async () => {
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
        path: "/api/catalog/sources"
      },
      {
        createCatalogRepository: () => ({
          listCatalogOfferSourceNames: async () => [
            "aldi-hu-offers",
            "lidl-hu-brochure",
            "penny_hu_offers"
          ],
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          })
        }),
        getMongoClient: async () => ({
          db: () => ({})
        } as never)
      }
    );

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      sourceNames: [
        "aldi-hu-offers",
        "lidl-hu-brochure",
        "penny_hu_offers"
      ]
    });
  });

  it("updates a catalog product with a valid admin token", async () => {
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
    let updateInput: unknown;

    const response = await handleAppRequest(
      {
        bodyText: JSON.stringify({
          brandName: "Kamra",
          id: "product_1",
          name: "Corrected milk"
        }),
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "PATCH",
        path: "/api/catalog/product"
      },
      {
        createCatalogRepository: () => ({
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          }),
          updateCatalogProduct: async (input) => {
            updateInput = input;
            return {
              brandName: input.brandName,
              householdStockCount: 0,
              id: input.id,
              measurements: [],
              name: input.name ?? "Corrected milk",
              offers: [],
              sourceNames: [],
              tagKeys: [],
              validationStatus: "unvalidated"
            };
          }
        }),
        getMongoClient: async () => ({
          db: () => ({})
        } as never)
      }
    );

    expect(response.status).toBe(200);
    expect(updateInput).toMatchObject({
      brandName: "Kamra",
      id: "product_1",
      name: "Corrected milk"
    });
    expect(JSON.parse(response.body)).toMatchObject({
      product: {
        brandName: "Kamra",
        id: "product_1",
        name: "Corrected milk"
      }
    });
  });

  it("invalidates a catalog product with the admin user recorded", async () => {
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
    let validationInput: unknown;

    const response = await handleAppRequest(
      {
        bodyText: JSON.stringify({
          id: "product_1",
          note: "Bad crawler name."
        }),
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "POST",
        path: "/api/catalog/product/invalidate"
      },
      {
        createCatalogRepository: () => ({
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          }),
          setCatalogProductValidationStatus: async (input) => {
            validationInput = input;
            return {
              householdStockCount: 0,
              id: input.id,
              measurements: [],
              name: "Bad item",
              offers: [],
              sourceNames: [],
              tagKeys: [],
              validationStatus: input.status
            };
          }
        }),
        getMongoClient: async () => ({
          db: () => ({})
        } as never)
      }
    );

    expect(response.status).toBe(200);
    expect(validationInput).toMatchObject({
      id: "product_1",
      note: "Bad crawler name.",
      reviewerId: "admin@kamra.test",
      status: "invalid"
    });
    expect(JSON.parse(response.body)).toMatchObject({
      product: {
        id: "product_1",
        validationStatus: "invalid"
      }
    });
  });

  it("hard-deletes a catalog product with a valid admin token", async () => {
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
        method: "DELETE",
        path: "/api/catalog/product",
        query: {
          id: "product_1"
        }
      },
      {
        createCatalogRepository: () => ({
          deleteCatalogProduct: async (id) => ({
            deletedIdentifierCount: id === "product_1" ? 1 : 0,
            deletedPriceObservationCount: 2,
            deletedProductCount: 1,
            deletedProductSourceCount: 1,
            deletedStockCount: 1,
            deletedTagAssignmentCount: 1
          }),
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          })
        }),
        getMongoClient: async () => ({
          db: () => ({})
        } as never)
      }
    );

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      id: "product_1",
      result: {
        deletedIdentifierCount: 1,
        deletedPriceObservationCount: 2,
        deletedProductCount: 1,
        deletedProductSourceCount: 1,
        deletedStockCount: 1,
        deletedTagAssignmentCount: 1
      }
    });
  });

  it("prepares product review items for one ingestion snapshot", async () => {
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
    const reviewItem = createProductReviewItem();

    const response = await handleAppRequest(
      {
        bodyText: JSON.stringify({ snapshotId: "simple_html_table_shop:weekly-html-table:2026-07-02" }),
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "POST",
        path: "/api/admin/ingestion/prepare-review-items"
      },
      {
        createCatalogRepository: () => ({
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          }),
          setupCollections: async () => undefined
        }),
        createIngestionRepository: () => ({
          findRawSnapshotById: async () => createIngestionSnapshot(),
          listRawSnapshots: async () => [],
          prepareProductReviewItems: async () => [reviewItem],
          setupCollections: async () => undefined
        }),
        getMongoClient: async () => ({
          db: () => ({})
        } as never)
      }
    );

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      preparedCount: 1,
      reviewItems: [
        {
          id: reviewItem.id,
          status: "pending"
        }
      ],
      snapshotId: "simple_html_table_shop:weekly-html-table:2026-07-02"
    });
  });

  it("lists product review items with filters", async () => {
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
    let requestedOptions: unknown;
    const reviewItem = createProductReviewItem();

    const response = await handleAppRequest(
      {
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "GET",
        path: "/api/admin/ingestion/review-items",
        query: {
          limit: "20",
          offset: "40",
          snapshotId: "snapshot-1",
          sourceName: "lidl-hu-brochure",
          status: "pending,declined"
        }
      },
      {
        createCatalogRepository: () => ({
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          }),
          setupCollections: async () => undefined
        }),
        createIngestionRepository: () => ({
          findRawSnapshotById: async () => null,
          listProductReviewItems: async (options) => {
            requestedOptions = options;
            return [reviewItem];
          },
          listRawSnapshots: async () => [],
          setupCollections: async () => undefined
        }),
        getMongoClient: async () => ({
          db: () => ({})
        } as never)
      }
    );

    expect(response.status).toBe(200);
    expect(requestedOptions).toEqual({
      limit: 20,
      offset: 40,
      snapshotId: "snapshot-1",
      sourceName: "lidl-hu-brochure",
      status: ["pending", "declined"]
    });
    expect(JSON.parse(response.body)).toMatchObject({
      reviewItems: [
        {
          id: reviewItem.id
        }
      ]
    });
  });

  it("updates one product review candidate from editor JSON", async () => {
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
    const reviewItem = createProductReviewItem();
    let updatedCandidateName = "";

    const response = await handleAppRequest(
      {
        bodyText: JSON.stringify({
          candidate: {
            ...reviewItem.candidate,
            product: {
              ...reviewItem.candidate.product,
              name: "Corrected milk"
            }
          },
          id: reviewItem.id
        }),
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "PATCH",
        path: "/api/admin/ingestion/review-item"
      },
      {
        createCatalogRepository: () => ({
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          }),
          setupCollections: async () => undefined
        }),
        createIngestionRepository: () => ({
          findProductReviewItemById: async () => ({
            ...reviewItem,
            candidate: {
              ...reviewItem.candidate,
              product: {
                ...reviewItem.candidate.product,
                name: updatedCandidateName
              }
            }
          }),
          findRawSnapshotById: async () => null,
          listRawSnapshots: async () => [],
          setupCollections: async () => undefined,
          updateProductReviewItemCandidate: async (input) => {
            updatedCandidateName = input.candidate.product.name;
            return true;
          }
        }),
        getMongoClient: async () => ({
          db: () => ({})
        } as never)
      }
    );

    expect(response.status).toBe(200);
    expect(updatedCandidateName).toBe("Corrected milk");
    expect(JSON.parse(response.body)).toMatchObject({
      reviewItem: {
        candidate: {
          product: {
            name: "Corrected milk"
          }
        },
        id: reviewItem.id
      }
    });
  });

  it("declines one product review item with a reason", async () => {
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
    let decisionInput: unknown;

    const response = await handleAppRequest(
      {
        bodyText: JSON.stringify({
          declineReason: "bad_name",
          id: "review-1",
          note: "Not a product name."
        }),
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "POST",
        path: "/api/admin/ingestion/review-item/decline"
      },
      {
        createCatalogRepository: () => ({
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          }),
          setupCollections: async () => undefined
        }),
        createIngestionRepository: () => ({
          findRawSnapshotById: async () => null,
          listRawSnapshots: async () => [],
          markProductReviewItemDecision: async (input) => {
            decisionInput = input;
            return true;
          },
          setupCollections: async () => undefined
        }),
        getMongoClient: async () => ({
          db: () => ({})
        } as never)
      }
    );

    expect(response.status).toBe(200);
    expect(decisionInput).toMatchObject({
      declineReason: "bad_name",
      id: "review-1",
      note: "Not a product name.",
      reviewerId: "admin@kamra.test",
      status: "declined"
    });
    expect(JSON.parse(response.body)).toEqual({
      acceptedCatalogProductId: null,
      id: "review-1",
      status: "declined"
    });
  });

  it("accepts one product review item and creates a catalog product", async () => {
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
    let createdProductCandidateName = "";
    let decisionInput: unknown;
    const reviewItem = createProductReviewItem();

    const response = await handleAppRequest(
      {
        bodyText: JSON.stringify({
          id: reviewItem.id,
          note: "Looks good."
        }),
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "POST",
        path: "/api/admin/ingestion/review-item/accept"
      },
      {
        createCatalogRepository: () => ({
          createCatalogProductFromReviewCandidate: async (input) => {
            createdProductCandidateName = input.candidate.product.name;
            return {
              productId: "product_created_1"
            };
          },
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          }),
          setupCollections: async () => undefined
        }),
        createIngestionRepository: () => ({
          findProductReviewItemById: async () => reviewItem,
          findRawSnapshotById: async () => null,
          listRawSnapshots: async () => [],
          markProductReviewItemDecision: async (input) => {
            decisionInput = input;
            return true;
          },
          setupCollections: async () => undefined
        }),
        getMongoClient: async () => ({
          db: () => ({}),
        } as never)
      }
    );

    expect(response.status).toBe(200);
    expect(createdProductCandidateName).toBe("Pilos UHT tej 2,8% 1 l");
    expect(decisionInput).toMatchObject({
      acceptedCatalogProductId: "product_created_1",
      id: reviewItem.id,
      note: "Looks good.",
      reviewerId: "admin@kamra.test",
      status: "accepted"
    });
    expect(JSON.parse(response.body)).toEqual({
      acceptedCatalogProductId: "product_created_1",
      id: reviewItem.id,
      status: "accepted"
    });
  });

  it("returns a stable internal error when review acceptance fails unexpectedly", async () => {
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
    const reviewItem = createProductReviewItem();

    const response = await handleAppRequest(
      {
        bodyText: JSON.stringify({
          id: reviewItem.id,
          note: "Looks good."
        }),
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "POST",
        path: "/api/admin/ingestion/review-item/accept"
      },
      {
        createCatalogRepository: () => ({
          createCatalogProductFromReviewCandidate: async () => {
            throw new Error("Document failed validation");
          },
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          }),
          setupCollections: async () => undefined
        }),
        createIngestionRepository: () => ({
          findProductReviewItemById: async () => reviewItem,
          findRawSnapshotById: async () => null,
          listRawSnapshots: async () => [],
          markProductReviewItemDecision: async () => true,
          setupCollections: async () => undefined
        }),
        getMongoClient: async () => ({
          db: () => ({})
        } as never)
      }
    );

    expect(response.status).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: "internal_error",
      message: "Document failed validation"
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
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          }),
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

function createParsedShopProductRow(overrides: Record<string, unknown> = {}) {
  return {
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
    storeBrandKey: "simple-html-table-shop",
    ...overrides
  };
}

function createIngestionSnapshot(parsedRows = [createParsedShopProductRow()]) {
  return {
    capturedAt: "2026-07-02T09:00:00.000Z",
    contentHash: "abc123",
    contentType: "text/html",
    crawlDate: "2026-07-02",
    crawlRunId: "synthetic-html-table-shop:simple_html_table_shop:2026-07-02",
    id: "simple_html_table_shop:weekly-html-table:2026-07-02",
    parserName: "SimpleHtmlTableShopAdapter",
    parserVersion: "1.0.0",
    parsedRows,
    payloadText: "<table></table>",
    sourceName: "simple_html_table_shop",
    sourceRecordId: "weekly-html-table",
    sourceUrl: "https://example.invalid/simple-html-table-shop",
    workflowName: "synthetic-html-table-shop"
  };
}

function createProductReviewItem() {
  return {
    acceptedCatalogProductDeletedAt: null,
    acceptedCatalogProductId: null,
    candidate: {
      matchConfidence: "strong_source_key" as const,
      origin: {
        capturedAt: "2026-07-02T09:00:00.000Z",
        sourceName: "simple_html_table_shop",
        sourceRecordId: "weekly-html-table",
        sourceUrl: "https://example.invalid/simple-html-table-shop"
      },
      priceObservations: [
        {
          currencyCode: "HUF" as const,
          observedAt: "2026-07-02T09:00:00.000Z",
          price: 469,
          priceKind: "base" as const
        }
      ],
      product: {
        kind: "grocery" as const,
        measurements: [],
        name: "Pilos UHT tej 2,8% 1 l",
        normalizedName: "pilos uht tej 2,8% 1 l",
        primaryCategoryKey: null
      },
      source: {
        countryCode: "HU" as const,
        sourceName: "simple_html_table_shop",
        sourceProductKey: "simple-milk",
        sourceProductName: "Pilos UHT tej 2,8% 1 l",
        storeBrandKey: "simple-html-table-shop"
      },
      sourceProductIdentifiers: [],
      stock: {
        availability: "infinite" as const,
        countryCode: "HU" as const
      }
    },
    candidateBuilderName: "SourceOfferReviewCandidateBuilder",
    candidateBuilderVersion: "1.0.0",
    candidateMatch: "strong_source_key" as const,
    capturedAt: "2026-07-02T09:00:00.000Z",
    createdAt: "2026-07-02T09:00:00.000Z",
    decision: null,
    id: "review-1",
    rawRowPreview: {
      countryCode: "HU" as const,
      displayName: "Pilos UHT tej 2,8% 1 l",
      packageLabel: "1 l",
      priceValue: 469,
      sourceName: "simple_html_table_shop",
      sourceProductKey: "simple-milk",
      sourceRecordId: "simple_html_table_shop:weekly-html-table:2026-07-02:row-1",
      storeBrandKey: "simple-html-table-shop"
    },
    rowFingerprint: "review-fingerprint",
    rowIndex: 0,
    snapshotId: "simple_html_table_shop:weekly-html-table:2026-07-02",
    sourceName: "simple_html_table_shop",
    sourceRecordId: "simple_html_table_shop:weekly-html-table:2026-07-02:row-1",
    status: "pending" as const,
    updatedAt: "2026-07-02T09:00:00.000Z"
  };
}
