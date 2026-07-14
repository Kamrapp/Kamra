import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import {
  closeMongoClient,
  getMongoClient
} from "../packages/kamra-api-server/src/db/mongo-client.js";
import { MongoHouseholdDemoSeedRepository } from "../packages/kamra-api-server/src/household/current/demo-household-seed.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";

const confirmation = "--confirm=demo-household";

async function teardownDemoHousehold(): Promise<void> {
  const config = readAppConfig();
  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    throw new Error("MongoDB configuration is required for the demo household teardown.");
  }
  if (!process.argv.includes(confirmation)) {
    throw new Error(`Refusing teardown without the exact confirmation argument '${confirmation}'.`);
  }
  if (!/^kamra_(dev|test|smoke)$/.test(config.mongodb.databaseName)) {
    throw new Error(
      `Refusing to tear down database '${config.mongodb.databaseName}'. Use kamra_dev, kamra_test, or kamra_smoke.`
    );
  }

  const client = await getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
  const repository = new MongoHouseholdDemoSeedRepository(client.db(config.mongodb.databaseName));
  const result = await repository.teardownDemoHousehold();

  writeServerLog("info", "Focused demo household teardown completed", {
    databaseName: config.mongodb.databaseName,
    ...result
  });
}

try {
  await teardownDemoHousehold();
} catch (error) {
  writeServerLog("error", "Focused demo household teardown failed", error);
  process.exitCode = 1;
} finally {
  await closeMongoClient();
}
