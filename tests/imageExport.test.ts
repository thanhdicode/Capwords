import assert from "node:assert/strict";
import { test } from "node:test";
import {
  imageExportFilename,
  runImageExport,
  type ImageExportPorts,
} from "../src/domain/imageExport";
import type { Word } from "../src/domain/types";

const word: Word = {
  id: "word-1",
  native: "Sunflower",
  target: "Tournesol",
  phonetic: "/tuʁ.nə.sɔl/",
  example: "Nous avons planté des graines de tournesol.",
  exampleTranslation: "We planted sunflower seeds.",
  emoji: "🌻",
  color: "#E8A44D",
  category: "Nature",
  favorite: false,
  createdAt: "2026-10-25T00:00:00.000Z",
  review: {
    dueAt: "2026-10-25T00:00:00.000Z",
    intervalDays: 0,
    repetitions: 0,
  },
};

function fakePorts(platform: "web" | "native") {
  const calls: string[] = [];
  const ports: ImageExportPorts = {
    platform,
    async resolveSource() {
      calls.push("resolve");
      return {
        uri: "file:///word.png",
        mimeType: "image/png",
        extension: "png",
      };
    },
    async prepareNativeFile(_source, filename) {
      calls.push(`prepare:${filename}`);
      return {
        uri: "file:///cache/CapWords-tournesol.png",
        cleanup() {
          calls.push("cleanup");
        },
      };
    },
    async downloadWeb(_source, filename) {
      calls.push(`download:${filename}`);
    },
    async saveToPhotos(uri) {
      calls.push(`save:${uri}`);
    },
    async shareFile(uri, mimeType, title) {
      calls.push(`share:${uri}:${mimeType}:${title}`);
    },
  };
  return { ports, calls };
}

test("export filenames normalize accents and strip path/control characters", () => {
  assert.equal(
    imageExportFilename("  Une Femme / 🌻  ", ".PNG"),
    "CapWords-une-femme.png",
  );
  assert.equal(imageExportFilename("🔥", "unknown"), "CapWords-word.jpg");
});

test("web export downloads the image without preparing or saving a native file", async () => {
  const { ports, calls } = fakePorts("web");
  const message = await runImageExport(word, "download", ports);
  assert.equal(message, "Image download started.");
  assert.deepEqual(calls, ["resolve", "download:CapWords-tournesol.png"]);
});

test("native save prepares a named local copy and always cleans it up", async () => {
  const { ports, calls } = fakePorts("native");
  const message = await runImageExport(word, "save", ports);
  assert.equal(message, "Image saved to Photos.");
  assert.deepEqual(calls, [
    "resolve",
    "prepare:CapWords-tournesol.png",
    "save:file:///cache/CapWords-tournesol.png",
    "cleanup",
  ]);
});

test("native share passes the real image MIME type and cleans up afterward", async () => {
  const { ports, calls } = fakePorts("native");
  const message = await runImageExport(word, "share", ports);
  assert.match(message, /only if you selected a destination/);
  assert.deepEqual(calls, [
    "resolve",
    "prepare:CapWords-tournesol.png",
    "share:file:///cache/CapWords-tournesol.png:image/png:Share Tournesol",
    "cleanup",
  ]);
});

test("native temporary files are cleaned even when the share provider fails", async () => {
  const { ports, calls } = fakePorts("native");
  ports.shareFile = async () => {
    calls.push("share-failed");
    throw new Error("share unavailable");
  };
  await assert.rejects(
    runImageExport(word, "share", ports),
    /share unavailable/,
  );
  assert.deepEqual(calls, [
    "resolve",
    "prepare:CapWords-tournesol.png",
    "share-failed",
    "cleanup",
  ]);
});

test("web share and native download fail closed without invoking another export action", async () => {
  const web = fakePorts("web");
  await assert.rejects(
    runImageExport(word, "share", web.ports),
    /iOS or Android app/,
  );
  assert.deepEqual(web.calls, ["resolve"]);

  const native = fakePorts("native");
  await assert.rejects(
    runImageExport(word, "download", native.ports),
    /Save to Photos/,
  );
  assert.deepEqual(native.calls, ["resolve"]);
});

test("export rejects words without an image source", async () => {
  const { ports, calls } = fakePorts("native");
  ports.resolveSource = async () => null;
  await assert.rejects(runImageExport(word, "share", ports), /no saved image/);
  assert.deepEqual(calls, []);
});
