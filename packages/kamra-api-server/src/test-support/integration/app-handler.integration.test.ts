import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MongoHouseholdRepository } from "../../household/current/mongo-household-repository.js";
import type { HouseholdProduct } from "../../household/v2/contracts.js";
import type { ShoppingTrip } from "../../household/v2/stage9-contracts.js";
import type { IngestionRawSnapshotRecord } from "../../ingestion/v1/contracts.js";
import { createIntegrationHarness } from "./app-harness.js";

beforeEach(() => {
  vi.stubEnv("AUTH_TOKEN_SECRET", "stage11-integration-secret");
  vi.stubEnv("MONGODB_URI", "mongodb://stage11-integration.invalid/kamra");
  vi.stubEnv("MONGODB_DB_NAME", "stage11_integration");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Stage 11 application integration harness", () => {
  it("runs an admin feature-flag request through auth, route, repository, and fake persistence", async () => {
    const harness = createIntegrationHarness({
      user: { email: "stage11-admin@kamra.test", role: "admin" }
    });
    await new MongoHouseholdRepository(harness.database).setupCollections();

    const initial = await harness.send({
      method: "GET",
      path: "/api/admin/dashboard/feature-flags"
    });
    expect(initial.status).toBe(200);

    const update = await harness.send({
      bodyText: JSON.stringify({
        enabled: true,
        key: "useAbbreviatedUiLabels"
      }),
      method: "PATCH",
      path: "/api/admin/dashboard/feature-flags"
    });
    expect(update.status).toBe(200);
    expect(JSON.parse(update.body)).toEqual({
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

    const stored = await harness.database
      .collection("household_feature_flags")
      .findOne({ key: "useAbbreviatedUiLabels" });
    expect(stored).toMatchObject({
      enabled: true,
      key: "useAbbreviatedUiLabels",
      updatedByUserId: "stage11-admin@kamra.test"
    });
  });

  it("bridges an admin feature-flag update into the household workspace response", async () => {
    const harness = createIntegrationHarness({
      user: { email: "stage11-flag-owner@kamra.test", role: "admin" }
    });
    await harness.database.collection("household_memberships").insertOne({
      householdId: harness.householdId,
      status: "active",
      userId: harness.user.email
    });

    const before = await harness.send({
      method: "GET",
      path: `/api/households/${harness.householdId}/stock-workspace`
    });
    expect(JSON.parse(before.body).productGroupWorkspace.useAbbreviatedUiLabels).toBe(false);

    const update = await harness.send({
      bodyText: JSON.stringify({
        enabled: true,
        key: "useAbbreviatedUiLabels"
      }),
      method: "PATCH",
      path: "/api/admin/dashboard/feature-flags"
    });
    expect(update.status).toBe(200);

    const after = await harness.send({
      method: "GET",
      path: `/api/households/${harness.householdId}/stock-workspace`
    });
    expect(JSON.parse(after.body).productGroupWorkspace.useAbbreviatedUiLabels).toBe(true);
  });

  it("runs a household workspace request through token auth, membership, and grouped read repositories", async () => {
    const harness = createIntegrationHarness({
      user: { email: "stage11-user@kamra.test", role: "user" }
    });
    await harness.database.collection("household_memberships").insertOne({
      householdId: harness.householdId,
      status: "active",
      userId: harness.user.email
    });
    await harness.database.collection("households").insertOne({
      allowExpiredItems: true,
      id: harness.householdId
    });

    const response = await harness.send({
      method: "GET",
      path: `/api/households/${harness.householdId}/stock-workspace`
    });

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      productGroupWorkspace: {
        productGroups: [],
        unassignedProducts: []
      },
      schemaVersion: "household-v2",
      workspace: {
        allowExpiredItems: true,
        products: [],
        targets: [],
        unassignedBatches: [],
        unassignedProducts: []
      }
    });
  });

  it("writes a Product Group, Product, and Batch through the composer and returns the grouped read model", async () => {
    const harness = createIntegrationHarness({
      user: { email: "stage11-product-owner@kamra.test", role: "user" }
    });
    await harness.database.collection("household_memberships").insertOne({
      householdId: harness.householdId,
      status: "active",
      userId: harness.user.email
    });

    const create = await harness.send({
      bodyText: JSON.stringify({
        batch: {
          acquiredOn: "2026-07-12",
          displayName: "Pilos 1.5% milk",
          expiryOn: "2026-07-14",
          originalQuantity: 1.5,
          unit: "l"
        },
        group: {
          displayName: "Milk",
          targetPolicy: {
            consumptionPolicy: "earliest_expiry_first",
            desiredQuantity: 4,
            expiryWarningDays: 2,
            minimumQuantity: 2,
            trackingUnit: "l"
          },
          trackingUnit: "l"
        },
        operationId: "compose-milk-1",
        product: {
          defaultTrackingUnit: "l",
          displayName: "Pilos 1.5% milk",
          note: "manual integration fixture"
        },
        requestFingerprint: "compose-milk-1-fingerprint"
      }),
      method: "POST",
      path: `/api/households/${harness.householdId}/product-composer`
    });

    expect(create.status).toBe(201);
    const createBody = JSON.parse(create.body) as {
      result: {
        batchId: string;
        productGroupId: string;
        productId: string;
      };
    };
    expect(createBody.result.productGroupId).toContain("product-group:");

    const workspace = await harness.send({
      method: "GET",
      path: `/api/households/${harness.householdId}/stock-workspace`
    });
    expect(workspace.status).toBe(200);
    const workspaceBody = JSON.parse(workspace.body) as {
      productGroupWorkspace: {
        productGroups: Array<{
          aggregate: { availableQuantity: number; state: string };
          group: { displayName: string; targetPolicy: { desiredQuantity: number } };
          products: Array<{
            batches: Array<{ id: string; householdProductId: string; remainingQuantity: number }>;
            product: { displayName: string; id: string; productGroupId: string };
          }>;
        }>;
      };
    };
    const group = workspaceBody.productGroupWorkspace.productGroups[0]!;
    const product = group.products[0]!;
    const batch = product.batches[0]!;
    expect(group.group).toMatchObject({
      displayName: "Milk",
      targetPolicy: { desiredQuantity: 4 }
    });
    expect(group.aggregate).toMatchObject({
      availableQuantity: 1.5,
      state: "below_minimum"
    });
    expect(product.product).toMatchObject({
      displayName: "Pilos 1.5% milk",
      id: createBody.result.productId,
      productGroupId: createBody.result.productGroupId
    });
    expect(batch).toMatchObject({
      householdProductId: createBody.result.productId,
      id: createBody.result.batchId,
      remainingQuantity: 1.5
    });
  });

  it("keeps household membership as a real integration boundary", async () => {
    const harness = createIntegrationHarness({
      user: { email: "stage11-outsider@kamra.test", role: "user" }
    });
    await harness.database.collection("household_memberships").insertOne({
      householdId: harness.householdId,
      status: "active",
      userId: "another-user@kamra.test"
    });

    const response = await harness.send({
      method: "GET",
      path: `/api/households/${harness.householdId}/stock-workspace`
    });

    expect(response.status).toBe(403);
    expect(JSON.parse(response.body)).toEqual({
      error: "household_membership_required"
    });
  });

  it("bridges the Home shopping list into the v2 shopping-trip need list", async () => {
    const harness = createIntegrationHarness({
      user: { email: "stage11-shopping-bridge@kamra.test", role: "user" }
    });
    const householdRepository = new MongoHouseholdRepository(harness.database);
    await householdRepository.setupCollections();
    await householdRepository.createHousehold({
      createdAt: "2026-07-13T10:00:00.000Z",
      createdByUserId: harness.user.email,
      id: harness.householdId,
      name: "Bridge household"
    });

    const composed = await harness.send({
      bodyText: JSON.stringify({
        batch: {
          acquiredOn: "2026-07-12",
          displayName: "Pilos milk",
          originalQuantity: 1,
          unit: "l"
        },
        group: {
          displayName: "Milk",
          targetPolicy: {
            consumptionPolicy: "earliest_expiry_first",
            desiredQuantity: 2,
            expiryWarningDays: 0,
            minimumQuantity: 2,
            trackingUnit: "l"
          },
          trackingUnit: "l"
        },
        operationId: "compose-shopping-bridge",
        product: { defaultTrackingUnit: "l", displayName: "Pilos milk" },
        requestFingerprint: "compose-shopping-bridge-fingerprint"
      }),
      method: "POST",
      path: `/api/households/${harness.householdId}/product-composer`
    });
    expect(composed.status).toBe(201);

    const shoppingList = await harness.send({
      bodyText: JSON.stringify({
        householdId: harness.householdId,
        scale: "business_as_usual"
      }),
      method: "POST",
      path: "/api/household/shopping-lists"
    });
    expect(shoppingList.status).toBe(201);
    const needList = await harness.database
      .collection("household_shopping_need_lists")
      .findOne({ householdId: harness.householdId });
    expect(needList?.["items"]).toHaveLength(1);

    const trip = await harness.send({
      bodyText: JSON.stringify({
        plannedDate: "2026-07-14",
        shopNameSnapshot: "Lidl"
      }),
      method: "POST",
      path: `/api/households/${harness.householdId}/shopping-trips`
    });
    expect(trip.status).toBe(201);
    expect(JSON.parse(trip.body).result.items).toHaveLength(1);
  });

  it("creates a Product-owned Batch and one Ingestion Submission across an idempotent partial trip retry", async () => {
    const harness = createIntegrationHarness({
      user: { email: "stage11-trip-owner@kamra.test", role: "user" }
    });
    const productId = `household-product:${harness.householdId}:milk`;
    const tripId = `shopping-trip:${harness.householdId}:trip-1`;
    const boughtItemId = `${tripId}:milk`;
    const product: HouseholdProduct = {
      classificationRevision: 0,
      createdAt: "2026-07-12T10:00:00.000Z",
      createdByUserId: harness.user.email,
      defaultTrackingUnit: "l",
      directAttributes: [],
      directConcepts: [],
      displayName: "Pilos 1.5% milk",
      householdId: harness.householdId,
      id: productId,
      identityKind: "manual",
      identitySnapshot: {},
      note: null,
      productGroupId: null,
      revision: 0,
      status: "active",
      targetPolicy: null,
      updatedAt: "2026-07-12T10:00:00.000Z",
      updatedByUserId: harness.user.email
    };
    const trip: ShoppingTrip = {
      createdAt: "2026-07-12T10:00:00.000Z",
      createdByUserId: harness.user.email,
      householdId: harness.householdId,
      id: tripId,
      items: [
        {
          displayNameSnapshot: product.displayName,
          id: boughtItemId,
          needId: "need:milk",
          planStatus: "selected",
          requiredQuantity: 2,
          requiredUnit: "l",
          resultStatus: "pending"
        },
        {
          displayNameSnapshot: "Bread",
          id: `${tripId}:bread`,
          needId: "need:bread",
          planStatus: "selected",
          requiredQuantity: 1,
          requiredUnit: "count",
          resultStatus: "pending"
        }
      ],
      plannedDate: "2026-07-13",
      revision: 0,
      shopMarketId: "market:demo",
      sourceShoppingNeedListId: "shopping-needs:demo",
      status: "in_progress",
      updatedAt: "2026-07-12T10:00:00.000Z",
      updatedByUserId: harness.user.email
    };
    await harness.database.collection("household_memberships").insertOne({
      householdId: harness.householdId,
      status: "active",
      userId: harness.user.email
    });
    await harness.database.collection("household_products").insertOne(product);
    await harness.database.collection("household_shopping_trips").insertOne(trip);

    const completion = {
      items: [
        {
          acquiredOn: "2026-07-13",
          actualCurrencyCode: "HUF",
          actualExpiryOn: "2026-07-20",
          actualPaidPrice: 499,
          actualQuantity: 2,
          actualUnit: "l",
          householdProductId: productId,
          itemId: boughtItemId,
          resultStatus: "bought"
        }
      ],
      operationId: "trip-complete-1"
    };
    const first = await harness.send({
      bodyText: JSON.stringify(completion),
      method: "POST",
      path: `/api/households/${harness.householdId}/shopping-trips/${encodeURIComponent(tripId)}/complete`
    });
    expect(first.status).toBe(200);
    expect(JSON.parse(first.body).result.status).toBe("partially_processed");

    const retry = await harness.send({
      bodyText: JSON.stringify(completion),
      method: "POST",
      path: `/api/households/${harness.householdId}/shopping-trips/${encodeURIComponent(tripId)}/complete`
    });
    expect(retry.status).toBe(200);
    expect(JSON.parse(retry.body).result.status).toBe("partially_processed");

    expect(
      await harness.database
        .collection("household_stock_batches")
        .countDocuments({ householdId: harness.householdId })
    ).toBe(1);
    expect(
      await harness.database
        .collection("ingestion_submissions")
        .countDocuments({ shoppingTripId: tripId })
    ).toBe(1);
    expect(
      await harness.database
        .collection("household_domain_operations")
        .countDocuments({ id: `trip-complete-1:${boughtItemId}` })
    ).toBe(1);
  });

  it("turns a raw ingestion snapshot into a persisted admin review candidate", async () => {
    const harness = createIntegrationHarness({
      user: { email: "stage11-ingestion-admin@kamra.test", role: "admin" }
    });
    const snapshot: IngestionRawSnapshotRecord = {
      capturedAt: "2026-07-13T08:00:00.000Z",
      contentHash: "stage11-content-hash",
      contentType: "text/html",
      crawlDate: "2026-07-13",
      crawlRunId: "stage11-crawl-1",
      id: "lidl:milk-row:2026-07-13",
      parserName: "stage11-fixture-parser",
      parserVersion: "1.0.0",
      parsedRows: [
        {
          categoryLabel: "Dairy",
          countryCode: "HU",
          displayName: "Pilos 1.5% tej",
          packageLabel: "1 l",
          priceObservations: [
            {
              currencyCode: "HUF",
              observedAt: "2026-07-13T08:00:00.000Z",
              price: 299,
              priceKind: "base"
            }
          ],
          priceValue: 299,
          rawName: "Pilos 1.5% tej 1 l",
          sourceName: "lidl",
          sourceProductKey: "milk-1l",
          sourceRecordId: "milk-row",
          sourceUrl: "https://example.test/lidl/milk-1l",
          storeBrandKey: "pilos"
        }
      ],
      payloadText: "sanitized stage11 fixture",
      sourceName: "lidl",
      sourceRecordId: "milk-row",
      sourceUrl: "https://example.test/lidl/2026-07-13",
      workflowName: "stage11-integration-fixture"
    };
    await harness.database.collection("ingestion_raw_snapshots").insertOne(snapshot);

    const prepared = await harness.send({
      bodyText: JSON.stringify({ snapshotId: snapshot.id }),
      method: "POST",
      path: "/api/admin/ingestion/prepare-review-items"
    });
    expect(prepared.status).toBe(200);
    expect(JSON.parse(prepared.body)).toMatchObject({
      preparedCount: 1,
      snapshotId: snapshot.id
    });

    const listed = await harness.send({
      method: "GET",
      path: "/api/admin/ingestion/review-items",
      query: { snapshotId: snapshot.id }
    });
    expect(listed.status).toBe(200);
    expect(JSON.parse(listed.body)).toMatchObject({
      reviewItems: [
        {
          candidate: {
            matchConfidence: "strong_source_key",
            product: {
              measurements: [{ normalizedUnit: "ml", normalizedValue: 1000 }],
              name: "Pilos 1.5% tej"
            },
            source: {
              sourceName: "lidl",
              sourceProductKey: "milk-1l"
            }
          },
          id: `${snapshot.id}:0`,
          status: "pending"
        }
      ]
    });
  });
});
