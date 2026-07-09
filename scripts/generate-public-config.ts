import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const apiBaseUrl = process.env["API_BASE_URL"]?.trim() ?? "";
const targetPath = resolve("src/app/generated-public-config.ts");
const fileContents = `export const publicAppConfig = {
  apiBaseUrl: ${JSON.stringify(apiBaseUrl)}
} as const;
`;

await writeFile(targetPath, fileContents, "utf8");
