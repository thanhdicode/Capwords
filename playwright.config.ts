import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "ui.spec.ts",
  workers: 1,
  fullyParallel: false,
  timeout: 60000,
  reporter: [["list"], ["json", { outputFile: "qa/playwright-results.json" }]],
  use: {
    baseURL: process.env.QA_BASE_URL || "http://127.0.0.1:8081",
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 1,
    launchOptions: {
      executablePath: "/usr/bin/chromium",
      args: [
        "--no-sandbox",
        "--use-fake-device-for-media-stream",
        "--use-fake-ui-for-media-stream",
      ],
    },
    screenshot: "only-on-failure",
  },
});
