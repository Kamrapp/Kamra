import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["**/coverage/**", "**/dist/**", "**/node_modules/**"],
    include: ["packages/kamra-api-server/src/**/*.integration.test.ts"]
  }
});
