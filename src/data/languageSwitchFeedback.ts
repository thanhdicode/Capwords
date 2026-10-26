export type LanguageSwitchStatus = "idle" | "saving" | "success" | "error";

export const LANGUAGE_SWITCH_COPY = {
  loading: "Changing learning language...",
  successTitle: "Language Switch Successful!",
  successBody: "Start learning in your new language and keep exploring!",
  errorTitle: "Couldn't save your language",
  errorBody:
    "Your language choice wasn't saved. Check available storage and try again.",
  retry: "Try again",
  cancel: "Cancel",
} as const;
