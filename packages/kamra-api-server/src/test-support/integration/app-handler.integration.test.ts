import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MongoHouseholdRepository } from "../../household/current/mongo-household-repository.js";
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
          enabled: true,
          key: "useAbbreviatedUiLabels"
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
});
