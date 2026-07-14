import type {
  HouseholdRecord,
  HouseholdShoppingListPreviewItem,
  HouseholdShoppingListPreviewResponse,
  HouseholdShoppingListReasonCode,
  HouseholdShoppingScale,
  HouseholdStockItemListItem,
  HouseholdStockStatus
} from "../v1/contracts.js";

const defaultCalculatedMaxLimitMultiplier = 2;

const shoppingScaleStatusAllowlist: Record<HouseholdShoppingScale, HouseholdStockStatus[]> = {
  business_as_usual: ["below_limit", "at_limit"],
  keep_it_chill: ["below_limit", "at_limit", "low_soon"],
  start_fresh: [],
  stock_em_up: ["below_limit", "at_limit", "low_soon", "steady"]
};

const stockStatusPriority: Record<HouseholdStockStatus, number> = {
  below_limit: 0,
  at_limit: 1,
  low_soon: 2,
  steady: 3
};

export interface GenerateHouseholdShoppingListPreviewInput {
  household: Pick<HouseholdRecord, "defaultCalculatedMaxLimitMultiplier" | "id">;
  scale: HouseholdShoppingScale;
  stockItems: readonly HouseholdStockItemListItem[];
}

export function generateHouseholdShoppingListPreview(
  input: GenerateHouseholdShoppingListPreviewInput
): HouseholdShoppingListPreviewResponse {
  const multiplier =
    input.household.defaultCalculatedMaxLimitMultiplier ?? defaultCalculatedMaxLimitMultiplier;
  const items = input.stockItems
    .filter((item) => shoppingScaleStatusAllowlist[input.scale].includes(item.stockStatus))
    .map((item) => toPreviewItem(item, multiplier))
    .sort(comparePreviewItems);

  return {
    householdId: input.household.id,
    itemCount: items.length,
    items,
    scale: input.scale
  };
}

export function calculateHouseholdShoppingTargetAmount(input: {
  defaultCalculatedMaxLimitMultiplier?: number | null;
  idealMaxLimit?: number | null;
  minLimit: number;
}): number {
  if (input.idealMaxLimit !== undefined && input.idealMaxLimit !== null) {
    return input.idealMaxLimit;
  }

  return (
    input.minLimit *
    (input.defaultCalculatedMaxLimitMultiplier ?? defaultCalculatedMaxLimitMultiplier)
  );
}

function toPreviewItem(
  item: HouseholdStockItemListItem,
  defaultMultiplier: number
): HouseholdShoppingListPreviewItem {
  const targetAmount = calculateHouseholdShoppingTargetAmount({
    defaultCalculatedMaxLimitMultiplier: defaultMultiplier,
    idealMaxLimit: item.idealMaxLimit ?? null,
    minLimit: item.minLimit
  });

  return {
    catalogProductId: item.catalogProductId ?? null,
    catalogProductNameSnapshot: item.catalogProductNameSnapshot ?? null,
    currentAmount: item.currentAmount,
    displayName: item.displayName,
    gtin: item.gtin ?? null,
    householdProductId: item.householdProductId,
    householdStockItemId: item.id,
    idealMaxLimit: item.idealMaxLimit ?? null,
    productSourceId: item.productSourceId ?? null,
    reasonCode: toReasonCode(item.stockStatus),
    sourceName: item.sourceName ?? null,
    sourceProductUrl: item.sourceProductUrl ?? null,
    stockGroupKey: item.stockGroupKey,
    stockStatus: item.stockStatus,
    suggestedBuyAmount: Math.max(0, targetAmount - item.currentAmount),
    targetAmount,
    uncertaintyFlags: [
      ...(item.catalogProductId ? [] : ["missing_catalog_product" as const]),
      ...(item.productSourceId ? [] : ["missing_product_source" as const])
    ],
    unit: item.unit
  };
}

function toReasonCode(stockStatus: HouseholdStockStatus): HouseholdShoppingListReasonCode {
  switch (stockStatus) {
    case "below_limit":
      return "below_minimum";
    case "at_limit":
      return "at_minimum";
    case "low_soon":
      return "low_soon";
    case "steady":
      return "broad_restock";
  }
}

function comparePreviewItems(
  left: HouseholdShoppingListPreviewItem,
  right: HouseholdShoppingListPreviewItem
): number {
  const priorityDifference =
    stockStatusPriority[left.stockStatus] - stockStatusPriority[right.stockStatus];
  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  return left.displayName.localeCompare(right.displayName, "hu-HU");
}
