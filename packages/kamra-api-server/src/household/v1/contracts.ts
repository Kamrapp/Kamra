export const householdV1CollectionNames = [
  "households",
  "household_memberships",
  "household_local_products",
  "household_stock_items",
  "household_feature_flags",
  "household_purchase_price_observations",
  "household_shopping_lists",
  "household_shops"
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

export const householdShoppingScales = ["business_as_usual", "keep_it_chill", "stock_em_up", "start_fresh"] as const;
export type HouseholdShoppingScale = (typeof householdShoppingScales)[number];

export const householdShoppingListReasonCodes = [
  "below_minimum",
  "at_minimum",
  "low_soon",
  "broad_restock"
] as const;
export type HouseholdShoppingListReasonCode = (typeof householdShoppingListReasonCodes)[number];

export const householdShoppingListItemUncertaintyFlags = [
  "missing_catalog_product",
  "missing_product_source"
] as const;
export type HouseholdShoppingListItemUncertaintyFlag = (typeof householdShoppingListItemUncertaintyFlags)[number];

export const householdShoppingListLineSourceKinds = ["generated", "manual"] as const;
export type HouseholdShoppingListLineSourceKind = (typeof householdShoppingListLineSourceKinds)[number];

export const householdShoppingListStatuses = ["active", "completed", "archived"] as const;
export type HouseholdShoppingListStatus = (typeof householdShoppingListStatuses)[number];

export const householdShoppingListStockApplicationStatuses = ["not_applied", "applied"] as const;
export type HouseholdShoppingListStockApplicationStatus =
  (typeof householdShoppingListStockApplicationStatuses)[number];

export const householdShopStatuses = ["active", "archived"] as const;
export type HouseholdShopStatus = (typeof householdShopStatuses)[number];

export const householdShoppingListUpdateScopes = ["update_ticked_only", "tick_all_and_update"] as const;
export type HouseholdShoppingListUpdateScope = (typeof householdShoppingListUpdateScopes)[number];

export const householdFeatureFlagKeys = [
  "allowAutoTickingAllShoppingListEntries",
  "allowControlledAlphaAccess"
] as const;
export type HouseholdFeatureFlagKey = (typeof householdFeatureFlagKeys)[number];

export interface HouseholdRecord {
  createdAt: string;
  createdByUserId: string;
  defaultCalculatedMaxLimitMultiplier?: number | null;
  favouriteShopId?: string | null;
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

export interface HouseholdFeatureFlagRecord {
  createdAt: string;
  enabled: boolean;
  id: string;
  key: HouseholdFeatureFlagKey;
  updatedAt: string;
  updatedByUserId: string;
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
  productSourceId?: string | null;
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
  idealMaxLimit?: number | null;
  initialAmount: number;
  minLimit: number;
  note?: string | null;
  productSourceId?: string | null;
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
  defaultCalculatedMaxLimitMultiplier?: number | null;
  favouriteShopId?: string | null;
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
  productSourceId?: string | null;
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
  idealMaxLimit?: number | null;
  initialAmount: number;
  minLimit: number;
  note?: string | null;
  productSourceId?: string | null;
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
  idealMaxLimit?: number | null;
  initialAmount?: number;
  minLimit: number;
  note?: string | null;
  productSourceId?: string | null;
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
  idealMaxLimit?: number | null;
  initialAmount?: number;
  minLimit?: number;
  note?: string | null;
  productSourceId?: string | null;
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

export interface HouseholdShoppingListItemReference {
  catalogProductId?: string | null;
  gtin?: string | null;
  householdProductId?: string | null;
  householdStockItemId?: string | null;
  productSourceId?: string | null;
  sourceName?: string | null;
  sourceProductUrl?: string | null;
  stockGroupKey?: string | null;
}

export interface HouseholdShoppingListItemDisplaySnapshot {
  catalogProductNameSnapshot?: string | null;
  displayName: string;
  unit: string;
}

export interface HouseholdObservedPriceInput {
  amount: number;
  currencyCode: string;
  observedAt: string;
}

export interface HouseholdShoppingListPreviewItem
  extends HouseholdShoppingListItemReference, HouseholdShoppingListItemDisplaySnapshot {
  currentAmount: number;
  idealMaxLimit?: number | null;
  reasonCode: HouseholdShoppingListReasonCode;
  stockStatus: HouseholdStockStatus;
  suggestedBuyAmount: number;
  targetAmount: number;
  uncertaintyFlags: HouseholdShoppingListItemUncertaintyFlag[];
}

export interface HouseholdShoppingListPreviewRequest {
  householdId: string;
  scale: HouseholdShoppingScale;
}

export interface HouseholdShoppingListPreviewResponse {
  householdId: string;
  itemCount: number;
  items: HouseholdShoppingListPreviewItem[];
  scale: HouseholdShoppingScale;
}

export interface HouseholdShoppingListLineRecord
  extends HouseholdShoppingListItemReference, HouseholdShoppingListItemDisplaySnapshot {
  currentAmount?: number | null;
  id: string;
  idealMaxLimit?: number | null;
  minLimit?: number | null;
  observedPrice?: HouseholdObservedPriceInput | null;
  plannedAmount: number;
  purchasedAmount: number;
  reasonCode?: HouseholdShoppingListReasonCode | null;
  sourceKind: HouseholdShoppingListLineSourceKind;
  status: HouseholdShoppingListStockApplicationStatus;
  stockStatus?: HouseholdStockStatus | null;
  suggestedBuyAmount: number;
  targetAmount: number;
  ticked: boolean;
  uncertaintyFlags: HouseholdShoppingListItemUncertaintyFlag[];
}

export interface HouseholdShoppingListRecord {
  createdAt: string;
  createdByUserId: string;
  householdId: string;
  id: string;
  items: HouseholdShoppingListLineRecord[];
  schemaVersion: string;
  scale: HouseholdShoppingScale;
  shopId?: string | null;
  status: HouseholdShoppingListStatus;
  stockAppliedAt?: string | null;
  updatedAt: string;
  updatedByUserId: string;
}

export interface CreateHouseholdShoppingListRequest {
  householdId: string;
  scale: HouseholdShoppingScale;
  shopId?: string | null;
}

export interface UpdateHouseholdShoppingListRequest {
  householdId: string;
  id: string;
  items?: HouseholdShoppingListLineRecord[];
  shopId?: string | null;
  status?: HouseholdShoppingListStatus;
}

export interface UpdateHouseholdShoppingListStocksRequest {
  confirmationMode?: HouseholdShoppingListUpdateScope | null;
  householdId: string;
  id: string;
  stockAppliedAt: string;
}

export interface HouseholdShoppingListResponse {
  shoppingList: HouseholdShoppingListRecord;
}

export interface HouseholdShopListResponse {
  shops: HouseholdShopRecord[];
}

export interface HouseholdFeatureFlagListItem {
  enabled: boolean;
  key: HouseholdFeatureFlagKey;
}

export interface HouseholdFeatureFlagListResponse {
  featureFlags: HouseholdFeatureFlagListItem[];
}

export interface UpdateHouseholdFeatureFlagRequest {
  enabled: boolean;
  key: HouseholdFeatureFlagKey;
}

export interface HouseholdShoppingListStockUpdateResponse {
  allowedConfirmationModes?: HouseholdShoppingListUpdateScope[];
  appliedLineCount: number;
  confirmationRequired: boolean;
  householdStockPage?: HouseholdStockPageResponse;
  shoppingList: HouseholdShoppingListRecord;
}

export interface HouseholdPurchasePriceObservationRecord
  extends HouseholdShoppingListItemReference, HouseholdShoppingListItemDisplaySnapshot {
  createdAt: string;
  householdId: string;
  id: string;
  observedAt: string;
  price: HouseholdObservedPriceInput;
  shoppingListId?: string | null;
  shoppingListLineId?: string | null;
  shopId?: string | null;
  updatedAt: string;
}

export interface HouseholdShopRecord {
  countryCode: string;
  createdAt: string;
  id: string;
  label: string;
  sourceNames: string[];
  status: HouseholdShopStatus;
  storeBrandKeys: string[];
  updatedAt: string;
}

export type HouseholdStockCreateResponse = HouseholdStockPageResponse;
export type HouseholdStockUpdateResponse = HouseholdStockPageResponse;
export type HouseholdStockDeleteResponse = HouseholdStockPageResponse;
