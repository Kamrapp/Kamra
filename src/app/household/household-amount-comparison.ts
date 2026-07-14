export type HouseholdAmountComparisonKind = "minimum" | "target";
export type HouseholdAmountComparisonClass =
  | "comparison-neutral"
  | "comparison-good"
  | "comparison-strong-good"
  | "comparison-info"
  | "comparison-error";

export function householdAmountComparisonClass(
  current: number,
  reference: number | undefined,
  kind: HouseholdAmountComparisonKind
): HouseholdAmountComparisonClass {
  if (reference === undefined) return "comparison-neutral";
  if (kind === "minimum") return current >= reference ? "comparison-good" : "comparison-error";
  if (current > reference) return "comparison-strong-good";
  if (current === reference) return "comparison-good";
  return "comparison-info";
}
