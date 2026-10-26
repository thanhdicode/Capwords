import test from "node:test";
import assert from "node:assert/strict";
import {
  imagePersistenceErrorMessage,
  isPersistentLibraryImage,
  persistentImageDestination,
} from "../src/domain/imagePersistence";

const documents = "file:///app/Documents/";

test("native cache images map to a stable word-specific document URI", () => {
  assert.equal(
    persistentImageDestination(
      "file:///cache/cropped.png",
      "word-7",
      documents,
      "ios",
    ),
    "file:///app/Documents/capwords-images/word-7.png",
  );
  assert.equal(
    persistentImageDestination(
      "file:///cache/photo.heic?edited=1",
      "a/b",
      documents,
      "android",
    ),
    "file:///app/Documents/capwords-images/a_b.heic",
  );
  assert.equal(
    persistentImageDestination(
      "file:///cache/avatar.jpg",
      "profile-avatar-123",
      documents,
      "ios",
    ),
    "file:///app/Documents/capwords-images/profile-avatar-123.jpg",
  );
});

test("existing durable images are reused and recognized only within the app-owned folder", () => {
  const uri = "file:///app/Documents/capwords-images/word-7.jpg";
  assert.equal(persistentImageDestination(uri, "other", documents, "ios"), uri);
  assert.equal(isPersistentLibraryImage(uri, documents), true);
  assert.equal(
    isPersistentLibraryImage("file:///app/Documents/other.jpg", documents),
    false,
  );
});

test("native image persistence errors explain low storage and give a retry path", () => {
  assert.equal(
    imagePersistenceErrorMessage(new Error("ENOSPC: no space left on device")),
    "Your device is low on storage, so this photo could not be saved. Free up space and try again.",
  );
  assert.equal(
    imagePersistenceErrorMessage(new Error("Permission denied")),
    "Could not copy this photo to permanent storage. Check available device storage and try again, or choose a smaller photo.",
  );
  assert.equal(
    imagePersistenceErrorMessage("QUOTA EXCEEDED"),
    "Your device is low on storage, so this photo could not be saved. Free up space and try again.",
  );
});

test("web blobs/data and remote URLs are never copied into the native file store", () => {
  for (const uri of [
    "blob:https://example.test/photo",
    "data:image/png;base64,cGhvdG8=",
    "https://example.test/photo.png",
  ]) {
    assert.equal(
      persistentImageDestination(uri, "word-7", documents, "ios"),
      null,
    );
  }
  assert.equal(
    persistentImageDestination(
      "file:///cache/photo.bmp",
      "word-7",
      documents,
      "web",
    ),
    null,
  );
});
