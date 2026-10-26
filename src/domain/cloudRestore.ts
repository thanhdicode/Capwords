import type { AppState } from "./types";

/** An explicit restore is additive, never a remote overwrite of this device. */
export function mergeRestoredLibrary(
  current: AppState,
  restored: AppState,
): { state: AppState; addedCount: number } {
  const knownIds = new Set(current.words.map((word) => word.id));
  const additions = restored.words.filter((word) => {
    if (knownIds.has(word.id)) return false;
    knownIds.add(word.id);
    return true;
  });
  return {
    state: {
      ...current,
      words: [...current.words, ...additions],
      reviewDates: [
        ...new Set([...current.reviewDates, ...restored.reviewDates]),
      ].sort(),
      lastReview: current.lastReview ?? restored.lastReview ?? null,
    },
    addedCount: additions.length,
  };
}
