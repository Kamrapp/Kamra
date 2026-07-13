import { describe, expect, it } from "vitest";
import {
  createAdHocShoppingNeed,
  generateProductGroupShoppingNeeds,
  generateShoppingNeed,
  generateTargetPolicyShoppingNeed,
  transitionShoppingNeed
} from "./shopping-needs.js";
import type { StockTarget } from "./contracts.js";
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
      distributionMode: "even",
      mode: "add_products_only",
      needIdPrefix: "even",
      workspace
    });

    expect(needs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ownerId: "milk-a", plannedQuantity: 1.5 }),
        expect.objectContaining({ ownerId: "milk-b", plannedQuantity: 2.5 })
      ])
    );
  });

  it("distributes extra Group quantity proportionally to current Product amounts", () => {
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
      distributionMode: "proportional",
      mode: "add_products_only",
      needIdPrefix: "proportional",
      workspace
    });

    expect(needs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ownerId: "milk-a", plannedQuantity: 1.25 }),
        expect.objectContaining({ ownerId: "milk-b", plannedQuantity: 1.75 })
      ])
    );
  });

  it("selects the earliest-expiring stocked Product when no Product target is already planned", () => {
    const workspace = createWorkspace({
      groupCurrent: 0,
      groupMinimum: 1,
      groupDesired: 2,
      products: [
        { current: 0, displayName: "Milk later", id: "later", nextExpiryOn: "2026-07-20" },
        { current: 0, displayName: "Milk sooner", id: "sooner", nextExpiryOn: "2026-07-13" }
      ],
      stockedProductId: "sooner"
    });

    const needs = generateProductGroupShoppingNeeds({
      mode: "add_products_only",
      needIdPrefix: "list",
      workspace
    });

    expect(needs).toHaveLength(1);
    expect(needs[0]).toMatchObject({ ownerId: "sooner", plannedQuantity: 2 });
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
  it("honors manually selected Product and Group owners even when they are not below a target", () => {
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

    expect(needs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ownerId: "milk", plannedQuantity: 1 }),
        expect.objectContaining({ ownerId: "group:milk", ownerKind: "product_group" })
      ])
    );
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
  products: Array<{
    current: number;
    displayName: string;
    id: string;
    nextExpiryOn: string | null;
    target?: { desired: number; minimum: number };
  }>;
  stockedProductId?: string;
}): ProductGroupWorkspaceReadModel {
  const products = input.products.map((product) => ({
    aggregate: {
      availableQuantity: product.current,
      batchCount: product.id === input.stockedProductId ? 1 : 0,
      nextExpiryOn: product.nextExpiryOn,
      state: "not_tracked" as const,
      trackingUnit: "l" as const
    },
    batches: [],
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
  }));
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
          trackingUnit: "l"
        },
        products
      }
    ],
    unassignedBatches: [],
    unassignedProducts: []
  } as unknown as ProductGroupWorkspaceReadModel;
}
