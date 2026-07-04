import type { ProductMeasurement } from "../../catalog/v1/contracts.js";
import type {
  IngestionRawSnapshotRecord,
  ParsedShopProductRow
} from "../v1/contracts.js";
import {
  createProductReviewCandidateFingerprint,
  type ProductReviewCandidateDraft,
  type ProductReviewCandidateMatchConfidence
} from "../v1/review-contracts.js";

export const sourceOfferReviewCandidateBuilderName = "SourceOfferReviewCandidateBuilder";
export const sourceOfferReviewCandidateBuilderVersion = "1.0.0";

export interface SourceOfferReviewCandidate {
  candidate: ProductReviewCandidateDraft;
  candidateFingerprint: string;
  rawRowPreview: {
    categoryLabel?: string | null;
    countryCode: "HU";
    crawlContext?: string | null;
    description?: string | null;
    displayName: string;
    packageLabel?: string | null;
    priceText?: string | null;
    priceValue?: number | null;
    rawName?: string | null;
    sourceName?: string;
    sourceProductKey?: string;
    sourceRecordId?: string | null;
    sourceUrl?: string | null;
    storeBrandKey?: string;
    unitPriceText?: string | null;
    validFrom?: string | null;
    validTo?: string | null;
  };
}

export function buildSourceOfferReviewCandidate(
  snapshot: IngestionRawSnapshotRecord,
  row: ParsedShopProductRow,
  rowIndex: number
): SourceOfferReviewCandidate {
  const sourceName = row.sourceName ?? snapshot.sourceName;
  const sourceProductKey = row.sourceProductKey ?? createFallbackSourceProductKey(sourceName, row, rowIndex);
  const displayName = row.displayName.trim();

  return {
    candidateFingerprint: createProductReviewCandidateFingerprint(snapshot, row, rowIndex),
    candidate: {
      matchConfidence: determineMatchConfidence(row, sourceName),
      origin: {
        capturedAt: snapshot.capturedAt,
        sourceName,
        sourceRecordId: row.sourceRecordId ?? snapshot.sourceRecordId,
        sourceUrl: row.sourceUrl ?? snapshot.sourceUrl ?? null
      },
      priceObservations: [...(row.priceObservations ?? [])],
      product: {
        brandName: null,
        kind: "grocery",
        measurements: parsePackageMeasurements(row.packageLabel),
        name: displayName,
        normalizedName: normalizeProductName(displayName),
        primaryCategoryKey: null
      },
      source: {
        countryCode: "HU",
        currentCategoryLabel: row.categoryLabel ?? null,
        productPageUrl: row.sourceUrl ?? snapshot.sourceUrl ?? null,
        sourceName,
        sourceProductKey,
        sourceProductName: row.rawName ?? displayName,
        storeBrandKey: row.storeBrandKey ?? sourceName
      },
      sourceProductIdentifiers: [...(row.productIdentifiers ?? [])],
      stock: row.stock ?? undefined
    },
    rawRowPreview: {
      categoryLabel: row.categoryLabel ?? null,
      countryCode: "HU",
      crawlContext: row.crawlContext ?? null,
      description: row.description ?? null,
      displayName,
      packageLabel: row.packageLabel ?? null,
      priceText: row.priceText ?? null,
      priceValue: row.priceValue ?? null,
      rawName: row.rawName ?? null,
      sourceName,
      sourceProductKey,
      sourceRecordId: row.sourceRecordId ?? snapshot.sourceRecordId,
      sourceUrl: row.sourceUrl ?? snapshot.sourceUrl ?? null,
      storeBrandKey: row.storeBrandKey ?? sourceName,
      unitPriceText: row.unitPriceText ?? null,
      validFrom: row.validFrom ?? null,
      validTo: row.validTo ?? null
    }
  };
}

function createFallbackSourceProductKey(
  sourceName: string,
  row: ParsedShopProductRow,
  rowIndex: number
): string {
  return `${sourceName}:${row.sourceRecordId ?? rowIndex}`;
}

function determineMatchConfidence(
  row: ParsedShopProductRow,
  sourceName: string
): ProductReviewCandidateMatchConfidence {
  const identifiers = row.productIdentifiers ?? [];
  if (identifiers.some((identifier) => identifier.kind === "gtin")) {
    return "strong_identifier";
  }

  if (row.sourceProductKey?.trim()) {
    return "strong_source_key";
  }

  if (sourceName.trim()) {
    return "source_scoped_name";
  }

  return "name_only";
}

function parsePackageMeasurements(packageLabel: string | null | undefined): ProductMeasurement[] {
  if (!packageLabel?.trim()) {
    return [];
  }

  const match = packageLabel.trim().match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml)$/i);
  if (!match) {
    return [];
  }

  const [, rawValue, rawUnit] = match;
  if (!rawValue || !rawUnit) {
    return [];
  }

  const value = Number(rawValue.replace(",", "."));
  const unit = rawUnit.toLowerCase();
  const normalizedUnit = unit === "kg" ? "g" : unit === "l" ? "ml" : unit;
  const normalizedValue = unit === "kg" || unit === "l" ? value * 1000 : value;

  return [
    {
      normalizedUnit,
      normalizedValue,
      unit,
      value
    }
  ];
}

function normalizeProductName(name: string): string {
  return name.trim().toLowerCase();
}
