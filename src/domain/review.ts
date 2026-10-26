import type { ReviewRating, ReviewSummary, Word, WordReview } from "./types";

const GOOD_INTERVALS = [1, 3, 7, 14, 30, 60];

export interface ReviewOutcome {
  wordId: string;
  rating: ReviewRating;
}

export function isValidReviewGoal(goal: number): boolean {
  return Number.isInteger(goal) && goal >= 5 && goal <= 40;
}

export function isValidReviewSummary(value: unknown): value is ReviewSummary {
  if (!value || typeof value !== "object") return false;
  const summary = value as Partial<ReviewSummary>;
  return (
    Number.isInteger(summary.good) &&
    Number.isInteger(summary.again) &&
    Number.isInteger(summary.total) &&
    (summary.good ?? -1) >= 0 &&
    (summary.again ?? -1) >= 0 &&
    (summary.total ?? 0) > 0 &&
    summary.good! + summary.again! === summary.total &&
    typeof summary.completedAt === "string" &&
    Number.isFinite(new Date(summary.completedAt).getTime())
  );
}

export function createReviewSummary(
  stats: Pick<ReviewSummary, "good" | "again" | "total">,
  completedAt = new Date(),
): ReviewSummary {
  return { ...stats, completedAt: completedAt.toISOString() };
}

export function nextReview(
  current: WordReview,
  rating: ReviewRating,
  now = new Date(),
): WordReview {
  if (rating === "again") {
    return {
      dueAt: now.toISOString(),
      intervalDays: 0,
      repetitions: 0,
    };
  }

  const repetitions = current.repetitions + 1;
  const intervalDays =
    GOOD_INTERVALS[Math.min(repetitions - 1, GOOD_INTERVALS.length - 1)];
  const dueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  return { dueAt: dueAt.toISOString(), intervalDays, repetitions };
}

export function rateWord(
  word: Word,
  rating: ReviewRating,
  now = new Date(),
): Word {
  return { ...word, review: nextReview(word.review, rating, now) };
}

export function isWordDue(word: Word, now = new Date()): boolean {
  return new Date(word.review.dueAt).getTime() <= now.getTime();
}

export function dueWords(words: Word[], now = new Date()): Word[] {
  return words.filter((word) => isWordDue(word, now));
}

export function reviewDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
