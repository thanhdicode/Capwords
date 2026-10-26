import type { ReviewOutcome } from "../domain/review";
import type { Word } from "../domain/types";

export const reviewCompletionReference = {
  headline: "You have mastered quite a few words!",
  ringHeadline: "Congratulations",
  fixtureDateLabel: "September 12, 2025",
  fixtureOutcomes: [
    { target: "Un cornet de glace", rating: "good" },
    { target: "Tournesol", rating: "good" },
    { target: "Obscurité", rating: "good" },
    { target: "Une Femme", rating: "again" },
  ],
  captures: {
    "103": { confetti: true },
    "104": { confetti: false },
  },
} as const;

export type ReviewCompletionSourceId =
  keyof typeof reviewCompletionReference.captures;

export function isReviewCompletionSourceId(
  value: string | null,
): value is ReviewCompletionSourceId {
  return value === "103" || value === "104";
}

/** QA-only source mapping; every tile resolves to a seeded vocabulary record. */
export function getReviewCompletionFixtureOutcomes(
  sourceId: ReviewCompletionSourceId,
  words: Word[],
): ReviewOutcome[] {
  const byTarget = new Map(words.map((word) => [word.target, word]));
  return reviewCompletionReference.fixtureOutcomes.flatMap(
    ({ target, rating }) => {
      if (!byTarget.has(target)) return [];
      return [{ wordId: byTarget.get(target)!.id, rating }];
    },
  );
}
