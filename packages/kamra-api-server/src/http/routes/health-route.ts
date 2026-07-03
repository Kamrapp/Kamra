import { createDefaultCatalogRepository } from "../app-route-context.js";
import { getHealthResult } from "../../health/get-health-report.js";
import { writeServerLog } from "../../logging/kamra-logger.js";
import { json, unauthorized, type AppRoute } from "../app-route-context.js";

export const healthRoute: AppRoute = {
  match: (request) => request.method === "GET" && request.path === "/api/health",
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user || user.role !== "admin") {
      return unauthorized("Sign in as an admin to view this resource.");
    }

    const config = context.config;
    const result = await getHealthResult(config, {
      onHealthCheckFailed: (error) => {
        writeServerLog("error", "Health check failed", error);
      },
      pingMongo: async () => {
        if (!config.mongodb.uri || !config.mongodb.databaseName) {
          return;
        }

        const client = await context.getMongoClient(
          config.mongodb.uri,
          config.mongodb.dnsServers
        );
        await client.db(config.mongodb.databaseName).command({ ping: 1 });
      }
    });

    writeServerLog("info", "Health check completed", {
      databaseName: result.report.checks.database.databaseName,
      databaseStatus: result.report.checks.database.status,
      requestPath: request.path,
      status: result.report.status,
      statusCode: result.statusCode
    });

    return json(result.statusCode, result.report);
  }
};

export const upgradeCatalogValidatorsRoute: AppRoute = {
  match: (request) => request.method === "POST" && request.path === "/api/health/upgrade-catalog-validators",
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user || user.role !== "admin") {
      return unauthorized("Sign in as an admin to view this resource.");
    }

    const config = context.config;
    if (!config.mongodb.uri || !config.mongodb.databaseName) {
      return json(503, { error: "catalog_not_configured" });
    }

    const client = await context.getMongoClient(
      config.mongodb.uri,
      config.mongodb.dnsServers
    );
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
      writeServerLog("error", "Catalog validator upgrade failed", error);

      return json(500, {
        error: "catalog_validator_upgrade_failed",
        message: "Catalog collection validators could not be upgraded."
      });
    }
  }
};

export const markLegacyProductsUnvalidatedRoute: AppRoute = {
  match: (request) => request.method === "POST" && request.path === "/api/health/backfill-unvalidated-products",
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user || user.role !== "admin") {
      return unauthorized("Sign in as an admin to view this resource.");
    }

    const config = context.config;
    if (!config.mongodb.uri || !config.mongodb.databaseName) {
      return json(503, { error: "catalog_not_configured" });
    }

    const client = await context.getMongoClient(
      config.mongodb.uri,
      config.mongodb.dnsServers
    );
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
      writeServerLog("error", "Legacy product validation backfill failed", error);

      return json(500, {
        error: "catalog_backfill_failed",
        message: "Legacy products could not be marked as unvalidated."
      });
    }

    writeServerLog("info", "Legacy product validation backfill completed", {
      markedBy: user.email,
      skippedCount: result.skippedCount,
      status: result.status,
      updatedCount: result.updatedCount
    });

    return json(200, {
      message: result.status === "validator_incompatible"
        ? "Existing products are treated as unvalidated by the read model because the current MongoDB collection validator still rejects validation fields."
        : "Legacy products were marked as unvalidated.",
      skippedCount: result.skippedCount,
      status: result.status,
      updatedCount: result.updatedCount
    });
  }
};
