import type {
  ShoppingTrip,
  ShoppingTripItem,
  ShoppingTripItemPlanStatus,
  ShoppingTripItemResultStatus,
  ShoppingTripStatus
} from "./stage9-contracts.js";

const terminalItem = (item: ShoppingTripItem): boolean =>
  item.planStatus === "skipped" || item.resultStatus !== "pending";

export function createShoppingTrip(input: {
  createdAt: string;
  createdByUserId: string;
  householdId: string;
  id: string;
  items: ShoppingTripItem[];
  plannedDate: string;
  sourceShoppingNeedListId: string;
  updatedAt: string;
  updatedByUserId: string;
}): ShoppingTrip {
  if (input.items.length === 0) throw new Error("shopping_trip_requires_item");
  return {
    ...input,
    revision: 0,
    shopMarketId: null,
    status: "draft",
    items: input.items.map((item) => ({ ...item, resultStatus: "pending" }))
  };
}

export function transitionShoppingTrip(trip: ShoppingTrip, next: ShoppingTripStatus): ShoppingTrip {
  if (trip.status === "cancelled" || trip.status === "completed")
    throw new Error("shopping_trip_is_terminal");
  const allowed: Record<ShoppingTripStatus, ShoppingTripStatus[]> = {
    draft: ["matching", "cancelled"],
    matching: ["draft", "ready", "cancelled"],
    ready: ["in_progress", "cancelled"],
    in_progress: ["partially_processed", "completed", "cancelled"],
    partially_processed: ["in_progress", "completed", "cancelled"],
    completed: [],
    cancelled: []
  };
  if (!allowed[trip.status].includes(next))
    throw new Error(`invalid_shopping_trip_transition:${trip.status}:${next}`);
  if (
    next === "ready" &&
    (!trip.shopMarketId || trip.items.some((item) => item.planStatus === "unresolved"))
  )
    throw new Error("shopping_trip_not_ready");
  if (next === "completed" && trip.items.some((item) => !terminalItem(item)))
    throw new Error("shopping_trip_items_incomplete");
  return { ...trip, status: next, revision: trip.revision + 1 };
}

export function setShoppingTripMarket(
  trip: ShoppingTrip,
  shopMarketId: string,
  plannedDate = trip.plannedDate
): ShoppingTrip {
  if (!["draft", "matching", "ready"].includes(trip.status))
    throw new Error("shopping_trip_market_locked");
  if (!shopMarketId.trim()) throw new Error("shop_market_required");
  return { ...trip, shopMarketId, plannedDate, revision: trip.revision + 1 };
}

export function updateShoppingTripItem(
  trip: ShoppingTrip,
  itemId: string,
  patch: {
    planStatus?: ShoppingTripItemPlanStatus;
    resultStatus?: ShoppingTripItemResultStatus;
    selectedPriceObservationId?: string | null;
    selectedProductId?: string | null;
    selectedShopProductId?: string | null;
    expectedPackageCount?: number | null;
    expectedTotal?: number | null;
    priceState?: ShoppingTripItem["priceState"];
    matchExplanation?: string | null;
    actualQuantity?: number | null;
    actualUnit?: ShoppingTripItem["actualUnit"];
    actualPaidPrice?: number | null;
    createdBatchIds?: string[];
    ingestionSubmissionId?: string | null;
  }
): ShoppingTrip {
  const editablePlan = ["draft", "matching", "ready"].includes(trip.status);
  const editableResult = ["in_progress", "partially_processed"].includes(trip.status);
  if (!editablePlan && !editableResult) throw new Error("shopping_trip_item_locked");
  const index = trip.items.findIndex((item) => item.id === itemId);
  if (index < 0) throw new Error("shopping_trip_item_not_found");
  const existing = trip.items[index];
  if (!existing) throw new Error("shopping_trip_item_not_found");
  if (patch.planStatus !== undefined && !editablePlan) throw new Error("shopping_trip_plan_locked");
  if (patch.resultStatus !== undefined && !editableResult)
    throw new Error("shopping_trip_result_locked");
  const items = [...trip.items];
  items[index] = { ...existing, ...patch };
  return { ...trip, items, revision: trip.revision + 1 };
}

export function nextProcessingStatus(trip: ShoppingTrip): ShoppingTripStatus {
  const processed = trip.items.filter(terminalItem).length;
  if (processed === 0) return "in_progress";
  return processed === trip.items.length ? "completed" : "partially_processed";
}
