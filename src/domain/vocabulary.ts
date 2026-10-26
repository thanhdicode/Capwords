import type { NewWord, Word, WordPatch, WordReview } from "./types";

export const DEFAULT_REVIEW: WordReview = {
  dueAt: new Date(0).toISOString(),
  intervalDays: 0,
  repetitions: 0,
};

export function createWord(
  input: NewWord,
  now = new Date(),
  id = makeWordId(now),
): Word {
  return {
    ...input,
    id,
    createdAt: now.toISOString(),
    review: { ...DEFAULT_REVIEW },
  };
}

export function updateWord(word: Word, patch: WordPatch): Word {
  return { ...word, ...patch };
}

export function removeWord(words: Word[], id: string): Word[] {
  return words.filter((word) => word.id !== id);
}

export function toggleWordFavorite(word: Word): Word {
  return { ...word, favorite: !word.favorite };
}

export function makeWordId(now = new Date()): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `word-${now.getTime()}-${random}`;
}
