import { createHash } from "node:crypto";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import type { ParsedShopProductRow } from "../../v1/contracts.js";

export const lidlHuBrochureSourceName = "lidl-hu-brochure";
export const lidlHuBrochureWorkflowName = "lidl-hu-brochure-pdf";
export const lidlHuBrochureParserName = "LidlHuBrochurePdfParser";
export const lidlHuBrochureParserVersion = "0.1.1";
export const lidlHuBrochureIndexUrl = "https://www.lidl.hu/c/szorolap/s10013623";
export const lidlHuLeafletApiBaseUrl = "https://endpoints.leaflets.schwarz/v4/flyer";

interface LidlHuLeafletApiResponse {
  flyer?: LidlHuApiFlyer;
  success?: boolean;
}

interface LidlHuApiFlyer {
  endDate?: string;
  flyerUrlAbsolute?: string;
  id?: string;
  offerEndDate?: string;
  offerStartDate?: string;
  pages?: LidlHuApiPage[];
  pdfUrl?: string;
  relatedFlyers?: LidlHuRelatedFlyer[];
  slug?: string;
  startDate?: string;
  status?: string;
  title?: string;
}

interface LidlHuApiPage {
  number?: number;
  pageType?: string;
}

interface LidlHuRelatedFlyer {
  endDate?: string;
  pdfUrl?: string;
  slug?: string;
  startDate?: string;
  title?: string;
  url?: string;
}

export interface LidlHuBrochureSummary {
  endDate: string | null;
  flyerId: string;
  pageNumbers: number[];
  pdfUrl: string;
  slug: string;
  sourceUrl: string;
  startDate: string | null;
  title: string;
}

interface LidlHuPageText {
  lines: string[];
  pageNumber: number;
}

export function hashLidlHuBrochureContent(content: Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

export function discoverLidlHuBrochureSlugs(indexHtml: string): string[] {
  const slugs = new Set<string>();
  const hrefPattern =
    /href="(?<href>(?:https:\/\/www\.lidl\.hu)?\/l\/hu\/ujsag\/(?<slug>[^"/?#]+)[^"]*)"/g;

  for (const match of indexHtml.matchAll(hrefPattern)) {
    const slug = match.groups?.["slug"];

    if (slug) {
      slugs.add(slug);
    }
  }

  return [...slugs];
}

export function parseLidlHuBrochureSummary(
  apiResponseText: string,
  fallbackSlug: string
): LidlHuBrochureSummary | null {
  const response = JSON.parse(apiResponseText) as LidlHuLeafletApiResponse;
  const flyer = response.flyer;

  if (!response.success || !flyer || !isLidlHuFoodBrochureTitle(flyer.title)) {
    return null;
  }

  if (!flyer.pdfUrl) {
    throw new Error(`Lidl HU brochure ${fallbackSlug} did not include a PDF URL.`);
  }

  return {
    endDate: normalizeDate(flyer.offerEndDate ?? flyer.endDate),
    flyerId: requireText(flyer.id, "flyer id"),
    pageNumbers: visiblePageNumbers(flyer.pages),
    pdfUrl: flyer.pdfUrl,
    slug: flyer.slug ?? fallbackSlug,
    sourceUrl: flyer.flyerUrlAbsolute ?? `${lidlHuBrochureIndexUrl}#${fallbackSlug}`,
    startDate: normalizeDate(flyer.offerStartDate ?? flyer.startDate),
    title: requireText(flyer.title, "flyer title")
  };
}

export function parseLidlHuBrochureRows(
  brochure: LidlHuBrochureSummary,
  pageTexts: LidlHuPageText[],
  observedAt: string
): ParsedShopProductRow[] {
  return pageTexts
    .filter(
      (page) => brochure.pageNumbers.length === 0 || brochure.pageNumbers.includes(page.pageNumber)
    )
    .flatMap((page) => parseLidlHuPageRows(brochure, page, observedAt));
}

export async function extractLidlHuPdfPageTexts(pdfBytes: Uint8Array): Promise<LidlHuPageText[]> {
  const loadingTask = getDocument({
    data: new Uint8Array(pdfBytes),
    useSystemFonts: true
  });
  const document = await loadingTask.promise;
  const pages: LidlHuPageText[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const lines = textContent.items
        .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
        .map(normalizeLine)
        .filter(Boolean);

      pages.push({
        lines,
        pageNumber
      });
    }
  } finally {
    await loadingTask.destroy();
  }

  return pages;
}

