import { describe, expect, it } from "vitest";
import {
  createAdHocShoppingNeed,
  generateProductGroupShoppingNeeds,
  generateShoppingNeed,
  generateTargetPolicyShoppingNeed,
  transitionShoppingNeed
} from "./shopping-needs.js";
import type { StockTarget } from "./contracts.js";
import type { StockBatch } from "./contracts.js";
import type { StockTargetAggregate } from "./domain.js";
import type { ProductGroupWorkspaceReadModel } from "./product-group-read-model.js";

const target: StockTarget = {
  acceptanceCriteria: {
    acceptedAttributesAny: [],
    acceptedConceptsAny: [],
    excludedAttributesAny: [],
    requiredAttributesAll: [],
    requiredConceptsAll: []
  },
  consumptionPolicy: "earliest_expiry_first",
  createdAt: "2026-07-11T00:00:00.000Z",
  createdByUserId: "u",
  displayName: "Milk",
  expiryWarningDays: 3,
  householdId: "h",
  id: "target",
  minimumQuantity: 2,
  preferredProductId: "product",
  preferredProductNameSnapshot: "Milk 1 l",
  revision: 0,
  status: "active",
  targetQuantity: 4,
  trackingUnit: "l",
  updatedAt: "2026-07-11T00:00:00.000Z",
  updatedByUserId: "u"
};
const aggregate: StockTargetAggregate = {
  availableQuantity: 1,
  batchCount: 1,
  expiringBatchCount: 0,
  nextExpiryOn: null,
  noticeCodes: ["below_minimum"],
  status: "below_minimum"
};

