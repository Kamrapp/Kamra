import { createHash } from "node:crypto";

import type {
  CatalogV1SeedDataset,
  PriceObservationKind,
  ProductMeasurement,
  ProductRecord,
  ProductSourceIdentifierRecord,
  ProductSourceRecord,
  RecordOrigin,
  SourceRecordProcessingStateRecord,
  StockLocationReference,
  StockRecord
} from "../../catalog/v1/contracts.js";
import type {
  IngestionRawSnapshotRecord,
  ParsedShopPriceObservation,
  ParsedShopProductIdentifier,
  ParsedShopProductRow
} from "../v1/contracts.js";

export const sourceOfferProcessorName = "SourceOfferCatalogProcessor";
export const sourceOfferProcessorVersion = "0.1.0";

interface SourceProcessingConfig {
  defaultStoreBrandKey: string;
  locationLabel: string;
  locationKey: string;
}

export interface SourceOfferProcessingResult {
  dataset: CatalogV1SeedDataset;
  processedRowCount: number;
  skippedRowCount: number;
}

const sourceConfigs: Record<string, SourceProcessingConfig> = {
  "aldi-hu-offers": {
    defaultStoreBrandKey: "aldi-hu",
    locationLabel: "ALDI Hungary",
    locationKey: "availability:aldi-hu"
  },
  "coop-hu-offers": {
    defaultStoreBrandKey: "coop-hu",
    locationLabel: "COOP Hungary",
    locationKey: "availability:coop-hu"
  },
  "penny_hu_offers": {
    defaultStoreBrandKey: "penny-hu",
    locationLabel: "PENNY Hungary",
    locationKey: "availability:penny-hu"
  },
  "simple_html_table_shop": {
    defaultStoreBrandKey: "simple-html-table-shop",
    locationLabel: "SimpleHtmlTableShop",
    locationKey: "availability:simple-html-table-shop"
  }
};

export function processSourceOfferSnapshot(
  snapshot: IngestionRawSnapshotRecord,
  processedAt = new Date().toISOString()
): SourceOfferProcessingResult {
  const dataset = createEmptyDataset();
  let processedRowCount = 0;
  let skippedRowCount = 0;

  for (const [rowIndex, row] of snapshot.parsedRows.entries()) {
    if (!row.displayName?.trim()) {
      skippedRowCount += 1;
      continue;
    }

    const sourceName = row.sourceName ?? snapshot.sourceName;
    const sourceProductKey = createSourceProductKey(row, sourceName, rowIndex);
    const storeBrandKey = row.storeBrandKey ?? configFor(sourceName).defaultStoreBrandKey;
    const normalizedName = normalizeProductName(row.displayName);
    const productId = createProductId(row, normalizedName);
    const productSourceId = createProductSourceId(sourceName, sourceProductKey);
    const sourceUrl = row.sourceUrl ?? snapshot.sourceUrl ?? null;
    const origin = createProcessorOrigin(snapshot, row, sourceName, sourceUrl);
    const location = createLocation(sourceName, storeBrandKey);
    const priceObservations = createPriceObservations(row);

    dataset.products.push({
      brandName: null,
      createdAt: processedAt,
      id: productId,
      kind: "grocery",
      measurements: parsePackageMeasurements(row.packageLabel),
      name: row.displayName,
      normalizedName,
      origin: [origin],
      primaryCategoryKey: null,
      status: "active",
      updatedAt: processedAt
    });

    dataset.productSources.push({
      countryCode: row.countryCode,
      createdAt: processedAt,
      currentCategoryLabel: row.categoryLabel ?? null,
      id: productSourceId,
      origin,
      priceLastCheckedAt: latestObservedAt(priceObservations) ?? row.observedAt ?? snapshot.capturedAt,
      productId,
      productPageUrl: sourceUrl ?? `urn:kamra:source:${sourceName}`,
      sourceName,
      sourceProductKey,
      sourceProductName: row.rawName ?? row.displayName,
      storeBrandKey,
      updatedAt: processedAt
    });

    dataset.productSourceIdentifiers.push(
      ...createProductSourceIdentifiers(row, sourceName, productSourceId, origin, processedAt)
    );

    dataset.priceObservations.push(
      ...priceObservations.map((observation, observationIndex) => ({
        createdAt: processedAt,
        id: createPriceObservationId(snapshot, rowIndex, observationIndex, observation),
        location,
        observedAt: observation.observedAt,
        origin,
        price: {
          amount: observation.price,
          currencyCode: observation.currencyCode
        },
        priceKind: observation.priceKind ?? "offer",
        productId,
        productSourceId,
        programName: observation.programName ?? null,
        sourceName,
        sourceProductKey,
        unitPriceLabel: observation.unitPriceLabel ?? row.unitPriceText ?? null,
        updatedAt: processedAt,
        validFrom: observation.validFrom ?? row.validFrom ?? null,
        validTo: observation.validTo ?? row.validTo ?? null
      }))
    );

    dataset.stocks.push({
      createdAt: processedAt,
      id: createStockId(sourceName, sourceProductKey),
      location,
      origin,
      price: null,
      productId,
      quantity: {
        amount: 1,
        packageCount: null,
        unit: "availability"
      },
      status: "active",
      updatedAt: processedAt
    });

    processedRowCount += 1;
  }

  dataset.sourceRecordProcessingStates.push(createProcessingState(snapshot, processedAt));

  return {
    dataset,
    processedRowCount,
    skippedRowCount
  };
}

