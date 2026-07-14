import {
  closeMongoClient,
  getMongoClient
} from "../packages/kamra-api-server/src/db/mongo-client.js";
import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";

const requiredSeedNames = ["admin_identity", "demo_household"];

if (process.env["SEED_CATALOG_V1"] === "1") {
  requiredSeedNames.push("catalog_v1_foundation");
}

async function shouldRunInitialSeed(): Promise<boolean> {
  const config = readAppConfig();
  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    throw new Error("MongoDB configuration is required for container bootstrap.");
  }

  const client = await getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
  const seedRecords = await client
    .db(config.mongodb.databaseName)
    .collection<{ seedName: string; status: string }>("seed_ledger")
    .find({ seedName: { $in: requiredSeedNames }, status: "ok" })
    .project({ seedName: 1 })
    .toArray();

  await closeMongoClient();

  const completedSeedNames = new Set(seedRecords.map((record) => record["seedName"]));
  return requiredSeedNames.some((seedName) => !completedSeedNames.has(seedName));
}

try {
  if (await shouldRunInitialSeed()) {
    writeServerLog("info", "Container database is not initialized; running configured seeds");
    await import("./seed.js");
  } else {
    writeServerLog("info", "Container database already initialized; skipping seeds");
  }
} catch (error: unknown) {
  writeServerLog("error", "Container database bootstrap failed", { error });
  process.exitCode = 1;
}
