export const ingestionV1CollectionNames = [
  "ingestion_raw_snapshots",
  "ingestion_runs"
] as const;

export type IngestionV1CollectionName = (typeof ingestionV1CollectionNames)[number];

export const ingestionRunStatuses = ["completed", "failed", "partial", "running"] as const;
export type IngestionRunStatus = (typeof ingestionRunStatuses)[number];

export interface CrawlRunIdentity {
  crawlDate: string;
  crawlRunId: string;
  sourceName: string;
  workflowName: string;
}

export interface IngestionRunRecord extends CrawlRunIdentity {
  completedAt?: string | null;
  createdAt: string;
  failedCount: number;
  id: string;
  insertedSnapshotCount: number;
  skippedSnapshotCount: number;
  startedAt: string;
  status: IngestionRunStatus;
  updatedAt: string;
}

export interface ParsedShopPriceObservation {
  currencyCode: "HUF";
  observedAt: string;
  price: number;
  priceKind?: "base" | "coupon" | "loyalty_card" | "offer" | "old";
  programName?: string | null;
  unitPriceLabel?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
}

export interface ParsedShopProductIdentifier {
  kind: "gtin" | "national_code" | "retailer_item_number" | "retailer_product_id" | "unknown";
  value: string;
  issuer?: string | null;
}

export interface ParsedShopProductRow {
  categoryLabel?: string | null;
  countryCode: "HU";
  crawlContext?: string | null;
  currency?: "HUF";
  description?: string | null;
  displayName: string;
  metadata?: Record<string, unknown>;
  observedAt?: string;
  packageLabel?: string | null;
  productIdentifiers?: ParsedShopProductIdentifier[];
  priceObservations?: ParsedShopPriceObservation[];
  priceText?: string | null;
  priceValue?: number | null;
  rawName?: string | null;
  sourceName?: string;
  sourceProductKey?: string;
  sourceRecordId?: string;
  sourceUrl?: string;
  stock?: {
    availability: "infinite";
    countryCode: "HU";
  };
  storeBrandKey?: string;
  unitPriceText?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
}

export interface IngestionRawSnapshotRecord extends CrawlRunIdentity {
  capturedAt: string;
  contentHash: string;
  contentType: string;
  id: string;
  parserName: string;
  parserVersion: string;
  payloadText: string;
  parsedRows: ParsedShopProductRow[];
  sourceRecordId: string;
  sourceUrl?: string | null;
}
