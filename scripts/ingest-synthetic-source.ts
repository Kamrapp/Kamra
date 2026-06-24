import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import { closeMongoClient, getMongoClient } from "../packages/kamra-api-server/src/db/mongo-client.js";
import { MongoIngestionRepository } from "../packages/kamra-api-server/src/ingestion/current/mongo-ingestion-repository.js";
import {
  hashSourceContent,
  parseSimpleHtmlTableShop,
  simpleHtmlTableShopFixture,
  simpleHtmlTableShopParserName,
  simpleHtmlTableShopParserVersion,
  simpleHtmlTableShopSourceName,
  simpleHtmlTableShopWorkflowName
} from "../packages/kamra-api-server/src/ingestion/sources/simple-html-table-shop/source.js";
import { createCrawlRunIdentity } from "../packages/kamra-api-server/src/ingestion/v1/run-identity.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";

async function ingestSyntheticSource(): Promise<void> {
  const config = readAppConfig();

  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    throw new Error("MongoDB configuration is required for synthetic ingestion.");
  }

  const now = new Date();
  const observedAt = now.toISOString();
  const identity = createCrawlRunIdentity(
    simpleHtmlTableShopSourceName,
    simpleHtmlTableShopWorkflowName,
    now
  );
  const client = await getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
  const repository = new MongoIngestionRepository(client.db(config.mongodb.databaseName));

  await repository.setupCollections();
  await repository.startRun({
    ...identity,
    createdAt: observedAt,
    id: identity.crawlRunId,
    startedAt: observedAt,
    updatedAt: observedAt
  });

  const parsedRows = parseSimpleHtmlTableShop(simpleHtmlTableShopFixture, observedAt);
  const result = await repository.ingestSnapshot({
    ...identity,
    capturedAt: observedAt,
    contentHash: hashSourceContent(simpleHtmlTableShopFixture),
    contentType: "text/html",
    parserName: simpleHtmlTableShopParserName,
    parserVersion: simpleHtmlTableShopParserVersion,
    parsedRows,
    payloadText: simpleHtmlTableShopFixture,
    sourceRecordId: "weekly-product-table",
    sourceUrl: "fixture://simple-html-table-shop/weekly-product-table"
  });
  await repository.completeRun(identity.crawlRunId, new Date().toISOString());

  writeServerLog("info", "Synthetic ingestion completed", {
    crawlRunId: identity.crawlRunId,
    inserted: result.inserted,
    parsedRowCount: parsedRows.length,
    snapshotId: result.snapshot.id
  });
}

try {
  await ingestSyntheticSource();
} catch (error) {
  writeServerLog("error", "Synthetic ingestion failed", error);
  process.exitCode = 1;
} finally {
  await closeMongoClient();
}
