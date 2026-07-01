import { createHash } from "node:crypto";

import type { ParsedShopProductRow } from "../../v1/contracts.js";

export const coopHuOffersSourceName = "coop-hu-offers";
export const coopHuOffersWorkflowName = "coop-hu-offers-crawl";
export const coopHuOffersParserName = "coop-hu-offers-visible-text-parser";
export const coopHuOffersParserVersion = "0.3.0";
export const coopHuOffersUrl = "https://www.coop.hu/akcios-termekek/";

interface CoopHuOffersPayload {
  html: string;
  visibleText: string;
}

interface CoopHuValidityWindow {
  label: string | null;
  validFrom: string | null;
  validTo: string | null;
}

interface CoopHuPriceMatch {
  amountText: string;
  amountValueHuf: number | null;
  fullText: string;
  index: number;
  unit: string | null;
}

interface ParsedCoopHuOfferDraft {
  couponPriceText: string | null;
  couponPriceValueHuf: number | null;
  couponUnitPriceText: string | null;
  description: string | null;
  displayName: string;
  observedAt: string;
  priceText: string | null;
  priceValueHuf: number | null;
  rawText: string;
  sourceRecordId: string;
  unitPriceText: string | null;
  validFrom: string | null;
  validTo: string | null;
  validityLabel: string | null;
}

