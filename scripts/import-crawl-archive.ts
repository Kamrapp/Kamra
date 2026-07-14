import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import {
  closeMongoClient,
  getMongoClient
} from "../packages/kamra-api-server/src/db/mongo-client.js";
import { importCrawlArchive } from "../packages/kamra-api-server/src/ingestion/archive/crawl-archive-import.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";

function readArgument(name: string): string | null {
  const value = process.argv.find((argument) => argument.startsWith(`${name}=`));
  return value?.slice(name.length + 1).trim() || null;
}

const archiveDirectory = readArgument("--archive");
if (!archiveDirectory) throw new Error("--archive=<directory> is required");
const apply = process.argv.includes("--apply");
const target = readArgument("--target");
if (apply && !target) throw new Error("--target=<database> is required with --apply");

const config = readAppConfig();
if (!config.mongodb.uri || !config.mongodb.databaseName)
  throw new Error("MongoDB configuration is required for crawl archive import.");
if (apply && config.mongodb.databaseName !== target)
  throw new Error("archive_import_target_mismatch");

try {
  const client = await getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
  const result = await importCrawlArchive({
    apply,
    archiveDirectory,
    database: client.db(config.mongodb.databaseName)
  });
  writeServerLog("info", "Crawl archive import inspected", {
    archiveDirectory,
    conflicts: result.conflicts,
    dryRun: result.dryRun,
    insertedRuns: result.insertedRuns,
    insertedSnapshots: result.insertedSnapshots,
    skippedRuns: result.skippedRuns,
    skippedSnapshots: result.skippedSnapshots,
    target: config.mongodb.databaseName
  });
  if (result.conflicts.length > 0) process.exitCode = 2;
} catch (error) {
  writeServerLog("error", "Crawl archive import failed", error);
  process.exitCode = 1;
} finally {
  await closeMongoClient();
}
