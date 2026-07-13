import type { IngestionRawSnapshotRecord } from "../packages/kamra-api-server/src/ingestion/v1/contracts.js";
import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import {
  closeMongoClient,
  getMongoClient
} from "../packages/kamra-api-server/src/db/mongo-client.js";
import {
  createLidlBrochureParserRepairPlan,
  lidlHuBrochurePreviousParserVersion
} from "../packages/kamra-api-server/src/ingestion/repair/lidl-brochure-parser-repair.js";
import {
  lidlHuBrochureParserName,
  lidlHuBrochureParserVersion,
  lidlHuBrochureSourceName
} from "../packages/kamra-api-server/src/ingestion/sources/lidl-hu-brochure/source.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";

const defaultLimit = 50;

function readArgument(name: string): string | null {
  const value = process.argv.find((argument) => argument.startsWith(`${name}=`));
  return value?.slice(name.length + 1).trim() || null;
}

function readLimit(): number {
  const value = readArgument("--limit");
  if (!value) return defaultLimit;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1)
    throw new Error("--limit must be a positive integer.");
  return parsed;
}

const apply = process.argv.includes("--apply");
const target = readArgument("--target");
const operator = readArgument("--operator");
const snapshotId = readArgument("--snapshot-id");
const limit = readLimit();
const fromVersion = readArgument("--from-version") ?? lidlHuBrochurePreviousParserVersion;

if (apply && !target) throw new Error("--target=<database> is required with --apply");
if (apply && !operator) throw new Error("--operator=<identity> is required with --apply");
if (fromVersion !== lidlHuBrochurePreviousParserVersion) {
  throw new Error(`unsupported_lidl_brochure_source_version:${fromVersion}`);
}

const config = readAppConfig();
if (!config.mongodb.uri || !config.mongodb.databaseName) {
  throw new Error("MongoDB configuration is required for Lidl brochure row repair.");
}
if (apply && config.mongodb.databaseName !== target) {
  throw new Error("lidl_brochure_repair_target_mismatch");
}

try {
  const client = await getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
  const collection = client
    .db(config.mongodb.databaseName)
    .collection<IngestionRawSnapshotRecord>("ingestion_raw_snapshots");
  const filter = {
    ...(snapshotId ? { id: snapshotId } : {}),
    parserName: lidlHuBrochureParserName,
    parserVersion: fromVersion,
    sourceName: lidlHuBrochureSourceName
  };
  const selectedSnapshots = await collection
    .find(filter)
    .sort({ _id: 1 })
    .limit(limit + 1)
    .toArray();
  const hasMore = selectedSnapshots.length > limit;
  const snapshots = selectedSnapshots.slice(0, limit);
  if (snapshotId && snapshots.length === 0) {
    throw new Error(`lidl_brochure_repair_snapshot_not_found:${snapshotId}`);
  }
  const plans = snapshots.map((snapshot) => ({
    plan: createLidlBrochureParserRepairPlan(snapshot),
    snapshot
  }));
  const changed = plans.filter(
    ({ plan }) =>
      plan.beforeParserVersion !== plan.afterParserVersion ||
      plan.beforeRowCount !== plan.afterRowCount ||
      plan.beforeDuplicateRowCount !== plan.afterDuplicateRowCount
  );

  if (apply) {
    for (const { plan, snapshot } of changed) {
      const result = await collection.updateOne(
        {
          contentHash: snapshot.contentHash,
          id: snapshot.id,
          parserName: lidlHuBrochureParserName,
          parserVersion: fromVersion,
          sourceName: lidlHuBrochureSourceName
        },
        {
          $set: {
            parsedRows: plan.parsedRows,
            parserVersion: lidlHuBrochureParserVersion
          }
        }
      );
      if (result.matchedCount !== 1) {
        throw new Error(`lidl_brochure_repair_snapshot_changed:${snapshot.id}`);
      }
    }
  }

  const summary = {
    apply,
    changedSnapshots: changed.length,
    fromVersion,
    hasMore,
    limit,
    operator: apply ? operator : null,
    selectedSnapshots: snapshots.length,
    snapshotId: snapshotId ?? null,
    toVersion: lidlHuBrochureParserVersion,
    totalDuplicateRowsAfter: plans.reduce(
      (total, { plan }) => total + plan.afterDuplicateRowCount,
      0
    ),
    totalDuplicateRowsBefore: plans.reduce(
      (total, { plan }) => total + plan.beforeDuplicateRowCount,
      0
    )
  };
  console.log(JSON.stringify(summary, null, 2));
  writeServerLog("info", "Lidl brochure parser repair inspected", summary);
} catch (error) {
  writeServerLog("error", "Lidl brochure parser repair failed", error);
  process.exitCode = 1;
} finally {
  await closeMongoClient();
}
