import { mkdir, writeFile } from "node:fs/promises";
import prettier from "prettier";

import { catalogV1SchemaArtifact } from "../packages/kamra-api-server/src/catalog/v1/schemas.js";

const outputDirectoryUrl = new URL(
  "../packages/kamra-api-server/src/catalog/v1/generated/",
  import.meta.url
);
const outputFileUrl = new URL("catalog-schemas.json", outputDirectoryUrl);

await mkdir(outputDirectoryUrl, { recursive: true });
const prettierConfig = (await prettier.resolveConfig(outputFileUrl)) ?? {};
const formattedArtifact = await prettier.format(JSON.stringify(catalogV1SchemaArtifact, null, 2), {
  ...prettierConfig,
  parser: "json"
});
await writeFile(outputFileUrl, formattedArtifact, "utf8");
