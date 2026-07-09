import type { HouseholdStockStatus } from "../v1/contracts.js";

export const householdLowSoonRatio = 1.2;

export function classifyHouseholdStockStatus(input: {
  currentAmount: number;
  minLimit: number;
}): HouseholdStockStatus {
  if (input.currentAmount < input.minLimit) {
    return "below_limit";
  }

  if (input.currentAmount === input.minLimit) {
    return "at_limit";
  }

  if (input.minLimit > 0 && input.currentAmount <= input.minLimit * householdLowSoonRatio) {
    return "low_soon";
  }

  return "steady";
}