export function serializeLidlHuBrochurePayload(
  brochure: LidlHuBrochureSummary,
  pageTexts: LidlHuPageText[]
): string {
  return JSON.stringify(
    {
      brochure,
      pages: pageTexts.map((page) => ({
        lines: page.lines,
        pageNumber: page.pageNumber
      }))
    },
    null,
    2
  );
}

function parseLidlHuPageRows(
  brochure: LidlHuBrochureSummary,
  page: LidlHuPageText,
  observedAt: string
): ParsedShopProductRow[] {
  const rows: ParsedShopProductRow[] = [];
  const sourceRecordIds = new Set<string>();

  for (const [index, line] of page.lines.entries()) {
    if (
      !isLidlItemNumberLine(line) ||
      isLidlItemNumberContinuation(page.lines, index) ||
      isSplitPackageQuantityLine(page.lines, index) ||
      isLikelyPriceAfterItemNumber(page.lines, index)
    ) {
      continue;
    }

    const itemNumberGroup = collectItemNumberGroup(page.lines, index);
    const sourceProductKey = normalizeItemNumberGroup(itemNumberGroup.lines);
    const packageLabel = collectPackageLabel(page.lines, index);
    const nameLines = collectNameLines(page.lines, index, packageLabel.skipIndexes);
    const displayName = nameLines.displayName;

    if (!displayName || !isAcceptableProductName(displayName)) {
      continue;
    }

    const price = findPriceAfterItemNumber(page.lines, itemNumberGroup.endIndex);
    const rawText = collectRawContext(page.lines, index);
    const sourceRecordId = `${brochure.slug}:page-${page.pageNumber}:item-${sourceProductKey}`;

    if (sourceRecordIds.has(sourceRecordId)) {
      continue;
    }

    sourceRecordIds.add(sourceRecordId);

    rows.push({
      countryCode: "HU",
      crawlContext: rawText,
      displayName,
      metadata: {
        flyerId: brochure.flyerId,
        flyerSlug: brochure.slug,
        flyerTitle: brochure.title,
        pageNumber: page.pageNumber,
        parserName: lidlHuBrochureParserName,
        parserVersion: lidlHuBrochureParserVersion,
        pdfUrl: brochure.pdfUrl,
        rawText
      },
      observedAt,
      packageLabel: packageLabel.label,
      priceObservations:
        price === null
          ? []
          : [
              {
                currencyCode: "HUF",
                observedAt,
                price,
                priceKind: "offer",
                unitPriceLabel: packageLabel.unitPriceLabel,
                validFrom: brochure.startDate,
                validTo: brochure.endDate
              }
            ],
      productIdentifiers: [
        {
          issuer: "lidl.hu",
          kind: "retailer_item_number",
          value: sourceProductKey
        }
      ],
      rawName: displayName,
      sourceName: lidlHuBrochureSourceName,
      sourceProductKey,
      sourceRecordId,
      sourceUrl: brochure.sourceUrl,
      stock: {
        availability: "infinite",
        countryCode: "HU"
      },
      storeBrandKey: "lidl-hu",
      validFrom: brochure.startDate,
      validTo: brochure.endDate
    });
  }

  return rows;
}

function collectNameLines(
  lines: string[],
  itemNumberIndex: number,
  skipIndexes: Set<number>
): {
  displayName: string | null;
} {
  const collected: string[] = [];

  for (let index = itemNumberIndex - 1; index >= 0 && collected.length < 10; index -= 1) {
    const line = lines[index];

    if (!line) {
      break;
    }

    if (skipIndexes.has(index) || isProductAttributeLine(line)) {
      continue;
    }

    if (
      isLidlItemNumberLine(line) ||
      isStandaloneOfferPriceLine(line) ||
      isHardNameBoundary(line)
    ) {
      break;
    }

    if (!isLidlNoiseLine(line)) {
      collected.unshift(line);
    }
  }

  const displayName = cleanDisplayName(collected.join(" "));

  return {
    displayName: displayName.length > 0 ? displayName : null
  };
}

