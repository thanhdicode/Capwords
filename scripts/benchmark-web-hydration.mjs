import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = (process.env.QA_BASE_URL || "http://127.0.0.1:8087").replace(
  /\/$/,
  "",
);
const wordCounts = (process.env.BENCH_WORD_COUNTS || "100,1000,5000,10000")
  .split(",")
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isSafeInteger(value) && value > 0);
const repeats = Number(process.env.BENCH_REPEATS || 3);
const outputPath = path.resolve(
  process.env.BENCH_OUTPUT || "qa/performance/web-hydration.json",
);
const storageKey = "@capwords/state";
const capturedAt = "2025-01-01T00:00:00.000Z";

if (!wordCounts.length || !Number.isSafeInteger(repeats) || repeats < 1) {
  throw new Error("Provide positive BENCH_WORD_COUNTS and BENCH_REPEATS values.");
}

function benchmarkWord(index) {
  return {
    id: `benchmark-${index}`,
    native: `native-${index}`,
    target: `target-${index}`,
    phonetic: "/benchmark/",
    example: `Example sentence ${index}.`,
    exampleTranslation: `Translation ${index}.`,
    emoji: "📘",
    color: "#D8D3CA",
    category: "Benchmark",
    favorite: false,
    createdAt: capturedAt,
    review: {
      dueAt: capturedAt,
      intervalDays: 0,
      repetitions: 0,
    },
  };
}

function benchmarkSnapshot(count) {
  return JSON.stringify({
    version: 1,
    state: {
      onboarded: true,
      nativeLanguage: "en",
      learningLanguage: "fr",
      preferredSpeechVoiceId: null,
      profileName: "Hydration benchmark",
      dailyGoal: 10,
      dailyReminderEnabled: false,
      dailyReminderTime: "08:00",
      reviewRemindersEnabled: true,
      sound: true,
      words: Array.from({ length: count }, (_, index) => benchmarkWord(index)),
      reviewDates: [],
      lastReview: null,
    },
  });
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const results = [];
let failed = false;

try {
  for (const wordCount of wordCounts) {
    const payload = benchmarkSnapshot(wordCount);
    const measurements = [];
    const failures = [];

    for (let run = 0; run < repeats; run += 1) {
      const context = await browser.newContext({
        viewport: { width: 393, height: 852 },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      await page.addInitScript(
        ({ key, value }) => {
          try {
            window.localStorage.setItem(key, value);
          } catch (error) {
            window.__capwordsBenchSeedError = String(error);
          }
          window.__capwordsBenchStartedAt = performance.now();
        },
        { key: storageKey, value: payload },
      );

      try {
        await page.goto(`${baseUrl}/?screen=home`, {
          waitUntil: "domcontentloaded",
          timeout: 120_000,
        });
        await page.getByLabel("Profile and settings").waitFor({
          state: "visible",
          timeout: 120_000,
        });
        const measurement = await page.evaluate((key) => {
          const browserPerformance = performance;
          const memory = browserPerformance.memory;
          return {
            hydrationMs:
              browserPerformance.now() - window.__capwordsBenchStartedAt,
            usedJsHeapBytes: memory?.usedJSHeapSize ?? null,
            persistedBytes: new Blob([
              window.localStorage.getItem(key) || "",
            ]).size,
            seedError: window.__capwordsBenchSeedError || null,
          };
        }, storageKey);
        if (measurement.seedError) {
          throw new Error(`Could not seed browser storage: ${measurement.seedError}`);
        }
        measurements.push(measurement);
      } catch (error) {
        failed = true;
        failures.push(error instanceof Error ? error.message : String(error));
      } finally {
        await context.close();
      }
    }

    results.push({
      words: wordCount,
      repeats,
      payloadBytes: Buffer.byteLength(payload),
      status: failures.length ? "failed" : "measured",
      medianHydrationMs: measurements.length
        ? Math.round(median(measurements.map((item) => item.hydrationMs)))
        : null,
      runs: measurements.map((item) => ({
        hydrationMs: Math.round(item.hydrationMs),
        usedJsHeapBytes: item.usedJsHeapBytes,
        persistedBytes: item.persistedBytes,
      })),
      failures,
    });
  }
} finally {
  await browser.close();
}

const report = {
  benchmark: "CapWords Web AppState v1 hydration",
  capturedAt: new Date().toISOString(),
  baseUrl,
  browser: "Chromium via Playwright",
  viewport: { width: 393, height: 852 },
  storage: "AsyncStorage Web adapter backed by localStorage",
  workload: "Synthetic schema-valid words with no image files; all review dates due.",
  caveat:
    "This measures local Web startup/hydration, not native SQLite, Appwrite throughput, server load balancing, or production user data.",
  results,
};
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
console.log(`Saved benchmark: ${outputPath}`);
if (failed) process.exitCode = 1;
