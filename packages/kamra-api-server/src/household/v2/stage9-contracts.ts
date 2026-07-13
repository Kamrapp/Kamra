import type { TrackingUnit } from "./contracts.js";

export const tripStatuses = [
  "draft",
  "matching",
  "ready",
  "in_progress",
  "partially_processed",
  "completed",
  "cancelled"
] as const;
export type ShoppingTripStatus = (typeof tripStatuses)[number];

export const tripItemPlanStatuses = ["unresolved", "selected", "skipped"] as const;
export type ShoppingTripItemPlanStatus = (typeof tripItemPlanStatuses)[number];

export const tripItemResultStatuses = ["pending", "bought", "not_bought"] as const;
export type ShoppingTripItemResultStatus = (typeof tripItemResultStatuses)[number];

export interface ShopProductCandidate {
  displayName: string;
  id: string;
  packageQuantity: number;
  packageUnit: TrackingUnit;
  productId: string;
  shopMarketId: string;
  status: "active" | "archived";
}

export interface PriceObservationCandidate {
  currencyCode: string;
  id: string;
  kind: "base" | "offer" | "coupon" | "loyalty_card" | "purchase_paid";
  observedAt: string;
  price: number;
  shopProductId: string;
  validFrom?: string | null;
  validTo?: string | null;
  supersededByObservationId?: string | null;
}

export type ApplicablePriceState =
  "applicable" | "conditional_only" | "expired" | "future" | "no_price" | "stale";

export interface ApplicablePrice {
  currencyCode: string | null;
  observationId: string | null;
  price: number | null;
  state: ApplicablePriceState;
}

export interface ShoppingTripItem {
  id: string;
  needId: string;
  displayNameSnapshot: string;
  requiredQuantity: number;
  requiredUnit: TrackingUnit;
  planStatus: ShoppingTripItemPlanStatus;
  resultStatus: ShoppingTripItemResultStatus;
  selectedShopProductId?: string | null;
  selectedProductId?: string | null;
  selectedPriceObservationId?: string | null;
  expectedPackageCount?: number | null;
  expectedTotal?: number | null;
  priceState?: ApplicablePriceState | null;
  matchExplanation?: string | null;
  matchOptions?: ShoppingTripMatchOption[];
  actualQuantity?: number | null;
  actualUnit?: TrackingUnit | null;
  actualPaidPrice?: number | null;
  createdBatchIds?: string[];
  ingestionSubmissionId?: string | null;
}

export interface ShoppingTripMatchOption {
  displayName: string;
  expectedPackageCount: number;
  expectedTotal: number | null;
  priceState: ApplicablePriceState;
  selectedPriceObservationId: string | null;
  shopProductId: string;
}

export interface ShoppingTrip {
  id: string;
  householdId: string;
  shopMarketId: string | null;
  plannedDate: string;
  status: ShoppingTripStatus;
  sourceShoppingNeedListId: string;
  revision: number;
  items: ShoppingTripItem[];
  createdAt: string;
  createdByUserId: string;
  updatedAt: string;
  updatedByUserId: string;
}

export interface ShopMarketRecord {
  id: string;
  aliases: string[];
  countryCode: string;
  currencyCode: string;
  displayName: string;
  status: "active" | "archived";
  metadata?: Record<string, string>;
  revision: number;
  createdAt: string;
  createdByUserId: string;
  updatedAt: string;
  updatedByUserId: string;
}

export interface ShopProductRecord extends ShopProductCandidate {
  aliases: string[];
  sourceKey?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  lastConfirmedAt?: string | null;
}

export const ingestionSubmissionStatuses = [
  "pending",
  "accepted",
  "corrected",
  "rejected"
] as const;
export type IngestionSubmissionStatus = (typeof ingestionSubmissionStatuses)[number];

export interface IngestionSubmission {
  id: string;
  householdId: string;
  shoppingTripId: string;
  shoppingTripItemId: string;
  submittedByUserId: string;
  status: IngestionSubmissionStatus;
  facts: {
    displayName: string;
    shopMarketId: string | null;
    shopProductId?: string | null;
    productId?: string | null;
    quantity: number;
    unit: TrackingUnit;
    paidPrice?: number | null;
    currencyCode?: string | null;
  };
  reviewNote?: string | null;
  revision: number;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string | null;
  reviewedByUserId?: string | null;
}
