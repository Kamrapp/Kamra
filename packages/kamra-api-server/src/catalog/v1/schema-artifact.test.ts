import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { catalogV1SchemaArtifact } from "./schemas.js";

describe("Catalog v1 schema artifact", () => {
  it("matches the checked-in JSON artifact", () => {
    const artifactPath = resolve(
      process.cwd(),
      "packages/kamra-api-server/src/catalog/v1/generated/catalog-schemas.json"
    );
    const artifact = JSON.parse(readFileSync(artifactPath, "utf8")) as unknown;

    expect(artifact).toEqual(catalogV1SchemaArtifact);
  });
});
