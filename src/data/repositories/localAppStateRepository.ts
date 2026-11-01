import {
  isValidPreferredSpeechVoiceId,
  migrateReminderSettings,
} from "../../domain/profileSettings";
import { isValidReviewSummary } from "../../domain/review";
import { isValidAppState } from "../../domain/appStateValidation";
import type { AppState } from "../../domain/types";

export const APP_STATE_STORAGE_KEY = "@capwords/state";
export const APP_STATE_SNAPSHOT_VERSION = 1;

export interface StringKeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export interface LocalAppStateRepository {
  load(): Promise<AppState | null>;
  loadResult(): Promise<LocalAppStateLoadResult>;
  save(state: AppState): Promise<void>;
}

export type LocalAppStateLoadResult =
  | { status: "empty" }
  | { status: "loaded"; state: AppState }
  | { status: "invalid" }
  | { status: "unsupported-version"; version: number };

export class UnsupportedAppStateSnapshotVersionError extends Error {
  readonly supportedVersion = APP_STATE_SNAPSHOT_VERSION;

  constructor(readonly storedVersion: number) {
    super(
      `Cannot overwrite AppState envelope version ${storedVersion} with supported version ${APP_STATE_SNAPSHOT_VERSION}.`,
    );
    this.name = "UnsupportedAppStateSnapshotVersionError";
  }
}

interface PersistedAppState {
  version: number;
  state: unknown;
}

function readPersistedEnvelopeVersion(raw: string | null): number | null {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const version = (parsed as { version?: unknown }).version;
    return typeof version === "number" ? version : null;
  } catch {
    return null;
  }
}

function migrateVersion1State(value: unknown): AppState | null {
  if (!value || typeof value !== "object") return null;

  const sourceState = value as Record<string, unknown>;
  const currentFields = { ...sourceState };
  delete currentFields.reminders;

  const migratedState = {
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

  return isValidAppState(migratedState) ? migratedState : null;
}

export function inspectPersistedAppState(
  raw: string | null,
): LocalAppStateLoadResult {
  if (!raw) return { status: "empty" };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { status: "invalid" };

    const persisted = parsed as Partial<PersistedAppState>;
    if (typeof persisted.version !== "number") return { status: "invalid" };
    if (persisted.version !== APP_STATE_SNAPSHOT_VERSION)
      return { status: "unsupported-version", version: persisted.version };
    if (!("state" in persisted)) return { status: "invalid" };

    const state = migrateVersion1State(persisted.state);
    return state ? { status: "loaded", state } : { status: "invalid" };
  } catch {
    return { status: "invalid" };
  }
}

export function decodePersistedAppState(raw: string | null): AppState | null {
  const result = inspectPersistedAppState(raw);
  return result.status === "loaded" ? result.state : null;
}

export function createLocalAppStateRepository(
  storage: StringKeyValueStorage,
): LocalAppStateRepository {
  const loadResult = async (): Promise<LocalAppStateLoadResult> =>
    inspectPersistedAppState(await storage.getItem(APP_STATE_STORAGE_KEY));

  return {
    async load() {
      const result = await loadResult();
      return result.status === "loaded" ? result.state : null;
    },
    loadResult,
    async save(state) {
      const existingVersion = readPersistedEnvelopeVersion(
        await storage.getItem(APP_STATE_STORAGE_KEY),
      );
      if (
        existingVersion !== null &&
        existingVersion !== APP_STATE_SNAPSHOT_VERSION
      ) {
        throw new UnsupportedAppStateSnapshotVersionError(existingVersion);
      }

      const persisted: PersistedAppState = {
        version: APP_STATE_SNAPSHOT_VERSION,
        state,
      };
      await storage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(persisted));
    },
  };
}