describe("shopping needs", () => {
  it("creates a shortage snapshot without selecting a shop or product", () => {
    expect(generateShoppingNeed(target, aggregate, "need-1")).toMatchObject({
      plannedQuantity: 3,
      reasonCode: "below_minimum",
      stockTargetId: "target",
      state: "open",
      unit: "l"
    });
    expect(
      generateShoppingNeed(
        target,
        {
          ...aggregate,
          availableQuantity: 2,
          status: "between_minimum_and_target",
          noticeCodes: []
        },
        "need-2"
      )
    ).toBeNull();
  });
  it("supports ad-hoc and revision-checked skip/restore transitions", () => {
    const need = createAdHocShoppingNeed({ id: "manual", plannedQuantity: 2, unit: "count" });
    const skipped = transitionShoppingNeed(need, "skipped", 0);
    expect(skipped).toMatchObject({ revision: 1, state: "skipped" });
    expect(transitionShoppingNeed(skipped, "open", 1).state).toBe("open");
    expect(() => transitionShoppingNeed(skipped, "open", 0)).toThrow("stale_revision");
  });
  it("generates a Product Group-owned need from its target policy", () => {
    const need = generateTargetPolicyShoppingNeed({
      aggregate: {
        availableQuantity: 1,
        batchCount: 1,
        nextExpiryOn: null,
        state: "below_minimum",
        trackingUnit: "l"
      },
      displayName: "Milk",
      id: "group:milk",
      needId: "need:milk",
      ownerKind: "product_group",
      policy: {
        consumptionPolicy: "earliest_expiry_first",
        desiredQuantity: 3,
        expiryWarningDays: 0,
        minimumQuantity: 2,
        trackingUnit: "l"
      }
    });
    expect(need).toMatchObject({
      ownerId: "group:milk",
      ownerKind: "product_group",
      plannedQuantity: 2,
      unit: "l"
    });
  });

  it("uses product shortages first and splits remaining Group shortage across planned Products", () => {
    const workspace = createWorkspace({
      groupCurrent: 1,
      groupMinimum: 3,
      groupDesired: 5,
      products: [
        {
          current: 0,
          displayName: "Milk A",
          id: "milk-a",
          nextExpiryOn: "2026-07-13",
          target: { desired: 1, minimum: 1 }
        },
        {
          current: 1,
          displayName: "Milk B",
          id: "milk-b",
          nextExpiryOn: "2026-07-20",
          target: { desired: 2, minimum: 2 }
        }
      ]
    });

    const needs = generateProductGroupShoppingNeeds({
      mode: "add_products_and_group_item",
      needIdPrefix: "list",
      workspace
    });

    expect(needs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ownerId: "milk-a", plannedQuantity: 2 }),
        expect.objectContaining({ ownerId: "milk-b", plannedQuantity: 2 })
      ])
    );
    expect(needs.some((need) => need.ownerKind === "product_group")).toBe(false);
  });

  it("distributes extra Group quantity evenly with a deterministic remainder", () => {
    const workspace = createWorkspace({
      groupCurrent: 0,
      groupMinimum: 3,
      groupDesired: 4,
      products: [
        {
          current: 0,
          displayName: "Milk A",
          id: "milk-a",
          nextExpiryOn: null,
          target: { desired: 1, minimum: 1 }
        },
        {
          current: 0,
          displayName: "Milk B",
          id: "milk-b",
          nextExpiryOn: null,
          target: { desired: 2, minimum: 2 }
        }
      ]
    });

    const needs = generateProductGroupShoppingNeeds({
      distributionMode: "split_evenly",
      mode: "add_products_only",
      needIdPrefix: "split",
      workspace
    });

    expect(needs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ownerId: "milk-a", plannedQuantity: 1.5 }),
        expect.objectContaining({ ownerId: "milk-b", plannedQuantity: 2.5 })
      ])
    );
  });

  it("rounds evenly distributed quantities to one decimal beyond an integer target", () => {
    const workspace = createWorkspace({
      groupCurrent: 0,
      groupMinimum: 1,
      groupDesired: 4,
      products: [
        { current: 0, displayName: "Milk A", id: "milk-a", nextExpiryOn: null },
        { current: 0, displayName: "Milk B", id: "milk-b", nextExpiryOn: null },
        { current: 0, displayName: "Milk C", id: "milk-c", nextExpiryOn: null }
      ]
    });

    const needs = generateProductGroupShoppingNeeds({
      distributionMode: "split_evenly",
      mode: "add_products_only",
      needIdPrefix: "rounded",
      workspace
    });

    expect(needs.map((need) => need.plannedQuantity)).toEqual([1.4, 1.3, 1.3]);
    expect(needs.reduce((total, need) => total + need.plannedQuantity, 0)).toBe(4);
  });

  it("uses one extra decimal beyond a fractional target while preserving the total", () => {
    const workspace = createWorkspace({
      groupCurrent: 0.1,
      groupMinimum: 1,
      groupDesired: 4.2,
      products: [
        { current: 0.1, displayName: "Milk A", id: "milk-a", nextExpiryOn: null },
        { current: 0, displayName: "Milk B", id: "milk-b", nextExpiryOn: null },
        { current: 0, displayName: "Milk C", id: "milk-c", nextExpiryOn: null }
      ]
    });

    const needs = generateProductGroupShoppingNeeds({
      distributionMode: "split_evenly",
      mode: "add_products_only",
      needIdPrefix: "fractional-rounded",
      workspace
    });

    expect(needs.map((need) => need.plannedQuantity)).toEqual([1.38, 1.36, 1.36]);
    expect(needs.reduce((total, need) => total + need.plannedQuantity, 0)).toBeCloseTo(4.1);
  });

  it("splits remaining Group quantity evenly across all Products", () => {
    const workspace = createWorkspace({
      groupCurrent: 4,
      groupMinimum: 5,
      groupDesired: 7,
      products: [
        {
          current: 1,
          displayName: "Milk A",
          id: "milk-a",
          nextExpiryOn: null,
          target: { desired: 2, minimum: 2 }
        },
        {
          current: 3,
          displayName: "Milk B",
          id: "milk-b",
          nextExpiryOn: null,
          target: { desired: 4, minimum: 4 }
        }
      ]
    });

    const needs = generateProductGroupShoppingNeeds({
      distributionMode: "split_evenly",
      mode: "add_products_only",
      needIdPrefix: "split",
      workspace
    });

    expect(needs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ownerId: "milk-a", plannedQuantity: 1.5 }),
        expect.objectContaining({ ownerId: "milk-b", plannedQuantity: 1.5 })
      ])
    );
  });

  it("selects the oldest stocked Product when no Product target is already planned", () => {
    const workspace = createWorkspace({
      groupCurrent: 0,
      groupMinimum: 1,
      groupDesired: 2,
      products: [
        { current: 0, displayName: "Milk later", id: "later", nextExpiryOn: "2026-07-20" },
        { current: 0, displayName: "Milk sooner", id: "sooner", nextExpiryOn: "2026-07-13" }
      ],
      stockedProductId: "sooner",
      stockedProductDates: { sooner: "2026-07-13", later: "2026-07-20" }
    });

    const needs = generateProductGroupShoppingNeeds({
      distributionMode: "oldest",
      mode: "add_products_only",
      needIdPrefix: "list",
      workspace
    });

    expect(needs).toHaveLength(1);
    expect(needs[0]).toMatchObject({ ownerId: "sooner", plannedQuantity: 2 });
  });

  it("uses the latest available batch of each Product for the oldest strategy", () => {
    const workspace = createWorkspace({
      groupCurrent: 0,
      groupMinimum: 1,
      groupDesired: 2,
      products: [
        { current: 0, displayName: "Alma", id: "alma", nextExpiryOn: "2026-07-30" },
        { current: 0, displayName: "Kiwi", id: "kiwi", nextExpiryOn: "2026-07-30" }
      ],
      stockedProductDates: {
        alma: ["2026-06-01", "2026-07-20"],
        kiwi: "2026-07-10"
      }
    });

    const needs = generateProductGroupShoppingNeeds({
      distributionMode: "oldest",
      mode: "add_products_only",
      needIdPrefix: "latest-batch",
      workspace
    });

    expect(needs).toEqual([expect.objectContaining({ ownerId: "kiwi", plannedQuantity: 2 })]);
  });

  it("uses a Group impulse need only in the default mode when the Group has no Products", () => {
    const workspace = createWorkspace({
      groupCurrent: 0,
      groupMinimum: 1,
      groupDesired: 2,
      products: []
    });

    expect(
      generateProductGroupShoppingNeeds({
        mode: "add_products_and_group_item",
        needIdPrefix: "list",
        workspace
      })
    ).toEqual([expect.objectContaining({ ownerKind: "product_group", plannedQuantity: 2 })]);
    expect(
      generateProductGroupShoppingNeeds({
        mode: "add_products_only",
        needIdPrefix: "list",
        workspace
      })
    ).toEqual([]);
    expect(
      generateProductGroupShoppingNeeds({
        mode: "ignore_group_targets",
        needIdPrefix: "list",
        workspace
      })
    ).toEqual([]);
  });

  it.each(["split_evenly", "least_amount", "latest", "oldest", "dont_split"] as const)(
    "falls back to the Group need for an empty Group with a %s local distribution override",
    (distributionMode) => {
      const workspace = createWorkspace({
        groupCurrent: 0,
        groupMinimum: 1,
        groupDesired: 2,
        groupDistributionOverride: distributionMode,
        products: []
      });

      expect(
        generateProductGroupShoppingNeeds({
          mode: "add_products_and_group_item",
          needIdPrefix: `empty-${distributionMode}`,
          workspace
        })
      ).toEqual([
        expect.objectContaining({
          ownerId: "group:milk",
          ownerKind: "product_group",
          plannedQuantity: 2
        })
      ]);
    }
  );

  it("supports no-split and explicit Product selection strategies", () => {
    const workspace = createWorkspace({
      groupCurrent: 0,
      groupMinimum: 1,
      groupDesired: 4,
      products: [
        { current: 0, displayName: "Milk A", id: "milk-a", nextExpiryOn: null },
        { current: 2, displayName: "Milk B", id: "milk-b", nextExpiryOn: null }
      ]
    });

    expect(
      generateProductGroupShoppingNeeds({
        distributionMode: "dont_split",
        mode: "add_products_only",
        needIdPrefix: "no-split",
        workspace
      })
    ).toEqual([]);
    expect(
      generateProductGroupShoppingNeeds({
        distributionMode: "least_amount",
        mode: "add_products_only",
        needIdPrefix: "least",
        workspace
      })
    ).toEqual([expect.objectContaining({ ownerId: "milk-a", plannedQuantity: 4 })]);
  });

  it("uses the effective Group override for mode and stocked-at strategy", () => {
    const workspace = createWorkspace({
      groupCurrent: 0,
      groupMinimum: 1,
      groupDesired: 3,
      groupModeOverride: "ignore_group_targets",
      groupDistributionOverride: "latest",
      products: [
        { current: 0, displayName: "Milk A", id: "milk-a", nextExpiryOn: null },
        { current: 0, displayName: "Milk B", id: "milk-b", nextExpiryOn: null }
      ],
      stockedProductDates: { "milk-a": "2026-07-10", "milk-b": "2026-07-12" }
    });

    expect(
      generateProductGroupShoppingNeeds({
        distributionMode: "split_evenly",
        mode: "add_products_and_group_item",
        needIdPrefix: "override",
        workspace
      })
    ).toEqual([]);

    const localStrategyWorkspace = createWorkspace({
      groupCurrent: 0,
      groupMinimum: 1,
      groupDesired: 3,
      groupDistributionOverride: "latest",
      products: [
        { current: 0, displayName: "Milk A", id: "milk-a", nextExpiryOn: null },
        { current: 0, displayName: "Milk B", id: "milk-b", nextExpiryOn: null }
      ],
      stockedProductDates: { "milk-a": "2026-07-10", "milk-b": "2026-07-12" }
    });
    expect(
      generateProductGroupShoppingNeeds({
        distributionMode: "split_evenly",
        mode: "add_products_only",
        needIdPrefix: "latest",
        workspace: localStrategyWorkspace
      })
    ).toEqual([expect.objectContaining({ ownerId: "milk-b", plannedQuantity: 3 })]);
  });

  it("does not generate automatic needs when Product and Group Current are above Target", () => {
    const workspace = createWorkspace({
      groupCurrent: 5,
      groupMinimum: 1,
      groupDesired: 2,
      products: [
        {
          current: 5,
          displayName: "Milk",
          id: "milk",
          nextExpiryOn: null,
          target: { desired: 2, minimum: 1 }
        }
      ]
    });

    expect(
      generateProductGroupShoppingNeeds({
        mode: "add_products_and_group_item",
        needIdPrefix: "above-target",
        workspace
      })
    ).toEqual([]);
  });
  it("does not create a Group line beside a selected Product from that Group", () => {
    const workspace = createWorkspace({
      groupCurrent: 3,
      groupMinimum: 1,
      groupDesired: 2,
      products: [{ current: 3, displayName: "Milk", id: "milk", nextExpiryOn: null }]
    });

    const needs = generateProductGroupShoppingNeeds({
      mode: "add_products_and_group_item",
      needIdPrefix: "selected",
      selectedOwnerIds: new Set(["milk", "group:milk"]),
      workspace
    });

    expect(needs).toEqual([expect.objectContaining({ ownerId: "milk", plannedQuantity: 1 })]);
  });

  it("does not add a Group line beside Product lines produced by a selected Group split", () => {
    const workspace = createWorkspace({
      groupCurrent: 0,
      groupMinimum: 1,
      groupDesired: 4,
      products: [
        { current: 0, displayName: "Milk A", id: "milk-a", nextExpiryOn: null },
        { current: 0, displayName: "Milk B", id: "milk-b", nextExpiryOn: null },
        { current: 0, displayName: "Milk C", id: "milk-c", nextExpiryOn: null }
      ]
    });

    const needs = generateProductGroupShoppingNeeds({
      distributionMode: "split_evenly",
      mode: "add_products_and_group_item",
      needIdPrefix: "selected-group",
      selectedOwnerIds: new Set(["group:milk"]),
      workspace
    });

    expect(needs.every((need) => need.ownerKind === "household_product")).toBe(true);
    expect(needs.map((need) => need.plannedQuantity)).toEqual([1.4, 1.3, 1.3]);
  });

  it("does not add a Group line when the selected Group policy is Product-only", () => {
    const workspace = createWorkspace({
      groupCurrent: 0,
      groupMinimum: 1,
      groupDesired: 2,
      products: [{ current: 0, displayName: "Milk", id: "milk", nextExpiryOn: null }],
      groupModeOverride: "add_products_only"
    });

    const needs = generateProductGroupShoppingNeeds({
      mode: "add_products_and_group_item",
      needIdPrefix: "selected-product-only",
      selectedOwnerIds: new Set(["group:milk"]),
      workspace
    });

    expect(needs).toEqual([expect.objectContaining({ ownerId: "milk", plannedQuantity: 2 })]);
  });
  it("returns no generated rows when the explicit selection is empty", () => {
    const workspace = createWorkspace({
      groupCurrent: 0,
      groupMinimum: 1,
      groupDesired: 2,
      products: [{ current: 0, displayName: "Milk", id: "milk", nextExpiryOn: null }]
    });

    expect(
      generateProductGroupShoppingNeeds({
        mode: "add_products_and_group_item",
        needIdPrefix: "selected",
        selectedOwnerIds: new Set(),
        workspace
      })
    ).toEqual([]);
  });
});

