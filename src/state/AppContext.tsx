import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DEMO_VOCABULARY } from "../data/demoVocabulary";
import { mergeRestoredLibrary } from "../domain/cloudRestore";
import {
  DEFAULT_REMINDER_SETTINGS,
  isValidPreferredSpeechVoiceId,
  isValidReminderTime,
  migrateReminderSettings,
} from "../domain/profileSettings";
import {
  createWord,
  removeWord,
  toggleWordFavorite,
  updateWord,
} from "../domain/vocabulary";
import {
  createReviewSummary,
  isValidReviewSummary,
  rateWord as applyRating,
  reviewDateKey,
} from "../domain/review";
import {
  persistLibraryImage,
  removeLibraryImage,
} from "../services/persistentImage";
import type {
  AppState,
  NewWord,
  ReviewRating,
  ReviewSummary,
  Word,
  WordPatch,
} from "../domain/types";

const STORAGE_KEY = "@capwords/state";
const STORAGE_VERSION = 1;

type ConfigState = Omit<AppState, "words" | "reviewDates">;
export type AppSettingsPatch = Partial<ConfigState>;

export const initialState: AppState = {
  onboarded: false,
  nativeLanguage: "",
  learningLanguage: "",
  preferredSpeechVoiceId: null,
  profileName: "",
  dailyGoal: 10,
  ...DEFAULT_REMINDER_SETTINGS,
  sound: true,
  words: [],
  reviewDates: [],
  lastReview: null,
};

interface PersistedState {
  version: number;
  state: AppState;
}

export interface AppContextValue {
  state: AppState;
  ready: boolean;
  completeOnboarding: (
    nativeLanguage: string,
    learningLanguage: string,
  ) => void;
  updateSettings: (patch: AppSettingsPatch) => void;
  updateSettingsAndPersist: (patch: AppSettingsPatch) => Promise<void>;
  addWord: (word: NewWord) => Promise<void>;
  mergeCloudSnapshot: (snapshot: AppState) => Promise<number>;
  editWord: (id: string, patch: WordPatch) => void;
  deleteWord: (id: string) => void;
  toggleFavorite: (id: string) => void;
  rateWord: (id: string, rating: ReviewRating) => void;
  recordReviewSummary: (
    stats: Pick<ReviewSummary, "good" | "again" | "total">,
  ) => void;
  resetDemo: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function isValidDateString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    Number.isFinite(new Date(value).getTime())
  );
}

