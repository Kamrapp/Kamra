import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import {
  closeMongoClient,
  getMongoClient
} from "../packages/kamra-api-server/src/db/mongo-client.js";
import {
  demoHouseholdSeedName,
  MongoHouseholdDemoSeedRepository,
  runDemoHouseholdSeed,
  seedDemoHouseholdPasswordEnvName
} from "../packages/kamra-api-server/src/household/current/demo-household-seed.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";

async function seedDemoHousehold(): Promise<void> {
  const config = readAppConfig();
  const password = process.env[seedDemoHouseholdPasswordEnvName]?.trim();
  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    throw new Error("MongoDB configuration is required for the demo household seed.");
  }
  if (!password) {
    throw new Error(
      `${seedDemoHouseholdPasswordEnvName} is required for the focused demo household seed.`
    );
  }
  assertDisposableDatabase(config.mongodb.databaseName);

  const client = await getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
  const repository = new MongoHouseholdDemoSeedRepository(client.db(config.mongodb.databaseName));
  const result = await runDemoHouseholdSeed({ userPassword: password }, repository);

  writeServerLog("info", "Focused demo household seed completed", {
    databaseName: result.databaseName,
    seedName: demoHouseholdSeedName
  });
}

function assertDisposableDatabase(databaseName: string): void {
  if (!/^kamra_(dev|test|smoke)$/.test(databaseName)) {
    throw new Error(
      `Refusing to seed database '${databaseName}'. Use kamra_dev, kamra_test, or kamra_smoke.`
    );
  }
}

try {
  await seedDemoHousehold();
} catch (error) {
  writeServerLog("error", "Focused demo household seed failed", error);
  process.exitCode = 1;
} finally {
  await closeMongoClient();
}