function findPriceAfterItemNumber(lines: string[], itemNumberEndIndex: number): number | null {
  for (
    let index = itemNumberEndIndex + 1;
    index < lines.length && index <= itemNumberEndIndex + 8;
    index += 1
  ) {
    const line = lines[index];

    if (!line || isLidlItemNumberLine(line)) {
      break;
    }

    if (isSkippablePriceContextLine(line)) {
      continue;
    }

    if (isLikelyProductTextLine(line) || isHardNameBoundary(line)) {
      break;
    }

    const price = parseStandalonePrice(line);

    if (price !== null) {
      return price;
    }
  }

  return null;
}

function collectRawContext(lines: string[], itemNumberIndex: number): string {
  const start = Math.max(0, itemNumberIndex - 8);
  const end = Math.min(lines.length, itemNumberIndex + 9);

  return lines.slice(start, end).join("\n");
}

function collectItemNumberGroup(
  lines: string[],
  itemNumberIndex: number
): {
  endIndex: number;
  lines: string[];
} {
  const firstLine = lines[itemNumberIndex];

  if (!firstLine) {
    return {
      endIndex: itemNumberIndex,
      lines: []
    };
  }

  const group = [firstLine];
  let endIndex = itemNumberIndex;

  for (let index = itemNumberIndex + 1; index < lines.length; index += 1) {
    const previousLine = lines[index - 1];
    const line = lines[index];

    if (!previousLine || !line || !previousLine.endsWith("/") || !isLidlItemNumberLine(line)) {
      break;
    }

    group.push(line);
    endIndex = index;
  }

  return {
    endIndex,
    lines: group
  };
}

function isLidlItemNumberContinuation(lines: string[], index: number): boolean {
  const previousLine = lines[index - 1];

  return Boolean(previousLine?.endsWith("/") && isLidlItemNumberLine(previousLine));
}

function isLikelyPriceAfterItemNumber(lines: string[], index: number): boolean {
  const line = lines[index];

  if (!line || !/^\d{4}$/.test(line)) {
    return false;
  }

  for (
    let previousIndex = index - 1;
    previousIndex >= 0 && previousIndex >= index - 4;
    previousIndex -= 1
  ) {
    const previousLine = lines[previousIndex];

    if (!previousLine) {
      continue;
    }

    if (isLidlItemNumberLine(previousLine)) {
      return true;
    }

    if (isLikelyProductTextLine(previousLine) && !isSkippablePriceContextLine(previousLine)) {
      return false;
    }
  }

  return false;
}

function normalizeItemNumberGroup(lines: string[]): string {
  return lines.join(" / ").replace(/\s+/g, "").replace(/\/+/g, "/").replace(/\/$/, "");
}

function collectPackageLabel(
  lines: string[],
  itemNumberIndex: number
): {
  label: string | null;
  skipIndexes: Set<number>;
  unitPriceLabel: string | null;
} {
  const skipIndexes = new Set<number>();
  const fragments: Array<{ index: number; line: string }> = [];

  for (let index = itemNumberIndex - 1; index >= 0 && fragments.length < 4; index -= 1) {
    const line = lines[index];

    if (!line) {
      break;
    }

    if (isLidlItemNumberLine(line) && !isSplitPackageQuantityLine(lines, index)) {
      break;
    }

    if (isPurchaseDealLine(line)) {
      break;
    }

    if (isPackageFragmentLine(line) || isSplitUnitPriceTail(lines, index)) {
      fragments.unshift({ index, line });
      skipIndexes.add(index);
      continue;
    }

    break;
  }

  const label = normalizePackageLabel(fragments.map((fragment) => fragment.line));

  return {
    label,
    skipIndexes,
    unitPriceLabel: label ? extractUnitPriceLabel(label) : null
  };
}

function visiblePageNumbers(pages: LidlHuApiPage[] | undefined): number[] {
  return (pages ?? [])
    .filter((page) => !page.pageType || page.pageType.toLowerCase() === "page")
    .map((page) => page.number)
    .filter((pageNumber): pageNumber is number => typeof pageNumber === "number");
}

