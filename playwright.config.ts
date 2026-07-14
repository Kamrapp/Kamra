import { defineConfig, devices } from "playwright/test";

export default defineConfig({
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  testDir: "./tests/browser",
  use: {
    baseURL: "http://127.0.0.1:4200",
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run dev:web",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: "http://127.0.0.1:4200"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
