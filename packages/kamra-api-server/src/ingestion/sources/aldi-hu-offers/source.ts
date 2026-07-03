import { createHash } from "node:crypto";

import type { ParsedShopProductRow } from "../../v1/contracts.js";

export const aldiHuOffersSourceName = "aldi-hu-offers";
export const aldiHuOffersWorkflowName = "aldi-hu-offers-crawl";
export const aldiHuOffersParserName = "aldi-hu-offers-visible-text-parser";
export const aldiHuOffersParserVersion = "0.3.0";
export const aldiHuOffersUrl = "https://www.aldi.hu/szuper-akciok-mindennap";

interface AldiHuOffersPayload {
  html: string;
  visibleText: string;
}

interface AldiValidityWindow {
  label: string;
  validFrom: string | null;
  validTo: string | null;
}

interface ParsedAldiOfferDraft {
  crawlContext: string | null;
  description: string | null;
  displayName: string;
  itemNumbers: string[];
  observedAt: string;
  priceText: string | null;
  priceValueHuf: number | null;
  sourceRecordId: string;
  unitPriceText: string | null;
  validFrom: string | null;
  validTo: string | null;
  validityLabel: string | null;
}

export function hashAldiContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function serializeAldiHuOffersPayload(payload: AldiHuOffersPayload): string {
  return JSON.stringify(
    {
      html: payload.html,
      visibleText: payload.visibleText
    },
    null,
    2
  );
}

/**
 * Parses the current public ALDI Hungary "Szuper akciók mindennap" page from rendered body text.
 *
 * The page currently exposes product names, validity headings, unit prices, and Cikkszám item numbers
 * in stable text. The primary shelf price is not always text-exposed; when absent, priceText and
 * priceValueHuf intentionally stay null instead of copying the unit price into the product price.
 */
export function parseAldiHuOffersText(visibleText: string, observedAt: string): ParsedShopProductRow[] {
  const lines = normalizeVisibleTextLines(visibleText);
  const rows: ParsedAldiOfferDraft[] = [];
  let activeValidity: AldiValidityWindow | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) {
      continue;
    }

    const validity = parseValidityWindow(line);

    if (validity) {
      activeValidity = validity;
      continue;
    }

    if (!/Cikkszám\s*:/i.test(line)) {
      continue;
    }

    const displayName = inferProductName(lines, index);
    const itemNumbers = extractItemNumbers(line);

    if (!displayName || itemNumbers.length === 0) {
      continue;
    }

    const unitPriceText = extractUnitPriceText(line);
    const priceText = extractPrimaryPriceText(line);
    const priceValueHuf = priceText ? parseHungarianPriceNumber(priceText) : null;
    const rawDescription = extractDescription(line);
    const description = rawDescription && rawDescription !== displayName ? rawDescription : null;
    const sourceRecordId = createSourceRecordId(itemNumbers, displayName, activeValidity);

    rows.push({
      crawlContext: extractCrawlContext(lines, index),
      description,
      displayName,
      itemNumbers,
      observedAt,
      priceText,
      priceValueHuf,
      sourceRecordId,
      unitPriceText,
      validFrom: activeValidity?.validFrom ?? null,
      validTo: activeValidity?.validTo ?? null,
      validityLabel: activeValidity?.label ?? null
    });
  }

  return rows.map(toParsedShopProductRow);
}

function normalizeVisibleTextLines(visibleText: string): string[] {
  return visibleText
    .replace(/\u00a0/g, " ")
    .split(/\r?\n/g)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((line) => !isNavigationOrBoilerplateLine(line));
}

function isNavigationOrBoilerplateLine(line: string): boolean {
  return [
    "Keresés",
    "Keresési eredmények",
    "Listák",
    "Menü",
    "Főoldal",
    "Tovább a termékekhez"
  ].includes(line);
}

function parseValidityWindow(line: string): AldiValidityWindow | null {
  const match = line.match(
    /^(?<label>.*?)(?<from>20\d{2}\.\d{2}\.\d{2})-t(?:ő|ó)l\s+(?<to>20\d{2}\.\d{2}\.\d{2})-ig/i
  );

  const groups = match?.groups;
  const from = groups?.["from"];
  const to = groups?.["to"];

  if (!from || !to) {
    return null;
  }

  return {
    label: cleanupLabel(groups["label"] ?? ""),
    validFrom: toIsoDate(from),
    validTo: toIsoDate(to)
  };
}

function cleanupLabel(label: string): string {
  return label.replace(/^#+\s*/, "").replace(/[,\s]+$/g, "").trim();
}

function toIsoDate(value: string): string {
  const parts = value.split(".");
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  if (!year || !month || !day) {
    throw new Error(`Invalid ALDI validity date: ${value}`);
  }

  return `${year}-${month}-${day}`;
}

function inferProductName(lines: string[], itemNumberLineIndex: number): string | null {
  const itemNumberLine = lines[itemNumberLineIndex];

  if (!itemNumberLine) {
    return null;
  }

  const sameLineCandidate = cleanupProductName(itemNumberLine.split("Cikkszám:")[0] ?? "");

  if (
    isLikelyProductName(sameLineCandidate)
    && !sameLineCandidate.includes("Ft/")
    && !isLikelyProductDetailLine(sameLineCandidate)
  ) {
    return sameLineCandidate;
  }

  for (let index = itemNumberLineIndex - 1; index >= Math.max(0, itemNumberLineIndex - 6); index -= 1) {
    const line = lines[index];

    if (!line) {
      continue;
    }

    const candidate = cleanupProductName(line);

    if (isLikelyProductName(candidate)) {
      return candidate;
    }
  }

  return null;
}

function cleanupProductName(value: string): string {
  return value
    .replace(/^Image:\s*/i, "")
    .replace(/\([^)]*Ft\/[^)]*\)/g, "")
    .replace(/\bCikkszám\s*:.*$/i, "")
    .replace(/[,\s]+$/g, "")
    .trim();
}

