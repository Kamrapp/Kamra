import { describe, expect, it } from "vitest";
import {
  composeTrackingUnit,
  displayTrackingUnit,
  isCustomTrackingUnit,
  splitTrackingUnit
} from "./household-tracking-units";

describe("household tracking units", () => {
  it("round-trips built-in and custom editor values", () => {
    expect(splitTrackingUnit("l")).toEqual({ customSuffix: "", option: "l" });
    expect(splitTrackingUnit("custom:test")).toEqual({
      customSuffix: "test",
      option: "custom"
    });
    expect(composeTrackingUnit("kg", "")).toBe("kg");
    expect(composeTrackingUnit("custom", " test ")).toBe("custom:test");
    expect(composeTrackingUnit("custom", " ")).toBeNull();
  });

  it("hides the custom storage prefix in the table", () => {
    expect(displayTrackingUnit("custom:db")).toBe("db");
    expect(displayTrackingUnit("count")).toBe("count");
    expect(displayTrackingUnit(null)).toBe("—");
    expect(isCustomTrackingUnit("custom:db")).toBe(true);
    expect(isCustomTrackingUnit("db")).toBe(false);
  });
});
