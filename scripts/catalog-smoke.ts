import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import {
  closeMongoClient,
  getMongoClient
} from "../packages/kamra-api-server/src/db/mongo-client.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";
import { MongoCurrentCatalogRepository } from "../packages/kamra-api-server/src/catalog/current/mongo-catalog-repository.js";

async function runCatalogSmoke(): Promise<void> {
  const config = readAppConfig();

  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    throw new Error("MongoDB configuration is required for catalog smoke validation.");
  }

  const client = await getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
  const repository = new MongoCurrentCatalogRepository(client.db(config.mongodb.databaseName));
  const result = await repository.runSmokeCheck();

  writeServerLog("info", "Catalog smoke validation completed", result);
}

try {
  await runCatalogSmoke();
} catch (error) {
  writeServerLog("error", "Catalog smoke validation failed", error);
  process.exitCode = 1;
} finally {
  await closeMongoClient();
}
