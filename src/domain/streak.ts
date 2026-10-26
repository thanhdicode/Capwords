import { reviewDateKey } from "./review";

/** A streak remains alive until the day after its last completed local date. */
export function currentStreak(
  reviewDates: readonly string[],
  now = new Date(),
): number {
  const dates = new Set(reviewDates);
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!dates.has(reviewDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (dates.has(reviewDateKey(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

/** Keeps the current day-of-month where possible, clamping at month boundaries. */
export function calendarMonthDate(now: Date, monthOffset: number): Date {
  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth() + monthOffset,
    1,
  );
  const lastDay = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0,
  ).getDate();
  return new Date(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    Math.min(now.getDate(), lastDay),
    12,
  );
}
