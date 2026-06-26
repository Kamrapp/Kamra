import { chromium } from "playwright";
import { readAppConfig } from "../packages/kamra-api-server/src/config/app-config.js";
import { closeMongoClient, getMongoClient } from "../packages/kamra-api-server/src/db/mongo-client.js";
import { MongoIngestionRepository } from "../packages/kamra-api-server/src/ingestion/current/mongo-ingestion-repository.js";
import {
  aldiHuOffersParserName,
  aldiHuOffersParserVersion,
  aldiHuOffersSourceName,
  aldiHuOffersUrl,
  aldiHuOffersWorkflowName,
  hashAldiContent,
  parseAldiHuOffersText,
  serializeAldiHuOffersPayload
} from "../packages/kamra-api-server/src/ingestion/sources/aldi-hu-offers/source.js";
import { createCrawlRunIdentity } from "../packages/kamra-api-server/src/ingestion/v1/run-identity.js";
import { writeServerLog } from "../packages/kamra-api-server/src/logging/kamra-logger.js";

interface FetchedAldiOffersPage {
  html: string;
  visibleText: string;
}

async function fetchAldiOffersPage(): Promise<FetchedAldiOffersPage> {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      locale: "hu-HU",
      userAgent: "KamraCrawler/0.1 (+https://kamra.hu; grocery price research)"
    });

    const response = await page.goto(aldiHuOffersUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => undefined);

    const html = await page.content();
    const visibleText = await page.locator("body").innerText({ timeout: 10000 });

    if (!response || !response.ok()) {
      writeServerLog("error", "ALDI HU offers page fetch failed", {
        sourceUrl: aldiHuOffersUrl,
        status: response?.status(),
        statusText: response?.statusText(),
        bodyStart: html.slice(0, 2000)
      });

      throw new Error(`ALDI HU offers fetch failed with HTTP ${response?.status() ?? "unknown"}.`);
    }

    return { html, visibleText };
  } finally {
    await browser.close();
  }
}

async function ingestAldiOffers(): Promise<void> {
  const config = readAppConfig();

  if (!config.mongodb.uri || !config.mongodb.databaseName) {
    throw new Error("MongoDB configuration is required for ALDI HU offers ingestion.");
  }

  const now = new Date();
  const observedAt = now.toISOString();
  const identity = createCrawlRunIdentity(aldiHuOffersSourceName, aldiHuOffersWorkflowName, now);

  writeServerLog("info", "Fetching ALDI HU offers page", {
    crawlRunId: identity.crawlRunId,
    sourceUrl: aldiHuOffersUrl
  });

  const fetchedPage = await fetchAldiOffersPage();
  const parsedRows = parseAldiHuOffersText(fetchedPage.visibleText, observedAt);

  if (parsedRows.length === 0) {
    writeServerLog("error", "ALDI HU offers parser returned no rows", {
      crawlRunId: identity.crawlRunId,
      sourceUrl: aldiHuOffersUrl,
      visibleTextStart: fetchedPage.visibleText.slice(0, 2000)
    });

    throw new Error("ALDI HU offers parser returned no rows.");
  }

  const client = await getMongoClient(config.mongodb.uri, config.mongodb.dnsServers);
  const repository = new MongoIngestionRepository(client.db(config.mongodb.databaseName));
  const payloadText = serializeAldiHuOffersPayload(fetchedPage);

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
    contentHash: hashAldiContent(payloadText),
    contentType: "application/vnd.kamra.aldi-hu-offers+json",
    parserName: aldiHuOffersParserName,
    parserVersion: aldiHuOffersParserVersion,
    parsedRows,
    payloadText,
    sourceRecordId: "offers-page-0",
    sourceUrl: aldiHuOffersUrl
  });

  await repository.completeRun(identity.crawlRunId, new Date().toISOString());

  writeServerLog("info", "ALDI HU offers ingestion completed", {
    crawlRunId: identity.crawlRunId,
    inserted: result.inserted,
    parsedRowCount: parsedRows.length,
    sampleProductNames: parsedRows.slice(0, 5).map((row) => row.displayName),
    snapshotId: result.snapshot.id
  });
}

try {
  await ingestAldiOffers();
} catch (error) {
  writeServerLog("error", "ALDI HU offers ingestion failed", error);
  process.exitCode = 1;
} finally {
  await closeMongoClient();
}
