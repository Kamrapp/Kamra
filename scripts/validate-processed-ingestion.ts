import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import {
  closeMongoClient,
  getMongoClient
} from "../packages/kamra-api-server/src/db/mongo-client.js";
import {
  createSourceOfferRecordFingerprint,
  sourceOfferProcessorName,
  sourceOfferProcessorVersion
} from "../packages/kamra-api-server/src/ingestion/processing/source-offer-processor.js";
import type { IngestionRawSnapshotRecord } from "../packages/kamra-api-server/src/ingestion/v1/contracts.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";

interface CountBySource {
  count: number;
  sourceName: string;
}

interface PriceKindCount {
  count: number;
  priceKind: string;
  sourceName: string;
}

interface RawSourceCount {
  rows: number;
  snapshots: number;
  sourceName: string;
}

interface ProcessingStateSummary {
  count: number;
  sourceName: string;
  state: string;
}

interface MissingProcessedSnapshot {
  capturedAt: string;
  crawlDate: string;
  id: string;
  parserVersion: string;
  sourceName: string;
}

async function validateProcessedIngestion(): Promise<void> {
  const config = readAppConfig();

  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    throw new Error("MongoDB configuration is required for processed ingestion validation.");
  }

  const client = await getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
  const database = client.db(config.mongodb.databaseName);
  const snapshots = await database
    .collection<IngestionRawSnapshotRecord>("ingestion_raw_snapshots")
    .find({})
    .sort({ _id: 1 })
    .toArray();
  const currentStates = await database
    .collection("source_record_processing_states")
    .find({
      processorName: sourceOfferProcessorName,
      processorVersion: sourceOfferProcessorVersion
    })
    .toArray();
  const processedFingerprints = new Set(
    currentStates
      .filter((state) => state["state"] === "processed")
      .map((state) => `${state["sourceName"]}:${state["recordFingerprint"]}`)
  );
  const missingProcessedSnapshots = snapshots
    .filter(
      (snapshot) =>
        !processedFingerprints.has(
          `${snapshot.sourceName}:${createSourceOfferRecordFingerprint(snapshot)}`
        )
    )
    .map((snapshot): MissingProcessedSnapshot => ({
      capturedAt: snapshot.capturedAt,
      crawlDate: snapshot.crawlDate,
      id: snapshot.id,
      parserVersion: snapshot.parserVersion,
      sourceName: snapshot.sourceName
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  const failedStates = currentStates
    .filter((state) => state["state"] === "failed")
    .map((state) => ({
      lastErrorCode: state["lastErrorCode"],
      lastErrorMessage: state["lastErrorMessage"],
      recordFingerprint: state["recordFingerprint"],
      sourceName: state["sourceName"]
    }));
  const [rawSources, processingStates, productSources, priceKinds] = await Promise.all([
    database
      .collection("ingestion_raw_snapshots")
      .aggregate<RawSourceCount>([
        {
          $group: {
            _id: "$sourceName",
            rows: { $sum: { $size: "$parsedRows" } },
            snapshots: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            rows: 1,
            snapshots: 1,
            sourceName: "$_id"
          }
        }
      ])
      .toArray(),
    database
      .collection("source_record_processing_states")
      .aggregate<ProcessingStateSummary>([
        {
          $match: {
            processorName: sourceOfferProcessorName,
            processorVersion: sourceOfferProcessorVersion
          }
        },
        {
          $group: {
            _id: {
              sourceName: "$sourceName",
              state: "$state"
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.sourceName": 1, "_id.state": 1 } },
        {
          $project: {
            _id: 0,
            count: 1,
            sourceName: "$_id.sourceName",
            state: "$_id.state"
          }
        }
      ])
      .toArray(),
    database
      .collection("product_sources")
      .aggregate<CountBySource>([
        {
          $group: {
            _id: "$sourceName",
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            count: 1,
            sourceName: "$_id"
          }
        }
      ])
      .toArray(),
    database
      .collection("price_observations")
      .aggregate<PriceKindCount>([
        {
          $group: {
            _id: {
              priceKind: "$priceKind",
              sourceName: "$sourceName"
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.sourceName": 1, "_id.priceKind": 1 } },
        {
          $project: {
            _id: 0,
            count: 1,
            priceKind: "$_id.priceKind",
            sourceName: "$_id.sourceName"
          }
        }
      ])
      .toArray()
  ]);

  writeServerLog("info", "Processed ingestion validation completed", {
    databaseName: config.mongodb.databaseName,
    failedStates,
    missingProcessedStateCount: missingProcessedSnapshots.length,
    missingProcessedStates: missingProcessedSnapshots.slice(0, 25),
    missingProcessedStatesTruncated: missingProcessedSnapshots.length > 25,
    priceKinds,
    processingStates,
    processorName: sourceOfferProcessorName,
    processorVersion: sourceOfferProcessorVersion,
    productSources,
    rawSources,
    snapshotCount: snapshots.length
  });

  if (missingProcessedSnapshots.length > 0) {
    throw new Error(
      `Missing processed states for ${missingProcessedSnapshots.length} snapshot(s).`
    );
  }

  if (failedStates.length > 0) {
    throw new Error(`Found ${failedStates.length} failed source offer processing state(s).`);
  }
}

try {
  await validateProcessedIngestion();
} catch (error) {
  writeServerLog("error", "Processed ingestion validation failed", error);
  process.exitCode = 1;
} finally {
  await closeMongoClient();
}
