import { createDefaultCatalogRepository } from "../app-route-context.js";
import { getHealthResult } from "../../health/get-health-report.js";
import {
  demoHouseholdSeedName,
  MongoHouseholdDemoSeedRepository,
  seedDemoHouseholdPasswordEnvName
} from "../../household/current/demo-household-seed.js";
import { assertUpdateHouseholdFeatureFlagRequest } from "../../household/v1/validation.js";
import { writeServerLog } from "../../logging/kamra-logger.js";
import { FeatureFlagService } from "../../feature-toggles/service.js";
import { MongoFeatureFlagStore } from "../../feature-toggles/mongo-store.js";
import { featureFlagDefinitions, type FeatureFlagKey } from "../../feature-toggles/contracts.js";
import { describeRequest, json, unauthorized, type AppRoute } from "../app-route-context.js";

export const adminDashboardHealthRoute: AppRoute = {
  match: (request) => request.method === "GET" && request.path === "/api/admin/dashboard/health",
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user || user.role !== "admin") {
      return unauthorized("apiErrors.adminRequired");
    }

    const config = context.config;
    const result = await getHealthResult(config, {
      onHealthCheckFailed: (error) => {
        writeServerLog("error", "Health check failed", {
          error,
          ...describeRequest(request)
        });
      },
      pingMongo: async () => {
        if (!config.mongodb.uri || !config.mongodb.databaseName) {
          return;
        }

        const client = await context.getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
        await client.db(config.mongodb.databaseName).command({ ping: 1 });
      }
    });

    writeServerLog("info", "Health check completed", {
      databaseName: result.report.checks.database.databaseName,
      databaseStatus: result.report.checks.database.status,
      ...describeRequest(request),
      status: result.report.status,
      statusCode: result.statusCode
    });

    return json(result.statusCode, result.report);
  }
};

export const adminDashboardUpgradeCatalogValidatorsRoute: AppRoute = {
  match: (request) =>
    request.method === "POST" && request.path === "/api/admin/dashboard/upgrade-catalog-validators",
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user || user.role !== "admin") {
      return unauthorized("apiErrors.adminRequired");
    }

    const config = context.config;
    if (!config.mongodb.uri || !config.mongodb.databaseName) {
      return json(503, { error: "catalog_not_configured" });
    }

    const client = await context.getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
    const repository = context.dependencies.createCatalogRepository
      ? context.dependencies.createCatalogRepository(client.db(config.mongodb.databaseName))
      : createDefaultCatalogRepository(client.db(config.mongodb.databaseName));

    if (!repository.upgradeCatalogValidators) {
      return json(501, {
        error: "catalog_validator_upgrade_not_supported"
      });
    }

    try {
      const result = await repository.upgradeCatalogValidators();

      writeServerLog("info", "Catalog validators upgraded", {
        createdCollections: result.createdCollections,
        databaseName: result.databaseName,
        ...describeRequest(request),
        upgradedBy: user.email,
        upgradedCollections: result.upgradedCollections
      });

      return json(200, {
        createdCollections: result.createdCollections,
        databaseName: result.databaseName,
        message: "Catalog collection validators were upgraded to the current schema.",
        upgradedCollections: result.upgradedCollections
      });
    } catch (error: unknown) {
      writeServerLog("error", "Catalog validator upgrade failed", {
        error,
        ...describeRequest(request)
      });

      return json(500, {
        error: "catalog_validator_upgrade_failed",
        message: "Catalog collection validators could not be upgraded."
      });
    }
  }
};

export const adminDashboardMarkLegacyProductsUnvalidatedRoute: AppRoute = {
  match: (request) =>
    request.method === "POST" &&
    request.path === "/api/admin/dashboard/backfill-unvalidated-products",
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user || user.role !== "admin") {
      return unauthorized("apiErrors.adminRequired");
    }

    const config = context.config;
    if (!config.mongodb.uri || !config.mongodb.databaseName) {
      return json(503, { error: "catalog_not_configured" });
    }

    const client = await context.getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
    const repository = context.dependencies.createCatalogRepository
      ? context.dependencies.createCatalogRepository(client.db(config.mongodb.databaseName))
      : createDefaultCatalogRepository(client.db(config.mongodb.databaseName));

    if (!repository.markLegacyProductsUnvalidated) {
      return json(501, {
        error: "catalog_backfill_not_supported"
      });
    }

    let result: Awaited<ReturnType<NonNullable<typeof repository.markLegacyProductsUnvalidated>>>;
    try {
      result = await repository.markLegacyProductsUnvalidated();
    } catch (error: unknown) {
      writeServerLog("error", "Legacy product validation backfill failed", {
        error,
        ...describeRequest(request)
      });

      return json(500, {
        error: "catalog_backfill_failed",
        message: "Legacy products could not be marked as unvalidated."
      });
    }

    writeServerLog("info", "Legacy product validation backfill completed", {
      markedBy: user.email,
      ...describeRequest(request),
      skippedCount: result.skippedCount,
      status: result.status,
      updatedCount: result.updatedCount
    });

    return json(200, {
      message:
        result.status === "validator_incompatible"
          ? "Existing products are treated as unvalidated by the read model because the current MongoDB collection validator still rejects validation fields."
          : "Legacy products were marked as unvalidated.",
      skippedCount: result.skippedCount,
      status: result.status,
      updatedCount: result.updatedCount
    });
  }
};

