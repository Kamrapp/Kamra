import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import {
  closeMongoClient,
  getMongoClient
} from "../packages/kamra-api-server/src/db/mongo-client.js";
import { MongoIngestionRepository } from "../packages/kamra-api-server/src/ingestion/current/mongo-ingestion-repository.js";
import {
  discoverLidlHuBrochureSlugs,
  extractLidlHuPdfPageTexts,
  hashLidlHuBrochureContent,
  lidlHuBrochureIndexUrl,
  lidlHuBrochureParserName,
  lidlHuBrochureParserVersion,
  lidlHuBrochureSourceName,
  lidlHuBrochureWorkflowName,
  lidlHuLeafletApiBaseUrl,
  parseLidlHuBrochureRows,
  parseLidlHuBrochureSummary,
  serializeLidlHuBrochurePayload,
  type LidlHuBrochureSummary
} from "../packages/kamra-api-server/src/ingestion/sources/lidl-hu-brochure/source.js";
import { createCrawlRunIdentity } from "../packages/kamra-api-server/src/ingestion/v1/run-identity.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";

const userAgent = "KamraCrawler/0.1 (+https://kamra.hu; grocery price research)";

async function ingestLidlBrochures(): Promise<void> {
  const config = readAppConfig();

  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    throw new Error("MongoDB configuration is required for Lidl brochure ingestion.");
  }

  const now = new Date();
  const observedAt = now.toISOString();
  const identity = createCrawlRunIdentity(
    lidlHuBrochureSourceName,
    lidlHuBrochureWorkflowName,
    now
  );

  writeServerLog("info", "Fetching Lidl brochure index", {
    crawlRunId: identity.crawlRunId,
    sourceUrl: lidlHuBrochureIndexUrl
  });

  const indexHtml = await fetchText(lidlHuBrochureIndexUrl);
  const slugs = discoverLidlHuBrochureSlugs(indexHtml);
  const brochures = await discoverFoodBrochures(slugs);
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

  let insertedCount = 0;
  let skippedCount = 0;
  let parsedRowCount = 0;

  for (const brochure of brochures) {
    writeServerLog("info", "Fetching Lidl brochure PDF", {
      flyerId: brochure.flyerId,
      pdfUrl: brochure.pdfUrl,
      slug: brochure.slug,
      title: brochure.title
    });

    const pdfBytes = await fetchBytes(brochure.pdfUrl);
    const pageTexts = await extractLidlHuPdfPageTexts(pdfBytes);
    const parsedRows = parseLidlHuBrochureRows(brochure, pageTexts, observedAt);
    const result = await repository.ingestSnapshot({
      ...identity,
      capturedAt: observedAt,
      contentHash: hashLidlHuBrochureContent(pdfBytes),
      contentType: "application/pdf",
      parserName: lidlHuBrochureParserName,
      parserVersion: lidlHuBrochureParserVersion,
      parsedRows,
      payloadText: serializeLidlHuBrochurePayload(brochure, pageTexts),
      sourceRecordId: brochure.slug,
      sourceUrl: brochure.sourceUrl
    });

    if (result.inserted) {
      insertedCount += 1;
    } else {
      skippedCount += 1;
    }

    parsedRowCount += parsedRows.length;

    writeServerLog("info", "Lidl brochure PDF parsed", {
      inserted: result.inserted,
      parsedRowCount: parsedRows.length,
      slug: brochure.slug,
      snapshotId: result.snapshot.id,
      title: brochure.title
    });
  }

  await repository.completeRun(identity.crawlRunId, new Date().toISOString());

  writeServerLog("info", "Lidl brochure ingestion completed", {
    brochureCount: brochures.length,
    crawlRunId: identity.crawlRunId,
    inserted: insertedCount,
    parsedRowCount,
    skipped: skippedCount
  });
}

async function discoverFoodBrochures(slugs: string[]): Promise<LidlHuBrochureSummary[]> {
  const summaries: LidlHuBrochureSummary[] = [];

  for (const slug of slugs) {
    const apiText = await fetchText(
      `${lidlHuLeafletApiBaseUrl}?flyer_identifier=${encodeURIComponent(slug)}`
    );
    const summary = parseLidlHuBrochureSummary(apiText, slug);

    if (summary) {
      summaries.push(summary);
    }
  }

  return summaries;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": userAgent
    }
  });

  if (!response.ok) {
    throw new Error(`Fetch failed for ${url} with HTTP ${response.status}.`);
  }

  return response.text();
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url, {
    headers: {
      "user-agent": userAgent
    }
  });

  if (!response.ok) {
    throw new Error(`PDF fetch failed for ${url} with HTTP ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/pdf")) {
    throw new Error(
      `Expected Lidl brochure PDF but received content type ${contentType || "unknown"}.`
    );
  }

  return new Uint8Array(await response.arrayBuffer());
}

try {
  await ingestLidlBrochures();
} catch (error) {
  writeServerLog("error", "Lidl brochure ingestion failed", error);
  process.exitCode = 1;
} finally {
  await closeMongoClient();
}
