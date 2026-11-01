import assert from "node:assert/strict";
import test from "node:test";
import type { AppState } from "../src/domain/types";
import {
  APP_STATE_SNAPSHOT_VERSION,
  APP_STATE_STORAGE_KEY,
  createLocalAppStateRepository,
  UnsupportedAppStateSnapshotVersionError,
  type StringKeyValueStorage,
} from "../src/data/repositories/localAppStateRepository";

const currentState: AppState = {
  onboarded: true,
  nativeLanguage: "en",
  learningLanguage: "fr",
  preferredSpeechVoiceId: null,
  profileName: "Test learner",
  profileAvatarUri: "file:///profile/avatar.png",
  dailyGoal: 10,
  dailyReminderEnabled: false,
  dailyReminderTime: "08:30",
  reviewRemindersEnabled: true,
  sound: true,
  words: [
    {
      id: "flower-1",
      native: "flower",
      target: "fleur",
      phonetic: "/flœʁ/",
      example: "A flower is blooming.",
      exampleTranslation: "Une fleur est en train de fleurir.",
      emoji: "🌼",
      imageUri: "file:///library/flower.png",
      color: "#D8D3CA",
      category: "Nature",
      favorite: true,
      createdAt: "2026-10-25T08:00:00.000Z",
      review: {
        dueAt: "2026-10-26T08:00:00.000Z",
        intervalDays: 0,
        repetitions: 0,
      },
    },
  ],
  reviewDates: ["2026-10-25"],
  lastReview: {
    good: 1,
    again: 0,
    total: 1,
    completedAt: "2026-10-25T08:00:00.000Z",
  },
};

function createMemoryStorage(entries: [string, string][] = []) {
  const values = new Map(entries);
  let writeCount = 0;
  const storage: StringKeyValueStorage = {
    async getItem(key) {
      return values.get(key) ?? null;
    },
    async setItem(key, value) {
      writeCount += 1;
      values.set(key, value);
    },
  };
  return {
    storage,
    values,
    get writeCount() {
      return writeCount;
    },
  };
}

test("repository saves and reloads the existing version-1 snapshot envelope", async () => {
  const memory = createMemoryStorage();
  const repository = createLocalAppStateRepository(memory.storage);

  await repository.save(currentState);

  const raw = memory.values.get(APP_STATE_STORAGE_KEY);
  assert.ok(raw);
  assert.deepEqual(JSON.parse(raw), {
    version: APP_STATE_SNAPSHOT_VERSION,
    state: currentState,
  });
  assert.deepEqual(await repository.load(), currentState);
  assert.deepEqual(await repository.loadResult(), {
    status: "loaded",
    state: currentState,
  });

  const updatedState = { ...currentState, profileName: "Updated learner" };
  await repository.save(updatedState);
  assert.deepEqual(await repository.load(), updatedState);
  assert.equal(memory.writeCount, 2);
});

test("repository migrates legacy v1 fields without dropping saved words or images", async () => {
  const legacyState: Record<string, unknown> = {
    ...currentState,
    reminders: false,
    dailyReminderTime: "07:45",
    preferredSpeechVoiceId: "",
    profileAvatarUri: 42,
    lastReview: {
      good: 2,
      again: 0,
      total: 1,
      completedAt: "2026-10-25T08:00:00.000Z",
    },
  };
  delete legacyState.dailyReminderEnabled;
  delete legacyState.reviewRemindersEnabled;

  const memory = createMemoryStorage([
    [APP_STATE_STORAGE_KEY, JSON.stringify({ version: 1, state: legacyState })],
  ]);
  const repository = createLocalAppStateRepository(memory.storage);
  const restored = await repository.load();

  assert.ok(restored);
  assert.equal(restored.dailyReminderEnabled, false);
  assert.equal(restored.dailyReminderTime, "07:45");
  assert.equal(restored.reviewRemindersEnabled, false);
  assert.equal(restored.preferredSpeechVoiceId, null);
  assert.equal(restored.profileAvatarUri, undefined);
  assert.equal(restored.lastReview, null);
  assert.equal("reminders" in restored, false);
  assert.deepEqual(restored.words, currentState.words);
  assert.deepEqual(restored.reviewDates, currentState.reviewDates);
  assert.equal(memory.writeCount, 0);
});

