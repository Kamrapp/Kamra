import { createDefaultCatalogRepository, createDefaultHouseholdRepository } from "../app-route-context.js";
import { findDatabaseMaintenanceEntry, databaseMaintenanceEntries } from "../../database-maintenance/registry.js";
import { MongoMaintenanceRunRepository } from "../../database-maintenance/mongo-maintenance-run-repository.js";
import { writeServerLog } from "../../logging/kamra-logger.js";
import { MongoFeatureFlagStore } from "../../feature-toggles/mongo-store.js";
import { MongoClassificationRepository } from "../../catalog/v2/mongo-classification-repository.js";
import type { ProductTagAssignmentRecord, ProductTagRecord } from "../../catalog/v1/contracts.js";
import { MongoStockMigrationRepository } from "../../household/v2/mongo-stock-migration.js";
import { MongoHouseholdProductRepository } from "../../household/v2/mongo-household-product-repository.js";
import { describeRequest, json, unauthorized, type AppRoute } from "../app-route-context.js";

export const databaseMaintenanceListRoute: AppRoute = {
  match: (request) => request.method === "GET" && request.path === "/api/admin/database-maintenance",
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user || user.role !== "admin") {
      return unauthorized("apiErrors.adminRequired");
    }

    const database = await getDatabase(context);
    if (!database) {
      return json(503, { error: "database_maintenance_not_configured" });
    }

    const states = await new MongoMaintenanceRunRepository(database).listStates();
    const stateById = new Map(states.map((state) => [state.id, state]));

    return json(200, {
      entries: databaseMaintenanceEntries.map((entry) => {
        const state = stateById.get(entry.id);
        return {
          details: entry.details,
          id: entry.id,
          migrationCompleted: Boolean(state?.migrationCompletedAt),
          title: entry.title,
          validatorUpdated: Boolean(state?.validatorUpdatedAt)
        };
      })
    });
  }
};

export const databaseMaintenanceValidatorRoute: AppRoute = {
  match: (request) => request.method === "POST" && request.path === "/api/admin/database-maintenance/validators",
  handle: async (request, context) => await runDatabaseMaintenanceAction(request, context, "validator")
};

export const databaseMaintenanceMigrationRoute: AppRoute = {
  match: (request) => request.method === "POST" && request.path === "/api/admin/database-maintenance/migrations",
  handle: async (request, context) => await runDatabaseMaintenanceAction(request, context, "migration")
};

export const databaseMaintenanceCompleteRoute: AppRoute = {
  match: (request) => request.method === "POST" && request.path === "/api/admin/database-maintenance/complete",
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user || user.role !== "admin") {
      return unauthorized("apiErrors.adminRequired");
    }

    const body = parseJsonObject(request.bodyText);
    const entryId = typeof body?.["entryId"] === "string" ? body["entryId"] : null;
    if (!entryId || !findDatabaseMaintenanceEntry(entryId)) {
      return json(400, { error: "invalid_database_maintenance_entry" });
    }

    const database = await getDatabase(context);
    if (!database) {
      return json(503, { error: "database_maintenance_not_configured" });
    }

    const state = await new MongoMaintenanceRunRepository(database).markEntryComplete(
      entryId,
      user.email,
      new Date()
    );
    return json(200, {
      entryId,
      manuallyMarkedComplete: true,
      state
    });
  }
};

export const databaseMaintenanceRunAllRoute: AppRoute = {
  match: (request) => request.method === "POST" && request.path === "/api/admin/database-maintenance/run-all",
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user || user.role !== "admin") {
      return unauthorized("apiErrors.adminRequired");
    }

    const database = await getDatabase(context);
    if (!database) {
      return json(503, { error: "database_maintenance_not_configured" });
    }

    const tracking = new MongoMaintenanceRunRepository(database);
    const stateById = new Map((await tracking.listStates()).map((state) => [state.id, state]));
    const completedActions: string[] = [];

    try {
      for (const entry of databaseMaintenanceEntries) {
        let state = stateById.get(entry.id);
        if (!state?.validatorUpdatedAt) {
          await runValidatorAction(entry.id, database, context);
          state = await tracking.markValidatorUpdated(entry.id, user.email, new Date());
          stateById.set(entry.id, state);
          completedActions.push(`${entry.id}:validator`);
        }
        if (!state.migrationCompletedAt) {
          await runMigrationAction(entry.id, database, context);
          state = await tracking.markMigrationCompleted(entry.id, user.email, new Date());
          stateById.set(entry.id, state);
          completedActions.push(`${entry.id}:migration`);
        }
      }
    } catch (error: unknown) {
      writeServerLog("error", "Database maintenance run-all failed", {
        completedActions,
        error,
        ...describeRequest(request)
      });
      return json(500, {
        completedActions,
        error: "database_maintenance_run_all_failed",
        message: error instanceof Error && error.message
          ? error.message
          : "The database maintenance run-all action failed."
      });
    }

    return json(200, {
      completedActions,
      message: "All incomplete database maintenance actions completed."
    });
  }
};

