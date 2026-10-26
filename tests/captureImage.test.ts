import test from "node:test";
import assert from "node:assert/strict";
import {
  imageUriForCapture,
  vocabularyImageUriForCapture,
} from "../src/services/captureImage";

test("temporary web photos use their actual base64 and MIME type for persistence", () => {
  assert.equal(
    imageUriForCapture({
      uri: "blob:https://example.test/temp",
      base64: "cGhvdG8=",
      mimeType: "image/png",
    }),
    "data:image/png;base64,cGhvdG8=",
  );
  assert.equal(
    imageUriForCapture({
      uri: "blob:https://example.test/temp",
      base64: "cGhvdG8=",
    }),
    "data:image/jpeg;base64,cGhvdG8=",
  );
});

test("temporary blobs without image bytes fail explicitly instead of saving a broken URL", () => {
  assert.throws(
    () => imageUriForCapture({ uri: "blob:https://example.test/temp" }),
    /could not be prepared for saving/,
  );
});

test("existing data, remote and native image URIs are not rewritten", () => {
  for (const uri of [
    "data:image/png;base64,cGhvdG8=",
    "https://example.test/photo.jpg",
    "file:///cache/photo.jpg",
  ]) {
    assert.equal(imageUriForCapture({ uri, base64: "ignored" }), uri);
  }
});

test("vocabulary image uses a matching transparent foreground and retains the raw capture", () => {
  const asset = {
    uri: "file:///cache/original.jpg",
    base64: "b3JpZ2luYWw=",
    foregroundRemoval: {
      status: "processed" as const,
      sourceUri: "file:///cache/original.jpg",
      image: {
        uri: "file:///cache/capwords-foreground.png",
        mimeType: "image/png" as const,
        width: 1200,
        height: 1600,
      },
    },
  };

  assert.equal(asset.uri, "file:///cache/original.jpg");
  assert.equal(imageUriForCapture(asset), "file:///cache/original.jpg");
  assert.equal(
    vocabularyImageUriForCapture(asset),
    "file:///cache/capwords-foreground.png",
  );
  assert.equal(
    vocabularyImageUriForCapture({
      ...asset,
      uri: "file:///cache/cropped.jpg",
    }),
    "file:///cache/cropped.jpg",
  );
});
