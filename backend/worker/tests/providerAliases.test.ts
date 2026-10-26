import assert from "node:assert/strict";
import test from "node:test";
import { normalize } from "../src/index";

test("normalizes observed Mistral aliases into the canonical bounded response", () => {
  const result = normalize({
    response:
      '```json\n{"target":"glace","translation":"ice cream","phoneticSpelling":"glahs","example":"Je veux une glace.","exampleTranslation":"I want an ice cream.","emoji":"🍦","category":"food","color":"#f0e68c","imageUri":"https://untrusted.example/image"}\n```',
  });
  assert.deepEqual(result, {
    target: "glace",
    native: "ice cream",
    phonetic: "glahs",
    example: "Je veux une glace.",
    exampleTranslation: "I want an ice cream.",
    emoji: "🍦",
    category: "food",
    color: "#f0e68c",
  });
  assert.equal("imageUri" in result, false);
});

test("provider aliases retain strict type and size validation", () => {
  assert.throws(() =>
    normalize({ target: "glace", translation: "x".repeat(10000) }),
  );
  assert.throws(() =>
    normalize({ target: "glace", native: 42, translation: "ice cream" }),
  );
  assert.throws(() =>
    normalize({
      target: "glace",
      translation: "ice cream",
      phoneticSpelling: {},
    }),
  );
});
