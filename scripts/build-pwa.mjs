import { spawnSync } from "node:child_process";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateSW } from "workbox-build";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outputDir = path.join(projectRoot, "dist-pwa");

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? filesUnder(entryPath) : [entryPath];
    }),
  );
  return nested.flat();
}

const publicBuildEnv = {
  ...process.env,
  EXPO_PUBLIC_ENABLE_STUDIO: "0",
};
const expo = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["expo", "export", "--platform", "web", "--output-dir", "dist-pwa"],
  { cwd: projectRoot, env: publicBuildEnv, stdio: "inherit" },
);
if (expo.error) throw expo.error;
if (expo.status !== 0) process.exit(expo.status ?? 1);

// These source captures are local QA material, never PWA production assets.
await rm(path.join(outputDir, "references"), { recursive: true, force: true });
await rm(path.join(outputDir, "qa"), { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await copyFile(
  path.join(projectRoot, "pwa", "manifest.json"),
  path.join(outputDir, "manifest.json"),
);
for (const size of [192, 512]) {
  await copyFile(
    path.join(projectRoot, "pwa", "icons", `icon-${size}.png`),
    path.join(outputDir, `pwa-icon-${size}.png`),
  );
}
await copyFile(
  path.join(projectRoot, "pwa", "register-service-worker.js"),
  path.join(outputDir, "register-service-worker.js"),
);

const htmlPath = path.join(outputDir, "index.html");
let html = await readFile(htmlPath, "utf8");
if (!/<head\b/i.test(html) || !/<\/head>/i.test(html)) {
  throw new Error(
    "Expo export did not produce a usable index.html head element.",
  );
}
const pwaHead = [
  '<link rel="manifest" href="/manifest.json" />',
  '<link rel="apple-touch-icon" href="/pwa-icon-192.png" />',
  '<meta name="theme-color" content="#304F99" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
  '<script src="/register-service-worker.js" defer></script>',
].join("\n    ");
if (!html.includes('rel="manifest"')) {
  html = html.replace(/<\/head>/i, `    ${pwaHead}\n  </head>`);
  await writeFile(htmlPath, html);
}

const { count, size, warnings } = await generateSW({
  globDirectory: outputDir,
  globPatterns: [
    "index.html",
    "manifest.json",
    "pwa-icon-192.png",
    "pwa-icon-512.png",
    "favicon.ico",
    "assets/**/*",
    "_expo/static/**/*",
  ],
  globIgnores: ["**/*.map", "references/**", "qa/**"],
  swDest: path.join(outputDir, "service-worker.js"),
  navigateFallback: "/index.html",
  navigateFallbackDenylist: [
    /^\/(?:references|qa)(?:\/|$)/,
    /^\/(?:service-worker\.js|manifest\.json)$/,
  ],
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  // Let an active release finish before a waiting service worker takes over.
  skipWaiting: false,
  maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
  sourcemap: false,
  mode: "production",
});
if (warnings.length) {
  throw new Error(`Workbox precache warnings:\n${warnings.join("\n")}`);
}
const serviceWorkerPath = path.join(outputDir, "service-worker.js");
if ((await stat(serviceWorkerPath)).size === 0) {
  throw new Error("Workbox generated an empty service worker.");
}
const serviceWorker = await readFile(serviceWorkerPath, "utf8");
const webJavaScriptChunks = (
  await filesUnder(path.join(outputDir, "_expo", "static", "js", "web"))
)
  .filter((file) => file.endsWith(".js"))
  .map((file) => path.relative(outputDir, file).split(path.sep).join("/"));
const missingWebChunks = webJavaScriptChunks.filter(
  (chunk) => !serviceWorker.includes(chunk),
);
if (missingWebChunks.length) {
  throw new Error(
    `PWA service worker does not precache Web JavaScript chunks:\n${missingWebChunks.join("\n")}`,
  );
}
for (const privateOrQADir of ["references", "qa"]) {
  try {
    await stat(path.join(outputDir, privateOrQADir));
    throw new Error(`Unexpected ${privateOrQADir}/ directory in PWA output.`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
console.log(
  `PWA ready: ${outputDir} — ${count} precached files (${(size / 1024 / 1024).toFixed(2)} MiB).`,
);
console.log(
  `All ${webJavaScriptChunks.length} Web JavaScript chunks are included in offline precache.`,
);
console.log(
  "Auth, private media and provider/API responses are not runtime-cached.",
);
