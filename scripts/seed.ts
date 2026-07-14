import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import {
  closeMongoClient,
  getMongoClient
} from "../packages/kamra-api-server/src/db/mongo-client.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";
import { createAdminUserSeed } from "../packages/kamra-api-server/src/seeds/admin-identity-seed.js";
import { MongoAdminIdentitySeedRepository } from "../packages/kamra-api-server/src/seeds/mongo-admin-identity-seed-repository.js";
import { MongoCatalogV1SeedRepository } from "../packages/kamra-api-server/src/seeds/mongo-catalog-v1-seed-repository.js";
import {
  createDemoHouseholdSeed,
  MongoHouseholdDemoSeedRepository
} from "../packages/kamra-api-server/src/household/current/demo-household-seed.js";
import { NodeSeedPrompt } from "../packages/kamra-api-server/src/seeds/node-seed-prompt.js";
import { runRegisteredSeeds } from "../packages/kamra-api-server/src/seeds/seed-runner.js";
import { createCatalogV1Seed } from "../packages/kamra-api-server/src/seeds/catalog-v1-seed.js";

async function runSeeds(): Promise<void> {
  const config = readAppConfig();

  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    throw new Error("MongoDB configuration is required for seeding.");
  }

  const client = await getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
  const database = client.db(config.mongodb.databaseName);
  const adminUserSeedRepository = new MongoAdminIdentitySeedRepository(database);
  const catalogV1SeedRepository = new MongoCatalogV1SeedRepository(database);
  const demoHouseholdSeedRepository = new MongoHouseholdDemoSeedRepository(database);
  const seedResults = await runRegisteredSeeds(
    [
      createAdminUserSeed(adminUserSeedRepository),
      createCatalogV1Seed(catalogV1SeedRepository),
      createDemoHouseholdSeed(demoHouseholdSeedRepository)
    ],
    {
      env: process.env,
      prompt: new NodeSeedPrompt()
    }
  );

  writeServerLog("info", "Seed completed", {
    databaseName: config.mongodb.databaseName,
    results: seedResults
  });
}

try {
  await runSeeds();
} catch (error) {
  writeServerLog("error", "Seed failed", error);
  process.exitCode = 1;
} finally {
  await closeMongoClient();
}
