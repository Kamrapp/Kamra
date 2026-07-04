import type { ProductMeasurement } from "../../catalog/v1/contracts.js";
import type {
  IngestionRawSnapshotRecord,
  ParsedShopPriceObservation,
  ParsedShopProductIdentifier,
  ParsedShopProductRow
} from "./contracts.js";

export const productReviewCandidateMatchConfidences = [
  "name_only",
  "none",
  "source_scoped_name",
  "strong_identifier",
  "strong_source_key"
] as const;

export type ProductReviewCandidateMatchConfidence =
  (typeof productReviewCandidateMatchConfidences)[number];

export const productReviewDecisionReasons = [
  "bad_name",
  "bad_price",
  "duplicate",
  "non_product",
  "online_only",
  "unsupported_layout",
  "other"
] as const;

export type ProductReviewDecisionReason = (typeof productReviewDecisionReasons)[number];

export interface ProductReviewCandidateProductDraft {
  brandName?: string | null;
  kind: "grocery";
  measurements: ProductMeasurement[];
  name: string;
  normalizedName: string;
  primaryCategoryKey?: string | null;
}

export interface ProductReviewCandidateSourceDraft {
  countryCode: "HU";
  currentCategoryLabel?: string | null;
  productPageUrl?: string | null;
  sourceName: string;
  sourceProductKey: string;
  sourceProductName: string;
  storeBrandKey: string;
}

export interface ProductReviewCandidateDraft {
  matchConfidence: ProductReviewCandidateMatchConfidence;
  origin: {
    capturedAt: string;
    sourceName: string;
    sourceRecordId: string;
    sourceUrl?: string | null;
  };
  priceObservations: ParsedShopPriceObservation[];
  product: ProductReviewCandidateProductDraft;
  source: ProductReviewCandidateSourceDraft;
  sourceProductIdentifiers: ParsedShopProductIdentifier[];
  stock?: {
    availability: "infinite";
    countryCode: "HU";
  };
}

export interface ProductReviewRawRowPreview {
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
}

export interface IngestionProductReviewItemRecord {
  acceptedCatalogProductDeletedAt?: string | null;
  acceptedCatalogProductId?: string | null;
  candidate: ProductReviewCandidateDraft;
  candidateBuilderName: string;
  candidateBuilderVersion: string;
  candidateMatch: ProductReviewCandidateMatchConfidence;
  capturedAt: string;
  createdAt: string;
  decision?: {
    decidedAt: string;
    declineReason?: ProductReviewDecisionReason | null;
    note?: string | null;
    reviewerId: string;
    reviewerName: string;
    state: "accepted" | "declined";
  } | null;
  id: string;
  rawRowPreview: ProductReviewRawRowPreview;
  rowFingerprint: string;
  rowIndex: number;
  snapshotId: string;
  sourceName: string;
  sourceRecordId: string;
  status: "accepted" | "declined" | "failed" | "pending" | "stale";
  updatedAt: string;
}

export function createProductReviewCandidateFingerprint(
  snapshot: IngestionRawSnapshotRecord,
  row: ParsedShopProductRow,
  rowIndex: number
): string {
  return [
    snapshot.id,
    snapshot.contentHash,
    rowIndex,
    row.sourceName ?? snapshot.sourceName,
    row.sourceProductKey ?? "",
    row.sourceRecordId ?? snapshot.sourceRecordId,
    row.displayName,
    row.rawName ?? "",
    row.packageLabel ?? "",
    row.priceText ?? "",
    row.priceValue ?? "",
    row.unitPriceText ?? "",
    row.validFrom ?? "",
    row.validTo ?? ""
  ].join("|");
}
