export const groupTargetShoppingModes = [
  "add_products_and_group_item",
  "add_products_only",
  "ignore_group_targets"
] as const;
export type GroupTargetShoppingMode = (typeof groupTargetShoppingModes)[number];

export const groupTargetShoppingDistributionModes = [
  "dont_split",
  "split_evenly",
  "least_amount",
  "latest",
  "oldest"
] as const;
export type GroupTargetShoppingDistributionMode =
  (typeof groupTargetShoppingDistributionModes)[number];

export const groupTargetShoppingModeOverrides = ["default", ...groupTargetShoppingModes] as const;
export type GroupTargetShoppingModeOverride = (typeof groupTargetShoppingModeOverrides)[number];

export const groupTargetShoppingDistributionModeOverrides = [
  "default",
  ...groupTargetShoppingDistributionModes
] as const;
export type GroupTargetShoppingDistributionModeOverride =
  (typeof groupTargetShoppingDistributionModeOverrides)[number];

export function normalizeGroupTargetShoppingDistributionMode(
  value: unknown
): GroupTargetShoppingDistributionMode {
  if (groupTargetShoppingDistributionModes.includes(value as GroupTargetShoppingDistributionMode))
    return value as GroupTargetShoppingDistributionMode;
  if (value === "even" || value === "proportional") return "split_evenly";
  return "split_evenly";
}
