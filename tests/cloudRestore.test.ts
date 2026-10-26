import assert from "node:assert/strict";
import test from "node:test";
import { mergeRestoredLibrary } from "../src/domain/cloudRestore";
import { createWord } from "../src/domain/vocabulary";
import type { AppState } from "../src/domain/types";

const word = (id: string, target: string) =>
  createWord(
    {
      target,
      native: target,
      phonetic: "",
      example: "",
      exampleTranslation: "",
      emoji: "",
      category: "Captured",
      color: "#D8D3CA",
      favorite: false,
    },
    new Date("2026-10-25T00:00:00Z"),
    id,
  );

const state = (): AppState => ({
  onboarded: true,
  nativeLanguage: "vi",
  learningLanguage: "fr",
  preferredSpeechVoiceId: null,
  profileName: "Local name",
  dailyGoal: 10,
  dailyReminderEnabled: false,
  dailyReminderTime: "09:00",
  reviewRemindersEnabled: true,
  sound: true,
  words: [word("local", "local edit")],
  reviewDates: ["2026-10-25"],
  lastReview: null,
});

test("restore adds missing ids once and preserves local content/settings", () => {
  const local = state();
  const remote: AppState = {
    ...state(),
    profileName: "Remote name",
    learningLanguage: "de",
    words: [
      word("local", "stale remote"),
      word("new", "new word"),
      word("new", "duplicate"),
    ],
    reviewDates: ["2026-10-24", "2026-10-25"],
  };
  const merged = mergeRestoredLibrary(local, remote);
  assert.equal(merged.addedCount, 1);
  assert.deepEqual(
    merged.state.words.map((entry) => entry.target),
    ["local edit", "new word"],
  );
  assert.equal(merged.state.profileName, "Local name");
  assert.equal(merged.state.learningLanguage, "fr");
  assert.deepEqual(merged.state.reviewDates, ["2026-10-24", "2026-10-25"]);
  assert.equal(local.words.length, 1);
  assert.deepEqual(local.reviewDates, ["2026-10-25"]);
  const again = mergeRestoredLibrary(merged.state, remote);
  assert.equal(again.addedCount, 0);
  assert.deepEqual(again.state, merged.state);
});

test("restores a missing review summary but never overwrites a local summary", () => {
  const remote = {
    ...state(),
    lastReview: {
      good: 1,
      again: 0,
      total: 1,
      completedAt: "2026-10-24T00:00:00Z",
    },
  };
  assert.equal(
    mergeRestoredLibrary(state(), remote).state.lastReview,
    remote.lastReview,
  );
  const local = {
    ...state(),
    lastReview: {
      good: 2,
      again: 1,
      total: 3,
      completedAt: "2026-10-25T00:00:00Z",
    },
  };
  assert.equal(
    mergeRestoredLibrary(local, remote).state.lastReview,
    local.lastReview,
  );
});