function createEmptyDataset(): CatalogV1SeedDataset {
  return {
    migrationLedger: [],
    priceObservations: [],
    productSourceIdentifiers: [],
    productSources: [],
    productTagAssignments: [],
    productTags: [],
    products: [],
    sourceRecordProcessingStates: [],
    stocks: []
  };
}

function createProcessorOrigin(
  snapshot: IngestionRawSnapshotRecord,
  row: ParsedShopProductRow,
  sourceName: string,
  sourceUrl: string | null
): RecordOrigin {
  return {
    capturedAt: snapshot.capturedAt,
    kind: "processor",
    producer: sourceOfferProcessorName,
    sourceName,
    sourceRecordId: row.sourceRecordId ?? snapshot.sourceRecordId,
    sourceUrl
  };
}

function createLocation(sourceName: string, storeBrandKey: string): StockLocationReference {
  const config = configFor(sourceName);

  return {
    countryCode: "HU",
    kind: "global_shop_availability",
    label: config.locationLabel,
    locationKey: config.locationKey,
    storeBrandKey
  };
}

function configFor(sourceName: string): SourceProcessingConfig {
  return sourceConfigs[sourceName] ?? {
    defaultStoreBrandKey: sourceName,
    locationLabel: sourceName,
    locationKey: `availability:${stableSlug(sourceName)}`
  };
}

function createProductId(row: ParsedShopProductRow, normalizedName: string): string {
  const commonIdentifier = row.productIdentifiers?.find((identifier) =>
    identifier.kind === "gtin" || identifier.kind === "national_code"
  );

  if (commonIdentifier) {
    return `product_${commonIdentifier.kind}_${stableSlug(commonIdentifier.value)}`;
  }

  return `product_name_${stableSlug(normalizedName)}`;
}

function createSourceProductKey(
  row: ParsedShopProductRow,
  sourceName: string,
  rowIndex: number
): string {
  if (row.sourceProductKey?.trim()) {
    return row.sourceProductKey.trim();
  }

  if (row.sourceRecordId?.trim()) {
    return row.sourceRecordId.trim();
  }

  return `${sourceName}-${rowIndex}-${hashText(row.displayName).slice(0, 10)}`;
}

function createProductSourceId(sourceName: string, sourceProductKey: string): string {
  return `product_source_${stableSlug(sourceName)}_${stableSlug(sourceProductKey)}`;
}

function createProductSourceIdentifiers(
  row: ParsedShopProductRow,
  sourceName: string,
  productSourceId: string,
  origin: RecordOrigin,
  processedAt: string
): ProductSourceIdentifierRecord[] {
  return collectProductIdentifiers(row).map((identifier) => ({
    createdAt: processedAt,
    id: `product_source_identifier_${stableSlug(sourceName)}_${stableSlug(productSourceId)}_${stableSlug(identifier.kind)}_${stableSlug(identifier.value)}`,
    kind: identifier.kind,
    origin,
    productSourceId,
    sourceName,
    updatedAt: processedAt,
    value: identifier.value
  }));
}

function collectProductIdentifiers(row: ParsedShopProductRow): ParsedShopProductIdentifier[] {
  const identifiers = row.productIdentifiers ?? [];
  const itemNumbers = Array.isArray(row.metadata?.["itemNumbers"])
    ? row.metadata["itemNumbers"]
    : [];

  return [
    ...identifiers,
    ...itemNumbers
      .filter((itemNumber): itemNumber is string => typeof itemNumber === "string" && itemNumber.trim().length > 0)
      .map((itemNumber) => ({
        issuer: null,
        kind: "retailer_item_number" as const,
        value: itemNumber
      }))
  ].filter(uniqueIdentifier);
}

