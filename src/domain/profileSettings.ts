export interface ReminderSettings {
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
  reviewRemindersEnabled: boolean;
}

export const HOURS_PER_DAY = 24;
export const MINUTES_PER_HOUR = 60;

export const DEFAULT_REMINDER_SETTINGS: Readonly<ReminderSettings> = {
  dailyReminderEnabled: true,
  dailyReminderTime: "09:00",
  reviewRemindersEnabled: true,
};

export function isValidReminderTime(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return false;
  const [hour, minute] = value.split(":").map(Number);
  return hour >= 0 && hour < 24 && minute >= 0 && minute < 60;
}

/** Migrate the original single reminder toggle without losing either new preference. */
export function migrateReminderSettings(
  value: Record<string, unknown>,
): ReminderSettings {
  const legacyEnabled =
    typeof value.reminders === "boolean" ? value.reminders : undefined;
  return {
    dailyReminderEnabled:
      typeof value.dailyReminderEnabled === "boolean"
        ? value.dailyReminderEnabled
        : (legacyEnabled ?? DEFAULT_REMINDER_SETTINGS.dailyReminderEnabled),
    dailyReminderTime: isValidReminderTime(value.dailyReminderTime)
      ? value.dailyReminderTime
      : DEFAULT_REMINDER_SETTINGS.dailyReminderTime,
    reviewRemindersEnabled:
      typeof value.reviewRemindersEnabled === "boolean"
        ? value.reviewRemindersEnabled
        : (legacyEnabled ?? DEFAULT_REMINDER_SETTINGS.reviewRemindersEnabled),
  };
}

export function isValidPreferredSpeechVoiceId(
  value: unknown,
): value is string | null {
  return (
    value === null ||
    (typeof value === "string" && value.length > 0 && value.length <= 512)
  );
}
