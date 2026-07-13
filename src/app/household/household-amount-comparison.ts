export type HouseholdAmountComparisonKind = "minimum" | "target";
export type HouseholdAmountComparisonClass =
  "comparison-neutral" | "comparison-good" | "comparison-error";

export function householdAmountComparisonClass(
  current: number,
  reference: number | undefined,
  kind: HouseholdAmountComparisonKind
): HouseholdAmountComparisonClass {
  if (reference === undefined) return "comparison-neutral";
  if (kind === "minimum") return current >= reference ? "comparison-good" : "comparison-error";

  // Target is a restock boundary: below, at, and above it are all satisfied for the comparison
  // indicator. The derived state badge remains the place to communicate target-boundary nuance.
  return "comparison-good";
}
