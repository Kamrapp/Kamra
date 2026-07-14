import { defineConfig, devices } from "playwright/test";
import { tmpdir } from "node:os";
import { join } from "node:path";

const webServerPidFile = join(tmpdir(), `kamra-playwright-web-server-${process.pid}.pid`);
const webServerStopFile = `${webServerPidFile}.stop`;

export default defineConfig({
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  globalTeardown: "./scripts/playwright-web-server-teardown.mjs",
  reporter: "list",
  testDir: "./tests/browser",
  use: {
    baseURL: "http://127.0.0.1:4200",
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "node scripts/playwright-web-server.mjs",
    env: {
      KAMRA_PLAYWRIGHT_WEB_SERVER_PID_FILE: webServerPidFile,
      KAMRA_PLAYWRIGHT_WEB_SERVER_STOP_FILE: webServerStopFile
    },
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
