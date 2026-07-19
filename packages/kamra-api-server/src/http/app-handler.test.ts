import { afterEach, describe, expect, it, vi } from "vitest";

import type { UserDocument, UserRepository } from "../auth/user-auth.js";
import { createUserToken } from "../auth/user-token.js";
import { MongoHouseholdRepository } from "../household/current/mongo-household-repository.js";
import { createFakeDb, FakeCollection } from "../test-support/fake-mongo.js";
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
      path: "/api/admin/dashboard/health"
    });

    expect(response.status).toBe(401);
    expect(JSON.parse(response.body)).toEqual({
      error: "unauthorized",
      messageKey: "apiErrors.adminRequired"
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
      path: "/api/admin/dashboard/health"
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
        profile: {},
        role: "user"
      }
    });
  });

  it("enforces active household membership on the v2 stock-target read route", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");
    vi.stubEnv("MONGODB_URI", "mongodb+srv://example.mongodb.net/kamra");
    vi.stubEnv("MONGODB_DB_NAME", "kamra_test");
    const token = createUserToken({
      email: "member@kamra.test",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "user",
      secret: "test-secret"
    });
    const db = createFakeDb({
      household_memberships: new FakeCollection<Record<string, unknown>>("household_memberships", [
        { householdId: "household-1", status: "active", userId: "member@kamra.test" }
      ])
    });
    const response = await handleAppRequest(
      {
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        path: "/api/households/household-1/stock-targets/target-1"
      },
      { getMongoClient: async () => ({ db: () => db }) as never }
    );
    expect(response.status).toBe(404);
    expect(JSON.parse(response.body)).toEqual({ error: "stock_target_not_found" });
    const nonMemberToken = createUserToken({
      email: "other@kamra.test",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "user",
      secret: "test-secret"
    });
    const forbidden = await handleAppRequest(
      {
        headers: { authorization: `Bearer ${nonMemberToken}` },
        method: "GET",
        path: "/api/households/household-1/stock-targets/target-1"
      },
      { getMongoClient: async () => ({ db: () => db }) as never }
    );
    expect(forbidden.status).toBe(403);
  });

  it("rejects malformed v2 manual batch requests before database access", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");
    const token = createUserToken({
      email: "member@kamra.test",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "user",
      secret: "test-secret"
    });
    const response = await handleAppRequest({
      bodyText: "{}",
      headers: { authorization: `Bearer ${token}` },
      method: "POST",
      path: "/api/households/household-1/batches"
    });
    expect(response.status).toBe(400);
    expect(JSON.parse(response.body).error).toBe("invalid_stock_batch_request");
  });

  it("rejects malformed v2 consumption requests before database access", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");
    const token = createUserToken({
      email: "member@kamra.test",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "user",
      secret: "test-secret"
    });
    const response = await handleAppRequest({
      bodyText: JSON.stringify({ requestedQuantity: 1 }),
      headers: { authorization: `Bearer ${token}` },
      method: "POST",
      path: "/api/households/household-1/stock-targets/target-1/consume"
    });
    expect(response.status).toBe(400);
    expect(JSON.parse(response.body).error).toBe("invalid_stock_consumption_request");
  });

  it("lets admins read and update household feature flags from the dashboard route", async () => {
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
    const db = createFakeDb();
    const repositoryFactory = () => new MongoHouseholdRepository(db);
    await repositoryFactory().setupCollections();

    const initialResponse = await handleAppRequest(
      {
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "GET",
        path: "/api/admin/dashboard/feature-flags"
      },
      {
        createHouseholdRepository: repositoryFactory,
        getMongoClient: async () =>
          ({
            db: () => db
          }) as never
      }
    );

    expect(initialResponse.status).toBe(200);
    expect(JSON.parse(initialResponse.body)).toEqual({
      featureFlags: [
        {
          control: "boolean",
          descriptionKey: "health.featureFlagAutoTickAllShoppingListEntriesDescription",
          enabled: true,
          group: "shopping",
          key: "allowAutoTickingAllShoppingListEntries",
          labelKey: "health.featureFlagAutoTickAllShoppingListEntries"
        },
        {
          control: "alpha-access",
          descriptionKey: "health.featureFlagControlledAlphaAccessDescription",
          enabled: false,
          group: "access",
          key: "allowControlledAlphaAccess",
          labelKey: "health.featureFlagControlledAlphaAccess"
        },
        {
          control: "boolean",
          descriptionKey: "health.featureFlagAutomaticLoginDescription",
          enabled: false,
          group: "access",
          key: "allowAutomaticLogin",
          labelKey: "health.featureFlagAutomaticLogin"
        },
        {
          control: "boolean",
          descriptionKey: "health.featureFlagAbbreviatedUiLabelsDescription",
          enabled: false,
          group: "household",
          key: "useAbbreviatedUiLabels",
          labelKey: "health.featureFlagAbbreviatedUiLabels"
        }
      ]
    });

    const updateResponse = await handleAppRequest(
      {
        bodyText: JSON.stringify({
          enabled: true,
          key: "useAbbreviatedUiLabels"
        }),
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "PATCH",
        path: "/api/admin/dashboard/feature-flags"
      },
      {
        createHouseholdRepository: repositoryFactory,
        getMongoClient: async () =>
          ({
            db: () => db
          }) as never
      }
    );

    expect(updateResponse.status).toBe(200);
    expect(JSON.parse(updateResponse.body)).toEqual({
      featureFlags: [
        {
          control: "boolean",
          descriptionKey: "health.featureFlagAbbreviatedUiLabelsDescription",
          enabled: true,
          group: "household",
          key: "useAbbreviatedUiLabels",
          labelKey: "health.featureFlagAbbreviatedUiLabels"
        }
      ]
    });
  });

  it("corrects and discards an encoded v2 Batch id through the HTTP routes", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");
    vi.stubEnv("MONGODB_URI", "mongodb+srv://example.mongodb.net/kamra");
    vi.stubEnv("MONGODB_DB_NAME", "kamra_test");
    const token = createUserToken({
      email: "member@kamra.test",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "user",
      secret: "test-secret"
    });
    const batchId = "stock-batch:milk";
    const db = createFakeDb({
      household_memberships: new FakeCollection<Record<string, unknown>>("household_memberships", [
        { householdId: "household-1", status: "active", userId: "member@kamra.test" }
      ]),
      household_stock_batches: new FakeCollection<Record<string, unknown>>(
        "household_stock_batches",
        [
          {
            acquiredOn: "2026-07-12",
            acquisitionSnapshot: { displayName: "Milk" },
            classificationSnapshot: {
              capturedAt: "2026-07-12T00:00:00.000Z",
              directAttributes: [],
              directConcepts: [],
              effectiveConcepts: [],
              source: "manual"
            },
            createdAt: "2026-07-12T00:00:00.000Z",
            createdByUserId: "member@kamra.test",
            expiryOn: null,
            householdId: "household-1",
            id: batchId,
            originalQuantity: 1,
            remainingQuantity: 1,
            revision: 0,
            status: "available",
            unit: "l",
            updatedAt: "2026-07-12T00:00:00.000Z",
            updatedByUserId: "member@kamra.test"
          }
        ]
      )
    });
    const client = {
      db: () => db,
      startSession: () => ({
        abortTransaction: async () => undefined,
        commitTransaction: async () => undefined,
        endSession: async () => undefined,
        startTransaction: () => undefined
      })
    };
    const corrected = await handleAppRequest(
      {
        bodyText: JSON.stringify({
          acquiredOn: "2026-07-12",
          expectedBatchRevision: 0,
          expiryOn: "2026-07-10",
          operationId: "correct-1",
          requestFingerprint: "correct-1",
          resultingQuantity: 2,
          unit: "ml"
        }),
        headers: { authorization: `Bearer ${token}` },
        method: "POST",
        path: `/api/households/household-1/batches/${encodeURIComponent(batchId)}/correct`
      },
      { getMongoClient: async () => client as never }
    );
    expect(corrected.status).toBe(200);
    expect(db.__collections["household_stock_batches"]!.docs[0]).toMatchObject({
      remainingQuantity: 2,
      unit: "ml"
    });
    const discarded = await handleAppRequest(
      {
        bodyText: JSON.stringify({
          expectedBatchRevision: 1,
          operationId: "discard-1",
          requestFingerprint: "discard-1"
        }),
        headers: { authorization: `Bearer ${token}` },
        method: "POST",
        path: `/api/households/household-1/batches/${encodeURIComponent(batchId)}/discard`
      },
      { getMongoClient: async () => client as never }
    );
    expect(discarded.status).toBe(200);
  });

  it("creates alpha users with an empty household and blocks their login when disabled", async () => {
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
    const db = createFakeDb();
    const householdRepository = new MongoHouseholdRepository(db);
    await householdRepository.setupCollections();
    const alphaUsers = new Map<string, UserDocument>();
    const userRepository: UserRepository = {
      createAlphaUser: async (input) => {
        const user: UserDocument = {
          alphaAccess: input.alphaAccess,
          authProvider: "bootstrap_credentials",
          email: input.email,
          passwordHash: input.passwordHash,
          role: input.role,
          status: input.status
        };
        alphaUsers.set(user.email, user);
        return user;
      },
      findActiveUserByEmail: async (email) => {
        const user = alphaUsers.get(email);
        return user?.status === "active" ? user : null;
      },
      findUserByEmail: async (email) => alphaUsers.get(email) ?? null,
      updateUserProfile: async () => null
    };
    const dependencies = {
      createHouseholdRepository: () => householdRepository,
      createUserRepository: () => userRepository,
      getMongoClient: async () =>
        ({
          db: () => db
        }) as never
    };

    await householdRepository.updateFeatureFlag({
      enabled: true,
      key: "allowControlledAlphaAccess",
      updatedAt: "2026-07-10T10:00:00.000Z",
      updatedByUserId: "admin@kamra.test"
    });

    const createResponse = await handleAppRequest(
      {
        bodyText: JSON.stringify({
          email: "alpha@kamra.test",
          password: "correct-password"
        }),
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "POST",
        path: "/api/admin/alpha-users"
      },
      dependencies
    );

    expect(createResponse.status).toBe(201);
    expect(JSON.parse(createResponse.body)).toMatchObject({
      household: {
        memberCount: 1,
        name: "alpha@kamra.test household"
      },
      user: {
        email: "alpha@kamra.test",
        role: "user"
      }
    });
    expect(JSON.parse(createResponse.body)).not.toHaveProperty("password");
    expect(await householdRepository.listHouseholdsForUser("alpha@kamra.test")).toHaveLength(1);

    await householdRepository.updateFeatureFlag({
      enabled: false,
      key: "allowControlledAlphaAccess",
      updatedAt: "2026-07-10T10:01:00.000Z",
      updatedByUserId: "admin@kamra.test"
    });

    const loginResponse = await handleAppRequest(
      {
        bodyText: JSON.stringify({
          email: "alpha@kamra.test",
          password: "correct-password"
        }),
        headers: {},
        method: "POST",
        path: "/api/login"
      },
      dependencies
    );

    expect(loginResponse.status).toBe(401);
    expect(JSON.parse(loginResponse.body)).toEqual({ error: "invalid_credentials" });
  });

  it("lists household stock for a signed-in household member", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");
    vi.stubEnv("MONGODB_URI", "mongodb+srv://example.mongodb.net/kamra");
    vi.stubEnv("MONGODB_DB_NAME", "kamra_test");

    const token = createUserToken({
      email: "usera",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "user",
      secret: "test-secret"
    });
    const db = createFakeDb();
    const repository = new MongoHouseholdRepository(db);
    await repository.setupCollections();
    await repository.createHousehold({
      createdAt: "2026-07-09T10:00:00.000Z",
      createdByUserId: "usera",
      id: "household1",
      name: "Demo household"
    });
    await repository.createHouseholdStockItem({
      createdAt: "2026-07-09T10:05:00.000Z",
      createdByUserId: "usera",
      currentAmount: 0.2,
      displayName: "Kenyér",
      householdId: "household1",
      minLimit: 0.5,
      stockedAt: "2026-07-07T10:05:00.000Z",
      stockGroupKey: "kenyer",
      unit: "kg",
      userId: "usera"
    });

    const response = await handleAppRequest(
      {
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "GET",
        path: "/api/household/items",
        query: {
          householdId: "household1"
        }
      },
      {
        createHouseholdRepository: () => new MongoHouseholdRepository(db),
        getMongoClient: async () =>
          ({
            db: () => db
          }) as never
      }
    );

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      household: {
        id: "household1"
      },
      stockItems: [
        {
          displayName: "Kenyér",
          stockStatus: "below_limit"
        }
      ]
    });
  });

  it("creates and updates a custom household stock item for a signed-in member", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");
    vi.stubEnv("MONGODB_URI", "mongodb+srv://example.mongodb.net/kamra");
    vi.stubEnv("MONGODB_DB_NAME", "kamra_test");

    const token = createUserToken({
      email: "usera",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "user",
      secret: "test-secret"
    });
    const db = createFakeDb();
    const repository = new MongoHouseholdRepository(db);
    await repository.setupCollections();
    await repository.createHousehold({
      createdAt: "2026-07-09T10:00:00.000Z",
      createdByUserId: "usera",
      id: "household1",
      name: "Demo household"
    });

    const createResponse = await handleAppRequest(
      {
        bodyText: JSON.stringify({
          currentAmount: 0,
          displayName: "Flour",
          gtin: "5991234567890",
          householdId: "household1",
          minLimit: 1.5,
          sourceName: "manual-demo",
          sourceProductUrl: "https://example.test/flour",
          stockedAt: "2026-07-09T10:10:00.000Z",
          stockGroupKey: "flour",
          unit: "kg"
        }),
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "POST",
        path: "/api/household/items"
      },
      {
        createHouseholdRepository: () => new MongoHouseholdRepository(db),
        getMongoClient: async () =>
          ({
            db: () => db
          }) as never
      }
    );

    expect(createResponse.status).toBe(200);
    const createdPage = JSON.parse(createResponse.body) as {
      stockItems: Array<{
        displayName: string;
        gtin?: string | null;
        id: string;
        minLimit: number;
        sourceName?: string | null;
        sourceProductUrl?: string | null;
      }>;
    };
    expect(createdPage.stockItems).toEqual([
      expect.objectContaining({
        displayName: "Flour",
        gtin: "5991234567890",
        minLimit: 1.5,
        sourceName: "manual-demo",
        sourceProductUrl: "https://example.test/flour"
      })
    ]);

    const createdItemId = createdPage.stockItems[0]!.id;
    const updateResponse = await handleAppRequest(
      {
        bodyText: JSON.stringify({
          currentAmount: 0.8,
          gtin: "5991234567891",
          householdId: "household1",
          id: createdItemId,
          minLimit: 2,
          sourceName: "manual-update",
          unit: "kg"
        }),
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "PATCH",
        path: "/api/household/items"
      },
      {
        createHouseholdRepository: () => new MongoHouseholdRepository(db),
        getMongoClient: async () =>
          ({
            db: () => db
          }) as never
      }
    );

    expect(updateResponse.status).toBe(200);
    expect(JSON.parse(updateResponse.body)).toMatchObject({
      stockItems: [
        {
          currentAmount: 0.8,
          displayName: "Flour",
          gtin: "5991234567891",
          minLimit: 2,
          sourceName: "manual-update",
          sourceProductUrl: "https://example.test/flour",
          stockStatus: "below_limit"
        }
      ]
    });
  });

  it("blocks household stock access for users outside the household", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");
    vi.stubEnv("MONGODB_URI", "mongodb+srv://example.mongodb.net/kamra");
    vi.stubEnv("MONGODB_DB_NAME", "kamra_test");

    const token = createUserToken({
      email: "outsider",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "user",
      secret: "test-secret"
    });
    const db = createFakeDb();
    const repository = new MongoHouseholdRepository(db);
    await repository.setupCollections();
    await repository.createHousehold({
      createdAt: "2026-07-09T10:00:00.000Z",
      createdByUserId: "usera",
      id: "household1",
      name: "Demo household"
    });

    const response = await handleAppRequest(
      {
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "GET",
        path: "/api/household/items",
        query: {
          householdId: "household1"
        }
      },
      {
        createHouseholdRepository: () => new MongoHouseholdRepository(db),
        getMongoClient: async () =>
          ({
            db: () => db
          }) as never
      }
    );

    expect(response.status).toBe(404);
    expect(JSON.parse(response.body)).toEqual({
      error: "household_not_found"
    });
  });

  it("previews a generated shopping list for a signed-in household member", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");
    vi.stubEnv("MONGODB_URI", "mongodb+srv://example.mongodb.net/kamra");
    vi.stubEnv("MONGODB_DB_NAME", "kamra_test");

    const token = createUserToken({
      email: "usera",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "user",
      secret: "test-secret"
    });
    const db = createFakeDb();
    const repository = new MongoHouseholdRepository(db);
    await repository.setupCollections();
    await repository.createHousehold({
      createdAt: "2026-07-09T10:00:00.000Z",
      createdByUserId: "usera",
      id: "household1",
      name: "Demo household"
    });
    await repository.createHouseholdStockItem({
      createdAt: "2026-07-09T10:05:00.000Z",
      createdByUserId: "usera",
      currentAmount: 0,
      displayName: "Rice",
      householdId: "household1",
      minLimit: 1,
      stockedAt: "2026-07-07T10:05:00.000Z",
      stockGroupKey: "rice",
      unit: "kg",
      userId: "usera"
    });

    const response = await handleAppRequest(
      {
        bodyText: JSON.stringify({
          householdId: "household1",
          scale: "business_as_usual"
        }),
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "POST",
        path: "/api/household/shopping-list/preview"
      },
      {
        createHouseholdRepository: () => new MongoHouseholdRepository(db),
        getMongoClient: async () =>
          ({
            db: () => db
          }) as never
      }
    );

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      householdId: "household1",
      items: [
        {
          displayName: "Rice",
          reasonCode: "below_minimum"
        }
      ],
      scale: "business_as_usual"
    });
  });

  it("creates, reads, and updates the latest shopping list", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");
    vi.stubEnv("MONGODB_URI", "mongodb+srv://example.mongodb.net/kamra");
    vi.stubEnv("MONGODB_DB_NAME", "kamra_test");

    const token = createUserToken({
      email: "usera",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "user",
      secret: "test-secret"
    });
    const db = createFakeDb();
    const repository = new MongoHouseholdRepository(db);
    await repository.setupCollections();
    await repository.createHousehold({
      createdAt: "2026-07-09T10:00:00.000Z",
      createdByUserId: "usera",
      id: "household1",
      name: "Demo household"
    });
    await repository.upsertSeedDataset({
      householdLocalProducts: [
        {
          createdAt: "2026-07-09T10:00:00.000Z",
          createdByUserId: "usera",
          displayName: "Milk",
          householdId: "household1",
          id: "product_milk",
          stockGroupKey: "milk",
          status: "active",
          updatedAt: "2026-07-09T10:00:00.000Z",
          updatedByUserId: "usera"
        }
      ],
      householdMemberships: [],
      householdPurchasePriceObservations: [],
      households: [],
      householdShops: [
        {
          countryCode: "HU",
          createdAt: "2026-07-09T10:00:00.000Z",
          id: "shop_hu_lidl",
          label: "Lidl Hungary",
          sourceNames: ["lidl-hu-brochure"],
          status: "active",
          storeBrandKeys: ["lidl-hu"],
          updatedAt: "2026-07-09T10:00:00.000Z"
        }
      ],
      householdShoppingLists: [],
      householdStockItems: [
        {
          createdAt: "2026-07-09T10:00:00.000Z",
          createdByUserId: "usera",
          currentAmount: 0,
          displayName: "Milk",
          householdId: "household1",
          householdProductId: "product_milk",
          id: "stock_milk",
          initialAmount: 1,
          minLimit: 1,
          note: null,
          stockedAt: "2026-07-09T10:00:00.000Z",
          stockGroupKey: "milk",
          status: "active",
          unit: "l",
          updatedAt: "2026-07-09T10:00:00.000Z",
          updatedByUserId: "usera"
        }
      ]
    });

    const createResponse = await handleAppRequest(
      {
        bodyText: JSON.stringify({
          householdId: "household1",
          scale: "business_as_usual",
          shopId: "shop_hu_lidl"
        }),
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "POST",
        path: "/api/household/shopping-lists"
      },
      {
        createHouseholdRepository: () => new MongoHouseholdRepository(db),
        getMongoClient: async () =>
          ({
            db: () => db
          }) as never
      }
    );

    expect(createResponse.status).toBe(201);
    const createdList = JSON.parse(createResponse.body).shoppingList;
    expect(createdList).toMatchObject({
      householdId: "household1",
      shopId: "shop_hu_lidl"
    });
    expect(createdList.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          purchasedAmount: 0,
          ticked: false
        })
      ])
    );

    const updateResponse = await handleAppRequest(
      {
        bodyText: JSON.stringify({
          householdId: "household1",
          id: createdList.id,
          items: createdList.items.map((item: Record<string, unknown>) => ({
            ...item,
            plannedAmount: 2.5,
            purchasedAmount: 2.5,
            ticked: true
          }))
        }),
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "PATCH",
        path: "/api/household/shopping-lists"
      },
      {
        createHouseholdRepository: () => new MongoHouseholdRepository(db),
        getMongoClient: async () =>
          ({
            db: () => db
          }) as never
      }
    );

    expect(updateResponse.status).toBe(200);
    expect(JSON.parse(updateResponse.body)).toMatchObject({
      shoppingList: {
        items: [
          {
            plannedAmount: 2.5,
            purchasedAmount: 2.5,
            ticked: true
          }
        ]
      }
    });

    const latestResponse = await handleAppRequest(
      {
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "GET",
        path: "/api/household/shopping-lists/latest",
        query: {
          householdId: "household1"
        }
      },
      {
        createHouseholdRepository: () => new MongoHouseholdRepository(db),
        getMongoClient: async () =>
          ({
            db: () => db
          }) as never
      }
    );

    expect(latestResponse.status).toBe(200);
    expect(JSON.parse(latestResponse.body)).toMatchObject({
      shoppingList: {
        id: createdList.id,
        shopId: "shop_hu_lidl"
      }
    });

    const archiveResponse = await handleAppRequest(
      {
        bodyText: JSON.stringify({
          householdId: "household1",
          id: createdList.id,
          status: "archived"
        }),
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "PATCH",
        path: "/api/household/shopping-lists"
      },
      {
        createHouseholdRepository: () => new MongoHouseholdRepository(db),
        getMongoClient: async () =>
          ({
            db: () => db
          }) as never
      }
    );

    expect(archiveResponse.status).toBe(200);
    expect(JSON.parse(archiveResponse.body)).toMatchObject({
      shoppingList: {
        id: createdList.id,
        status: "archived"
      }
    });

    const latestAfterArchiveResponse = await handleAppRequest(
      {
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "GET",
        path: "/api/household/shopping-lists/latest",
        query: {
          householdId: "household1"
        }
      },
      {
        createHouseholdRepository: () => new MongoHouseholdRepository(db),
        getMongoClient: async () =>
          ({
            db: () => db
          }) as never
      }
    );

    expect(latestAfterArchiveResponse.status).toBe(404);
  });

  it("creates an empty shopping list for start fresh", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");
    vi.stubEnv("MONGODB_URI", "mongodb+srv://example.mongodb.net/kamra");
    vi.stubEnv("MONGODB_DB_NAME", "kamra_test");

    const token = createUserToken({
      email: "usera",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "user",
      secret: "test-secret"
    });
    const db = createFakeDb();
    const repository = new MongoHouseholdRepository(db);
    await repository.setupCollections();
    await repository.createHousehold({
      createdAt: "2026-07-09T10:00:00.000Z",
      createdByUserId: "usera",
      id: "household1",
      name: "Demo household"
    });
    await repository.upsertSeedDataset({
      householdLocalProducts: [],
      householdMemberships: [],
      householdPurchasePriceObservations: [],
      households: [],
      householdShops: [],
      householdShoppingLists: [],
      householdStockItems: [
        {
          createdAt: "2026-07-09T10:00:00.000Z",
          createdByUserId: "usera",
          currentAmount: 0,
          displayName: "Milk",
          householdId: "household1",
          householdProductId: "product_milk",
          id: "stock_milk",
          initialAmount: 1,
          minLimit: 1,
          note: null,
          stockedAt: "2026-07-09T10:00:00.000Z",
          stockGroupKey: "milk",
          status: "active",
          unit: "l",
          updatedAt: "2026-07-09T10:00:00.000Z",
          updatedByUserId: "usera"
        }
      ]
    });

    const createResponse = await handleAppRequest(
      {
        bodyText: JSON.stringify({
          householdId: "household1",
          scale: "start_fresh"
        }),
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "POST",
        path: "/api/household/shopping-lists"
      },
      {
        createHouseholdRepository: () => new MongoHouseholdRepository(db),
        getMongoClient: async () =>
          ({
            db: () => db
          }) as never
      }
    );

    expect(createResponse.status).toBe(201);
    expect(JSON.parse(createResponse.body)).toMatchObject({
      shoppingList: {
        items: [],
        scale: "start_fresh"
      }
    });
  });

  it("requires confirmation before applying partially unticked shopping-list stocks and then updates stock idempotently", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");
    vi.stubEnv("MONGODB_URI", "mongodb+srv://example.mongodb.net/kamra");
    vi.stubEnv("MONGODB_DB_NAME", "kamra_test");

    const token = createUserToken({
      email: "usera",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "user",
      secret: "test-secret"
    });
    const db = createFakeDb();
    const repository = new MongoHouseholdRepository(db);
    await repository.setupCollections();
    await repository.createHousehold({
      createdAt: "2026-07-09T10:00:00.000Z",
      createdByUserId: "usera",
      id: "household1",
      name: "Demo household"
    });
    await repository.upsertSeedDataset({
      householdLocalProducts: [
        {
          createdAt: "2026-07-09T10:00:00.000Z",
          createdByUserId: "usera",
          displayName: "Milk",
          householdId: "household1",
          id: "product_milk",
          stockGroupKey: "milk",
          status: "active",
          updatedAt: "2026-07-09T10:00:00.000Z",
          updatedByUserId: "usera"
        }
      ],
      householdMemberships: [],
      householdPurchasePriceObservations: [],
      households: [],
      householdShops: [
        {
          countryCode: "HU",
          createdAt: "2026-07-09T10:00:00.000Z",
          id: "shop_hu_lidl",
          label: "Lidl Hungary",
          sourceNames: ["lidl-hu-brochure"],
          status: "active",
          storeBrandKeys: ["lidl-hu"],
          updatedAt: "2026-07-09T10:00:00.000Z"
        }
      ],
      householdShoppingLists: [
        {
          createdAt: "2026-07-09T10:00:00.000Z",
          createdByUserId: "usera",
          householdId: "household1",
          id: "shopping_list_1",
          items: [
            {
              catalogProductId: "catalog_milk",
              displayName: "Milk",
              householdProductId: "product_milk",
              householdStockItemId: "stock_milk",
              id: "line_1",
              observedPrice: {
                amount: 599,
                currencyCode: "HUF",
                observedAt: "2026-07-09T10:10:00.000Z"
              },
              plannedAmount: 2,
              productSourceId: "product_source_milk",
              purchasedAmount: 2,
              sourceKind: "generated",
              sourceName: "lidl-hu-brochure",
              status: "not_applied",
              suggestedBuyAmount: 2,
              targetAmount: 2,
              ticked: true,
              uncertaintyFlags: [],
              unit: "l"
            },
            {
              displayName: "Paprika cream",
              id: "line_2",
              observedPrice: {
                amount: 899,
                currencyCode: "HUF",
                observedAt: "2026-07-09T10:15:00.000Z"
              },
              plannedAmount: 1,
              purchasedAmount: 1,
              sourceKind: "manual",
              status: "not_applied",
              stockGroupKey: "paprika_cream",
              suggestedBuyAmount: 1,
              targetAmount: 1,
              ticked: false,
              uncertaintyFlags: ["missing_catalog_product", "missing_product_source"],
              unit: "db"
            }
          ],
          scale: "keep_it_chill",
          schemaVersion: "shopping_list_v1",
          shopId: "shop_hu_lidl",
          status: "active",
          updatedAt: "2026-07-09T10:00:00.000Z",
          updatedByUserId: "usera"
        }
      ],
      householdStockItems: [
        {
          createdAt: "2026-07-09T10:00:00.000Z",
          createdByUserId: "usera",
          currentAmount: 1,
          displayName: "Milk",
          householdId: "household1",
          householdProductId: "product_milk",
          id: "stock_milk",
          initialAmount: 1,
          minLimit: 1,
          note: null,
          stockedAt: "2026-07-09T10:00:00.000Z",
          stockGroupKey: "milk",
          status: "active",
          unit: "l",
          updatedAt: "2026-07-09T10:00:00.000Z",
          updatedByUserId: "usera"
        }
      ]
    });

    const confirmationResponse = await handleAppRequest(
      {
        bodyText: JSON.stringify({
          householdId: "household1",
          id: "shopping_list_1",
          stockAppliedAt: "2026-07-09"
        }),
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "POST",
        path: "/api/household/shopping-lists/update-stocks"
      },
      {
        createCatalogRepository: () => ({
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          }),
          upsertPriceObservations: async () => undefined
        }),
        createHouseholdRepository: () => new MongoHouseholdRepository(db),
        getMongoClient: async () =>
          ({
            db: () => db
          }) as never
      }
    );

    expect(confirmationResponse.status).toBe(409);
    expect(JSON.parse(confirmationResponse.body)).toMatchObject({
      allowedConfirmationModes: ["tick_all_and_update", "update_ticked_only"],
      confirmationRequired: true
    });

    const appliedCatalogObservations: unknown[][] = [];
    const applyResponse = await handleAppRequest(
      {
        bodyText: JSON.stringify({
          confirmationMode: "tick_all_and_update",
          householdId: "household1",
          id: "shopping_list_1",
          stockAppliedAt: "2026-07-09"
        }),
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "POST",
        path: "/api/household/shopping-lists/update-stocks"
      },
      {
        createCatalogRepository: () => ({
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          }),
          upsertPriceObservations: async (records) => {
            appliedCatalogObservations.push([...records]);
          }
        }),
        createHouseholdRepository: () => new MongoHouseholdRepository(db),
        getMongoClient: async () =>
          ({
            db: () => db
          }) as never
      }
    );

    expect(applyResponse.status).toBe(200);
    expect(appliedCatalogObservations).toHaveLength(1);
    expect(JSON.parse(applyResponse.body)).toMatchObject({
      confirmationRequired: false,
      householdStockPage: {
        stockItems: [
          {
            currentAmount: 3,
            displayName: "Milk"
          },
          {
            currentAmount: 1,
            displayName: "Paprika cream"
          }
        ]
      },
      shoppingList: {
        items: [
          {
            id: "line_1",
            status: "applied",
            ticked: true
          },
          {
            id: "line_2",
            status: "applied",
            ticked: true
          }
        ]
      }
    });

    const secondApplyResponse = await handleAppRequest(
      {
        bodyText: JSON.stringify({
          confirmationMode: "tick_all_and_update",
          householdId: "household1",
          id: "shopping_list_1",
          stockAppliedAt: "2026-07-09"
        }),
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "POST",
        path: "/api/household/shopping-lists/update-stocks"
      },
      {
        createCatalogRepository: () => ({
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          }),
          upsertPriceObservations: async () => undefined
        }),
        createHouseholdRepository: () => new MongoHouseholdRepository(db),
        getMongoClient: async () =>
          ({
            db: () => db
          }) as never
      }
    );

    expect(secondApplyResponse.status).toBe(200);
    expect(JSON.parse(secondApplyResponse.body)).toMatchObject({
      householdStockPage: {
        stockItems: [
          {
            currentAmount: 3,
            displayName: "Milk"
          },
          {
            currentAmount: 1,
            displayName: "Paprika cream"
          }
        ]
      }
    });
  });

  it("lists seeded shops for signed-in users", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");
    vi.stubEnv("MONGODB_URI", "mongodb+srv://example.mongodb.net/kamra");
    vi.stubEnv("MONGODB_DB_NAME", "kamra_test");

    const token = createUserToken({
      email: "usera",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "user",
      secret: "test-secret"
    });
    const db = createFakeDb();
    const repository = new MongoHouseholdRepository(db);
    await repository.setupCollections();
    await repository.createHousehold({
      createdAt: "2026-07-09T10:00:00.000Z",
      createdByUserId: "usera",
      id: "household1",
      name: "Demo household"
    });
    await repository.upsertSeedDataset({
      householdLocalProducts: [],
      householdMemberships: [],
      householdPurchasePriceObservations: [],
      households: [],
      householdShops: [
        {
          countryCode: "HU",
          createdAt: "2026-07-09T10:00:00.000Z",
          id: "shop_hu_aldi",
          label: "ALDI Hungary",
          sourceNames: ["aldi-hu-offers"],
          status: "active",
          storeBrandKeys: ["aldi-hu"],
          updatedAt: "2026-07-09T10:00:00.000Z"
        }
      ],
      householdShoppingLists: [],
      householdStockItems: []
    });

    const response = await handleAppRequest(
      {
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "GET",
        path: "/api/shops"
      },
      {
        createHouseholdRepository: () => new MongoHouseholdRepository(db),
        getMongoClient: async () =>
          ({
            db: () => db
          }) as never
      }
    );

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      shops: [
        expect.objectContaining({
          id: "shop_hu_aldi",
          label: "ALDI Hungary"
        })
      ]
    });
  });

  it("updates profile preferences for the current user", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");
    vi.stubEnv("MONGODB_URI", "mongodb+srv://example.mongodb.net/kamra");
    vi.stubEnv("MONGODB_DB_NAME", "kamra_test");

    const token = createUserToken({
      email: "user@kamra.test",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "user",
      secret: "test-secret"
    });

    const response = await handleAppRequest(
      {
        bodyText: JSON.stringify({ theme: "dark" }),
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "PATCH",
        path: "/api/admin/preferences"
      },
      {
        createUserRepository: () => ({
          createAlphaUser: async (input) => ({
            alphaAccess: input.alphaAccess,
            authProvider: "bootstrap_credentials" as const,
            email: input.email,
            passwordHash: input.passwordHash,
            role: input.role,
            status: input.status
          }),
          findActiveUserByEmail: async () => null,
          findUserByEmail: async () => null,
          updateUserProfile: async (email, profile) => ({
            authProvider: "bootstrap_credentials" as const,
            email,
            passwordHash: {
              algorithm: "scrypt" as const,
              blockSize: 8,
              cost: 16384,
              hash: "hash",
              keyLength: 64,
              parallelization: 1,
              salt: "salt"
            },
            profile,
            role: "user" as const,
            status: "active" as const
          })
        }),
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
      }
    );

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      user: {
        email: "user@kamra.test",
        profile: {
          theme: "dark"
        },
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
      path: "/api/admin/dashboard/backfill-unvalidated-products"
    });

    expect(response.status).toBe(401);
    expect(JSON.parse(response.body)).toEqual({
      error: "unauthorized",
      messageKey: "apiErrors.adminRequired"
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
        path: "/api/admin/dashboard/backfill-unvalidated-products"
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
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
      }
    );

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      skippedCount: 0,
      status: "updated",
      updatedCount: 42
    });
  });

  it("lists and tracks database validator and migration actions", async () => {
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
    const db = createFakeDb();
    const repository = new MongoHouseholdRepository(db);
    await repository.setupCollections();
    await repository.createHousehold({
      createdAt: "2026-07-10T10:00:00.000Z",
      createdByUserId: "user@kamra.test",
      id: "household-maintenance-test",
      name: "Maintenance test household"
    });
    const dependencies = {
      createHouseholdRepository: () => repository,
      getMongoClient: async () =>
        ({
          db: () => db
        }) as never
    };
    const requestHeaders = {
      authorization: `Bearer ${token}`
    };

    const initialResponse = await handleAppRequest(
      {
        headers: requestHeaders,
        method: "GET",
        path: "/api/admin/database-maintenance"
      },
      dependencies
    );
    expect(initialResponse.status).toBe(200);
    expect(JSON.parse(initialResponse.body)).toMatchObject({
      entries: [
        {
          id: "alpha-domain-language-v1",
          migrationCompleted: false,
          validatorUpdated: false
        },
        {
          id: "catalog-product-validation",
          migrationCompleted: false,
          validatorUpdated: false
        },
        {
          id: "household-fields",
          migrationCompleted: false,
          validatorUpdated: false
        },
        {
          id: "household-expired-item-policy-v1",
          migrationCompleted: false,
          validatorUpdated: false
        },
        {
          id: "household-group-shopping-policy-v1",
          migrationCompleted: false,
          validatorUpdated: false
        },
        {
          id: "household-group-shopping-distribution-v1",
          migrationCompleted: false,
          validatorUpdated: false
        },
        {
          id: "household-group-shopping-distribution-v2",
          migrationCompleted: false,
          validatorUpdated: false
        },
        {
          id: "household-invitations-v1",
          migrationCompleted: false,
          validatorUpdated: false
        },
        {
          id: "catalog-classification-v1",
          migrationCompleted: false,
          validatorUpdated: false
        },
        {
          id: "household-stock-targets-v1",
          migrationCompleted: false,
          validatorUpdated: false
        },
        {
          id: "household-products-v1",
          migrationCompleted: false,
          validatorUpdated: false
        },
        {
          id: "household-product-groups-v1",
          migrationCompleted: false,
          validatorUpdated: false
        },
        {
          id: "household-local-classification-v1",
          migrationCompleted: false,
          validatorUpdated: false
        },
        {
          id: "shopping-trip-foundation-v1",
          migrationCompleted: false,
          validatorUpdated: false
        },
        {
          id: "shop-product-price-foundation-v1",
          migrationCompleted: false,
          validatorUpdated: false
        },
        {
          id: "shop-price-observations-v1",
          migrationCompleted: false,
          validatorUpdated: false
        },
        {
          id: "feature-flag-audit-v1",
          migrationCompleted: false,
          validatorUpdated: false
        },
        {
          id: "feature-flag-revision-v1",
          migrationCompleted: false,
          validatorUpdated: false
        },
        {
          id: "feature-flag-automatic-login-v1",
          migrationCompleted: false,
          validatorUpdated: false
        }
      ]
    });

    const manualCompletionResponse = await handleAppRequest(
      {
        bodyText: JSON.stringify({ entryId: "catalog-product-validation" }),
        headers: requestHeaders,
        method: "POST",
        path: "/api/admin/database-maintenance/complete"
      },
      dependencies
    );
    expect(manualCompletionResponse.status).toBe(200);
    expect(JSON.parse(manualCompletionResponse.body)).toMatchObject({
      manuallyMarkedComplete: true,
      state: {
        completionMarkedByUserId: "admin@kamra.test",
        migrationCompletedByUserId: "admin@kamra.test",
        validatorUpdatedByUserId: "admin@kamra.test"
      }
    });

    const validatorResponse = await handleAppRequest(
      {
        bodyText: JSON.stringify({ entryId: "household-fields" }),
        headers: requestHeaders,
        method: "POST",
        path: "/api/admin/database-maintenance/validators"
      },
      dependencies
    );
    expect(validatorResponse.status).toBe(200);

    const migrationResponse = await handleAppRequest(
      {
        bodyText: JSON.stringify({ entryId: "household-fields" }),
        headers: requestHeaders,
        method: "POST",
        path: "/api/admin/database-maintenance/migrations"
      },
      dependencies
    );
    expect(migrationResponse.status).toBe(200);
    expect(JSON.parse(migrationResponse.body)).toMatchObject({
      result: {
        updatedCount: 1
      }
    });

    const finishedResponse = await handleAppRequest(
      {
        headers: requestHeaders,
        method: "GET",
        path: "/api/admin/database-maintenance"
      },
      dependencies
    );
    const finishedPayload = JSON.parse(finishedResponse.body) as {
      entries: Array<Record<string, unknown>>;
    };
    expect(
      finishedPayload.entries.find((entry) => entry["id"] === "household-fields")
    ).toMatchObject({
      migrationCompleted: true,
      validatorUpdated: true
    });
  });

  it("runs all incomplete database maintenance actions sequentially", async () => {
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
    const db = createFakeDb();
    const householdRepository = new MongoHouseholdRepository(db);
    await householdRepository.setupCollections();
    const actionOrder: string[] = [];
    const dependencies = {
      createCatalogRepository: () => ({
        listCatalogProductsForReview: async () => ({ products: [], totalCount: 0 }),
        markLegacyProductsUnvalidated: async () => {
          actionOrder.push("catalog:migration");
          return { skippedCount: 0, status: "updated" as const, updatedCount: 0 };
        },
        upgradeCatalogValidators: async () => {
          actionOrder.push("catalog:validator");
          return { createdCollections: [], databaseName: "kamra_test", upgradedCollections: [] };
        }
      }),
      createHouseholdRepository: () => householdRepository,
      getMongoClient: async () =>
        ({
          db: () => db
        }) as never
    };

    const response = await handleAppRequest(
      {
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "POST",
        path: "/api/admin/database-maintenance/run-all"
      },
      dependencies
    );

    expect(response.status).toBe(200);
    expect(actionOrder).toEqual(["catalog:validator", "catalog:migration"]);
    expect(JSON.parse(response.body)).toMatchObject({
      completedActions: [
        "alpha-domain-language-v1:validator",
        "alpha-domain-language-v1:migration",
        "catalog-product-validation:validator",
        "catalog-product-validation:migration",
        "household-fields:validator",
        "household-fields:migration",
        "household-expired-item-policy-v1:validator",
        "household-expired-item-policy-v1:migration",
        "household-group-shopping-policy-v1:validator",
        "household-group-shopping-policy-v1:migration",
        "household-group-shopping-distribution-v1:validator",
        "household-group-shopping-distribution-v1:migration",
        "household-group-shopping-distribution-v2:validator",
        "household-group-shopping-distribution-v2:migration",
        "household-invitations-v1:validator",
        "household-invitations-v1:migration",
        "catalog-classification-v1:validator",
        "catalog-classification-v1:migration",
        "household-stock-targets-v1:validator",
        "household-stock-targets-v1:migration",
        "household-products-v1:validator",
        "household-products-v1:migration",
        "household-product-groups-v1:validator",
        "household-product-groups-v1:migration",
        "household-local-classification-v1:validator",
        "household-local-classification-v1:migration",
        "shopping-trip-foundation-v1:validator",
        "shopping-trip-foundation-v1:migration",
        "shop-product-price-foundation-v1:validator",
        "shop-product-price-foundation-v1:migration",
        "shop-price-observations-v1:validator",
        "shop-price-observations-v1:migration",
        "feature-flag-audit-v1:validator",
        "feature-flag-audit-v1:migration",
        "feature-flag-revision-v1:validator",
        "feature-flag-revision-v1:migration",
        "feature-flag-automatic-login-v1:validator",
        "feature-flag-automatic-login-v1:migration"
      ]
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
        path: "/api/admin/dashboard/upgrade-catalog-validators"
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
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
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
        path: "/api/admin/dashboard/upgrade-catalog-validators"
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
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
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
        path: "/api/admin/dashboard/backfill-unvalidated-products"
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
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
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
        path: "/api/admin/dashboard/backfill-unvalidated-products"
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
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
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
      path: "/api/admin/dashboard/health"
    });

    expect(response.status).toBe(401);
    expect(JSON.parse(response.body)).toEqual({
      error: "unauthorized",
      messageKey: "apiErrors.adminRequired"
    });
  });

  it("rejects demo household reseed without an admin token", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");

    const response = await handleAppRequest({
      headers: {},
      method: "POST",
      path: "/api/admin/dashboard/reseed-demo-household"
    });

    expect(response.status).toBe(401);
    expect(JSON.parse(response.body)).toEqual({
      error: "unauthorized",
      messageKey: "apiErrors.adminRequired"
    });
  });

  it("rejects demo household reseed for a valid non-admin token", async () => {
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
      path: "/api/admin/dashboard/reseed-demo-household"
    });

    expect(response.status).toBe(401);
    expect(JSON.parse(response.body)).toEqual({
      error: "unauthorized",
      messageKey: "apiErrors.adminRequired"
    });
  });

  it("reseeds the demo household for an admin without touching unrelated users", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");
    vi.stubEnv("MONGODB_URI", "mongodb+srv://example.mongodb.net/kamra");
    vi.stubEnv("MONGODB_DB_NAME", "kamra_test");
    vi.stubEnv("SEED_DEMO_HOUSEHOLD_PASSWORD", "demo-password");

    const token = createUserToken({
      email: "admin@kamra.test",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "admin",
      secret: "test-secret"
    });
    const db = createFakeDb();
    await db.collection("users").insertOne({
      authProvider: "bootstrap_credentials",
      createdAt: new Date("2026-07-09T08:00:00.000Z"),
      email: "outside_user",
      passwordHash: "hash",
      role: "user",
      status: "active",
      updatedAt: new Date("2026-07-09T08:00:00.000Z")
    });

    const firstResponse = await handleAppRequest(
      {
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "POST",
        path: "/api/admin/dashboard/reseed-demo-household"
      },
      {
        getMongoClient: async () =>
          ({
            db: () => db
          }) as never
      }
    );

    expect(firstResponse.status).toBe(200);
    expect(JSON.parse(firstResponse.body)).toMatchObject({
      counts: {
        households: 1,
        localProducts: 12,
        memberships: 2,
        stockItems: 12,
        users: 2
      },
      databaseName: "fake_db",
      message: "Demo household data was reseeded."
    });

    const secondResponse = await handleAppRequest(
      {
        headers: {
          authorization: `Bearer ${token}`
        },
        method: "POST",
        path: "/api/admin/dashboard/reseed-demo-household"
      },
      {
        getMongoClient: async () =>
          ({
            db: () => db
          }) as never
      }
    );

    expect(secondResponse.status).toBe(200);
    expect(JSON.parse(secondResponse.body)).toMatchObject({
      counts: {
        deletedHouseholds: 1,
        deletedLocalProducts: 12,
        deletedMemberships: 2,
        deletedStockItems: 12,
        deletedUsers: 2,
        households: 1,
        localProducts: 12,
        memberships: 2,
        stockItems: 12,
        users: 2
      }
    });

    const userEmails = db.__collections["users"]?.docs.map((user) => user.email).sort();
    expect(userEmails).toEqual(["outside_user", "usera", "userb"]);
  });

  it("returns catalog products for a valid signed-in non-admin token", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");
    vi.stubEnv("MONGODB_URI", "mongodb+srv://example.mongodb.net/kamra");
    vi.stubEnv("MONGODB_DB_NAME", "kamra_test");

    const token = createUserToken({
      email: "user@kamra.test",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "user",
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
          listCatalogProductsForReview: async () => ({
            products: [],
            totalCount: 0
          })
        }),
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
      }
    );

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      pagination: {
        page: 1,
        pageSize: 100,
        totalCount: 0,
        totalPages: 0
      },
      products: []
    });
  });

  it("returns admin products with a valid admin token", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");
    vi.stubEnv("MONGODB_URI", "mongodb+srv://example.mongodb.net/kamra");
    vi.stubEnv("MONGODB_DB_NAME", "kamra_test");
    let requestedProductOptions:
      | { limit?: number; nameIncludes?: string; offset?: number; sourceNames?: string[] }
      | undefined;

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
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
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
      messageKey: "apiErrors.adminRequired"
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
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
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
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
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
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
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
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
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
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
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

  it("returns catalog offer source names for a signed-in non-admin user", async () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-secret");
    vi.stubEnv("MONGODB_URI", "mongodb+srv://example.mongodb.net/kamra");
    vi.stubEnv("MONGODB_DB_NAME", "kamra_test");

    const token = createUserToken({
      email: "user@kamra.test",
      maxAgeSeconds: 60,
      now: new Date(),
      role: "user",
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
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
      }
    );

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      sourceNames: ["aldi-hu-offers", "lidl-hu-brochure", "penny_hu_offers"]
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
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
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
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
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
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
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
        bodyText: JSON.stringify({
          snapshotId: "simple_html_table_shop:weekly-html-table:2026-07-02"
        }),
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
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
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
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
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
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
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
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
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
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
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
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
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
        getMongoClient: async () =>
          ({
            db: () => ({})
          }) as never
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
