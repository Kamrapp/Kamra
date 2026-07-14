import { describe, expect, it } from "vitest";

import { householdAmountComparisonClass } from "./household-amount-comparison";

describe("household amount comparison", () => {
  it("marks current below minimum as an error and current meeting minimum as good", () => {
    expect(householdAmountComparisonClass(0.5, 1, "minimum")).toBe("comparison-error");
    expect(householdAmountComparisonClass(1, 1, "minimum")).toBe("comparison-good");
    expect(householdAmountComparisonClass(2, 1, "minimum")).toBe("comparison-good");
  });

  it("distinguishes below, at, and above target in the comparison indicator", () => {
    expect(householdAmountComparisonClass(0.5, 1, "target")).toBe("comparison-info");
    expect(householdAmountComparisonClass(1, 1, "target")).toBe("comparison-good");
    expect(householdAmountComparisonClass(2, 1, "target")).toBe("comparison-strong-good");
  });

  it("uses a neutral class when no target policy is configured", () => {
    expect(householdAmountComparisonClass(2, undefined, "target")).toBe("comparison-neutral");
  });
});
