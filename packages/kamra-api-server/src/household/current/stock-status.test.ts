import { describe, expect, it } from "vitest";

import { classifyHouseholdStockStatus, householdLowSoonRatio } from "./stock-status.js";

describe("classifyHouseholdStockStatus", () => {
  it("classifies below, at, low-soon, and steady amounts deterministically", () => {
    expect(classifyHouseholdStockStatus({ currentAmount: 0, minLimit: 1 })).toBe("below_limit");
    expect(classifyHouseholdStockStatus({ currentAmount: 0.5, minLimit: 1 })).toBe("below_limit");
    expect(classifyHouseholdStockStatus({ currentAmount: 1, minLimit: 1 })).toBe("at_limit");
    expect(classifyHouseholdStockStatus({ currentAmount: householdLowSoonRatio, minLimit: 1 })).toBe("low_soon");
    expect(classifyHouseholdStockStatus({ currentAmount: 1.21, minLimit: 1 })).toBe("steady");
    expect(classifyHouseholdStockStatus({ currentAmount: 0.1, minLimit: 0 })).toBe("steady");
  });
});
