import assert from "node:assert/strict";
import test from "node:test";
import { Query } from "appwrite";
import {
  paginateFiles,
  normalizedUpload,
  uploadSharedPhotos,
} from "../src/cloud/serviceCore";
import type { CloudFile } from "../src/cloud/client";

const file = (id: string, name = `media-${id}.jpg`): CloudFile => ({
  $id: id,
  name,
  mimeType: "image/jpeg",
  sizeOriginal: 3,
  $createdAt: "2026-10-25T00:00:00.000Z",
});
test("service uses Appwrite Query helpers and paginates beyond 25 files", async () => {
  const calls: string[][] = [];
  const pages = [
    Array.from({ length: 25 }, (_, i) => file(String(i))),
    [file("25")],
  ];
  const files = await paginateFiles(
    {
      listFiles: async ({ queries }: any) => {
        calls.push(queries ?? []);
        return { files: pages.shift() ?? [], total: 26 };
      },
    },
    "bucket",
    (method, value) => Query[method](value),
  );
  assert.equal(files.length, 26);
  assert.deepEqual(calls[0], [Query.limit(100), Query.offset(0)]);
  assert.deepEqual(calls[1], [Query.limit(100), Query.offset(100)]);
});
test("web upload normalizes name and preserves real bytes", () => {
  const bytes = new Uint8Array([7, 8, 9]);
  const upload = normalizedUpload({
    name: "photo.png",
    mimeType: "image/png",
    size: bytes.length,
    bytes,
  });
  assert.equal(upload.name, "media-photo.png");
  assert.deepEqual(upload.bytes, bytes);
});
test("shared word photos upload once and failed backup cleanup preserves prior files", async () => {
  const deleted: string[] = [];
  let uploads = 0;
  await assert.rejects(
    uploadSharedPhotos(
      ["same", "same", "other"],
      async (uri) => ({
        name: uri,
        mimeType: "image/jpeg",
        size: 1,
        bytes: new Uint8Array([1]),
      }),
      {
        upload: async () => {
          uploads++;
          if (uploads === 2) throw new Error("snapshot failed");
          return {
            fileId: `new-${uploads}`,
            kind: "photo",
            name: "x.jpg",
            mimeType: "image/jpeg",
            size: 1,
            createdAt: "2026-10-25T00:00:00.000Z",
          };
        },
      },
      async (id) => {
        deleted.push(id);
      },
    ),
    /snapshot failed/,
  );
  assert.equal(uploads, 2);
  assert.deepEqual(deleted, ["new-1"]);
});
