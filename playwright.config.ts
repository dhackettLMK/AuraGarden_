import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3100);

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "off",
  },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      SYNC_DEV_STORE: process.env.SYNC_DEV_STORE ?? "",
      // Test-only: lets the feed route reach the fixture server on this exact origin.
      FEED_TEST_ALLOW: "http://127.0.0.1:4555/",
      FEED_TEST_ALLOW_IN_PROD: "yes-i-am-a-test",
    },
  },
});
