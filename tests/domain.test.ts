// @ts-ignore Node's runtime test modules are available through tsx; this app does not install @types/node.
import assert from "node:assert/strict";
// @ts-ignore Node's runtime test modules are available through tsx; this app does not install @types/node.
import test from "node:test";
import {
  createReviewSummary,
  dueWords,
  isValidReviewGoal,
  isValidReviewSummary,
  nextReview,
  reviewDateKey,
} from "../src/domain/review";
import {
  createWord,
  removeWord,
  toggleWordFavorite,
  updateWord,
} from "../src/domain/vocabulary";
import type { NewWord } from "../src/domain/types";
import {
  buildHomeTimeline,
  wordsForHomeDate,
} from "../src/domain/homeTimeline";

const sample: NewWord = {
  native: "hello",
  target: "hola",
  phonetic: "OH-la",
  example: "Hola.",
  exampleTranslation: "Hello.",
  emoji: "👋",
  color: "#fff",
  category: "Greetings",
  favorite: false,
};

const now = new Date("2026-01-02T12:00:00.000Z");

test("createWord adds stable identity, timestamp, and a fresh review record", () => {
  const word = createWord(sample, now, "word-1");
  assert.equal(word.id, "word-1");
  assert.equal(word.createdAt, now.toISOString());
  assert.deepEqual(word.review, {
    dueAt: new Date(0).toISOString(),
    intervalDays: 0,
    repetitions: 0,
  });
  assert.equal(word.target, "hola");
});

test("vocabulary helpers are immutable", () => {
  const word = createWord(sample, now, "word-1");
  const edited = updateWord(word, { target: "buenas" });
  assert.equal(word.target, "hola");
  assert.equal(edited.target, "buenas");
  assert.equal(toggleWordFavorite(word).favorite, true);
  assert.equal(removeWord([word], "word-1").length, 0);
});

test("good ratings progress through spaced intervals", () => {
  const first = nextReview(
    { dueAt: now.toISOString(), intervalDays: 0, repetitions: 0 },
    "good",
    now,
  );
  assert.equal(first.intervalDays, 1);
  assert.equal(first.repetitions, 1);
  assert.equal(first.dueAt, "2026-01-03T12:00:00.000Z");

  const second = nextReview(first, "good", now);
  assert.equal(second.intervalDays, 3);
  assert.equal(second.repetitions, 2);
});

test("again resets repetitions and makes a word immediately due", () => {
  const review = nextReview(
    { dueAt: "2030-01-01T00:00:00.000Z", intervalDays: 30, repetitions: 5 },
    "again",
    now,
  );
  assert.deepEqual(review, {
    dueAt: now.toISOString(),
    intervalDays: 0,
    repetitions: 0,
  });
});

test("dueWords and reviewDateKey select due words predictably", () => {
  const due = createWord(sample, now, "due");
  const future = {
    ...due,
    id: "future",
    review: nextReview(due.review, "good", now),
  };
  assert.deepEqual(
    dueWords([due, future], now).map((word) => word.id),
    ["due"],
  );
  assert.equal(reviewDateKey(now), "2026-01-02");
});

test("review goals must be whole numbers from 5 through 40", () => {
  assert.equal(isValidReviewGoal(5), true);
  assert.equal(isValidReviewGoal(40), true);
  for (const invalid of [0, 4, 41, 5.5, Number.NaN]) {
    assert.equal(isValidReviewGoal(invalid), false);
  }
});

test("completed review summaries validate counts and completion time", () => {
  const summary = createReviewSummary({ good: 3, again: 2, total: 5 }, now);
  assert.deepEqual(summary, {
    good: 3,
    again: 2,
    total: 5,
    completedAt: now.toISOString(),
  });
  assert.equal(isValidReviewSummary(summary), true);
  assert.equal(isValidReviewSummary({ ...summary, total: 6 }), false);
  assert.equal(
    isValidReviewSummary({ ...summary, completedAt: "invalid" }),
    false,
  );
});

test("reviewDateKey follows the local calendar date, not the UTC date", () => {
  const localDate = new Date(2026, 0, 2, 0, 30, 0);
  const expected = [
    localDate.getFullYear(),
    String(localDate.getMonth() + 1).padStart(2, "0"),
    String(localDate.getDate()).padStart(2, "0"),
  ].join("-");
  assert.equal(reviewDateKey(localDate), expected);
});

test("good review increments from the stored repetition count", () => {
  const review = nextReview(
    { dueAt: now.toISOString(), intervalDays: 30, repetitions: 5 },
    "good",
    now,
  );
  assert.equal(review.repetitions, 6);
  assert.equal(review.intervalDays, 60);
});

test("Home timeline groups local capture dates and always includes today", () => {
  const today = new Date(2026, 8, 12, 12);
  const yesterday = new Date(2026, 8, 11, 12);
  const twoDaysAgo = new Date(2026, 8, 10, 12);
  const yesterdayWord = createWord(sample, yesterday, "yesterday");
  const olderWord = createWord(sample, twoDaysAgo, "older");
  const newerTodayWord = createWord(sample, new Date(2026, 8, 12, 16), "today");
  const timeline = buildHomeTimeline(
    [olderWord, yesterdayWord, newerTodayWord],
    today,
  );

  assert.deepEqual(
    timeline.map((day) => [day.dateKey, day.words.map((word) => word.id)]),
    [
      ["2026-09-12", ["today"]],
      ["2026-09-11", ["yesterday"]],
      ["2026-09-10", ["older"]],
    ],
  );
  assert.equal(timeline[0].dayLabel, "Sep 12");
  assert.equal(timeline[1].monthLabel, "September");
  assert.deepEqual(
    wordsForHomeDate([olderWord, yesterdayWord], "2026-09-11").map(
      (word) => word.id,
    ),
    ["yesterday"],
  );
  assert.deepEqual(wordsForHomeDate([yesterdayWord], "2026-02-31"), []);
});