function isLidlHuFoodBrochureTitle(title: string | undefined): boolean {
  const normalized = title?.toLocaleLowerCase("hu-HU") ?? "";

  return normalized.includes("akciós újság") && !normalized.includes("nonfood");
}

function isLidlItemNumberLine(line: string): boolean {
  return /^\d{4,8}(?:\s*\/\s*\d{4,8})*(?:\s*\/)?$/.test(line);
}

function isLikelyPackageLine(line: string): boolean {
  return /\b\d+(?:[,.]\d+)?\s*(?:g|kg|ml|l|db)\b/i.test(line) || /^\s*\/\s*kg\s*$/i.test(line);
}

function isPackageFragmentLine(line: string): boolean {
  return (
    !isPurchaseDealLine(line) &&
    (isLikelyPackageLine(line) ||
      /^\d+(?:[,.]\d+)?$/.test(line) ||
      /^(?:g|kg|ml|l|db)(?:;.*)?$/i.test(line) ||
      /^\d[\d\s]*(?:,\d{1,2})?\s*Ft(?:\/(?:kg|l|db))?$/i.test(line))
  );
}

function isSplitUnitPriceTail(lines: string[], index: number): boolean {
  const line = lines[index];
  const previousLine = lines[index - 1] ?? "";

  if (!line) {
    return false;
  }

  return (
    /^\d[\d\s]*(?:,\d{1,2})?\s*Ft$/i.test(line) &&
    /\b1\s*(?:kg|l|db)\s*=\s*[\d\s]*$/i.test(previousLine)
  );
}

function isSplitPackageQuantityLine(lines: string[], index: number): boolean {
  const line = lines[index];
  const nextLine = lines[index + 1] ?? "";

  if (!line) {
    return false;
  }

  return /^\d+(?:[,.]\d+)?$/.test(line) && /^(?:g|kg|ml|l|db)(?:\b|;)/i.test(nextLine);
}

function normalizePackageLabel(lines: string[]): string | null {
  if (lines.length === 0) {
    return null;
  }

  const label = lines.join(" ").replace(/\s+/g, " ").trim();

  return isLikelyPackageLine(label) ? label : null;
}

function extractUnitPriceLabel(line: string): string | null {
  const match = line.match(/1\s*(?:kg|l|db)\s*=\s*[\d\s,.]+\s*Ft/i);

  return match?.[0].replace(/\s+/g, " ").trim() ?? null;
}

function isProductAttributeLine(line: string): boolean {
  return /^(?:Zsírtartalom|Alkoholtartalom|Energiatartalom|Méret|Anyaga|Cserép átmérője|Növény magassága):/i.test(
    line
  );
}

function isPurchaseDealLine(line: string): boolean {
  return (
    /^\d+\s*db;\s*[\d\s]+\s*Ft\/db\b/i.test(line) ||
    /^\d+\s*db\s+vásárlása esetén:?$/i.test(line) ||
    /^[\d\s]+Ft\/db\b/i.test(line) ||
    /^Ft-(?:tól|db)$/i.test(line)
  );
}

function cleanDisplayName(value: string): string {
  let name = value.replace(/\s+/g, " ").trim();

  for (;;) {
    const cleaned = name
      .replace(/^(?:Jó választás\s+)*/i, "")
      .replace(/^(?:a hazai\s+)*/i, "")
      .replace(/^(?:Szuper\s+ár!?\s+)*/i, "")
      .replace(/^(?:Lidl Plus-szal\s+\*?\s*)*/i, "")
      .replace(/^(?:\*+\s+)*/i, "")
      .replace(/^Ft-(?:tól|db)\s+/i, "")
      .replace(/^Ft\/db\s+/i, "")
      .replace(/^(?:\d+\s*db;\s*[\d\s]+\s*Ft\/db\s+)*/i, "")
      .replace(/^(?:\d+\s*(?:db|l|g|kg|ml)\s+)*/i, "")
      .replace(/\s+\d+\s*db\s+vásárlása esetén:.*$/i, "")
      .trim();

    if (cleaned === name) {
      return cleaned;
    }

    name = cleaned;
  }
}

