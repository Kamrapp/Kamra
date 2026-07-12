import { describe, expect, it } from "vitest";
import {
  createShoppingTrip,
  nextProcessingStatus,
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
    expect(transitionShoppingTrip(trip, "completed").status).toBe("completed");
  });

  it("rejects edits after cancellation", () => {
    const trip = transitionShoppingTrip(draft(), "cancelled");
    expect(() => setShoppingTripMarket(trip, "market:hu")).toThrow("locked");
  });
});