async function runDatabaseMaintenanceAction(
  request: Parameters<AppRoute["handle"]>[0],
  context: Parameters<AppRoute["handle"]>[1],
  action: "migration" | "validator"
) {
  const user = context.authenticateRequestUser(request);
  if (!user || user.role !== "admin") {
    return unauthorized("apiErrors.adminRequired");
  }

  const body = parseJsonObject(request.bodyText);
  const entryId = typeof body?.["entryId"] === "string" ? body["entryId"] : null;
  const entry = entryId ? findDatabaseMaintenanceEntry(entryId) : null;
  if (!entry) {
    return json(400, { error: "invalid_database_maintenance_entry" });
  }

  const database = await getDatabase(context);
  if (!database) {
    return json(503, { error: "database_maintenance_not_configured" });
  }

  const tracking = new MongoMaintenanceRunRepository(database);
  const now = new Date();

  try {
    const result = action === "validator"
      ? await runValidatorAction(entry.id, database, context)
      : await runMigrationAction(entry.id, database, context);
    const state = action === "validator"
      ? await tracking.markValidatorUpdated(entry.id, user.email, now)
      : await tracking.markMigrationCompleted(entry.id, user.email, now);

    writeServerLog("info", "Database maintenance action completed", {
      action,
      entryId: entry.id,
      ...describeRequest(request),
      ranBy: user.email
    });

    return json(200, {
      entryId: entry.id,
      result,
      state
    });
  } catch (error: unknown) {
    writeServerLog("error", "Database maintenance action failed", {
      action,
      entryId: entry.id,
      error,
      ...describeRequest(request)
    });

    return json(500, {
      entryId: entry.id,
      error: "database_maintenance_action_failed",
      message: error instanceof Error && error.message
        ? error.message
        : "The database maintenance action failed."
    });
  }
}

async function runValidatorAction(
  entryId: string,
  database: Db,
  context: Parameters<AppRoute["handle"]>[1]
): Promise<unknown> {
  if (entryId === "catalog-classification-v1") {
    return await new MongoClassificationRepository(database).setupCollections();
  }
  if (entryId === "feature-flag-audit-v1") {
    return await new MongoFeatureFlagStore(database).setupCollections();
  }
  if (entryId === "household-stock-targets-v1") {
    return await new MongoStockMigrationRepository(database).setupCollections();
  }
  if (entryId === "household-products-v1") {
    return await new MongoHouseholdProductRepository(database).setupCollections();
  }
  if (entryId === "household-expired-item-policy-v1") {
    const repository = context.dependencies.createHouseholdRepository
      ? context.dependencies.createHouseholdRepository(database)
      : createDefaultHouseholdRepository(database);
    return await repository.upgradeHouseholdValidators();
  }
  if (entryId === "catalog-product-validation") {
    const repository = context.dependencies.createCatalogRepository
      ? context.dependencies.createCatalogRepository(database)
      : createDefaultCatalogRepository(database);
    if (!repository.upgradeCatalogValidators) {
      throw new Error("Catalog validator upgrade is not supported.");
    }
    return await repository.upgradeCatalogValidators();
  }

  const repository = context.dependencies.createHouseholdRepository
    ? context.dependencies.createHouseholdRepository(database)
    : createDefaultHouseholdRepository(database);
  return await repository.upgradeHouseholdValidators();
}

async function runMigrationAction(
  entryId: string,
  database: Db,
  context: Parameters<AppRoute["handle"]>[1]
): Promise<unknown> {
  if (entryId === "catalog-classification-v1") {
    const repository = new MongoClassificationRepository(database);
    const tags = await database.collection<ProductTagRecord>("product_tags").find({}).toArray();
    const assignments = await database.collection<ProductTagAssignmentRecord>("product_tag_assignments").find({}).toArray();
    return await repository.migrateLegacy(tags, assignments);
  }
  if (entryId === "feature-flag-audit-v1") {
    return { status: "ready", migratedCount: 0 };
  }
  if (entryId === "household-stock-targets-v1") {
    return await new MongoStockMigrationRepository(database).migrateLegacy();
  }
  if (entryId === "household-products-v1") {
    return await new MongoHouseholdProductRepository(database).migrateLegacy();
  }
  if (entryId === "household-expired-item-policy-v1") {
    const repository = context.dependencies.createHouseholdRepository
      ? context.dependencies.createHouseholdRepository(database)
      : createDefaultHouseholdRepository(database);
    return await repository.migrateExpiredItemPolicy();
  }
  if (entryId === "catalog-product-validation") {
    const repository = context.dependencies.createCatalogRepository
      ? context.dependencies.createCatalogRepository(database)
      : createDefaultCatalogRepository(database);
    if (!repository.markLegacyProductsUnvalidated) {
      throw new Error("Catalog data migration is not supported.");
    }
    return await repository.markLegacyProductsUnvalidated();
  }

  const repository = context.dependencies.createHouseholdRepository
    ? context.dependencies.createHouseholdRepository(database)
    : createDefaultHouseholdRepository(database);
  return await repository.migrateHouseholdDefaultFields();
}

async function getDatabase(
  context: Parameters<AppRoute["handle"]>[1]
): Promise<Db | null> {
  const config = context.config;
  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    return null;
  }

  const client = await context.getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
  return client.db(config.mongodb.databaseName);
}

function parseJsonObject(bodyText: string | undefined): Record<string, unknown> | null {
  if (!bodyText) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(bodyText);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}
import type { Db } from "mongodb";
