export const reviewSummaryReference = {
  "105": {
    good: 3,
    again: 1,
    total: 4,
    streakDays: 2,
  },
} as const;

export type ReviewSummarySourceId = keyof typeof reviewSummaryReference;

export function isReviewSummarySourceId(
  value: string | null,
): value is ReviewSummarySourceId {
  return value === "105";
}