function isValidWord(value: unknown): value is Word {
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

function isValidState(value: unknown): value is AppState {
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

function parsePersisted(raw: string | null): AppState | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const persisted = parsed as Partial<PersistedState>;
    if (
      persisted.version !== STORAGE_VERSION ||
      !persisted.state ||
      typeof persisted.state !== "object"
    )
      return null;

    // Older v1 saves have no summary. Invalid summary-only data is discarded
    // without rejecting otherwise valid user words/settings.
    const sourceState = persisted.state as unknown as Record<string, unknown>;
    const currentFields = { ...sourceState };
    delete currentFields.reminders;
    const migrated = {
      ...currentFields,
      ...migrateReminderSettings(sourceState),
      preferredSpeechVoiceId: isValidPreferredSpeechVoiceId(
        sourceState.preferredSpeechVoiceId,
      )
        ? sourceState.preferredSpeechVoiceId
        : null,
      profileAvatarUri:
        typeof sourceState.profileAvatarUri === "string"
          ? sourceState.profileAvatarUri
          : undefined,
      lastReview: isValidReviewSummary(sourceState.lastReview)
        ? sourceState.lastReview
        : null,
    };
    return isValidState(migrated) ? migrated : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const stateRef = useRef<AppState>(initialState);
  const [ready, setReady] = useState(false);
  const mutatedBeforeHydration = useRef(false);
  const writeQueue = useRef(Promise.resolve());

  const persistSnapshot = useCallback((snapshot: AppState) => {
    const payload: PersistedState = {
      version: STORAGE_VERSION,
      state: snapshot,
    };
    const write = writeQueue.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)));
    writeQueue.current = write.catch(() => undefined);
    return write;
  }, []);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (mounted && !mutatedBeforeHydration.current) {
          const restored = parsePersisted(raw) ?? initialState;
          stateRef.current = restored;
          setState(restored);
        }
      })
      .catch(() => {
        if (mounted && !mutatedBeforeHydration.current) {
          stateRef.current = initialState;
          setState(initialState);
        }
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    void persistSnapshot(state).catch(() => undefined);
  }, [ready, state, persistSnapshot]);

  const updateState = useCallback(
    (updater: (current: AppState) => AppState) => {
      if (!ready) mutatedBeforeHydration.current = true;
      const next = updater(stateRef.current);
      stateRef.current = next;
      setState(next);
      return next;
    },
    [ready],
  );

  const completeOnboarding = useCallback(
    (nativeLanguage: string, learningLanguage: string) => {
      updateState((current) => ({
        ...current,
        onboarded: true,
        nativeLanguage,
        learningLanguage,
      }));
    },
    [updateState],
  );

  const updateSettings = useCallback(
    (patch: AppSettingsPatch) => {
      updateState((current) => ({ ...current, ...patch }));
    },
    [updateState],
  );

  const updateSettingsAndPersist = useCallback(
    async (patch: AppSettingsPatch) => {
      try {
        while (true) {
          const previous = stateRef.current;
          const next = { ...previous, ...patch };
          await persistSnapshot(next);
          if (stateRef.current === previous) {
            updateState(() => next);
            return;
          }
        }
      } catch {
        throw new Error(
          "Settings could not be saved on this device. Check available storage and try again.",
        );
      }
    },
    [persistSnapshot, updateState],
  );

  const addWord = useCallback(
    async (word: NewWord) => {
      const created = createWord(word);
      const imageUri = await persistLibraryImage(created.imageUri, created.id);
      const savedWord = { ...created, imageUri };
      try {
        while (true) {
          const previous = stateRef.current;
          const next = { ...previous, words: [...previous.words, savedWord] };
          await persistSnapshot(next);
          if (stateRef.current === previous) {
            updateState(() => next);
            return;
          }
        }
      } catch {
        try {
          removeLibraryImage(imageUri);
        } catch {
          // A copied image is app-owned, but cleanup failure must not hide the save error.
        }
        throw new Error(
          "The word could not be saved to the library. Check available storage and try again.",
        );
      }
    },
    [persistSnapshot, updateState],
  );

  const mergeCloudSnapshot = useCallback(
    async (snapshot: AppState) => {
      if (!ready)
        throw new Error(
          "Your local library is still loading. Try again shortly.",
        );
      if (!isValidState(snapshot))
        throw new Error("This cloud backup contains invalid library data.");
      try {
        while (true) {
          const previous = stateRef.current;
          const merged = mergeRestoredLibrary(previous, snapshot);
          await persistSnapshot(merged.state);
          if (stateRef.current === previous) {
            updateState(() => merged.state);
            return merged.addedCount;
          }
        }
      } catch {
        throw new Error(
          "The restored library could not be saved on this device. Check available storage and try again.",
        );
      }
    },
    [ready, persistSnapshot, updateState],
  );

  const editWord = useCallback(
    (id: string, patch: WordPatch) => {
      updateState((current) => ({
        ...current,
        words: current.words.map((word) =>
          word.id === id ? updateWord(word, patch) : word,
        ),
      }));
    },
    [updateState],
  );

  const deleteWord = useCallback(
    (id: string) => {
      const removed = state.words.find((word) => word.id === id);
      updateState((current) => ({
        ...current,
        words: removeWord(current.words, id),
      }));
      try {
        removeLibraryImage(removed?.imageUri);
      } catch {
        // The user's delete remains effective; a failed file cleanup is non-fatal.
      }
    },
    [state.words, updateState],
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      updateState((current) => ({
        ...current,
        words: current.words.map((word) =>
          word.id === id ? toggleWordFavorite(word) : word,
        ),
      }));
    },
    [updateState],
  );

  const rateWord = useCallback(
    (id: string, rating: ReviewRating) => {
      const now = new Date();
      updateState((current) => ({
        ...current,
        words: current.words.map((word) =>
          word.id === id ? applyRating(word, rating, now) : word,
        ),
        reviewDates: current.reviewDates.includes(reviewDateKey(now))
          ? current.reviewDates
          : [...current.reviewDates, reviewDateKey(now)],
      }));
    },
    [updateState],
  );

  const resetDemo = useCallback(() => {
    const now = new Date();
    updateState((current) => ({
      ...current,
      words: DEMO_VOCABULARY.map((word, index) =>
        createWord(word, now, `demo-${index + 1}`),
      ),
      reviewDates: [],
    }));
  }, [updateState]);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      ready,
      completeOnboarding,
      updateSettings,
      updateSettingsAndPersist,
      addWord,
      mergeCloudSnapshot,
      editWord,
      deleteWord,
      toggleFavorite,
      rateWord,
      recordReviewSummary: (stats) =>
        updateSettings({ lastReview: createReviewSummary(stats) }),
      resetDemo,
    }),
    [
      state,
      ready,
      completeOnboarding,
      updateSettings,
      addWord,
      mergeCloudSnapshot,
      editWord,
      deleteWord,
      toggleFavorite,
      rateWord,
      resetDemo,
      updateSettingsAndPersist,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
