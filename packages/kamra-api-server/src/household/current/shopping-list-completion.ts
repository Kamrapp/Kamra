import type { PriceObservationRecord } from "../../catalog/v1/contracts.js";
import type {
  HouseholdPurchasePriceObservationRecord,
  HouseholdShopRecord,
  HouseholdShoppingListLineRecord,
  HouseholdShoppingListRecord,
  HouseholdShoppingListStockUpdateResponse,
  HouseholdShoppingListUpdateScope,
  HouseholdStockPageResponse
} from "../v1/contracts.js";

export interface BuildShoppingListStockUpdateInput {
  allowAutoTickingAllShoppingListEntries: boolean;
  confirmationMode?: HouseholdShoppingListUpdateScope | null;
  householdId: string;
  shoppingList: HouseholdShoppingListRecord;
  shop: HouseholdShopRecord | null;
  stockAppliedAt: string;
  stockPage: HouseholdStockPageResponse;
}

export interface ShoppingListStockMutationPlan {
  catalogPriceObservations: PriceObservationRecord[];
  householdPurchasePriceObservations: HouseholdPurchasePriceObservationRecord[];
  stockCreates: Array<{
    currentAmount: number;
    displayName: string;
    householdId: string;
    householdProductId?: string | null;
    idealMaxLimit?: number | null;
    minLimit: number;
    productSourceId?: string | null;
    stockGroupKey: string;
    stockedAt: string;
    unit: string;
  }>;
  stockUpdates: Array<{
    currentAmount: number;
    householdId: string;
    id: string;
  }>;
  updatedShoppingList: HouseholdShoppingListRecord;
}

export function buildShoppingListStockUpdatePlan(
  input: BuildShoppingListStockUpdateInput
):
  | { kind: "confirmation_required"; response: HouseholdShoppingListStockUpdateResponse }
  | { kind: "ready"; plan: ShoppingListStockMutationPlan } {
  const pendingItems = input.shoppingList.items.filter((item) => item.status === "not_applied");
  const untickedPendingItems = pendingItems.filter((item) => !item.ticked);

  if (untickedPendingItems.length > 0 && !input.confirmationMode) {
    return {
      kind: "confirmation_required",
      response: {
        allowedConfirmationModes: input.allowAutoTickingAllShoppingListEntries
          ? ["tick_all_and_update", "update_ticked_only"]
          : ["update_ticked_only"],
        appliedLineCount: 0,
        confirmationRequired: true,
        shoppingList: input.shoppingList
      }
    };
  }

  if (input.confirmationMode === "tick_all_and_update" && !input.allowAutoTickingAllShoppingListEntries) {
    throw new Error("Tick-all stock updates are disabled.");
  }

  const itemsToApply = pendingItems.filter((item) =>
    input.confirmationMode === "tick_all_and_update"
      ? true
      : item.ticked
  );

  const stockById = new Map(input.stockPage.stockItems.map((item) => [item.id, item]));
  const stockByProductId = new Map(input.stockPage.stockItems.map((item) => [item.householdProductId, item]));

  const stockUpdates: ShoppingListStockMutationPlan["stockUpdates"] = [];
  const stockCreates: ShoppingListStockMutationPlan["stockCreates"] = [];
  const householdPurchasePriceObservations: HouseholdPurchasePriceObservationRecord[] = [];
  const catalogPriceObservations: PriceObservationRecord[] = [];

  const updatedShoppingList: HouseholdShoppingListRecord = {
    ...input.shoppingList,
    items: input.shoppingList.items.map((item) => {
      const appliedItem = itemsToApply.find((candidate) => candidate.id === item.id);
      if (!appliedItem) {
        return item;
      }

      const purchasedAmount = appliedItem.purchasedAmount;
      if (purchasedAmount > 0) {
        const existingStock = appliedItem.householdStockItemId
          ? stockById.get(appliedItem.householdStockItemId)
          : appliedItem.householdProductId
            ? stockByProductId.get(appliedItem.householdProductId)
            : undefined;

        if (existingStock) {
          stockUpdates.push({
            currentAmount: existingStock.currentAmount + purchasedAmount,
            householdId: existingStock.householdId,
            id: existingStock.id
          });
        } else {
          stockCreates.push({
            currentAmount: purchasedAmount,
            displayName: appliedItem.displayName,
            householdId: input.householdId,
            householdProductId: appliedItem.householdProductId ?? null,
            idealMaxLimit: appliedItem.idealMaxLimit ?? null,
            minLimit: appliedItem.minLimit ?? 0,
            productSourceId: appliedItem.productSourceId ?? null,
            stockGroupKey: appliedItem.stockGroupKey ?? stableSlug(appliedItem.displayName),
            stockedAt: input.stockAppliedAt,
            unit: appliedItem.unit
          });
        }
      }

      const observation = createPriceObservationArtifacts(
        appliedItem,
        input.householdId,
        input.shoppingList.id,
        input.shop
      );
      if (observation.householdPurchasePriceObservation) {
        householdPurchasePriceObservations.push(observation.householdPurchasePriceObservation);
      }
      if (observation.catalogPriceObservation) {
        catalogPriceObservations.push(observation.catalogPriceObservation);
      }

      return {
        ...item,
        status: "applied",
        ticked: input.confirmationMode === "tick_all_and_update" ? true : item.ticked
      };
    }),
    status: "completed",
    stockAppliedAt: input.stockAppliedAt
  };

  return {
    kind: "ready",
    plan: {
      catalogPriceObservations,
      householdPurchasePriceObservations,
      stockCreates,
      stockUpdates,
      updatedShoppingList
    }
  };
}

