import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "pwa.spec.ts",
  workers: 1,
  fullyParallel: false,
  timeout: 60000,
  reporter: [["list"], ["json", { outputFile: "qa/pwa-playwright-results.json" }]],
  use: {
    baseURL: process.env.QA_BASE_URL || "http://127.0.0.1:8086",
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 1,
    launchOptions: {
      executablePath: "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
    screenshot: "only-on-failure",
  },
});
