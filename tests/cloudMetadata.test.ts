import assert from "node:assert/strict";
import test from "node:test";
import { canonicalProviderInstant } from "../src/cloud/metadata";
import {
  parseSnapshot,
  serializeSnapshot,
  snapshotFromState,
} from "../src/cloud/schema";
import type { AppState } from "../src/domain/types";

test("canonicalizes actual Appwrite offset and fractional timestamps", () => {
  assert.equal(
    canonicalProviderInstant("2026-10-25T01:56:38.745+00:00"),
    "2026-10-25T01:56:38.745Z",
  );
  assert.equal(
    canonicalProviderInstant("2026-10-25T08:56:38.745123+07:00"),
    "2026-10-25T01:56:38.745Z",
  );
  for (const value of [undefined, "invalid", "2026-10-25"])
    assert.throws(() => canonicalProviderInstant(value));
});

test("backup with a real-provider media timestamp and word photo reference round-trips", () => {
  const date = "2026-10-25T01:56:38.745Z";
  const state: AppState = {
    onboarded: true,
    nativeLanguage: "en",
    learningLanguage: "fr",
    preferredSpeechVoiceId: null,
    profileName: "QA",
    dailyGoal: 10,
    dailyReminderEnabled: false,
    dailyReminderTime: "09:00",
    reviewRemindersEnabled: true,
    sound: true,
    reviewDates: [],
    lastReview: null,
    words: [
      {
        id: "qa-word",
        target: "glace",
        native: "ice cream",
        phonetic: "glahs",
        example: "Je veux une glace.",
        exampleTranslation: "I want an ice cream.",
        emoji: "🍦",
        category: "food",
        color: "#f0e68c",
        favorite: false,
        createdAt: date,
        review: { dueAt: date, intervalDays: 0, repetitions: 0 },
        imageUri: "cloud-photo-1",
      },
    ],
  };
  const snapshot = snapshotFromState(state, [
    {
      fileId: "cloud-photo-1",
      kind: "photo",
      name: "media-word.png",
      mimeType: "image/png",
      size: 26854,
      createdAt: canonicalProviderInstant("2026-10-25T01:56:38.745+00:00"),
    },
  ]);
  const restored = parseSnapshot(JSON.parse(serializeSnapshot(snapshot)));
  assert.equal(restored.state.words[0].cloudPhotoId, "cloud-photo-1");
  assert.equal("imageUri" in restored.state.words[0], false);
  assert.equal(restored.media[0].createdAt, date);
});
