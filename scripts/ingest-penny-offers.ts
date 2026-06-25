import { chromium } from "playwright";
import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import { closeMongoClient, getMongoClient } from "../packages/kamra-api-server/src/db/mongo-client.js";
import { MongoIngestionRepository } from "../packages/kamra-api-server/src/ingestion/current/mongo-ingestion-repository.js";
import {
  hashPennyContent,
  parsePennyHuOffers,
  pennyHuOffersParserName,
  pennyHuOffersParserVersion,
  pennyHuOffersSourceName,
  pennyHuOffersUrl,
  pennyHuOffersWorkflowName
} from "../packages/kamra-api-server/src/ingestion/sources/penny-hu-offers/source.js";
import { createCrawlRunIdentity } from "../packages/kamra-api-server/src/ingestion/v1/run-identity.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";

async function fetchPennyOffersHtml(): Promise<string> {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      locale: "hu-HU",
      userAgent: "KamraCrawler/0.1 (+https://kamra.hu; grocery price research)"
    });

    const response = await page.goto(pennyHuOffersUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    const html = await page.content();

    if (!response || !response.ok()) {
      writeServerLog("error", "PENNY offers page fetch failed", {
        sourceUrl: pennyHuOffersUrl,
        status: response?.status(),
        statusText: response?.statusText(),
        bodyStart: html.slice(0, 2000)
      });

      throw new Error(`PENNY offers fetch failed with HTTP ${response?.status() ?? "unknown"}.`);
    }

    return html;
  } finally {
    await browser.close();
  }
}

async function ingestPennyOffers(): Promise<void> {
  const config = readAppConfig();

  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    throw new Error("MongoDB configuration is required for PENNY offers ingestion.");
  }

  const now = new Date();
  const observedAt = now.toISOString();
  const identity = createCrawlRunIdentity(pennyHuOffersSourceName, pennyHuOffersWorkflowName, now);

  writeServerLog("info", "Fetching PENNY offers page", {
    crawlRunId: identity.crawlRunId,
    sourceUrl: pennyHuOffersUrl
  });

  const html = await fetchPennyOffersHtml();

  const parsedRows = parsePennyHuOffers(html, observedAt);
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

  const result = await repository.ingestSnapshot({
    ...identity,
    capturedAt: observedAt,
    contentHash: hashPennyContent(html),
    contentType: "text/html",
    parserName: pennyHuOffersParserName,
    parserVersion: pennyHuOffersParserVersion,
    parsedRows,
    payloadText: html,
    sourceRecordId: "offers-page-0",
    sourceUrl: pennyHuOffersUrl
  });

  await repository.completeRun(identity.crawlRunId, new Date().toISOString());

  writeServerLog("info", "PENNY offers ingestion completed", {
    crawlRunId: identity.crawlRunId,
    inserted: result.inserted,
    parsedRowCount: parsedRows.length,
    sampleProductNames: parsedRows.slice(0, 5).map((row) => row.displayName),
    snapshotId: result.snapshot.id
  });
}

try {
  await ingestPennyOffers();
} catch (error) {
  writeServerLog("error", "PENNY offers ingestion failed", error);
  process.exitCode = 1;
} finally {
  await closeMongoClient();
}