function uniqueIdentifier(
  identifier: ParsedShopProductIdentifier,
  index: number,
  identifiers: ParsedShopProductIdentifier[]
): boolean {
  return identifiers.findIndex((candidate) =>
    candidate.kind === identifier.kind && candidate.value === identifier.value
  ) === index;
}

function createPriceObservations(row: ParsedShopProductRow): ParsedShopPriceObservation[] {
  if (row.priceObservations && row.priceObservations.length > 0) {
    return row.priceObservations.filter((observation) => Number.isFinite(observation.price));
  }

  if (typeof row.priceValue === "number" && Number.isFinite(row.priceValue)) {
    return [
      {
        currencyCode: row.currency ?? "HUF",
        observedAt: row.observedAt ?? new Date(0).toISOString(),
        price: row.priceValue,
        priceKind: "offer",
        unitPriceLabel: row.unitPriceText ?? null,
        validFrom: row.validFrom ?? null,
        validTo: row.validTo ?? null
      }
    ];
  }

  return [];
}

function latestObservedAt(priceObservations: ParsedShopPriceObservation[]): string | null {
  return priceObservations
    .map((observation) => observation.observedAt)
    .sort()
    .at(-1) ?? null;
}

function createPriceObservationId(
  snapshot: IngestionRawSnapshotRecord,
  rowIndex: number,
  observationIndex: number,
  observation: ParsedShopPriceObservation
): string {
  return `price_observation_${stableSlug(snapshot.sourceName)}_${stableSlug(snapshot.sourceRecordId)}_${stableSlug(observation.priceKind ?? "offer")}_${stableSlug(observation.observedAt)}_${rowIndex}_${observationIndex}`;
}

function createStockId(sourceName: string, sourceProductKey: string): string {
  return `stock_${stableSlug(sourceName)}_${stableSlug(sourceProductKey)}`;
}

function createProcessingState(
  snapshot: IngestionRawSnapshotRecord,
  processedAt: string
): SourceRecordProcessingStateRecord {
  return {
    attemptCount: 1,
    createdAt: processedAt,
    id: `processing_state_${stableSlug(snapshot.sourceName)}_${stableSlug(sourceOfferProcessorName)}_${stableSlug(sourceOfferProcessorVersion)}_${hashText(snapshot.contentHash).slice(0, 12)}`,
    lastErrorCode: null,
    lastErrorMessage: null,
    lastProcessedAt: processedAt,
    processorName: sourceOfferProcessorName,
    processorVersion: sourceOfferProcessorVersion,
    recordFingerprint: snapshot.contentHash,
    sourceName: snapshot.sourceName,
    state: "processed",
    updatedAt: processedAt
  };
}

function parsePackageMeasurements(packageLabel: string | null | undefined): ProductMeasurement[] {
  if (!packageLabel) {
    return [];
  }

  const match = packageLabel.match(/(?<value>\d+(?:[,.]\d+)?)\s*(?<unit>kg|g|l|ml|db)\b/i);
  const valueText = match?.groups?.["value"];
  const unit = match?.groups?.["unit"]?.toLowerCase();

  if (!valueText || !unit) {
    return [];
  }

  const value = Number(valueText.replace(",", "."));

  if (!Number.isFinite(value)) {
    return [];
  }

  return [
    {
      normalizedUnit: normalizedUnit(unit),
      normalizedValue: normalizedValue(value, unit),
      unit,
      value
    }
  ];
}

function normalizedUnit(unit: string): string {
  if (unit === "kg" || unit === "g") {
    return "g";
  }
  if (unit === "l" || unit === "ml") {
    return "ml";
  }
  if (unit === "db") {
    return "item";
  }

  return unit;
}

function normalizedValue(value: number, unit: string): number {
  if (unit === "kg" || unit === "l") {
    return value * 1000;
  }

  return value;
}

function normalizeProductName(value: string): string {
  return value.toLocaleLowerCase("hu-HU").replace(/\s+/g, " ").trim();
}

function stableSlug(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

  return slug || hashText(value).slice(0, 12);
}

function hashText(value: string): string {
  return createHash("sha1").update(value).digest("hex");
}
