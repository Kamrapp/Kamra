import { describe, expect, it } from "vitest";

import { householdFeatureFlagKeys } from "../household/v1/contracts.js";
import {
  featureFlagDefinitions,
  featureFlagKeys,
  toFeatureFlagAdminListItem
} from "./contracts.js";

describe("feature flag contracts", () => {
  it("keeps the household validation keys aligned with server definitions", () => {
    expect([...householdFeatureFlagKeys].sort()).toEqual(
      Object.keys(featureFlagDefinitions).sort()
    );
  });

  it("derives the admin display contract from the registered definitions", () => {
    expect(featureFlagKeys).toEqual(Object.keys(featureFlagDefinitions));
    expect(featureFlagKeys.map((key) => toFeatureFlagAdminListItem(key, false))).toEqual([
      {
        control: "boolean",
        descriptionKey: "health.featureFlagAutoTickAllShoppingListEntriesDescription",
        enabled: false,
        group: "shopping",
        key: "allowAutoTickingAllShoppingListEntries",
        labelKey: "health.featureFlagAutoTickAllShoppingListEntries"
      },
      {
        control: "alpha-access",
        descriptionKey: "health.featureFlagControlledAlphaAccessDescription",
        enabled: false,
        group: "access",
        key: "allowControlledAlphaAccess",
        labelKey: "health.featureFlagControlledAlphaAccess"
      },
      {
        control: "boolean",
        descriptionKey: "health.featureFlagAbbreviatedUiLabelsDescription",
        enabled: false,
        group: "household",
        key: "useAbbreviatedUiLabels",
        labelKey: "health.featureFlagAbbreviatedUiLabels"
      }
    ]);
  });
});
