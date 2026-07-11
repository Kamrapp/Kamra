import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import { closeMongoClient, getMongoClient } from "../packages/kamra-api-server/src/db/mongo-client.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";

const collectionName = "stage8_transaction_smoke";

async function runTransactionSmoke(): Promise<void> {
  const config = readAppConfig();
  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    throw new Error("MongoDB configuration is required for transaction smoke validation.");
  }
  if (!/^kamra_(dev|test|smoke)$/.test(config.mongodb.databaseName)) {
    throw new Error(`Refusing to run transaction smoke against database '${config.mongodb.databaseName}'. Use kamra_dev, kamra_test, or kamra_smoke.`);
  }

  const client = await getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
  const database = client.db(config.mongodb.databaseName);
  const collection = database.collection<{ runId: string; value: number }>(collectionName);
  const runId = `stage8-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await collection.createIndex({ runId: 1 }, { name: "stage8_transaction_smoke_run_id" });

  try {
    await sessionTransaction(client, async (session) => {
      await collection.insertOne({ runId, value: 1 }, { session });
      await collection.insertOne({ runId, value: 2 }, { session });
      throw new Error("intentional_transaction_abort");
    });
    throw new Error("Mongo transaction unexpectedly committed the forced failure.");
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "intentional_transaction_abort") {
      throw error;
    }
  }

  const rolledBackCount = await collection.countDocuments({ runId });
  if (rolledBackCount !== 0) {
    throw new Error(`Mongo transaction rollback failed; found ${rolledBackCount} aborted documents.`);
  }

  await sessionTransaction(client, async (session) => {
    await collection.insertOne({ runId, value: 3 }, { session });
    await collection.insertOne({ runId, value: 4 }, { session });
  });

  const committedCount = await collection.countDocuments({ runId });
  if (committedCount !== 2) {
    throw new Error(`Mongo transaction commit failed; found ${committedCount} committed documents.`);
  }

  await collection.deleteMany({ runId });
  writeServerLog("info", "Stage 8 transaction smoke validation completed", {
    committedCount,
    databaseName: database.databaseName,
    collectionName,
    rolledBackCount
  });
}

async function sessionTransaction(
  client: Awaited<ReturnType<typeof getMongoClient>>,
  operation: (session: ReturnType<typeof client.startSession>) => Promise<void>
): Promise<void> {
  const session = client.startSession();
  try {
    session.startTransaction();
    try {
      await operation(session);
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    }
  } finally {
    await session.endSession();
  }
}

try {
  await runTransactionSmoke();
} catch (error) {
  writeServerLog("error", "Stage 8 transaction smoke validation failed", error);
  process.exitCode = 1;
} finally {
  await closeMongoClient();
}
