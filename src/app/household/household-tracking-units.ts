export const householdTrackingUnitOptions = ["g", "kg", "ml", "l", "count"] as const;

export type HouseholdTrackingUnitOption = (typeof householdTrackingUnitOptions)[number] | "custom";

export function splitTrackingUnit(value: string): {
  customSuffix: string;
  option: HouseholdTrackingUnitOption;
} {
  if (householdTrackingUnitOptions.includes(value as never)) {
    return { customSuffix: "", option: value as HouseholdTrackingUnitOption };
  }
  if (value.startsWith("custom:")) {
    return { customSuffix: value.slice("custom:".length), option: "custom" };
  }
  return { customSuffix: value, option: "custom" };
}

export function composeTrackingUnit(
  option: HouseholdTrackingUnitOption,
  customSuffix: string
): string | null {
  if (option !== "custom") return option;
  const suffix = customSuffix.trim();
  return suffix ? `custom:${suffix}` : null;
}

export function displayTrackingUnit(value: string | null | undefined): string {
  if (!value) return "—";
  return value.startsWith("custom:") ? value.slice("custom:".length) : value;
}

export function isCustomTrackingUnit(value: string | null | undefined): boolean {
  return Boolean(value?.startsWith("custom:"));
}
