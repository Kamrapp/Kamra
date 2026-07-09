import { describe, expect, it } from "vitest";

import {
  assertCreateHouseholdStockItemRequest,
  assertDeleteHouseholdStockItemRequest,
  assertHouseholdCreateRequest,
  assertHouseholdLocalProductRecord,
  assertHouseholdMembershipRecord,
  assertHouseholdRecord,
  assertHouseholdStockItemRecord,
  assertHouseholdStockPageRequest,
  assertUpdateHouseholdStockItemRequest
} from "./validation.js";

describe("Household v1 validation", () => {
  it("accepts valid household records and requests", () => {
    expect(() =>
      assertHouseholdRecord({
        createdAt: "2026-07-09T10:00:00.000Z",
        createdByUserId: "userA",
        id: "household_1",
        name: "Minta háztartás",
        status: "active",
        updatedAt: "2026-07-09T10:00:00.000Z"
      })
    ).not.toThrow();

    expect(() =>
      assertHouseholdMembershipRecord({
        createdAt: "2026-07-09T10:00:00.000Z",
        householdId: "household_1",
        id: "membership_1",
        role: "owner",
        status: "active",
        updatedAt: "2026-07-09T10:00:00.000Z",
        userId: "userA"
      })
    ).not.toThrow();

    expect(() =>
      assertHouseholdLocalProductRecord({
        catalogProductId: null,
        catalogProductNameSnapshot: "Liszt",
        createdAt: "2026-07-09T10:00:00.000Z",
        createdByUserId: "userA",
        displayName: "Liszt",
        householdId: "household_1",
        id: "product_1",
        stockGroupKey: "liszt",
        status: "active",
        updatedAt: "2026-07-09T10:00:00.000Z",
        updatedByUserId: "userA"
      })
    ).not.toThrow();

    expect(() =>
      assertHouseholdStockItemRecord({
        catalogProductId: null,
        catalogProductNameSnapshot: "Kenyér",
        createdAt: "2026-07-09T10:00:00.000Z",
        createdByUserId: "userA",
        currentAmount: 0.2,
        displayName: "Kenyér",
        householdId: "household_1",
        householdProductId: "product_1",
        id: "stock_1",
        initialAmount: 1,
        minLimit: 0.5,
        note: null,
        stockedAt: "2026-07-07T10:00:00.000Z",
        stockGroupKey: "kenyer",
        status: "active",
        unit: "kg",
        updatedAt: "2026-07-09T10:00:00.000Z",
        updatedByUserId: "userA"
      })
    ).not.toThrow();

    expect(() =>
      assertHouseholdCreateRequest({
        name: "Új háztartás"
      })
    ).not.toThrow();

    expect(() =>
      assertHouseholdStockPageRequest({
        householdId: "household_1"
      })
    ).not.toThrow();

    expect(() =>
      assertCreateHouseholdStockItemRequest({
        catalogProductId: null,
        catalogProductNameSnapshot: null,
        currentAmount: 0,
        displayName: "Liszt",
        householdId: "household_1",
        householdProductId: null,
        initialAmount: 0,
        minLimit: 1,
        note: null,
        stockedAt: "2026-07-09T10:00:00.000Z",
        stockGroupKey: "liszt",
        unit: "kg"
      })
    ).not.toThrow();

    expect(() =>
      assertUpdateHouseholdStockItemRequest({
        currentAmount: 1.8,
        householdId: "household_1",
        id: "stock_1",
        minLimit: 2,
        unit: "l"
      })
    ).not.toThrow();

    expect(() =>
      assertDeleteHouseholdStockItemRequest({
        householdId: "household_1",
        id: "stock_1"
      })
    ).not.toThrow();
  });

  it("rejects invalid household records and requests", () => {
    expect(() =>
      assertHouseholdRecord({
        createdAt: "2026-07-09T10:00:00.000Z",
        createdByUserId: "userA",
        id: "household_1",
        name: "Minta háztartás",
        status: "pending",
        updatedAt: "2026-07-09T10:00:00.000Z"
      })
    ).toThrow();

    expect(() =>
      assertHouseholdMembershipRecord({
        createdAt: "2026-07-09T10:00:00.000Z",
        householdId: "household_1",
        id: "membership_1",
        role: "admin",
        status: "active",
        updatedAt: "2026-07-09T10:00:00.000Z",
        userId: "userA"
      })
    ).toThrow();

    expect(() =>
      assertHouseholdLocalProductRecord({
        createdAt: "2026-07-09T10:00:00.000Z",
        createdByUserId: "userA",
        displayName: " ",
        householdId: "household_1",
        id: "product_1",
        stockGroupKey: "liszt",
        status: "archived",
        updatedAt: "2026-07-09T10:00:00.000Z",
        updatedByUserId: "userA"
      })
    ).toThrow();

    expect(() =>
      assertHouseholdStockItemRecord({
        createdAt: "2026-07-09T10:00:00.000Z",
        createdByUserId: "userA",
        currentAmount: -1,
        displayName: "Kenyér",
        householdId: "household_1",
        householdProductId: "product_1",
        id: "stock_1",
        initialAmount: 1,
        minLimit: 0.5,
        stockedAt: "2026-07-07T10:00:00.000Z",
        stockGroupKey: "kenyer",
        status: "active",
        unit: "",
        updatedAt: "2026-07-09T10:00:00.000Z",
        updatedByUserId: "userA"
      })
    ).toThrow();

    expect(() =>
      assertHouseholdCreateRequest({
        name: " "
      })
    ).toThrow();

    expect(() =>
      assertCreateHouseholdStockItemRequest({
        currentAmount: 1,
        displayName: "Kenyér",
        householdId: "household_1",
        minLimit: 1,
        stockedAt: "2026-07-09T10:00:00.000Z",
        stockGroupKey: "kenyer",
        unit: "kg"
      })
    ).not.toThrow();

    expect(() =>
      assertCreateHouseholdStockItemRequest({
        currentAmount: 1,
        displayName: "Kenyér",
        householdId: "household_1",
        initialAmount: null,
        minLimit: 1,
        stockedAt: "2026-07-09T10:00:00.000Z",
        stockGroupKey: "kenyer",
        unit: "kg"
      })
    ).toThrow();

    expect(() =>
      assertCreateHouseholdStockItemRequest({
        currentAmount: 1,
        displayName: "Kenyér",
        householdId: "household_1",
        minLimit: 1,
        note: null,
        stockedAt: "2026-07-09T10:00:00.000Z",
        stockGroupKey: "kenyer",
        unit: "kg"
      })
    ).not.toThrow();

    expect(() =>
      assertUpdateHouseholdStockItemRequest({
        householdId: "household_1",
        id: "stock_1"
      })
    ).toThrow();

    expect(() =>
      assertDeleteHouseholdStockItemRequest({
        householdId: "",
        id: "stock_1"
      })
    ).toThrow();
  });
});