test("explicit v1 reminder settings take precedence over the legacy toggle", async () => {
  const state = {
    ...currentState,
    reminders: false,
    dailyReminderEnabled: true,
    dailyReminderTime: "06:30",
    reviewRemindersEnabled: true,
  };
  const memory = createMemoryStorage([
    [APP_STATE_STORAGE_KEY, JSON.stringify({ version: 1, state })],
  ]);
  const repository = createLocalAppStateRepository(memory.storage);

  const restored = await repository.load();

  assert.ok(restored);
  assert.equal(restored.dailyReminderEnabled, true);
  assert.equal(restored.dailyReminderTime, "06:30");
  assert.equal(restored.reviewRemindersEnabled, true);
});

test("repository returns null for absent, malformed, future-version, or invalid snapshots", async () => {
  const repository = createLocalAppStateRepository(
    createMemoryStorage().storage,
  );
  assert.equal(await repository.load(), null);

  const invalidSnapshots = [
    "{not-json",
    JSON.stringify({ version: 2, state: currentState }),
    JSON.stringify({
      version: 1,
      state: { ...currentState, words: [{ id: "incomplete" }] },
    }),
  ];

  for (const raw of invalidSnapshots) {
    const memory = createMemoryStorage([[APP_STATE_STORAGE_KEY, raw]]);
    const candidate = createLocalAppStateRepository(memory.storage);
    assert.equal(await candidate.load(), null);
  }
});

test("repository reports unsupported versions separately from empty and invalid data", async () => {
  const empty = createLocalAppStateRepository(createMemoryStorage().storage);
  assert.deepEqual(await empty.loadResult(), { status: "empty" });

  const malformed = createLocalAppStateRepository(
    createMemoryStorage([[APP_STATE_STORAGE_KEY, "{not-json"]]).storage,
  );
  assert.deepEqual(await malformed.loadResult(), { status: "invalid" });

  for (const version of [0, 2]) {
    const raw = JSON.stringify({ version, state: { opaque: true } });
    const memory = createMemoryStorage([[APP_STATE_STORAGE_KEY, raw]]);
    const repository = createLocalAppStateRepository(memory.storage);

    assert.deepEqual(await repository.loadResult(), {
      status: "unsupported-version",
      version,
    });
    assert.equal(memory.values.get(APP_STATE_STORAGE_KEY), raw);
    assert.equal(memory.writeCount, 0);
  }
});

test("repository refuses to overwrite envelope versions it does not support", async () => {
  for (const version of [0, 2]) {
    const raw = JSON.stringify({ version, state: currentState });
    const memory = createMemoryStorage([[APP_STATE_STORAGE_KEY, raw]]);
    const repository = createLocalAppStateRepository(memory.storage);

    await assert.rejects(
      repository.save(currentState),
      (error: unknown) =>
        error instanceof UnsupportedAppStateSnapshotVersionError &&
        error.storedVersion === version &&
        error.supportedVersion === APP_STATE_SNAPSHOT_VERSION,
    );
    assert.equal(memory.values.get(APP_STATE_STORAGE_KEY), raw);
    assert.equal(memory.writeCount, 0);
  }
});

test("repository can still replace malformed JSON with the current v1 envelope", async () => {
  const memory = createMemoryStorage([[APP_STATE_STORAGE_KEY, "{not-json"]]);
  const repository = createLocalAppStateRepository(memory.storage);

  await repository.save(currentState);

  assert.deepEqual(JSON.parse(memory.values.get(APP_STATE_STORAGE_KEY)!), {
    version: APP_STATE_SNAPSHOT_VERSION,
    state: currentState,
  });
});

test("repository fails closed when it cannot inspect the stored envelope", async () => {
  let writes = 0;
  const storage: StringKeyValueStorage = {
    async getItem() {
      throw new Error("storage read failed");
    },
    async setItem() {
      writes += 1;
    },
  };
  const repository = createLocalAppStateRepository(storage);

  await assert.rejects(repository.save(currentState), /storage read failed/);
  assert.equal(writes, 0);
});

test("repository propagates storage write failures to the caller", async () => {
  const storage: StringKeyValueStorage = {
    async getItem() {
      return null;
    },
    async setItem() {
      throw new Error("storage full");
    },
  };
  const repository = createLocalAppStateRepository(storage);

  await assert.rejects(repository.save(currentState), /storage full/);
});
