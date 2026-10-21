import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: process.env.VOX_TEST_URL || "http://127.0.0.1:1420",
    channel: "chrome",
    headless: true,
    acceptDownloads: true,
  },
  webServer: process.env.VOX_TEST_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://127.0.0.1:1420",
        reuseExistingServer: !process.env.CI,
      },
});
