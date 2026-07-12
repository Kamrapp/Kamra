import { convertQuantity } from "./domain.js";
import type {
  ApplicablePrice,
  PriceObservationCandidate,
  ShopProductCandidate
} from "./stage9-contracts.js";

export interface ShoppingMatchCandidate {
  shopProduct: ShopProductCandidate;
  priceObservations: PriceObservationCandidate[];
}

export interface ShoppingMatch {
  shopProductId: string;
  productId: string;
  packageCount: number;
  expectedTotal: number | null;
  applicablePrice: ApplicablePrice;
  explanation: string;
}

export function selectApplicablePrice(input: {
  currencyCode: string;
  observations: readonly PriceObservationCandidate[];
  shoppingDate: string;
  staleAfterDays?: number;
}): ApplicablePrice {
  const active = input.observations.filter(
    (observation) =>
      observation.currencyCode === input.currencyCode && !observation.supersededByObservationId
  );
  if (active.length === 0)
    return { currencyCode: null, observationId: null, price: null, state: "no_price" };
  const valid = active.filter(
    (observation) =>
      (observation.validFrom === null ||
        observation.validFrom === undefined ||
        observation.validFrom <= input.shoppingDate) &&
      (observation.validTo === null ||
        observation.validTo === undefined ||
        observation.validTo >= input.shoppingDate)
  );
  const dated = [...valid].sort(
    (a, b) =>
      Number(b.kind === "offer") - Number(a.kind === "offer") ||
      b.observedAt.localeCompare(a.observedAt) ||
      a.id.localeCompare(b.id)
  );
  const selected = dated[0];
  if (!selected) {
    const future = active.some(
      (observation) => observation.validFrom && observation.validFrom > input.shoppingDate
    );
    return {
      currencyCode: input.currencyCode,
      observationId: null,
      price: null,
      state: future ? "future" : "expired"
    };
  }
  const staleAfterDays = input.staleAfterDays ?? 14;
  const ageDays = differenceInDays(selected.observedAt.slice(0, 10), input.shoppingDate);
  return {
    currencyCode: selected.currencyCode,
    observationId: selected.id,
    price: selected.price,
    state:
      selected.kind === "coupon" || selected.kind === "loyalty_card"
        ? "conditional_only"
        : ageDays > staleAfterDays
          ? "stale"
          : "applicable"
  };
}

export function matchShoppingNeed(input: {
  candidates: readonly ShoppingMatchCandidate[];
  currencyCode: string;
  preferredProductId?: string | null;
  requiredQuantity: number;
  requiredUnit: ShopProductCandidate["packageUnit"];
  shoppingDate: string;
}): ShoppingMatch[] {
  if (!Number.isFinite(input.requiredQuantity) || input.requiredQuantity <= 0)
    throw new Error("invalid_required_quantity");
  const matches: ShoppingMatch[] = [];
  for (const candidate of input.candidates) {
    if (candidate.shopProduct.status !== "active") continue;
    let packageCount: number;
    try {
      packageCount = Math.ceil(
        convertQuantity(
          input.requiredQuantity,
          input.requiredUnit,
          candidate.shopProduct.packageUnit
        ) / candidate.shopProduct.packageQuantity
      );
    } catch {
      continue;
    }
    const price = selectApplicablePrice({
      currencyCode: input.currencyCode,
      observations: candidate.priceObservations,
      shoppingDate: input.shoppingDate
    });
    const preferred = input.preferredProductId === candidate.shopProduct.productId;
    matches.push({
      shopProductId: candidate.shopProduct.id,
      productId: candidate.shopProduct.productId,
      packageCount,
      expectedTotal: price.price === null ? null : packageCount * price.price,
      applicablePrice: price,
      explanation: preferred ? "preferred household Product" : "compatible package candidate"
    });
  }
  return matches.sort(
    (a, b) =>
      Number(a.expectedTotal === null) - Number(b.expectedTotal === null) ||
      (a.expectedTotal ?? Number.POSITIVE_INFINITY) -
        (b.expectedTotal ?? Number.POSITIVE_INFINITY) ||
      a.packageCount - b.packageCount ||
      Number(b.explanation.startsWith("preferred")) -
        Number(a.explanation.startsWith("preferred")) ||
      a.shopProductId.localeCompare(b.shopProductId)
  );
}

function differenceInDays(from: string, to: string): number {
  const fromTime = Date.parse(`${from}T00:00:00Z`);
  const toTime = Date.parse(`${to}T00:00:00Z`);
  return Math.max(0, Math.floor((toTime - fromTime) / 86_400_000));
}