function isLikelyProductName(value: string): boolean {
  if (value.length < 3) {
    return false;
  }

  if (/^(Akciók|Frissesség|Spórolj|Tekintsd|Az itt feltüntetett|Csütörtöktől|Hétfőtől)/i.test(value)) {
    return false;
  }

  if (/^20\d{2}\.\d{2}\.\d{2}/.test(value)) {
    return false;
  }

  if (/Ft\//i.test(value)) {
    return false;
  }

  return true;
}

function isLikelyProductDetailLine(value: string): boolean {
  if (/^[,;:()]/.test(value)) {
    return true;
  }

  if (/^\d/.test(value)) {
    return true;
  }

  if (/^[a-záéíóöőúüű]/u.test(value)) {
    return true;
  }

  if (/%|\bvagy\b|ízű|ízesítésű|zsírtartalom|alkoholtartalom|többféle|szeletelt|hámozott|frissen/iu.test(value)) {
    return true;
  }

  return false;
}

function extractItemNumbers(line: string): string[] {
  const match = line.match(/Cikkszám\s*:\s*(?<numbers>[0-9\s/]+)\b/i);
  const numbers = match?.groups?.["numbers"];

  if (!numbers) {
    return [];
  }

  return numbers
    .split("/")
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => /^\d+$/.test(value));
}

function extractUnitPriceText(line: string): string | null {
  const parenthesizedValues = [...line.matchAll(/\(([^)]*Ft\/[^)]*)\)/gi)]
    .map((match) => match[1])
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim());

  const lastValue = parenthesizedValues.at(-1);

  return lastValue ? lastValue.replace(/\s+/g, " ") : null;
}

function extractPrimaryPriceText(line: string): string | null {
  const withoutParentheses = line.replace(/\([^)]*\)/g, " ");
  const priceMatch = withoutParentheses.match(/(?<![\d/])(?<price>\d[\d\s]*(?:,\d{1,2})?)\s*Ft(?!\/)/i);
  const price = priceMatch?.groups?.["price"];

  if (!price) {
    return null;
  }

  return `${price.replace(/\s+/g, " ").trim()} Ft`;
}

function extractCrawlContext(lines: string[], itemNumberLineIndex: number): string | null {
  const contextLines = lines.slice(
    Math.max(0, itemNumberLineIndex - 6),
    Math.min(lines.length, itemNumberLineIndex + 4)
  );

  return contextLines.length > 0 ? contextLines.join("\n") : null;
}

function parseHungarianPriceNumber(priceText: string): number | null {
  const normalized = priceText.replace(/Ft/gi, "").replace(/\s/g, "").replace(",", ".").trim();
  const value = Number(normalized);

  return Number.isFinite(value) ? value : null;
}

function extractDescription(line: string): string | null {
  const withoutItemNumbers = line.replace(/,?\s*Cikkszám\s*:.*$/i, "").trim();
  const withoutUnitPrice = withoutItemNumbers.replace(/\([^)]*Ft\/[^)]*\)/gi, "").trim();
  const cleaned = withoutUnitPrice
    .replace(/^[,\s]+/g, "")
    .replace(/[,\s]+$/g, "")
    .replace(/^\(([^)]+)\)$/g, "$1")
    .trim();

  return cleaned.length > 0 ? cleaned : null;
}

function createSourceRecordId(
  itemNumbers: string[],
  displayName: string,
  validity: AldiValidityWindow | null
): string {
  const itemNumberPart = itemNumbers.join("-");
  const validityPart = validity?.validFrom ?? "no-valid-from";
  const nameHash = createHash("sha1").update(displayName).digest("hex").slice(0, 10);

  return `aldi-hu-${validityPart}-${itemNumberPart}-${nameHash}`;
}

function toParsedShopProductRow(draft: ParsedAldiOfferDraft): ParsedShopProductRow {
  const priceObservations = draft.priceValueHuf === null
    ? []
    : [
        {
          currencyCode: "HUF" as const,
          observedAt: draft.observedAt,
          price: draft.priceValueHuf,
          priceKind: "offer" as const,
          unitPriceLabel: draft.unitPriceText,
          validFrom: draft.validFrom,
          validTo: draft.validTo
        }
      ];

  return {
    sourceName: aldiHuOffersSourceName,
    sourceUrl: aldiHuOffersUrl,
    sourceRecordId: draft.sourceRecordId,
    sourceProductKey: draft.itemNumbers[0],
    observedAt: draft.observedAt,
    crawlContext: draft.crawlContext,
    displayName: draft.displayName,
    rawName: draft.displayName,
    description: draft.description,
    countryCode: "HU",
    currency: "HUF",
    priceText: draft.priceText,
    priceValue: draft.priceValueHuf,
    priceObservations,
    productIdentifiers: draft.itemNumbers.map((itemNumber) => ({
      issuer: "aldi.hu",
      kind: "retailer_item_number",
      value: itemNumber
    })),
    unitPriceText: draft.unitPriceText,
    validFrom: draft.validFrom,
    validTo: draft.validTo,
    metadata: {
      itemNumbers: draft.itemNumbers,
      parserName: aldiHuOffersParserName,
      parserVersion: aldiHuOffersParserVersion,
      priceCaptureStatus: draft.priceText ? "primary-price-text-found" : "primary-price-text-not-found",
      validityLabel: draft.validityLabel
    }
  };
}
