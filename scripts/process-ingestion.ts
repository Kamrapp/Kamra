import { readFile } from "node:fs/promises";
import { MongoCurrentCatalogRepository } from "../packages/kamra-api-server/src/catalog/current/mongo-catalog-repository.js";
import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import {
  applyIngestionCorrectionOverlays,
  assertIngestionCorrectionOverlay,
  type IngestionCorrectionOverlay
} from "../packages/kamra-api-server/src/ingestion/audit/ingestion-quality-audit.js";
import {
  closeMongoClient,
  getMongoClient
} from "../packages/kamra-api-server/src/db/mongo-client.js";
import { MongoIngestionRepository } from "../packages/kamra-api-server/src/ingestion/current/mongo-ingestion-repository.js";
import {
  createFailedSourceOfferProcessingDataset,
  createSourceOfferRecordFingerprint,
  processSourceOfferSnapshot,
  sourceOfferProcessorName,
  sourceOfferProcessorVersion
} from "../packages/kamra-api-server/src/ingestion/processing/source-offer-processor.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";

interface ProcessIngestionOptions {
  limit: number;
  overlayFile: string | null;
  reprocess: boolean;
  sourceName: string | null;
}

async function processIngestion(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  if (options.overlayFile && !options.reprocess)
    throw new Error("--overlay-file requires --reprocess");
  const config = readAppConfig();

  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    throw new Error("MongoDB configuration is required for ingestion processing.");
  }

  const client = await getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
  const database = client.db(config.mongodb.databaseName);
  const ingestionRepository = new MongoIngestionRepository(database);
  const catalogRepository = new MongoCurrentCatalogRepository(database);

  await Promise.all([ingestionRepository.setupCollections(), catalogRepository.setupCollections()]);

  const snapshots = await ingestionRepository.listRawSnapshots({
    limit: options.limit,
    sourceName: options.sourceName ?? undefined
  });
  const overlays = options.overlayFile ? await readCorrectionOverlays(options.overlayFile) : [];
  const snapshotIds = new Set(snapshots.map((snapshot) => snapshot.id));
  const orphanOverlay = overlays.find((overlay) => !snapshotIds.has(overlay.snapshotId));
  if (orphanOverlay)
    throw new Error(`correction_overlay_snapshot_not_selected:${orphanOverlay.snapshotId}`);
  const summary = {
    failed: 0,
    processed: 0,
    processedRows: 0,
    skippedAlreadyProcessed: 0,
    skippedRows: 0,
    snapshotCount: snapshots.length
  };

  for (const snapshot of snapshots) {
    const existingState = await catalogRepository.findProcessingState({
      processorName: sourceOfferProcessorName,
      processorVersion: sourceOfferProcessorVersion,
      recordFingerprint: createSourceOfferRecordFingerprint(snapshot),
      sourceName: snapshot.sourceName
    });

    if (existingState?.state === "processed" && !options.reprocess) {
      summary.skippedAlreadyProcessed += 1;
      continue;
    }

    try {
      const correctedSnapshot = applyIngestionCorrectionOverlays(snapshot, overlays);
      const result = processSourceOfferSnapshot(correctedSnapshot);
      await catalogRepository.upsertCatalogSeedDataset(result.dataset);
      summary.processed += 1;
      summary.processedRows += result.processedRowCount;
      summary.skippedRows += result.skippedRowCount;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      summary.failed += 1;
      await catalogRepository.upsertCatalogSeedDataset(
        createFailedSourceOfferProcessingDataset(snapshot, new Date().toISOString(), {
          code: "snapshot_processing_failed",
          message
        })
      );
      writeServerLog("error", "Ingestion snapshot processing failed", {
        error: message,
        snapshotId: snapshot.id,
        sourceName: snapshot.sourceName
      });
    }
  }

  writeServerLog("info", "Ingestion processing completed", {
    databaseName: config.mongodb.databaseName,
    processorName: sourceOfferProcessorName,
    processorVersion: sourceOfferProcessorVersion,
    reprocess: options.reprocess,
    sourceName: options.sourceName,
    ...summary
  });

  if (summary.failed > 0) {
    throw new Error(`Ingestion processing failed for ${summary.failed} snapshot(s).`);
  }
}

function parseOptions(args: string[]): ProcessIngestionOptions {
  let limit = 50;
  let overlayFile: string | null = null;
  let reprocess = false;
  let sourceName: string | null = null;

  for (const arg of args) {
    if (arg === "--reprocess") {
      reprocess = true;
      continue;
    }

    if (arg.startsWith("--overlay-file=")) {
      overlayFile = requireOptionValue(arg.slice("--overlay-file=".length), "--overlay-file");
      continue;
    }

    if (arg.startsWith("--limit=")) {
      limit = parsePositiveInteger(arg.slice("--limit=".length), "--limit");
      continue;
    }

    if (arg.startsWith("--source=")) {
      sourceName = requireOptionValue(arg.slice("--source=".length), "--source");
      continue;
    }

    throw new Error(`Unknown process-ingestion option: ${arg}`);
  }

  return {
    limit,
    overlayFile,
    reprocess,
    sourceName
  };
}

async function readCorrectionOverlays(path: string): Promise<IngestionCorrectionOverlay[]> {
  const overlays: IngestionCorrectionOverlay[] = [];
  const seen = new Set<string>();
  for (const [lineIndex, line] of (await readFile(path, "utf8")).split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    let value: unknown;
    try {
      value = JSON.parse(line);
    } catch {
      throw new Error(`correction_overlay_json_invalid:${lineIndex + 1}`);
    }
    assertIngestionCorrectionOverlay(value);
    const key = `${value.snapshotId}:${value.rowIndex}`;
    if (seen.has(key)) throw new Error(`correction_overlay_duplicate:${key}`);
    seen.add(key);
    overlays.push(value);
  }
  return overlays;
}

function parsePositiveInteger(value: string, optionName: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${optionName} must be a positive integer.`);
  }

  return parsed;
}

function requireOptionValue(value: string, optionName: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${optionName} requires a non-empty value.`);
  }

  return trimmed;
}

try {
  await processIngestion();
} catch (error) {
  writeServerLog("error", "Ingestion processing failed", error);
  process.exitCode = 1;
} finally {
  await closeMongoClient();
}
