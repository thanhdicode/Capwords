import type { DailyReviewGoal } from "../domain/reviewGoal";

/** UI copy visible in the Gummble daily-review goal sheet. */
export const dailyReviewGoalCopy = {
  title: "Daily review amount",
  remainingLead: "You have",
  singularWord: "word",
  pluralWord: "words",
  remainingTail: "left to review",
  done: "Done",
  cancel: "Cancel",
  cancelAccessibilityLabel: "Cancel daily review amount",
} as const;

/**
 * Captured values for screenshot-only states. These never replace the real
 * review queue or persisted daily goal outside an explicitly gated fixture.
 */
export const reviewGoalReference = {
  "022": { remainingCount: 5, selectedGoal: 5 },
  "043": { remainingCount: 15, selectedGoal: 15 },
} as const satisfies Record<
  string,
  { remainingCount: number; selectedGoal: DailyReviewGoal }
>;

export type ReviewGoalReferenceId = keyof typeof reviewGoalReference;

export function isReviewGoalReferenceId(
  value: string | null,
): value is ReviewGoalReferenceId {
  return value === "022" || value === "043";
}
