import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import { MongoAlphaDomainLanguageMaintenance } from "../packages/kamra-api-server/src/database-maintenance/alpha-domain-language-maintenance.js";
import { MongoMaintenanceRunRepository } from "../packages/kamra-api-server/src/database-maintenance/mongo-maintenance-run-repository.js";
import {
  closeMongoClient,
  getMongoClient
} from "../packages/kamra-api-server/src/db/mongo-client.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function readArgument(name: string): string | null {
  const value = process.argv.find((argument) => argument.startsWith(`${name}=`));
  return value?.slice(name.length + 1).trim() || null;
}

const config = readAppConfig();
if (!config.mongodb.uri || !config.mongodb.databaseName)
  throw new Error("MongoDB configuration is required for alpha domain language maintenance.");

const apply = hasFlag("--apply");
const target = readArgument("--target");
const operator = readArgument("--operator");
if (apply && target !== config.mongodb.databaseName)
  throw new Error("--target must exactly match the configured MongoDB database name.");
if (apply && !operator) throw new Error("--operator is required with --apply.");

try {
  const client = await getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
  const database = client.db(config.mongodb.databaseName);
  const maintenance = new MongoAlphaDomainLanguageMaintenance(database);

  if (!apply) {
    const preview = await maintenance.preview();
    writeServerLog("info", "Alpha domain language maintenance preview", preview);
  } else {
    await maintenance.setupCollections();
    const report = await maintenance.migrateLegacy();
    const tracking = new MongoMaintenanceRunRepository(database);
    await tracking.markValidatorUpdated("alpha-domain-language-v1", operator!, new Date());
    await tracking.markMigrationCompleted("alpha-domain-language-v1", operator!, new Date());
    writeServerLog("info", "Alpha domain language maintenance completed", report);
  }
} catch (error) {
  writeServerLog("error", "Alpha domain language maintenance failed", error);
  process.exitCode = 1;
} finally {
  await closeMongoClient();
}
