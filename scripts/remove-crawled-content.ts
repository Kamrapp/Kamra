import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import {
  closeMongoClient,
  getMongoClient
} from "../packages/kamra-api-server/src/db/mongo-client.js";
import { MongoIngestionRepository } from "../packages/kamra-api-server/src/ingestion/current/mongo-ingestion-repository.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";

function readCrawlRunId(): string {
  const arg = process.argv.find((value) => value.startsWith("--crawl-run-id="));
  const crawlRunId = arg?.slice("--crawl-run-id=".length).trim();

  if (!crawlRunId) {
    throw new Error("Usage: npm run crawl:remove -- --crawl-run-id=<workflow:source:yyyy-mm-dd>");
  }

  return crawlRunId;
}

async function removeCrawledContent(): Promise<void> {
  const config = readAppConfig();
  const crawlRunId = readCrawlRunId();

  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    throw new Error("MongoDB configuration is required for crawler cleanup.");
  }

  const client = await getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
  const repository = new MongoIngestionRepository(client.db(config.mongodb.databaseName));
  await repository.setupCollections();

  const result = await repository.cleanupByCrawlRunId(crawlRunId);
  writeServerLog("info", "Crawled content removed", {
    crawlRunId,
    ...result
  });
}

try {
  await removeCrawledContent();
} catch (error) {
  writeServerLog("error", "Crawler cleanup failed", error);
  process.exitCode = 1;
} finally {
  await closeMongoClient();
}
