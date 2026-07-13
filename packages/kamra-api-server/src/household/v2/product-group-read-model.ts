import type {
  HouseholdProduct,
  ProductGroup,
  StockBatch,
  TargetPolicy,
  TrackingUnit
} from "./contracts.js";
import { areUnitsCompatible, convertQuantity } from "./domain.js";

export type ProductGroupStockState =
  "below_minimum" | "at_target" | "between_minimum_and_target" | "not_tracked";

export interface ProductStockAggregate {
  availableQuantity: number;
  batchCount: number;
  nextExpiryOn: string | null;
  state: ProductGroupStockState;
  trackingUnit: TrackingUnit | null;
}

export interface ProductGroupNode {
  aggregate: ProductStockAggregate;
  childGroups: ProductGroupNode[];
  group: ProductGroup;
  products: Array<{
    aggregate: ProductStockAggregate;
    batches: StockBatch[];
    product: HouseholdProduct;
  }>;
}

export interface ProductGroupWorkspaceReadModel {
  allowExpiredItems: boolean;
  defaultCalculatedMaxLimitMultiplier: number;
  productGroups: ProductGroupNode[];
  unassignedBatches: StockBatch[];
  unassignedProducts: Array<{
    aggregate: ProductStockAggregate;
    batches: StockBatch[];
    product: HouseholdProduct;
  }>;
}

export function buildProductGroupWorkspace(input: {
  allowExpiredItems: boolean;
  defaultCalculatedMaxLimitMultiplier?: number | null;
  batches: StockBatch[];
  groups: ProductGroup[];
  products: HouseholdProduct[];
  today: string;
}): ProductGroupWorkspaceReadModel {
  const batchesByProduct = new Map<string, StockBatch[]>();
  const unassignedBatches = input.batches.filter((batch) => !batch.householdProductId);
  for (const batch of input.batches) {
    if (!batch.householdProductId) continue;
    const batches = batchesByProduct.get(batch.householdProductId) ?? [];
    batches.push(batch);
    batchesByProduct.set(batch.householdProductId, batches);
  }
  const productRows = new Map(
    input.products.map((product) => {
      const batches = orderBatchesForWorkspace(batchesByProduct.get(product.id) ?? [], input.today);
      return [
        product.id,
        {
          aggregate: summarizeProduct(
            product.targetPolicy ?? null,
            product.defaultTrackingUnit,
            batches,
            input.allowExpiredItems,
            input.today
          ),
          batches,
          product
        }
      ];
    })
  );
  const childrenByParent = new Map<string | null, ProductGroup[]>();
  for (const group of input.groups) {
    const children = childrenByParent.get(group.parentProductGroupId ?? null) ?? [];
    children.push(group);
    childrenByParent.set(group.parentProductGroupId ?? null, children);
  }
  const buildNode = (group: ProductGroup): ProductGroupNode => {
    const products = input.products
      .filter((product) => product.productGroupId === group.id)
      .map((product) => productRows.get(product.id)!);
    const childGroups = (childrenByParent.get(group.id) ?? []).sort(compareGroups).map(buildNode);
    const groupProducts = [...products, ...childGroups.flatMap((child) => child.products)];
    const aggregate = summarizeGroup(
      group,
      groupProducts.map((row) => row.aggregate),
      input.today
    );
    return { aggregate, childGroups, group, products: groupProducts };
  };
  const productGroups = (childrenByParent.get(null) ?? []).sort(compareGroups).map(buildNode);
  const assigned = new Set(
    input.products.filter((product) => product.productGroupId).map((product) => product.id)
  );
  return {
    allowExpiredItems: input.allowExpiredItems,
    defaultCalculatedMaxLimitMultiplier: input.defaultCalculatedMaxLimitMultiplier ?? 2,
    productGroups,
    unassignedBatches,
    unassignedProducts: input.products
      .filter((product) => !assigned.has(product.id))
      .map((product) => productRows.get(product.id)!)
  };
}

