import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import {
  closeMongoClient,
  getMongoClient
} from "../packages/kamra-api-server/src/db/mongo-client.js";
import { MongoIngestionRepository } from "../packages/kamra-api-server/src/ingestion/current/mongo-ingestion-repository.js";
import {
  extractPdfTextLines,
  generateSimplePdfShopFixturePdf,
  hashPdfContent,
  parseSimplePdfShop,
  simplePdfShopParserName,
  simplePdfShopParserVersion,
  simplePdfShopSourceName,
  simplePdfShopWorkflowName
} from "../packages/kamra-api-server/src/ingestion/sources/simple-pdf-shop/source.js";
import { createCrawlRunIdentity } from "../packages/kamra-api-server/src/ingestion/v1/run-identity.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";

async function ingestSyntheticPdfSource(): Promise<void> {
  const config = readAppConfig();

  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    throw new Error("MongoDB configuration is required for synthetic PDF ingestion.");
  }

  const now = new Date();
  const observedAt = now.toISOString();
  const identity = createCrawlRunIdentity(simplePdfShopSourceName, simplePdfShopWorkflowName, now);
  const pdfBytes = await generateSimplePdfShopFixturePdf();
  const payloadText = (await extractPdfTextLines(pdfBytes)).join("\n");
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

  const parsedRows = await parseSimplePdfShop(pdfBytes, observedAt);
  const result = await repository.ingestSnapshot({
    ...identity,
    capturedAt: observedAt,
    contentHash: hashPdfContent(pdfBytes),
    contentType: "application/pdf",
    parserName: simplePdfShopParserName,
    parserVersion: simplePdfShopParserVersion,
    parsedRows,
    payloadText,
    sourceRecordId: "weekly-product-pdf",
    sourceUrl: "fixture://simple-pdf-shop/weekly-product-pdf"
  });
  await repository.completeRun(identity.crawlRunId, new Date().toISOString());

  writeServerLog("info", "Synthetic PDF ingestion completed", {
    crawlRunId: identity.crawlRunId,
    inserted: result.inserted,
    parsedRowCount: parsedRows.length,
    snapshotId: result.snapshot.id
  });
}

try {
  await ingestSyntheticPdfSource();
} catch (error) {
  writeServerLog("error", "Synthetic PDF ingestion failed", error);
  process.exitCode = 1;
} finally {
  await closeMongoClient();
}