export function hashCoopHuContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function serializeCoopHuOffersPayload(payload: CoopHuOffersPayload): string {
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
 * Parses the current public COOP Hungary offers page from rendered body text.
 *
 * COOP currently renders offer data as sequential text lines:
 *
 * Product name
 * 369 Ft/db
 * 1 845 Ft/kg
 * optional condition lines
 * KUPONOS ÁR!
 * optional coupon price
 * optional coupon unit price
 *
 * This parser intentionally treats COOP as a smaller/noisier source than PENNY or ALDI.
 * It keeps rawText in metadata so later normalization can inspect coupon and store-scope notes.
 */
export function parseCoopHuOffersText(visibleText: string, observedAt: string): ParsedShopProductRow[] {
  const lines = normalizeVisibleTextLines(visibleText);
  const rows: ParsedCoopHuOfferDraft[] = [];
  let activeSectionLabel: string | null = null;
  let activeValidity: CoopHuValidityWindow | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!line) {
      continue;
    }

    if (isSectionHeading(line)) {
      activeSectionLabel = line.replace(/^#+\s*/, "").trim();
      continue;
    }

    const validity = parseValidityWindow(line, activeSectionLabel);

    if (validity) {
      activeValidity = validity;
      continue;
    }

    if (!isLikelyCoopHuProductNameLine(line)) {
      continue;
    }

    const priceLine = lines[index + 1];

    if (!priceLine || !isStandalonePriceLine(priceLine)) {
      continue;
    }

    const primaryPrice = parseSinglePriceLine(priceLine);

    if (!primaryPrice) {
      continue;
    }

    let cursor = index + 2;
    let unitPriceText: string | null = null;
    let couponPriceText: string | null = null;
    let couponPriceValueHuf: number | null = null;
    let couponUnitPriceText: string | null = null;
    const noteLines: string[] = [];
    const rawLines = [line, priceLine];

    const maybeUnitPriceLine = lines[cursor];

    if (maybeUnitPriceLine && isStandalonePriceLine(maybeUnitPriceLine)) {
      const unitPrice = parseSinglePriceLine(maybeUnitPriceLine);

      if (unitPrice && unitPrice.unit !== "db") {
        unitPriceText = unitPrice.fullText;
        rawLines.push(maybeUnitPriceLine);
        cursor += 1;
      }
    }

    while (cursor < lines.length) {
      const current = lines[cursor];

      if (!current) {
        cursor += 1;
        continue;
      }

      if (parseValidityWindow(current, activeSectionLabel)) {
        break;
      }

      rawLines.push(current);

      if (/KUPONOS\s+ÁR/i.test(current)) {
        const couponPriceLine = lines[cursor + 1];

        if (couponPriceLine && isStandalonePriceLine(couponPriceLine)) {
          const couponPrice = parseSinglePriceLine(couponPriceLine);

          if (couponPrice) {
            couponPriceText = couponPrice.fullText;
            couponPriceValueHuf = couponPrice.amountValueHuf;
            rawLines.push(couponPriceLine);
            cursor += 1;

            const couponUnitPriceLine = lines[cursor + 1];

            if (couponUnitPriceLine && isStandalonePriceLine(couponUnitPriceLine)) {
              const couponUnitPrice = parseSinglePriceLine(couponUnitPriceLine);
              couponUnitPriceText = couponUnitPrice?.unit === "db" ? null : couponUnitPrice?.fullText ?? null;
              rawLines.push(couponUnitPriceLine);
              cursor += 1;
            }
          }
        }
      } else if (isLikelyCoopHuProductNameLine(current) && isStandalonePriceLine(lines[cursor + 1] ?? "")) {
        rawLines.pop();
        break;
      } else if (!isStandalonePriceLine(current)) {
        noteLines.push(current);
      }

      cursor += 1;
    }

    const rawText = rawLines.join("\n");
    const sourceRecordId = createSourceRecordId(line, rawText, activeValidity);

    rows.push({
      couponPriceText,
      couponPriceValueHuf,
      couponUnitPriceText,
      description: noteLines.length > 0 ? noteLines.join(" ") : null,
      displayName: line,
      observedAt,
      priceText: primaryPrice.fullText,
      priceValueHuf: primaryPrice.amountValueHuf,
      rawText,
      sourceRecordId,
      unitPriceText,
      validFrom: activeValidity?.validFrom ?? null,
      validTo: activeValidity?.validTo ?? null,
      validityLabel: activeValidity?.label ?? activeSectionLabel
    });

    index = cursor - 1;
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
  const normalized = line.toLowerCase();

  return [
    "adatvédelmi beállítások",
    "összes süti elfogadása",
    "süti beállítások módosítása",
    "nélkülözhetetlen sütik elfogadása",
    "menü",
    "keresés",
    "vissza",
    "ajánlatok",
    "promóciók",
    "coop klub",
    "keresés indítása",
    "ugrás az oldal tetejére",
    "oldaltérkép",
    "ügyfélszolgálat",
    "közösségi média",
    "üzlet gyorskereső",
    "ajánlatkereső",
    "üzletkereső",
    "törzsvásárlói kártya",
    "igénylés",
    "belépés",
    "új jelszó igénylés",
    "nyerő márkák",
    "márkatermékek",
    "otthon webáruház",
    "cégünkről",
    "szolgáltatások"
  ].includes(normalized);
}

function isSectionHeading(line: string): boolean {
  if (/Ft(?:\s*\/)?/i.test(line)) {
    return false;
  }

  if (/^Érvényes:/i.test(line)) {
    return false;
  }

  return /^#+\s+/.test(line) || /^[\p{Lu}\d\s!ŐŰÁÉÍÓÖÜÚ.-]{8,}$/u.test(line);
}

function parseValidityWindow(line: string, activeSectionLabel: string | null): CoopHuValidityWindow | null {
  const match = line.match(
    /^Érvényes:\s*(?<fromYear>20\d{2})\.\s*(?<fromMonth>\d{1,2})\.\s*(?<fromDay>\d{1,2})\.\s*-\s*(?<toYear>20\d{2})\.\s*(?<toMonth>\d{1,2})\.\s*(?<toDay>\d{1,2})\./i
  );

  const groups = match?.groups;
  const fromYear = groups?.["fromYear"];
  const fromMonth = groups?.["fromMonth"];
  const fromDay = groups?.["fromDay"];
  const toYear = groups?.["toYear"];
  const toMonth = groups?.["toMonth"];
  const toDay = groups?.["toDay"];

  if (!fromYear || !fromMonth || !fromDay || !toYear || !toMonth || !toDay) {
    return null;
  }

  return {
    label: activeSectionLabel,
    validFrom: toIsoDate(fromYear, fromMonth, fromDay),
    validTo: toIsoDate(toYear, toMonth, toDay)
  };
}

function toIsoDate(year: string, month: string, day: string): string {
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function isStandalonePriceLine(line: string): boolean {
  return /^\d[\d\s]*(?:,\d{1,2})?\s*Ft(?:\s*\/\s*[\p{L}]+)?$/iu.test(line.trim());
}

function parseSinglePriceLine(line: string): CoopHuPriceMatch | null {
  const matches = extractPriceMatches(line);

  return matches[0] ?? null;
}

function extractPriceMatches(line: string): CoopHuPriceMatch[] {
  const matches: CoopHuPriceMatch[] = [];
  const pricePattern = /(?<amount>\d[\d\s]*(?:,\d{1,2})?)\s*Ft(?:\s*\/\s*(?<unit>[\p{L}]+))?/giu;

  for (const match of line.matchAll(pricePattern)) {
    const amount = match.groups?.["amount"];

    if (match.index === undefined || !amount) {
      continue;
    }

    const unit = match.groups?.["unit"]?.toLowerCase() ?? null;
    const fullText = match[0];

    if (!fullText) {
      continue;
    }

    matches.push({
      amountText: amount.replace(/\s+/g, " ").trim(),
      amountValueHuf: parseHungarianPriceNumber(amount),
      fullText: fullText.replace(/\s+/g, " ").trim(),
      index: match.index,
      unit
    });
  }

  return matches;
}

function isLikelyCoopHuProductNameLine(line: string): boolean {
  if (line.length < 6) {
    return false;
  }

  if (/Ft(?:\s*\/)?/i.test(line)) {
    return false;
  }

  if (/^(Érvényes|KUPONOS ÁR!?|TÖRZSVÁSÁRLÓI|Ajánlatkereső|Üzletkereső|Belépés|Cégünkről)$/i.test(line)) {
    return false;
  }

  if (/termék vásárlása esetén/i.test(line)) {
    return false;
  }

  if (/kuponos ár törzsvásárlóknak/i.test(line)) {
    return false;
  }

  if (/^Csak a Coop/i.test(line)) {
    return false;
  }

  if (/sütik|adatvédelmi|hozzájárulás|weboldalunkon/i.test(line)) {
    return false;
  }

  return /[a-záéíóöőúüű]/iu.test(line);
}

function parseHungarianPriceNumber(priceText: string): number | null {
  const normalized = priceText.replace(/\s/g, "").replace(",", ".").trim();
  const value = Number(normalized);

  return Number.isFinite(value) ? value : null;
}

function createSourceRecordId(
  displayName: string,
  rawText: string,
  validity: CoopHuValidityWindow | null
): string {
  const validityPart = validity?.validFrom ?? "no-valid-from";
  const textHash = createHash("sha1").update(`${displayName}\n${rawText}`).digest("hex").slice(0, 16);

  return `coop-hu-${validityPart}-${textHash}`;
}

function toParsedShopProductRow(draft: ParsedCoopHuOfferDraft): ParsedShopProductRow {
  const priceObservations = [
    draft.priceValueHuf === null
      ? null
      : {
          currencyCode: "HUF" as const,
          observedAt: draft.observedAt,
          price: draft.priceValueHuf,
          priceKind: "offer" as const,
          unitPriceLabel: draft.unitPriceText,
          validFrom: draft.validFrom,
          validTo: draft.validTo
        },
    draft.couponPriceValueHuf === null
      ? null
      : {
          currencyCode: "HUF" as const,
          observedAt: draft.observedAt,
          price: draft.couponPriceValueHuf,
          priceKind: "coupon" as const,
          unitPriceLabel: draft.couponUnitPriceText,
          validFrom: draft.validFrom,
          validTo: draft.validTo
        }
  ].filter((observation): observation is NonNullable<typeof observation> => observation !== null);

  return {
    sourceName: coopHuOffersSourceName,
    sourceUrl: coopHuOffersUrl,
    sourceRecordId: draft.sourceRecordId,
    observedAt: draft.observedAt,
    crawlContext: draft.rawText,
    displayName: draft.displayName,
    rawName: draft.displayName,
    description: draft.description,
    countryCode: "HU",
    currency: "HUF",
    priceText: draft.priceText,
    priceValue: draft.priceValueHuf,
    priceObservations,
    unitPriceText: draft.unitPriceText,
    validFrom: draft.validFrom,
    validTo: draft.validTo,
    metadata: {
      couponPriceText: draft.couponPriceText,
      couponUnitPriceText: draft.couponUnitPriceText,
      parserName: coopHuOffersParserName,
      parserVersion: coopHuOffersParserVersion,
      rawText: draft.rawText,
      validityLabel: draft.validityLabel
    }
  };
}
