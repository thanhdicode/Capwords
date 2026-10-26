import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_REMINDER_SETTINGS,
  isValidPreferredSpeechVoiceId,
  isValidReminderTime,
  migrateReminderSettings,
} from "../src/domain/profileSettings";

test("reminder time accepts valid local 24-hour values only", () => {
  for (const value of ["00:00", "09:00", "23:59"])
    assert.equal(isValidReminderTime(value), true, value);
  for (const value of ["24:00", "12:60", "9:00", "noon", null])
    assert.equal(isValidReminderTime(value), false, String(value));
});

test("single legacy reminder flag migrates to both independent settings", () => {
  assert.deepEqual(migrateReminderSettings({ reminders: false }), {
    dailyReminderEnabled: false,
    dailyReminderTime: DEFAULT_REMINDER_SETTINGS.dailyReminderTime,
    reviewRemindersEnabled: false,
  });
  assert.deepEqual(
    migrateReminderSettings({
      reminders: false,
      dailyReminderEnabled: false,
      dailyReminderTime: "07:45",
      reviewRemindersEnabled: true,
    }),
    {
      dailyReminderEnabled: false,
      dailyReminderTime: "07:45",
      reviewRemindersEnabled: true,
    },
  );
});

test("invalid saved reminder time recovers to the documented default", () => {
  assert.equal(
    migrateReminderSettings({ dailyReminderTime: "26:99" }).dailyReminderTime,
    DEFAULT_REMINDER_SETTINGS.dailyReminderTime,
  );
});

test("preferred voice accepts system identifiers or the system-default null value", () => {
  assert.equal(isValidPreferredSpeechVoiceId(null), true);
  assert.equal(isValidPreferredSpeechVoiceId("system.voice.identifier"), true);
  assert.equal(isValidPreferredSpeechVoiceId(""), false);
  assert.equal(isValidPreferredSpeechVoiceId("x".repeat(513)), false);
});
