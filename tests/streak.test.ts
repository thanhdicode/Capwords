import test from "node:test";
import assert from "node:assert/strict";
import { calendarMonthDate, currentStreak } from "../src/domain/streak";

test("currentStreak counts consecutive local dates and ignores duplicates", () => {
  assert.equal(
    currentStreak(
      ["2025-09-10", "2025-09-11", "2025-09-12", "2025-09-12"],
      new Date(2025, 8, 12, 12),
    ),
    3,
  );
});
test("a streak survives an unfinished today but not a missed yesterday", () => {
  assert.equal(
    currentStreak(["2025-09-10", "2025-09-11"], new Date(2025, 8, 12, 12)),
    2,
  );
  assert.equal(currentStreak(["2025-09-10"], new Date(2025, 8, 12, 12)), 0);
});
test("calendar month navigation clamps day-of-month without rollover", () => {
  const leapFebruary = calendarMonthDate(new Date(2024, 0, 31, 18), 1);
  assert.equal(leapFebruary.getFullYear(), 2024);
  assert.equal(leapFebruary.getMonth(), 1);
  assert.equal(leapFebruary.getDate(), 29);
  assert.equal(leapFebruary.getHours(), 12);

  const nonLeapFebruary = calendarMonthDate(new Date(2025, 0, 31), 1);
  assert.equal(nonLeapFebruary.getDate(), 28);
  const previousMonth = calendarMonthDate(new Date(2025, 0, 31), -1);
  assert.equal(previousMonth.getMonth(), 11);
  assert.equal(previousMonth.getDate(), 31);
});
test("empty review history has zero streak", () => {
  assert.equal(currentStreak([], new Date(2025, 8, 12)), 0);
});