function orderBatchesForWorkspace(batches: readonly StockBatch[], today: string): StockBatch[] {
  return [...batches].sort((left, right) => {
    const leftExpired = Boolean(left.expiryOn && left.expiryOn < today);
    const rightExpired = Boolean(right.expiryOn && right.expiryOn < today);
    if (leftExpired !== rightExpired) return leftExpired ? -1 : 1;
    return (
      (left.expiryOn ?? "9999-12-31").localeCompare(right.expiryOn ?? "9999-12-31") ||
      left.acquiredOn.localeCompare(right.acquiredOn) ||
      left.id.localeCompare(right.id)
    );
  });
}

function summarizeProduct(
  policy: TargetPolicy | null,
  defaultTrackingUnit: TrackingUnit | null | undefined,
  batches: readonly StockBatch[],
  allowExpiredItems: boolean,
  today: string
): ProductStockAggregate {
  const activeBatches = batches.filter((batch) => batch.status === "available");
  const available = activeBatches.filter(
    (batch) =>
      (allowExpiredItems || !batch.expiryOn || batch.expiryOn >= today)
  );
  const trackingUnit = policy?.trackingUnit ?? defaultTrackingUnit ?? available[0]?.unit ?? null;
  const quantity = trackingUnit
    ? available.reduce(
        (total, batch) =>
          total +
          (areUnitsCompatible(batch.unit, trackingUnit)
            ? convertQuantity(batch.remainingQuantity, batch.unit, trackingUnit)
            : 0),
        0
      )
    : 0;
  return summarizeQuantity(
    policy,
    available,
    quantity,
    today,
    activeBatches.length,
    nextExpiry(available, today),
    trackingUnit
  );
}

function summarizeGroup(
  group: ProductGroup,
  products: readonly ProductStockAggregate[],
  today: string
): ProductStockAggregate {
  const quantity = products.reduce(
    (total, product) =>
      total +
      (product.trackingUnit && areUnitsCompatible(product.trackingUnit, group.trackingUnit)
        ? convertQuantity(product.availableQuantity, product.trackingUnit, group.trackingUnit)
        : 0),
    0
  );
  const batches = products.reduce((total, product) => total + product.batchCount, 0);
  const nextExpiryOn =
    products
      .map((product) => product.nextExpiryOn)
      .filter((expiry): expiry is string => Boolean(expiry))
      .sort()[0] ?? null;
  const policy = group.targetPolicy ?? null;
  if (!policy)
    return {
      availableQuantity: quantity,
      batchCount: batches,
      nextExpiryOn,
      state: "not_tracked",
      trackingUnit: group.trackingUnit
    };
  return summarizeQuantity(policy, [], quantity, today, batches, nextExpiryOn, group.trackingUnit);
}

function summarizeQuantity(
  policy: TargetPolicy | null,
  batches: readonly StockBatch[],
  rawQuantity: number,
  today: string,
  batchCount = batches.length,
  nextExpiryOn = nextExpiry(batches, today),
  trackingUnit: TrackingUnit | null = policy?.trackingUnit ?? null
): ProductStockAggregate {
  if (!policy)
    return {
      availableQuantity: rawQuantity,
      batchCount,
      nextExpiryOn,
      state: "not_tracked",
      trackingUnit
    };
  const quantity = batches.length > 0 ? rawQuantity : rawQuantity;
  const state: ProductGroupStockState =
    quantity < policy.minimumQuantity
      ? "below_minimum"
      : quantity >= policy.desiredQuantity
        ? "at_target"
        : "between_minimum_and_target";
  return {
    availableQuantity: quantity,
    batchCount,
    nextExpiryOn,
    state,
    trackingUnit: policy.trackingUnit
  };
}

function nextExpiry(batches: readonly StockBatch[], today: string): string | null {
  return (
    batches
      .map((batch) => batch.expiryOn)
      .filter((expiry): expiry is string => typeof expiry === "string" && expiry >= today)
      .sort()[0] ?? null
  );
}

function compareGroups(a: ProductGroup, b: ProductGroup): number {
  return a.displayName.localeCompare(b.displayName) || a.id.localeCompare(b.id);
}

export function isProductUnitCompatible(
  productUnit: TrackingUnit | null | undefined,
  groupUnit: TrackingUnit
): boolean {
  return !productUnit || areUnitsCompatible(productUnit, groupUnit);
}
