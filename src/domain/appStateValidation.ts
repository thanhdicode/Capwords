import {
  isValidPreferredSpeechVoiceId,
  isValidReminderTime,
} from "./profileSettings";
import { isValidReviewSummary } from "./review";
import type { AppState, Word } from "./types";

function isValidDateString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    Number.isFinite(new Date(value).getTime())
  );
}

export function isValidWord(value: unknown): value is Word {
  if (!value || typeof value !== "object") return false;
  const word = value as Partial<Word>;
  const review = word.review;
  return (
    typeof word.id === "string" &&
    word.id.length > 0 &&
    typeof word.native === "string" &&
    typeof word.target === "string" &&
    typeof word.phonetic === "string" &&
    typeof word.example === "string" &&
    typeof word.exampleTranslation === "string" &&
    typeof word.emoji === "string" &&
    typeof word.color === "string" &&
    typeof word.category === "string" &&
    typeof word.favorite === "boolean" &&
    isValidDateString(word.createdAt) &&
    typeof review === "object" &&
    review !== null &&
    isValidDateString(review.dueAt) &&
    Number.isInteger(review.intervalDays) &&
    review.intervalDays >= 0 &&
    Number.isInteger(review.repetitions) &&
    review.repetitions >= 0 &&
    (word.imageUri === undefined || typeof word.imageUri === "string")
  );
}

export function isValidAppState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<AppState>;
  return (
    typeof state.onboarded === "boolean" &&
    typeof state.nativeLanguage === "string" &&
    typeof state.learningLanguage === "string" &&
    isValidPreferredSpeechVoiceId(state.preferredSpeechVoiceId) &&
    typeof state.profileName === "string" &&
    (state.profileAvatarUri === undefined ||
      typeof state.profileAvatarUri === "string") &&
    typeof state.dailyGoal === "number" &&
    Number.isFinite(state.dailyGoal) &&
    Number.isInteger(state.dailyGoal) &&
    state.dailyGoal >= 0 &&
    typeof state.dailyReminderEnabled === "boolean" &&
    isValidReminderTime(state.dailyReminderTime) &&
    typeof state.reviewRemindersEnabled === "boolean" &&
    typeof state.sound === "boolean" &&
    Array.isArray(state.words) &&
    state.words.every(isValidWord) &&
    Array.isArray(state.reviewDates) &&
    state.reviewDates.every(
      (date) =>
        /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        isValidDateString(`${date}T00:00:00`),
    ) &&
    (state.lastReview === undefined ||
      state.lastReview === null ||
      isValidReviewSummary(state.lastReview))
  );
}