function createWorkspace(input: {
  groupCurrent: number;
  groupDesired: number;
  groupMinimum: number;
  groupDistributionOverride?:
    "default" | "dont_split" | "split_evenly" | "least_amount" | "latest" | "oldest";
  groupModeOverride?:
    "default" | "add_products_and_group_item" | "add_products_only" | "ignore_group_targets";
  products: Array<{
    current: number;
    displayName: string;
    id: string;
    nextExpiryOn: string | null;
    target?: { desired: number; minimum: number };
  }>;
  stockedProductId?: string;
  stockedProductDates?: Record<string, string | readonly string[]>;
}): ProductGroupWorkspaceReadModel {
  const products = input.products.map((product) => {
    const configuredDates = input.stockedProductDates?.[product.id];
    const acquiredDates = configuredDates
      ? typeof configuredDates === "string"
        ? [configuredDates]
        : [...configuredDates]
      : product.id === input.stockedProductId
        ? ["2026-07-13"]
        : [];
    const batches = acquiredDates.map(
      (acquiredOn, index) =>
        ({
          acquiredOn,
          acquisitionSnapshot: { displayName: product.displayName },
          classificationSnapshot: {
            capturedAt: "2026-07-13T00:00:00.000Z",
            directAttributes: [],
            directConcepts: [],
            effectiveConcepts: [],
            source: "manual"
          },
          createdAt: "2026-07-13T00:00:00.000Z",
          createdByUserId: "test",
          expiryOn: product.nextExpiryOn,
          householdId: "h",
          householdProductId: product.id,
          id: `batch:${product.id}:${index}`,
          originalQuantity: product.current,
          remainingQuantity: product.current,
          revision: 0,
          status: "available",
          unit: "l",
          updatedAt: "2026-07-13T00:00:00.000Z",
          updatedByUserId: "test"
        }) satisfies StockBatch
    );
    return {
      aggregate: {
        availableQuantity: product.current,
        batchCount: batches.length,
        nextExpiryOn: product.nextExpiryOn,
        state: "not_tracked" as const,
        trackingUnit: "l" as const
      },
      batches,
      product: {
        displayName: product.displayName,
        id: product.id,
        targetPolicy: product.target
          ? {
              consumptionPolicy: "earliest_expiry_first",
              desiredQuantity: product.target.desired,
              expiryWarningDays: 0,
              minimumQuantity: product.target.minimum,
              trackingUnit: "l"
            }
          : null
      }
    };
  });
  return {
    allowExpiredItems: true,
    productGroups: [
      {
        aggregate: {
          availableQuantity: input.groupCurrent,
          batchCount: products.reduce((total, product) => total + product.aggregate.batchCount, 0),
          nextExpiryOn: null,
          state: "below_minimum",
          trackingUnit: "l"
        },
        childGroups: [],
        group: {
          displayName: "Milk",
          id: "group:milk",
          targetPolicy: {
            consumptionPolicy: "earliest_expiry_first",
            desiredQuantity: input.groupDesired,
            expiryWarningDays: 0,
            minimumQuantity: input.groupMinimum,
            trackingUnit: "l"
          },
          groupTargetShoppingDistributionModeOverride: input.groupDistributionOverride ?? "default",
          groupTargetShoppingModeOverride: input.groupModeOverride ?? "default",
          trackingUnit: "l"
        },
        products
      }
    ],
    unassignedBatches: [],
    unassignedProducts: []
  } as unknown as ProductGroupWorkspaceReadModel;
}
