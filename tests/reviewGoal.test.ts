import assert from "node:assert/strict";
import test from "node:test";
import {
  DAILY_REVIEW_GOALS,
  isDailyReviewGoal,
} from "../src/domain/reviewGoal";

test("daily review goals expose exactly the eight source choices", () => {
  assert.deepEqual(DAILY_REVIEW_GOALS, [5, 10, 15, 20, 25, 30, 35, 40]);
  for (const goal of DAILY_REVIEW_GOALS)
    assert.equal(isDailyReviewGoal(goal), true);
});

test("invalid persisted goals require a choice instead of silent normalization", () => {
  for (const value of [
    0,
    -5,
    1,
    7,
    41,
    2.5,
    NaN,
    Infinity,
    "10",
    null,
    undefined,
  ]) {
    assert.equal(isDailyReviewGoal(value), false, String(value));
  }
});