export const adminDashboardReseedDemoHouseholdRoute: AppRoute = {
  match: (request) =>
    request.method === "POST" && request.path === "/api/admin/dashboard/reseed-demo-household",
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user || user.role !== "admin") {
      return unauthorized("apiErrors.adminRequired");
    }

    const config = context.config;
    if (!config.mongodb.uri || !config.mongodb.databaseName) {
      return json(503, { error: "household_not_configured" });
    }

    const password = process.env[seedDemoHouseholdPasswordEnvName]?.trim();
    if (!password) {
      return json(503, {
        error: "demo_household_seed_not_configured",
        message: `${seedDemoHouseholdPasswordEnvName} is required for demo household reseeding.`
      });
    }

    const client = await context.getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
    const repository = new MongoHouseholdDemoSeedRepository(client.db(config.mongodb.databaseName));

    try {
      const setup = await repository.setup();
      const counts = await repository.reseedDemoHousehold({ userPassword: password });
      await repository.recordSeed({
        completedAt: new Date(),
        details: {
          counts,
          databaseName: setup.databaseName,
          triggeredBy: user.email,
          triggerPath: request.path
        },
        seedName: demoHouseholdSeedName,
        status: "ok"
      });

      writeServerLog("info", "Admin demo household reseed completed", {
        counts,
        databaseName: setup.databaseName,
        ...describeRequest(request),
        reseededBy: user.email
      });

      return json(200, {
        counts,
        databaseName: setup.databaseName,
        ensuredCollections: setup.ensuredCollections,
        message: "Demo household data was reseeded."
      });
    } catch (error: unknown) {
      writeServerLog("error", "Admin demo household reseed failed", {
        error,
        ...describeRequest(request)
      });

      return json(500, {
        error: "demo_household_reseed_failed",
        message:
          error instanceof Error && error.message
            ? error.message
            : "Demo household data could not be reseeded."
      });
    }
  }
};

export const adminDashboardFeatureFlagsRoute: AppRoute = {
  match: (request) =>
    (request.method === "GET" || request.method === "PATCH") &&
    request.path === "/api/admin/dashboard/feature-flags",
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user || user.role !== "admin") {
      return unauthorized("apiErrors.adminRequired");
    }

    const config = context.config;
    if (!config.mongodb.uri || !config.mongodb.databaseName) {
      return json(503, { error: "household_not_configured" });
    }

    const client = await context.getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
    const database = client.db(config.mongodb.databaseName);
    const featureFlags = new FeatureFlagService(new MongoFeatureFlagStore(database));
    if (request.method === "GET") {
      return json(200, {
        featureFlags: (
          await Promise.all(
            (Object.keys(featureFlagDefinitions) as FeatureFlagKey[]).map((key) =>
              featureFlags.evaluate(key)
            )
          )
        ).map(({ enabled, key }) => ({ enabled, key }))
      });
    }

    const body = parseJsonObject(request.bodyText);
    if (!body) {
      return json(400, { error: "invalid_json_body" });
    }

    try {
      assertUpdateHouseholdFeatureFlagRequest(body);
      if ((body.key as string) in featureFlagDefinitions === false)
        throw new Error("unknown feature flag");
    } catch (error: unknown) {
      return json(400, {
        error: "invalid_household_feature_flag_update_request",
        message: error instanceof Error ? error.message : "Feature flag update request is invalid."
      });
    }

    const updatedFlag = await featureFlags.update({
      actorUserId: user.email,
      enabled: body.enabled,
      key: body.key as FeatureFlagKey,
      reason: typeof body["reason"] === "string" ? body["reason"] : "Admin dashboard update",
      updatedAt: new Date().toISOString()
    });

    writeServerLog("info", "Admin dashboard feature flag updated", {
      enabled: updatedFlag.enabled,
      key: updatedFlag.key,
      ...describeRequest(request),
      updatedBy: user.email
    });

    return json(200, {
      featureFlags: [
        {
          enabled: updatedFlag.enabled,
          key: updatedFlag.key
        }
      ]
    });
  }
};

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
