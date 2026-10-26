import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_IMAGE_BYTES,
  assertImageWithinLimit,
  buildRecognitionRequestPayload,
  normalizeRecognitionResponse,
  validateRecognitionEndpoint,
} from "../src/domain/recognitionPayload";
import { recognize } from "../src/services/recognition";

const image = "cGhvdG8=";

test("rejects an image whose decoded base64 body exceeds 8 MB", () => {
  const oversized = "A".repeat(Math.ceil((MAX_IMAGE_BYTES + 1) / 3) * 4);
  assert.throws(() => assertImageWithinLimit(oversized), /too large/i);
});

test("allows the trusted Worker and local development only", () => {
  const worker = validateRecognitionEndpoint(
    "https://capwords-recognition-worker.capwords-1suen5.workers.dev/recognize",
  );
  assert.equal(worker.protocol, "https:");
  assert.throws(
    () =>
      validateRecognitionEndpoint(
        "http://capwords-recognition-worker.capwords-1suen5.workers.dev/recognize",
      ),
    /HTTPS/i,
  );
  assert.equal(
    validateRecognitionEndpoint("http://localhost:3000/api").hostname,
    "localhost",
  );
  assert.throws(
    () => validateRecognitionEndpoint("https://example.test/api"),
    /not allowed/i,
  );
  assert.throws(
    () =>
      validateRecognitionEndpoint(
        "https://capwords-recognition-worker.capwords-1suen5.workers.dev.attacker.test/recognize",
      ),
    /not allowed/i,
  );
  assert.throws(
    () =>
      validateRecognitionEndpoint(
        "https://user@capwords-recognition-worker.capwords-1suen5.workers.dev/recognize",
      ),
    /not allowed/i,
  );
  assert.throws(
    () =>
      validateRecognitionEndpoint(
        "https://capwords-recognition-worker.capwords-1suen5.workers.dev:8443/recognize",
      ),
    /not allowed/i,
  );
  assert.throws(
    () => validateRecognitionEndpoint("not a URL"),
    /URL is invalid/i,
  );
});

test("requires nonempty required response strings and validates optional types and colors", () => {
  assert.throws(
    () =>
      normalizeRecognitionResponse(
        { target: " ", native: "ok" },
        "file:///capture.jpg",
      ),
    /target/i,
  );
  assert.throws(
    () =>
      normalizeRecognitionResponse(
        { target: "cat", native: "gato", emoji: 3 },
        "file:///capture.jpg",
      ),
    /emoji/i,
  );
  assert.throws(
    () =>
      normalizeRecognitionResponse(
        { target: "cat", native: "gato", color: "javascript:alert(1)" },
        "file:///capture.jpg",
      ),
    /color/i,
  );
});

test("keeps the original capture URI and ignores a provider imageUri", () => {
  const word = normalizeRecognitionResponse(
    { target: "cat", native: "gato", imageUri: "https://attacker.test/track" },
    "file:///capture.jpg",
  );
  assert.equal(word.imageUri, "file:///capture.jpg");
});

test("adds native language to the request payload without requiring a token", () => {
  assert.deepEqual(
    buildRecognitionRequestPayload(image, "image/jpeg", "fr", {
      nativeLanguage: "en",
    }),
    {
      image: "data:image/jpeg;base64,cGhvdG8=",
      learningLanguage: "fr",
      nativeLanguage: "en",
    },
  );
});

test("sends optional native language and bearer access token", async () => {
  const previousEndpoint = process.env.EXPO_PUBLIC_RECOGNITION_ENDPOINT;
  const previousFetch = global.fetch;
  process.env.EXPO_PUBLIC_RECOGNITION_ENDPOINT =
    "https://capwords-recognition-worker.capwords-1suen5.workers.dev/recognize";
  let request: RequestInit | undefined;
  global.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    request = init;
    return new Response(JSON.stringify({ target: "cat", native: "gato" }), {
      status: 200,
    });
  }) as typeof fetch;
  try {
    const result = await recognize(
      { uri: "file:///capture.jpg", base64: image, mimeType: "image/jpeg" },
      "fr",
      false,
      undefined,
      { nativeLanguage: "en", accessToken: "secret-token" },
    );
    assert.equal(result.word.target, "cat");
    assert.equal(
      (request?.headers as Record<string, string>).Authorization,
      "Bearer secret-token",
    );
    assert.deepEqual(JSON.parse(String(request?.body)), {
      image: "data:image/jpeg;base64,cGhvdG8=",
      learningLanguage: "fr",
      nativeLanguage: "en",
    });
  } finally {
    if (previousEndpoint === undefined)
      delete process.env.EXPO_PUBLIC_RECOGNITION_ENDPOINT;
    else process.env.EXPO_PUBLIC_RECOGNITION_ENDPOINT = previousEndpoint;
    global.fetch = previousFetch;
  }
});
