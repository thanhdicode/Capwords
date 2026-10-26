import type { SpeechVoiceOption } from "../domain/speechVoice";
import type { AppState } from "../domain/types";
import {
  SOURCE_048_SELECTED_VOICE_ID,
  SOURCE_048_VOICE_OPTIONS,
} from "./profileVoiceReference";
import type { LanguageSwitchStatus } from "./languageSwitchFeedback";
import type { SpokenContentTutorialStep } from "./profileTutorial";

export interface ProfileSourceFixture {
  settings: Pick<
    AppState,
    | "profileName"
    | "learningLanguage"
    | "preferredSpeechVoiceId"
    | "dailyReminderEnabled"
    | "dailyReminderTime"
    | "reviewRemindersEnabled"
  >;
  languageSwitchStatus: LanguageSwitchStatus;
  initialSheet: "reminder" | "voice" | null;
  tutorialStep?: SpokenContentTutorialStep;
  voiceOptions?: readonly SpeechVoiceOption[];
  voiceDownloadCompletion?: boolean;
}

const sourceProfileSettings: ProfileSourceFixture["settings"] = {
  profileName: "Sam",
  learningLanguage: "fr",
  preferredSpeechVoiceId: null,
  dailyReminderEnabled: false,
  dailyReminderTime: "09:00",
  reviewRemindersEnabled: true,
};

export const PROFILE_SOURCE_FIXTURES = {
  languageLoading062: {
    settings: sourceProfileSettings,
    languageSwitchStatus: "saving",
    initialSheet: null,
  },
  reminderDisabled026: {
    settings: {
      ...sourceProfileSettings,
      dailyReminderTime: "08:00",
    },
    languageSwitchStatus: "idle",
    initialSheet: "reminder",
  },
  reminderTime063: {
    settings: {
      ...sourceProfileSettings,
      dailyReminderEnabled: true,
    },
    languageSwitchStatus: "idle",
    initialSheet: "reminder",
  },
  reminderTime047: {
    settings: {
      ...sourceProfileSettings,
      dailyReminderEnabled: true,
      dailyReminderTime: "08:00",
    },
    languageSwitchStatus: "idle",
    initialSheet: "reminder",
  },
  voiceChooser048: {
    settings: {
      ...sourceProfileSettings,
      learningLanguage: "ko",
      preferredSpeechVoiceId: SOURCE_048_SELECTED_VOICE_ID,
    },
    languageSwitchStatus: "idle",
    initialSheet: "voice",
    voiceOptions: SOURCE_048_VOICE_OPTIONS,
  },
  voiceDownload049: {
    settings: {
      ...sourceProfileSettings,
      learningLanguage: "ko",
    },
    languageSwitchStatus: "idle",
    initialSheet: "voice",
    voiceDownloadCompletion: true,
  },
  languageSuccess071: {
    settings: sourceProfileSettings,
    languageSwitchStatus: "success",
    initialSheet: null,
  },
  spokenContentStep1: {
    settings: sourceProfileSettings,
    languageSwitchStatus: "idle",
    initialSheet: "voice",
    tutorialStep: 1,
  },
  spokenContentStep3: {
    settings: sourceProfileSettings,
    languageSwitchStatus: "idle",
    initialSheet: "voice",
    tutorialStep: 3,
  },
} as const satisfies Record<string, ProfileSourceFixture>;

export type ProfileSourceFixtureName = keyof typeof PROFILE_SOURCE_FIXTURES;

export function getProfileSourceFixture(
  name: string | null,
): ProfileSourceFixture | undefined {
  if (!name || !Object.hasOwn(PROFILE_SOURCE_FIXTURES, name)) return undefined;
  return PROFILE_SOURCE_FIXTURES[name as ProfileSourceFixtureName];
}