function createPriceObservationArtifacts(
  item: HouseholdShoppingListLineRecord,
  householdId: string,
  shoppingListId: string,
  shop: HouseholdShopRecord | null
): {
  catalogPriceObservation: PriceObservationRecord | null;
  householdPurchasePriceObservation: HouseholdPurchasePriceObservationRecord | null;
} {
  if (!item.observedPrice) {
    return {
      catalogPriceObservation: null,
      householdPurchasePriceObservation: null
    };
  }

  const householdPurchasePriceObservation: HouseholdPurchasePriceObservationRecord = {
    catalogProductId: item.catalogProductId ?? null,
    catalogProductNameSnapshot: item.catalogProductNameSnapshot ?? null,
    createdAt: item.observedPrice.observedAt,
    displayName: item.displayName,
    gtin: item.gtin ?? null,
    householdId,
    householdProductId: item.householdProductId ?? null,
    householdStockItemId: item.householdStockItemId ?? null,
    id: createHouseholdPurchaseObservationId(shoppingListId, item.id, item.observedPrice),
    observedAt: item.observedPrice.observedAt,
    price: item.observedPrice,
    productSourceId: item.productSourceId ?? null,
    shopId: shop?.id ?? null,
    shoppingListId,
    shoppingListLineId: item.id,
    sourceName: item.sourceName ?? null,
    sourceProductUrl: item.sourceProductUrl ?? null,
    stockGroupKey: item.stockGroupKey ?? null,
    unit: item.unit,
    updatedAt: item.observedPrice.observedAt
  };

  if (!item.catalogProductId || !item.productSourceId || !shop) {
    return {
      catalogPriceObservation: null,
      householdPurchasePriceObservation
    };
  }

  return {
    catalogPriceObservation: {
      createdAt: item.observedPrice.observedAt,
      id: createCatalogPriceObservationId(shoppingListId, item.id, item.observedPrice),
      location: {
        countryCode: shop.countryCode,
        kind: "global_shop_availability",
        label: shop.label,
        locationKey: `household-shop:${shop.id}`,
        storeBrandKey: shop.storeBrandKeys[0] ?? null
      },
      observedAt: item.observedPrice.observedAt,
      origin: {
        capturedAt: item.observedPrice.observedAt,
        kind: "manual",
        producer: "household_shopping_list",
        sourceName: item.sourceName ?? "household_shopping_list",
        sourceRecordId: shoppingListId,
        sourceUrl: item.sourceProductUrl ?? null
      },
      price: {
        amount: item.observedPrice.amount,
        currencyCode: item.observedPrice.currencyCode
      },
      priceKind: "base",
      productId: item.catalogProductId,
      productSourceId: item.productSourceId,
      sourceName: item.sourceName ?? "household_shopping_list",
      sourceProductKey: item.productSourceId,
      updatedAt: item.observedPrice.observedAt
    },
    householdPurchasePriceObservation: null
  };
}

function createCatalogPriceObservationId(
  shoppingListId: string,
  lineId: string,
  observedPrice: HouseholdShoppingListLineRecord["observedPrice"] & NonNullable<unknown>
): string {
  return `price_observation_household_${stableSlug(shoppingListId)}_${stableSlug(lineId)}_${stableSlug(
    observedPrice.observedAt
  )}_${stableSlug(String(observedPrice.amount))}`;
}

function createHouseholdPurchaseObservationId(
  shoppingListId: string,
  lineId: string,
  observedPrice: HouseholdShoppingListLineRecord["observedPrice"] & NonNullable<unknown>
): string {
  return `household_purchase_price_${stableSlug(shoppingListId)}_${stableSlug(lineId)}_${stableSlug(
    observedPrice.observedAt
  )}_${stableSlug(String(observedPrice.amount))}`;
}

function stableSlug(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

  return slug || "item";
}
