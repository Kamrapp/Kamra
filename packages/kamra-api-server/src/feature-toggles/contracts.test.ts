import { describe, expect, it } from "vitest";

import { householdFeatureFlagKeys } from "../household/v1/contracts.js";
import { featureFlagDefinitions } from "./contracts.js";

describe("feature flag contracts", () => {
  it("keeps the household validation keys aligned with server definitions", () => {
    expect([...householdFeatureFlagKeys].sort()).toEqual(
      Object.keys(featureFlagDefinitions).sort()
    );
  });
});
