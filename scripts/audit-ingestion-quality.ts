import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import type { Collection, Document } from "mongodb";
import {
  auditIngestionQuality,
  type IngestionQualityReport
} from "../packages/kamra-api-server/src/ingestion/audit/ingestion-quality-audit.js";
import type {
  IngestionRawSnapshotRecord,
  IngestionRunRecord
} from "../packages/kamra-api-server/src/ingestion/v1/contracts.js";
import {
  closeMongoClient,
  getMongoClient
} from "../packages/kamra-api-server/src/db/mongo-client.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";

const pageSize = 500;

function readLimit(): number {
  const argument = process.argv.find((value) => value.startsWith("--issue-limit="));
  const parsed = Number(argument?.slice("--issue-limit=".length));
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 500;
}

async function readAll<T extends Document>(
  collection: Collection<T>,
  sort: Record<string, 1 | -1>
): Promise<T[]> {
  const records: T[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const page = (await collection
      .find({})
      .sort(sort)
      .skip(offset)
      .limit(pageSize)
      .toArray()) as T[];
    records.push(...page);
    if (page.length < pageSize) return records;
  }
}

const config = readAppConfig();
if (!config.mongodb.uri || !config.mongodb.databaseName)
  throw new Error("MongoDB configuration is required for ingestion quality audit.");

try {
  const client = await getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
  const database = client.db(config.mongodb.databaseName);
  const [runs, snapshots] = await Promise.all([
    readAll(database.collection<IngestionRunRecord>("ingestion_runs"), { _id: 1 }),
    readAll(database.collection<IngestionRawSnapshotRecord>("ingestion_raw_snapshots"), { _id: 1 })
  ]);
  const report: IngestionQualityReport = auditIngestionQuality({
    issueLimit: readLimit(),
    runs,
    snapshots
  });
  console.log(JSON.stringify(report, null, 2));
  writeServerLog("info", "Ingestion quality audit completed", {
    issues: report.issues.length,
    issuesTruncated: report.issuesTruncated,
    rows: report.rows,
    snapshots: report.snapshots,
    runs: report.runs
  });
} catch (error) {
  writeServerLog("error", "Ingestion quality audit failed", error);
  process.exitCode = 1;
} finally {
  await closeMongoClient();
}
