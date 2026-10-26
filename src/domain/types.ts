export type ReviewRating = "again" | "good";

export interface WordReview {
  dueAt: string;
  intervalDays: number;
  repetitions: number;
}

export interface ReviewSummary {
  good: number;
  again: number;
  total: number;
  completedAt: string;
}

export interface Word {
  id: string;
  native: string;
  target: string;
  phonetic: string;
  example: string;
  exampleTranslation: string;
  emoji: string;
  imageUri?: string;
  color: string;
  category: string;
  favorite: boolean;
  createdAt: string;
  review: WordReview;
}

export type NewWord = Omit<Word, "id" | "createdAt" | "review">;
export type WordPatch = Partial<NewWord>;

export interface AppState {
  onboarded: boolean;
  nativeLanguage: string;
  learningLanguage: string;
  preferredSpeechVoiceId: string | null;
  profileName: string;
  profileAvatarUri?: string;
  dailyGoal: number;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
  reviewRemindersEnabled: boolean;
  sound: boolean;
  words: Word[];
  reviewDates: string[];
  lastReview?: ReviewSummary | null;
}