function isHardNameBoundary(line: string): boolean {
  return (
    /^Az árak\b/i.test(line) ||
    /^Akciós termékeink\b/i.test(line) ||
    /^Nyomdai hibákért\b/i.test(line) ||
    /^A termékek nem képezik\b/i.test(line) ||
    /^EUTR technikai azonosító szám\b/i.test(line) ||
    /^Ft$/i.test(line) ||
    /^\d{1,2}\/\d{4}$/.test(line) ||
    /^\d{1,2}\.$/.test(line) ||
    /^\d{2}\.$/.test(line) ||
    /^\d{1,2}\.\d{1,2}/.test(line) ||
    /^\d{1,2}\.\s*(?:hét|pénteken|szombaton|vasárnap)/i.test(line) ||
    /^Még több ajánlat\b/i.test(line)
  );
}

function isStandaloneOfferPriceLine(line: string): boolean {
  return (
    /^\d[\d\s]*(?:,\d{1,2})?$/.test(line) ||
    /^\d[\d\s]*(?:,\d{1,2})?\s*Ft$/i.test(line) ||
    /^\d[\d\s]*(?:,\d{1,2})?ft$/i.test(line)
  );
}

function isSkippablePriceContextLine(line: string): boolean {
  return (
    /^-$/.test(line) ||
    /^\*+$/.test(line) ||
    /^-\d+%$/.test(line) ||
    /^%$/.test(line) ||
    /^Lidl Plus-szal$/i.test(line) ||
    /^Szuper ár!$/i.test(line) ||
    isPurchaseDealLine(line) ||
    /^Jó választás$/i.test(line) ||
    /^a hazai$/i.test(line) ||
    /^TV-$/i.test(line) ||
    /^termék$/i.test(line)
  );
}

function isLikelyProductTextLine(line: string): boolean {
  return (
    /[a-záéíóöőúüű]/i.test(line) &&
    !isSkippablePriceContextLine(line) &&
    !isProductAttributeLine(line) &&
    !isHardNameBoundary(line) &&
    !isLikelyPackageLine(line)
  );
}

function isAcceptableProductName(name: string): boolean {
  return (
    /[a-záéíóöőúüű]{3,}/i.test(name) &&
    !/^[\d\s.,%/+-]+$/.test(name) &&
    !/^\/?db$/i.test(name) &&
    !/^\*+$/.test(name) &&
    !/^Szuper\s+ár!?$/i.test(name) &&
    !/^Ft-(?:tól|db)$/i.test(name) &&
    !/^Az árak\b/i.test(name) &&
    !/^Akciós termékeink\b/i.test(name)
  );
}

function isLidlProductBoundary(line: string): boolean {
  if (/%$/.test(line) || /^-\d+%/.test(line)) {
    return true;
  }

  if (/^\d[\d\s]*(?:,\d{1,2})?\s*Ft$/i.test(line)) {
    return true;
  }

  if (
    /^(Lidl Plus-szal|Szuper ár!|TV-|termék|Új|Minden|Jó választás|Az árak|Akciós termékeink|Még több ajánlat|Részletek)$/i.test(
      line
    )
  ) {
    return true;
  }

  return false;
}

function isLidlNoiseLine(line: string): boolean {
  return (
    isLidlProductBoundary(line) ||
    /^a hazai$/i.test(line) ||
    /^Ft$/i.test(line) ||
    /^\d{1,2}\.$/.test(line) ||
    /^\d{1,2}\.\d{1,2}/.test(line) ||
    /^csütörtöktől$/i.test(line) ||
    /^igazán megéri\.?$/i.test(line)
  );
}

function parseStandalonePrice(line: string): number | null {
  const normalized = line.replace(/\s+/g, "").replace(/ft$/i, "");

  if (!/^\d{2,5}$/.test(normalized)) {
    return null;
  }

  const price = Number.parseInt(normalized, 10);

  return Number.isFinite(price) && price >= 50 ? price : null;
}

function normalizeDate(value: string | undefined): string | null {
  return value?.slice(0, 10) ?? null;
}

function normalizeLine(value: string): string {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function requireText(value: string | undefined, label: string): string {
  if (!value) {
    throw new Error(`Lidl HU brochure API response is missing ${label}.`);
  }

  return value;
}
