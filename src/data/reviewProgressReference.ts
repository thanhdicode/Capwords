export type ReviewProgressSourceId = "100" | "101" | "102";

/** Captured values and vocabulary order for the deterministic review-progress QA states. */
export const reviewProgressReference = {
  headline: "Congratulations",
  dateLabel: "September 12, 2025",
  cardTargets: ["Cornet De Glace", "Tournesol", "Obscurité", "Une Femme"],
  states: {
    "100": { progressPercent: 0, showRing: false },
    "101": {
      progressPercent: 6,
      showRing: true,
      transitionGlyphs: { previousDigit: "8", currentPrefix: "−" },
    },
    "102": { progressPercent: 75, showRing: true },
  },
} as const;

export function isReviewProgressSourceId(
  value: string | null,
): value is ReviewProgressSourceId {
  return value === "100" || value === "101" || value === "102";
}
