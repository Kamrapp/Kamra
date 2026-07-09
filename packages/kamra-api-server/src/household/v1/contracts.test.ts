import { describe, expect, it } from "vitest";

import { householdV1CollectionNames } from "./contracts.js";
import { householdV1CollectionSchemas } from "./schemas.js";

describe("Household v1 contracts", () => {
  it("define one schema per household collection", () => {
    expect(Object.keys(householdV1CollectionSchemas).sort()).toEqual(
      [...householdV1CollectionNames].sort()
    );
  });
});
