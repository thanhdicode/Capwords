import assert from "node:assert/strict";
import test from "node:test";
import {
  IMAGE_MAX_BYTES,
  SNAPSHOT_MAX_BYTES,
  parseSnapshot,
  readCloudConfig,
  serializeSnapshot,
  snapshotFromState,
  mediaSignatureMatches,
  validateMediaInput,
} from "../src/cloud/schema";
import type { AppState } from "../src/domain/types";

const state: AppState = {
  onboarded: true,
  nativeLanguage: "en",
  learningLanguage: "es",
  preferredSpeechVoiceId: null,
  profileName: "",
  dailyGoal: 5,
  dailyReminderEnabled: false,
  dailyReminderTime: "09:00",
  reviewRemindersEnabled: true,
  sound: true,
  words: [],
  reviewDates: [],
  lastReview: null,
};
test("cloud config requires all public IDs and uses registered platform default", () => {
  assert.equal(readCloudConfig({}), null);
  assert.equal(
    readCloudConfig({
      EXPO_PUBLIC_APPWRITE_ENDPOINT: "https://x",
      EXPO_PUBLIC_APPWRITE_PROJECT_ID: "p",
      EXPO_PUBLIC_APPWRITE_BUCKET_ID: "b",
    })?.platform,
    "dev.study.capwordsclone",
  );
});
test("media validation rejects unknown MIME and size overflow", () => {
  assert.equal(
    validateMediaInput({ kind: "photo", mimeType: "image/gif", size: 10 }).ok,
    false,
  );
  assert.equal(
    validateMediaInput({
      kind: "photo",
      mimeType: "image/jpeg",
      size: IMAGE_MAX_BYTES + 1,
    }).ok,
    false,
  );
  assert.equal(
    validateMediaInput({ kind: "video", mimeType: "video/mp4", size: 10 }).ok,
    true,
  );
});
test("media signatures must match the declared image or video MIME type", () => {
  const ascii = (value: string) => new TextEncoder().encode(value);
  const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]);
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const webp = Uint8Array.from([
    ...ascii("RIFF"),
    0,
    0,
    0,
    0,
    ...ascii("WEBP"),
  ]);
  const heic = Uint8Array.from([...ascii("\0\0\0\0ftypheic")]);
  const mp4 = Uint8Array.from([...ascii("\0\0\0\0ftypisom")]);
  const quicktime = Uint8Array.from([...ascii("\0\0\0\0ftypqt  ")]);
  const webm = Uint8Array.from([0x1a, 0x45, 0xdf, 0xa3]);
  assert.equal(mediaSignatureMatches("image/jpeg", jpeg), true);
  assert.equal(mediaSignatureMatches("image/png", png), true);
  assert.equal(mediaSignatureMatches("image/webp", webp), true);
  assert.equal(mediaSignatureMatches("image/heic", heic), true);
  assert.equal(mediaSignatureMatches("video/mp4", mp4), true);
  assert.equal(mediaSignatureMatches("video/quicktime", quicktime), true);
  assert.equal(mediaSignatureMatches("video/webm", webm), true);
  assert.equal(mediaSignatureMatches("image/png", jpeg), false);
  assert.equal(mediaSignatureMatches("application/pdf", ascii("%PDF-")), false);
});
test("snapshot omits local word-image and profile-avatar URIs", () => {
  const profileAvatarUri =
    "file:///app/Documents/capwords-images/profile-avatar-123.jpg";
  const snapshot = snapshotFromState({ ...state, profileAvatarUri }, []);
  const text = serializeSnapshot(snapshot);
  assert.ok(text.length < SNAPSHOT_MAX_BYTES);
  assert.equal(text.includes(profileAvatarUri), false);
  assert.equal("profileAvatarUri" in snapshot.state, false);
  assert.deepEqual(parseSnapshot(JSON.parse(text)).state.words, []);
});
test("snapshot parser rejects wrong version", () => {
  assert.throws(() =>
    parseSnapshot({ version: 3, state: { words: [] }, media: [] }),
  );
});

test("legacy v1 reminder preference migrates and new v2 values round-trip", () => {
  const legacy = {
    version: 1,
    createdAt: "2026-10-25T00:00:00.000Z",
    state: {
      onboarded: true,
      nativeLanguage: "en",
      learningLanguage: "es",
      profileName: "",
      dailyGoal: 5,
      reminders: false,
      sound: true,
      words: [],
      reviewDates: [],
      lastReview: null,
    },
    media: [],
  };
  const restoredLegacy = parseSnapshot(legacy).state;
  assert.equal(restoredLegacy.dailyReminderEnabled, false);
  assert.equal(restoredLegacy.reviewRemindersEnabled, false);
  assert.equal(restoredLegacy.dailyReminderTime, "09:00");
  assert.equal(restoredLegacy.preferredSpeechVoiceId, null);

  const current = snapshotFromState(
    {
      ...state,
      preferredSpeechVoiceId: "system-voice-identifier",
      dailyReminderEnabled: false,
      dailyReminderTime: "07:45",
      reviewRemindersEnabled: true,
    },
    [],
  );
  assert.equal(current.version, 2);
  const restoredCurrent = parseSnapshot(
    JSON.parse(serializeSnapshot(current)),
  ).state;
  assert.equal(restoredCurrent.dailyReminderEnabled, false);
  assert.equal(restoredCurrent.dailyReminderTime, "07:45");
  assert.equal(restoredCurrent.reviewRemindersEnabled, true);
  assert.equal(
    restoredCurrent.preferredSpeechVoiceId,
    "system-voice-identifier",
  );
});

test("snapshot parser rejects duplicate IDs, invalid dates, forbidden imageUri, and MIME graph mismatches", () => {
  const base = {
    version: 1,
    createdAt: "2026-10-25T00:00:00.000Z",
    state: { ...state, words: [] },
    media: [],
  };
  assert.throws(() => parseSnapshot({ ...base, createdAt: "not-a-date" }));
  assert.throws(() =>
    parseSnapshot({
      ...base,
      state: {
        ...base.state,
        words: [
          {
            id: "bad id",
            native: "",
            target: "",
            phonetic: "",
            example: "",
            exampleTranslation: "",
            emoji: "",
            color: "",
            category: "",
            favorite: false,
            createdAt: "2026-10-25T00:00:00.000Z",
            review: {
              dueAt: "2026-10-25T00:00:00.000Z",
              intervalDays: 0,
              repetitions: 0,
            },
          },
        ],
      },
    }),
  );
  assert.throws(() =>
    parseSnapshot({
      ...base,
      state: {
        ...base.state,
        words: [
          {
            id: "word",
            native: "",
            target: "",
            phonetic: "",
            example: "",
            exampleTranslation: "",
            emoji: "",
            color: "",
            category: "",
            favorite: false,
            imageUri: "file:///private",
            createdAt: "2026-10-25T00:00:00.000Z",
            review: {
              dueAt: "2026-10-25T00:00:00.000Z",
              intervalDays: 0,
              repetitions: 0,
            },
          },
        ],
      },
    }),
  );
  assert.throws(() =>
    parseSnapshot({
      ...base,
      media: [
        {
          fileId: "photo",
          kind: "photo",
          name: "x.mp4",
          mimeType: "video/mp4",
          size: 10,
          createdAt: "2026-10-25T00:00:00.000Z",
        },
      ],
    }),
  );
});
