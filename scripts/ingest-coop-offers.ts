import { chromium } from "playwright";
import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import {
  closeMongoClient,
  getMongoClient
} from "../packages/kamra-api-server/src/db/mongo-client.js";
import { MongoIngestionRepository } from "../packages/kamra-api-server/src/ingestion/current/mongo-ingestion-repository.js";
import {
  coopHuOffersParserName,
  coopHuOffersParserVersion,
  coopHuOffersSourceName,
  coopHuOffersUrl,
  coopHuOffersWorkflowName,
  hashCoopHuContent,
  parseCoopHuOffersText,
  serializeCoopHuOffersPayload
} from "../packages/kamra-api-server/src/ingestion/sources/coop-hu-offers/source.js";
import { createCrawlRunIdentity } from "../packages/kamra-api-server/src/ingestion/v1/run-identity.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";

interface FetchedCoopOffersPage {
  html: string;
  visibleText: string;
}

async function fetchCoopOffersPage(): Promise<FetchedCoopOffersPage> {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      locale: "hu-HU",
      userAgent: "KamraCrawler/0.1 (+https://kamra.hu; grocery price research)"
    });

    const response = await page.goto(coopHuOffersUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => undefined);

    const html = await page.content();
    const visibleText = await page.locator("body").innerText({ timeout: 10000 });

    if (!response || !response.ok()) {
      writeServerLog("error", "COOP HU offers page fetch failed", {
        sourceUrl: coopHuOffersUrl,
        status: response?.status(),
        statusText: response?.statusText(),
        bodyStart: html.slice(0, 2000)
      });

      throw new Error(`COOP HU offers fetch failed with HTTP ${response?.status() ?? "unknown"}.`);
    }

    return { html, visibleText };
  } finally {
    await browser.close();
  }
}

async function ingestCoopOffers(): Promise<void> {
  const config = readAppConfig();

  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    throw new Error("MongoDB configuration is required for COOP HU offers ingestion.");
  }

  const now = new Date();
  const observedAt = now.toISOString();
  const identity = createCrawlRunIdentity(coopHuOffersSourceName, coopHuOffersWorkflowName, now);

  writeServerLog("info", "Fetching COOP HU offers page", {
    crawlRunId: identity.crawlRunId,
    sourceUrl: coopHuOffersUrl
  });

  const fetchedPage = await fetchCoopOffersPage();
  const parsedRows = parseCoopHuOffersText(fetchedPage.visibleText, observedAt);

  if (parsedRows.length === 0) {
    writeServerLog("error", "COOP HU offers parser returned no rows", {
      crawlRunId: identity.crawlRunId,
      sourceUrl: coopHuOffersUrl,
      visibleTextStart: fetchedPage.visibleText.slice(0, 2000)
    });

    throw new Error("COOP HU offers parser returned no rows.");
  }

  const client = await getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
  const repository = new MongoIngestionRepository(client.db(config.mongodb.databaseName));
  const payloadText = serializeCoopHuOffersPayload(fetchedPage);

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
    contentHash: hashCoopHuContent(payloadText),
    contentType: "application/vnd.kamra.coop-hu-offers+json",
    parserName: coopHuOffersParserName,
    parserVersion: coopHuOffersParserVersion,
    parsedRows,
    payloadText,
    sourceRecordId: "offers-page-0",
    sourceUrl: coopHuOffersUrl
  });

  await repository.completeRun(identity.crawlRunId, new Date().toISOString());

  writeServerLog("info", "COOP HU offers ingestion completed", {
    crawlRunId: identity.crawlRunId,
    inserted: result.inserted,
    parsedRowCount: parsedRows.length,
    sampleProductNames: parsedRows.slice(0, 5).map((row) => row.displayName),
    snapshotId: result.snapshot.id
  });
}

try {
  await ingestCoopOffers();
} catch (error) {
  writeServerLog("error", "COOP HU offers ingestion failed", error);
  process.exitCode = 1;
} finally {
  await closeMongoClient();
}
