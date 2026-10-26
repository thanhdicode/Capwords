import assert from "node:assert/strict";
import test from "node:test";
import { downloadPrivateFile } from "../src/cloud/download";

const base = {
  endpoint: "https://cloud.example/v1/",
  projectId: "test-project",
  bucketId: "private-bucket",
  fileId: "snapshot-file",
  createJWT: async () => ({ jwt: "fake-user-jwt-for-unit-test" }),
};

test("private JSON downloads retain raw bytes and use user JWT rather than cookies", async () => {
  const json = '{\n  "version": 1, "text": "Tiếng Việt"\n}\n';
  const bytes = await downloadPrivateFile({
    ...base,
    fetcher: async (url, options) => {
      assert.equal(
        url,
        "https://cloud.example/v1/storage/buckets/private-bucket/files/snapshot-file/download",
      );
      assert.deepEqual(options?.headers, {
        "X-Appwrite-Project": "test-project",
        "X-Appwrite-JWT": "fake-user-jwt-for-unit-test",
      });
      assert.equal(options?.credentials, "omit");
      assert.equal(options?.cache, "no-store");
      return new Response(json, {
        headers: { "content-type": "application/json" },
      });
    },
  });
  assert.equal(new TextDecoder().decode(bytes), json);
});

test("private download rejects unauthorized HTTP responses", async () => {
  await assert.rejects(
    downloadPrivateFile({
      ...base,
      fetcher: async () => new Response("denied", { status: 401 }),
    }),
    /HTTP 401/,
  );
});

test("private download rejects missing token before any fetch", async () => {
  let fetched = false;
  await assert.rejects(
    downloadPrivateFile({
      ...base,
      createJWT: async () => ({ jwt: "" }),
      fetcher: async () => {
        fetched = true;
        return new Response("bytes");
      },
    }),
    /no access token/,
  );
  assert.equal(fetched, false);
});

test("private download rejects empty and excessive declared bytes", async () => {
  await assert.rejects(
    downloadPrivateFile({ ...base, fetcher: async () => new Response("") }),
    /no bytes/,
  );
  await assert.rejects(
    downloadPrivateFile({
      ...base,
      fetcher: async () =>
        new Response("oversized", {
          headers: { "content-length": "50000001" },
        }),
    }),
    /file limit/,
  );
});
