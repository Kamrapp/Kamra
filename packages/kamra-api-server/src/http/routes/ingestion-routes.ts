import {
  createDefaultCatalogRepository,
  createDefaultIngestionRepository,
  json,
  unauthorized,
  type AppRoute
} from "../app-route-context.js";
import {
  createSourceOfferRecordFingerprint,
  processSourceOfferSnapshot,
  sourceOfferProcessorName,
  sourceOfferProcessorVersion
} from "../../ingestion/processing/source-offer-processor.js";
import type { IngestionRawSnapshotRecord, ParsedShopProductRow } from "../../ingestion/v1/contracts.js";

const snapshotListLimit = 75;
const rowPreviewLimit = 250;

export const ingestionSnapshotsRoute: AppRoute = {
  match: (request) => request.method === "GET" && request.path === "/api/admin/ingestion/snapshots",
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user || user.role !== "admin") {
      return unauthorized("Sign in as an admin to view ingestion snapshots.");
    }

    const config = context.config;
    if (!config.mongodb.uri || !config.mongodb.databaseName) {
      return json(503, { error: "ingestion_not_configured" });
    }

    const client = await context.getMongoClient(
      config.mongodb.uri,
      config.mongodb.dnsServers
    );
    const database = client.db(config.mongodb.databaseName);
    const ingestionRepository = context.dependencies.createIngestionRepository
      ? context.dependencies.createIngestionRepository(database)
      : createDefaultIngestionRepository(database);
    const catalogRepository = context.dependencies.createCatalogRepository
      ? context.dependencies.createCatalogRepository(database)
      : createDefaultCatalogRepository(database);

    await Promise.all([
      ingestionRepository.setupCollections?.(),
      catalogRepository.setupCollections?.()
    ]);

    const snapshots = await ingestionRepository.listRawSnapshots({ limit: snapshotListLimit });
    const items = await Promise.all(snapshots.map(async (snapshot) => ({
      ...toSnapshotListItem(snapshot),
      processingState: catalogRepository.findProcessingState
        ? await catalogRepository.findProcessingState({
            processorName: sourceOfferProcessorName,
            processorVersion: sourceOfferProcessorVersion,
            recordFingerprint: createSourceOfferRecordFingerprint(snapshot),
            sourceName: snapshot.sourceName
          })
        : null
    })));

    return json(200, {
      processorName: sourceOfferProcessorName,
      processorVersion: sourceOfferProcessorVersion,
      snapshots: items
    });
  }
};

export const processIngestionSnapshotRoute: AppRoute = {
  match: (request) => request.method === "POST" && request.path === "/api/admin/ingestion/process-snapshot",
  handle: async (request, context) => {
    const user = context.authenticateRequestUser(request);
    if (!user || user.role !== "admin") {
      return unauthorized("Sign in as an admin to process ingestion snapshots.");
    }

    const snapshotId = parseSnapshotId(request.bodyText);
    if (!snapshotId) {
      return json(400, {
        error: "invalid_snapshot_id"
      });
    }

    const config = context.config;
    if (!config.mongodb.uri || !config.mongodb.databaseName) {
      return json(503, { error: "ingestion_not_configured" });
    }

    const client = await context.getMongoClient(
      config.mongodb.uri,
      config.mongodb.dnsServers
    );
    const database = client.db(config.mongodb.databaseName);
    const ingestionRepository = context.dependencies.createIngestionRepository
      ? context.dependencies.createIngestionRepository(database)
      : createDefaultIngestionRepository(database);
    const catalogRepository = context.dependencies.createCatalogRepository
      ? context.dependencies.createCatalogRepository(database)
      : createDefaultCatalogRepository(database);

    if (!catalogRepository.upsertCatalogSeedDataset) {
      return json(503, { error: "processor_not_available" });
    }

    await Promise.all([
      ingestionRepository.setupCollections?.(),
      catalogRepository.setupCollections?.()
    ]);

    const snapshot = await ingestionRepository.findRawSnapshotById(snapshotId);
    if (!snapshot) {
      return json(404, {
        error: "snapshot_not_found"
      });
    }

    const result = processSourceOfferSnapshot(snapshot);
    await catalogRepository.upsertCatalogSeedDataset(result.dataset);

    return json(200, {
      processedRowCount: result.processedRowCount,
      skippedRowCount: result.skippedRowCount,
      snapshotId: snapshot.id
    });
  }
};

function toSnapshotListItem(snapshot: IngestionRawSnapshotRecord): Record<string, unknown> {
  return {
    capturedAt: snapshot.capturedAt,
    contentHash: snapshot.contentHash,
    contentType: snapshot.contentType,
    crawlDate: snapshot.crawlDate,
    crawlRunId: snapshot.crawlRunId,
    id: snapshot.id,
    parserName: snapshot.parserName,
    parserVersion: snapshot.parserVersion,
    parsedRowCount: snapshot.parsedRows.length,
    rows: snapshot.parsedRows.slice(0, rowPreviewLimit).map(toRowPreview),
    rowPreviewLimit,
    sourceName: snapshot.sourceName,
    sourceRecordId: snapshot.sourceRecordId,
    sourceUrl: snapshot.sourceUrl ?? null,
    workflowName: snapshot.workflowName
  };
}

function toRowPreview(row: ParsedShopProductRow): Record<string, unknown> {
  return {
    displayName: row.displayName,
    packageLabel: row.packageLabel ?? null,
    priceCount: row.priceObservations?.length ?? 0,
    priceText: row.priceText ?? null,
    priceValue: row.priceObservations?.[0]?.price ?? row.priceValue ?? null,
    sourceProductKey: row.sourceProductKey ?? null,
    sourceRecordId: row.sourceRecordId ?? null,
    validFrom: row.validFrom ?? row.priceObservations?.[0]?.validFrom ?? null,
    validTo: row.validTo ?? row.priceObservations?.[0]?.validTo ?? null
  };
}

function parseSnapshotId(bodyText: string | undefined): string | null {
  if (!bodyText) {
    return null;
  }

  let payload: { snapshotId?: unknown };
  try {
    payload = JSON.parse(bodyText) as { snapshotId?: unknown };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }

  return typeof payload.snapshotId === "string" && payload.snapshotId.trim()
    ? payload.snapshotId.trim()
    : null;
}
