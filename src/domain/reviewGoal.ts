/** Choices visible in Gummble sources 022/043; do not normalize saved data. */
export const DAILY_REVIEW_GOALS = [5, 10, 15, 20, 25, 30, 35, 40] as const;
export type DailyReviewGoal = (typeof DAILY_REVIEW_GOALS)[number];

export function isDailyReviewGoal(value: unknown): value is DailyReviewGoal {
  return DAILY_REVIEW_GOALS.some((goal) => goal === value);
}
