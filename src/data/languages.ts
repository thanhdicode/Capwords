export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: readonly Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  {
    code: "en-GB",
    name: "English (British)",
    nativeName: "English (British)",
    flag: "🇬🇧",
  },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
];

/** Source-backed order for the onboarding native-language list. */
export const ONBOARDING_NATIVE_LANGUAGE_ORDER = [
  "en",
  "zh",
  "en-GB",
  "es",
  "ja",
  "ko",
  "de",
  "it",
] as const;

/** Source order for the Profile learning-language grid. */
export const LEARNING_LANGUAGE_ORDER = [
  "zh",
  "en",
  "en-GB",
  "fr",
  "es",
  "ja",
  "ko",
  "de",
] as const;

const learningLanguagePriority = new Set<string>(LEARNING_LANGUAGE_ORDER);
const languagesByCode = new Map(
  LANGUAGES.map((language) => [language.code, language]),
);

export const PROFILE_LEARNING_LANGUAGES: readonly Language[] = [
  ...LEARNING_LANGUAGE_ORDER.flatMap((code) => {
    const language = languagesByCode.get(code);
    return language ? [language] : [];
  }),
  ...LANGUAGES.filter(
    (language) => !learningLanguagePriority.has(language.code),
  ),
];
