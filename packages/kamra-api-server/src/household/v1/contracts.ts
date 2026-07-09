export const householdV1CollectionNames = [
  "households",
  "household_memberships",
  "household_local_products",
  "household_stock_items"
] as const;

export type HouseholdV1CollectionName = (typeof householdV1CollectionNames)[number];

export const householdStatuses = ["active", "archived"] as const;
export type HouseholdStatus = (typeof householdStatuses)[number];

export const householdMembershipRoles = ["member", "owner"] as const;
export type HouseholdMembershipRole = (typeof householdMembershipRoles)[number];

export const householdMembershipStatuses = ["active", "removed"] as const;
export type HouseholdMembershipStatus = (typeof householdMembershipStatuses)[number];

export const householdLocalProductStatuses = ["active", "archived"] as const;
export type HouseholdLocalProductStatus = (typeof householdLocalProductStatuses)[number];

export const householdStockItemStatuses = ["active", "archived"] as const;
export type HouseholdStockItemStatus = (typeof householdStockItemStatuses)[number];

export const householdStockStatuses = ["below_limit", "at_limit", "low_soon", "steady"] as const;
export type HouseholdStockStatus = (typeof householdStockStatuses)[number];

export interface HouseholdRecord {
  createdAt: string;
  createdByUserId: string;
  id: string;
  name: string;
  status: HouseholdStatus;
  updatedAt: string;
}

export interface HouseholdMembershipRecord {
  createdAt: string;
  householdId: string;
  id: string;
  role: HouseholdMembershipRole;
  status: HouseholdMembershipStatus;
  updatedAt: string;
  userId: string;
}

export interface HouseholdLocalProductRecord {
  catalogProductId?: string | null;
  catalogProductNameSnapshot?: string | null;
  createdAt: string;
  createdByUserId: string;
  displayName: string;
  gtin?: string | null;
  householdId: string;
  id: string;
  sourceName?: string | null;
  sourceProductUrl?: string | null;
  stockGroupKey: string;
  status: HouseholdLocalProductStatus;
  updatedAt: string;
  updatedByUserId: string;
}

export interface HouseholdStockItemRecord {
  catalogProductId?: string | null;
  catalogProductNameSnapshot?: string | null;
  createdAt: string;
  createdByUserId: string;
  currentAmount: number;
  displayName: string;
  gtin?: string | null;
  householdId: string;
  householdProductId: string;
  id: string;
  initialAmount: number;
  minLimit: number;
  note?: string | null;
  sourceName?: string | null;
  sourceProductUrl?: string | null;
  stockedAt: string;
  stockGroupKey: string;
  status: HouseholdStockItemStatus;
  unit: string;
  updatedAt: string;
  updatedByUserId: string;
}

export interface HouseholdListItem {
  createdAt: string;
  id: string;
  membershipRole: HouseholdMembershipRole;
  memberCount: number;
  name: string;
  status: HouseholdStatus;
  updatedAt: string;
}

export interface HouseholdListResponse {
  households: HouseholdListItem[];
}

export interface CreateHouseholdRequest {
  name: string;
}

export interface CreateHouseholdResponse {
  household: HouseholdListItem;
}

export interface HouseholdLocalProductListItem {
  catalogProductId?: string | null;
  catalogProductNameSnapshot?: string | null;
  createdAt: string;
  displayName: string;
  gtin?: string | null;
  householdId: string;
  id: string;
  sourceName?: string | null;
  sourceProductUrl?: string | null;
  stockGroupKey: string;
  status: HouseholdLocalProductStatus;
  updatedAt: string;
}

export interface HouseholdStockItemListItem {
  catalogProductId?: string | null;
  catalogProductNameSnapshot?: string | null;
  createdAt: string;
  currentAmount: number;
  displayName: string;
  gtin?: string | null;
  householdId: string;
  householdProductId: string;
  id: string;
  initialAmount: number;
  minLimit: number;
  note?: string | null;
  sourceName?: string | null;
  sourceProductUrl?: string | null;
  stockedAt: string;
  stockGroupKey: string;
  stockStatus: HouseholdStockStatus;
  status: HouseholdStockItemStatus;
  unit: string;
  updatedAt: string;
}

export interface HouseholdStockPageResponse {
  household: HouseholdListItem;
  localProducts: HouseholdLocalProductListItem[];
  stockItems: HouseholdStockItemListItem[];
}

export interface HouseholdStockPageRequest {
  householdId: string;
}

export interface CreateHouseholdStockItemRequest {
  catalogProductId?: string | null;
  catalogProductNameSnapshot?: string | null;
  currentAmount: number;
  displayName: string;
  gtin?: string | null;
  householdId: string;
  householdProductId?: string | null;
  initialAmount?: number;
  minLimit: number;
  note?: string | null;
  sourceName?: string | null;
  sourceProductUrl?: string | null;
  stockedAt: string;
  stockGroupKey: string;
  unit: string;
}

export interface UpdateHouseholdStockItemRequest {
  catalogProductId?: string | null;
  catalogProductNameSnapshot?: string | null;
  currentAmount?: number;
  displayName?: string;
  gtin?: string | null;
  householdId: string;
  id: string;
  initialAmount?: number;
  minLimit?: number;
  note?: string | null;
  sourceName?: string | null;
  sourceProductUrl?: string | null;
  stockedAt?: string;
  stockGroupKey?: string;
  unit?: string;
}

export interface DeleteHouseholdStockItemRequest {
  householdId: string;
  id: string;
}

export type HouseholdStockCreateResponse = HouseholdStockPageResponse;
export type HouseholdStockUpdateResponse = HouseholdStockPageResponse;
export type HouseholdStockDeleteResponse = HouseholdStockPageResponse;
