import { describe, expect, it } from "vitest";

import { householdV1CollectionSchemas } from "../household/v1/schemas.js";
import { databaseMaintenanceEntries } from "./registry.js";

describe("automatic-login feature flag maintenance", () => {
  it("registers a fresh validator-only maintenance action", () => {
    expect(
      databaseMaintenanceEntries.find((entry) => entry.id === "feature-flag-automatic-login-v1")
    ).toMatchObject({
      id: "feature-flag-automatic-login-v1",
      title: "Automatic-login feature flag validator"
    });
  });

  it("includes allowAutomaticLogin in the current MongoDB feature-flag validator", () => {
    const schema = householdV1CollectionSchemas.household_feature_flags as {
      properties?: {
        key?: {
          enum?: readonly string[];
        };
      };
    };

    expect(schema.properties?.key?.enum).toContain("allowAutomaticLogin");
  });
});
