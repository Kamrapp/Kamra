import { describe, expect, it } from "vitest";
import {
  addShoppingTripItem,
  createShoppingTrip,
  nextProcessingStatus,
  setShoppingTripCustomShop,
  setShoppingTripMarket,
  transitionShoppingTrip,
  updateShoppingTripItem
} from "./shopping-trip-domain.js";
import type { ShoppingTripItem } from "./stage9-contracts.js";

const item = (id: string): ShoppingTripItem => ({
  id,
  needId: `need-${id}`,
  displayNameSnapshot: id,
  requiredQuantity: 2,
  requiredUnit: "count",
  planStatus: "unresolved",
  resultStatus: "pending"
});

const draft = () =>
  createShoppingTrip({
    createdAt: "2026-07-12T00:00:00.000Z",
    createdByUserId: "user",
    householdId: "household",
    id: "trip",
    items: [item("one"), item("two")],
    plannedDate: "2026-07-12",
    sourceShoppingNeedListId: "needs",
    updatedAt: "2026-07-12T00:00:00.000Z",
    updatedByUserId: "user"
  });

describe("Stage 9 Shopping Trip state", () => {
  it("requires a market and resolved planning before ready", () => {
    let trip = draft();
    expect(() => transitionShoppingTrip(trip, "matching")).not.toThrow();
    trip = transitionShoppingTrip(trip, "matching");
    trip = setShoppingTripMarket(trip, "market:hu");
    expect(() => transitionShoppingTrip(trip, "ready")).toThrow("not_ready");
    trip = updateShoppingTripItem(trip, "one", { planStatus: "selected" });
    trip = updateShoppingTripItem(trip, "two", { planStatus: "skipped" });
    expect(transitionShoppingTrip(trip, "ready").status).toBe("ready");
  });
  it("accepts a custom shop snapshot as the trip location", () => {
    let trip = setShoppingTripCustomShop(draft(), "Saturday market");
    trip = updateShoppingTripItem(trip, "one", { planStatus: "selected" });
    trip = updateShoppingTripItem(trip, "two", { planStatus: "skipped" });
    trip = transitionShoppingTrip(trip, "matching");
    expect(transitionShoppingTrip(trip, "ready")).toMatchObject({
      shopMarketId: null,
      shopNameSnapshot: "Saturday market",
      status: "ready"
    });
  });

  it("supports partial processing and prevents impossible terminal edits", () => {
    let trip = setShoppingTripMarket(draft(), "market:hu");
    trip = updateShoppingTripItem(trip, "one", { planStatus: "selected" });
    trip = updateShoppingTripItem(trip, "two", { planStatus: "selected" });
    trip = transitionShoppingTrip(trip, "matching");
    trip = transitionShoppingTrip(trip, "ready");
    trip = transitionShoppingTrip(trip, "in_progress");
    trip = updateShoppingTripItem(trip, "one", { resultStatus: "bought", actualQuantity: 2 });
    expect(nextProcessingStatus(trip)).toBe("partially_processed");
    trip = transitionShoppingTrip(trip, "partially_processed");
    expect(() => updateShoppingTripItem(trip, "one", { planStatus: "skipped" })).toThrow(
      "plan_locked"
    );
    trip = updateShoppingTripItem(trip, "two", { resultStatus: "not_bought" });
    expect(() => transitionShoppingTrip(trip, "completed")).toThrow("items_incomplete");
    trip = updateShoppingTripItem(trip, "one", { createdBatchIds: ["batch:one"] });
    trip = updateShoppingTripItem(trip, "two", { createdBatchIds: [] });
    expect(transitionShoppingTrip(trip, "completed").status).toBe("completed");
  });

  it("rejects edits after cancellation", () => {
    const trip = transitionShoppingTrip(draft(), "cancelled");
    expect(() => setShoppingTripMarket(trip, "market:hu")).toThrow("locked");
  });

  it("keeps a user-selected purchase Product on the Trip Item", () => {
    const trip = updateShoppingTripItem(draft(), "one", {
      purchaseHouseholdProductId: "household-product:household:rye-bread"
    });
    expect(trip.items[0]?.purchaseHouseholdProductId).toBe("household-product:household:rye-bread");
  });

  it("adds an idempotent unplanned purchase while shopping", () => {
    let trip = setShoppingTripMarket(draft(), "market:hu");
    trip = updateShoppingTripItem(trip, "one", { planStatus: "selected" });
    trip = updateShoppingTripItem(trip, "two", { planStatus: "selected" });
    trip = transitionShoppingTrip(trip, "matching");
    trip = transitionShoppingTrip(trip, "ready");
    trip = transitionShoppingTrip(trip, "in_progress");
    trip = addShoppingTripItem(trip, {
      displayNameSnapshot: "Banana",
      id: "manual-banana",
      requiredQuantity: 3,
      requiredUnit: "count"
    });
    const repeated = addShoppingTripItem(trip, {
      displayNameSnapshot: "Banana",
      id: "manual-banana",
      requiredQuantity: 3,
      requiredUnit: "count"
    });
    expect(repeated.revision).toBe(trip.revision);
    expect(repeated.items.filter((candidate) => candidate.id === "manual-banana")).toHaveLength(1);
  });
});
