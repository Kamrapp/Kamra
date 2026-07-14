import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["**/coverage/**", "**/dist/**", "**/node_modules/**", "tests/browser/**"]
  }
});
