import { mkdir, writeFile } from "node:fs/promises";

import { catalogV1SchemaArtifact } from "../packages/kamra-api-server/src/catalog/v1/schemas.js";

const outputDirectoryUrl = new URL(
  "../packages/kamra-api-server/src/catalog/v1/generated/",
  import.meta.url
);
const outputFileUrl = new URL("catalog-schemas.json", outputDirectoryUrl);

await mkdir(outputDirectoryUrl, { recursive: true });
await writeFile(outputFileUrl, `${JSON.stringify(catalogV1SchemaArtifact, null, 2)}\n`, "utf8");
