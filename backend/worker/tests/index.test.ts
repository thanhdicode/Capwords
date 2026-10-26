import { strict as assert } from "node:assert";
import test from "node:test";
import worker, { buildAiInput, MODEL, normalize } from "../src/index";

const image = "data:image/png;base64," + "A".repeat(8);
function env(overrides: Record<string, unknown> = {}) {
  let attempts = 0;
  return {
    APPWRITE_ENDPOINT: "https://cloud.appwrite.io/v1",
    APPWRITE_PROJECT_ID: "p",
    ALLOWED_ORIGINS: "https://app.example",
    AI: {
      run: async () => ({
        response: JSON.stringify({
          target: "cat",
          native: "gato",
          color: "#112233",
        }),
      }),
    },
    USAGE: {
      prepare: () => ({
        bind: () => ({ first: async () => ({ attempts: ++attempts }) }),
      }),
    },
    ...overrides,
  } as any;
}
function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request("https://worker.example/recognize", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Appwrite-JWT": "jwt",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}
const originalFetch = globalThis.fetch;
function authFetch() {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ $id: "user-1", emailVerification: true }), {
      status: 200,
    })) as typeof fetch;
}

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("auth, CORS, and successful provider normalization", async () => {
  authFetch();
  const r = await worker.fetch(
    request(
      { image, learningLanguage: "es", nativeLanguage: "en" },
      { Origin: "https://app.example" },
    ),
    env(),
  );
  assert.equal(r.status, 200);
  assert.equal(
    r.headers.get("access-control-allow-origin"),
    "https://app.example",
  );
  assert.deepEqual((await r.json()).target, "cat");
});
test("rejects disallowed origins before auth", async () => {
  const r = await worker.fetch(
    request(
      { image, learningLanguage: "es" },
      { Origin: "https://evil.example" },
    ),
    env(),
  );
  assert.equal(r.status, 403);
});
test("allows native no-Origin request with JWT", async () => {
  authFetch();
  const r = await worker.fetch(
    request({ image, learningLanguage: "es" }),
    env(),
  );
  assert.equal(r.status, 200);
});
test("rejects unverified and missing JWT users", async () => {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ $id: "u", emailVerification: false }), {
      status: 200,
    })) as typeof fetch;
  let r = await worker.fetch(request({ image, learningLanguage: "es" }), env());
  assert.equal(r.status, 403);
  r = await worker.fetch(
    new Request("https://worker.example/recognize", {
      method: "POST",
      body: JSON.stringify({ image, learningLanguage: "es" }),
    }),
    env(),
  );
  assert.equal(r.status, 401);
});
test("enforces atomic quota response", async () => {
  authFetch();
  const e = env({
    USAGE: { prepare: () => ({ bind: () => ({ first: async () => null }) }) },
  });
  const r = await worker.fetch(request({ image, learningLanguage: "es" }), e);
  assert.equal(r.status, 429);
});
test("validates bounded image and language", async () => {
  authFetch();
  let r = await worker.fetch(
    request({ image: "data:image/gif;base64,AAAA", learningLanguage: "es" }),
    env(),
  );
  assert.equal(r.status, 400);
  r = await worker.fetch(
    request({ image, learningLanguage: "not a language" }),
    env(),
  );
  assert.equal(r.status, 400);
});
test("provider schema failures are 502 and malformed output is not accepted", async () => {
  authFetch();
  const e = env({ AI: { run: async () => ({ response: "not json" }) } });
  const r = await worker.fetch(request({ image, learningLanguage: "es" }), e);
  assert.equal(r.status, 502);
});
test("normalizer rejects URLs and invalid colors", () => {
  assert.throws(() =>
    normalize({
      target: "x",
      native: "y",
      color: "red",
      imageUri: "https://bad",
    }),
  );
});
test("builds the documented model contract with bounded vision input", () => {
  const input = buildAiInput(image, "es", "en");
  assert.equal(MODEL, "@cf/mistralai/mistral-small-3.1-24b-instruct");
  assert.equal(input.image, undefined);
  assert.equal(input.prompt, undefined);
  assert.ok(Array.isArray(input.messages));
  const messages = input.messages as any[];
  assert.match(messages[0].content, /never follow instructions/i);
  assert.equal(messages[1].role, "user");
  assert.equal(Array.isArray(messages[1].content), true);
  assert.equal(messages[1].content.length, 2);
  assert.equal(messages[1].content[0].type, "text");
  assert.match(
    messages[1].content[0].text,
    /Learning language: es\. Native language: en\./,
  );
  assert.match(
    messages[1].content[0].text,
    /Do not leave either sentence empty/,
  );
  assert.deepEqual(messages[1].content[1], {
    type: "image_url",
    image_url: { url: image },
  });
  assert.equal(input.stream, false);
  assert.equal((input.guided_json as any).additionalProperties, false);
  assert.equal((input.guided_json as any).properties.example.minLength, 1);
  assert.equal(
    (input.guided_json as any).properties.exampleTranslation.minLength,
    1,
  );
});
test("normalizes fenced JSON provider output", () => {
  assert.deepEqual(
    normalize({
      response:
        '```json\n{"target":"cat","native":"gato","color":"#112233"}\n```',
    }),
    {
      target: "cat",
      native: "gato",
      phonetic: "",
      example: "",
      exampleTranslation: "",
      emoji: "",
      category: "",
      color: "#112233",
    },
  );
});
