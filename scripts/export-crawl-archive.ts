import { mkdir } from "node:fs/promises";
import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import {
  closeMongoClient,
  getMongoClient
} from "../packages/kamra-api-server/src/db/mongo-client.js";
import { exportCrawlArchive } from "../packages/kamra-api-server/src/ingestion/archive/crawl-archive.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";

function readArgument(name: string): string | null {
  const value = process.argv.find((argument) => argument.startsWith(`${name}=`));
  return value?.slice(name.length + 1).trim() || null;
}

const config = readAppConfig();
if (!config.mongodb.uri || !config.mongodb.databaseName)
  throw new Error("MongoDB configuration is required for crawl archive export.");

const outputDirectory =
  readArgument("--output") ??
  `.artifacts/crawl-archives/${new Date().toISOString().replaceAll(/[:.]/g, "-")}`;
await mkdir(outputDirectory, { recursive: true });

try {
  const client = await getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
  const result = await exportCrawlArchive({
    database: client.db(config.mongodb.databaseName),
    databaseLabel: config.mongodb.databaseName,
    outputDirectory
  });
  writeServerLog("info", "Crawl archive export completed", {
    outputDirectory: result.outputDirectory,
    recordCounts: result.manifest.recordCounts
  });
} catch (error) {
  writeServerLog("error", "Crawl archive export failed", error);
  process.exitCode = 1;
} finally {
  await closeMongoClient();
}
