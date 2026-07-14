import type { ShoppingNeed, ShoppingNeedList } from "./contracts.js";
import { limitShoppingMatches, matchShoppingNeed } from "./shopping-matcher.js";
import type {
  PriceObservationCandidate,
  ShopProductCandidate,
  ShoppingTripItem,
  ShoppingTripMatchOption
} from "./stage9-contracts.js";

export function buildShoppingTripItems(input: {
  currencyCode: string;
  needs: ShoppingNeedList;
  plannedDate: string;
  priceObservationsByShopProductId: ReadonlyMap<string, readonly PriceObservationCandidate[]>;
  shopProducts: readonly ShopProductCandidate[];
}): ShoppingTripItem[] {
  return input.needs.items
    .filter((need) => need.state === "open")
    .map((need) => buildShoppingTripItem({ ...input, need }));
}

function buildShoppingTripItem(input: {
  currencyCode: string;
  need: ShoppingNeed;
  plannedDate: string;
  priceObservationsByShopProductId: ReadonlyMap<string, readonly PriceObservationCandidate[]>;
  shopProducts: readonly ShopProductCandidate[];
}): ShoppingTripItem {
  const matches = matchShoppingNeed({
    candidates: input.shopProducts.map((shopProduct) => ({
      priceObservations: [...(input.priceObservationsByShopProductId.get(shopProduct.id) ?? [])],
      shopProduct
    })),
    currencyCode: input.currencyCode,
    preferredProductId: input.need.preferredProductId,
    requiredQuantity: input.need.plannedQuantity,
    requiredUnit: input.need.unit,
    shoppingDate: input.plannedDate
  });
  const match = matches[0];
  const limitedMatches = limitShoppingMatches(matches);
  const matchOptions: ShoppingTripMatchOption[] = limitedMatches.matches.map((candidate) => ({
    displayName:
      input.shopProducts.find((product) => product.id === candidate.shopProductId)?.displayName ??
      candidate.shopProductId,
    expectedPackageCount: candidate.packageCount,
    expectedTotal: candidate.expectedTotal,
    priceState: candidate.applicablePrice.state,
    selectedPriceObservationId: candidate.applicablePrice.observationId,
    shopProductId: candidate.shopProductId
  }));

  return {
    displayNameSnapshot: input.need.ownerDisplayNameSnapshot ?? "Shopping need",
    expectedPackageCount: match?.packageCount ?? null,
    expectedTotal: match?.expectedTotal ?? null,
    id: `shopping-trip-item:${input.need.id}`,
    matchExplanation: match?.explanation ?? "No compatible Shop Product found",
    matchOptions,
    matchOptionsTruncated: limitedMatches.truncated,
    needId: input.need.id,
    planStatus: match ? "selected" : "unresolved",
    priceState: match?.applicablePrice.state ?? "no_price",
    requiredQuantity: input.need.plannedQuantity,
    requiredUnit: input.need.unit,
    resultStatus: "pending",
    selectedPriceObservationId: match?.applicablePrice.observationId ?? null,
    selectedProductId: match?.productId ?? null,
    selectedShopProductId: match?.shopProductId ?? null
  };
}
