import type {
  AppState,
  ReviewSummary,
  Word,
  WordReview,
} from "../domain/types";
import {
  isValidPreferredSpeechVoiceId,
  isValidReminderTime,
  migrateReminderSettings,
} from "../domain/profileSettings";

export const SNAPSHOT_VERSION = 2 as const;
const LEGACY_SNAPSHOT_VERSION = 1;
export const SNAPSHOT_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 50_000_000;
export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;
export const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;
export type CloudMediaKind = "photo" | "video";
export type CloudMediaMime =
  (typeof IMAGE_MIME_TYPES)[number] | (typeof VIDEO_MIME_TYPES)[number];
export interface CloudMediaMetadata {
  fileId: string;
  kind: CloudMediaKind;
  name: string;
  mimeType: CloudMediaMime;
  size: number;
  createdAt: string;
}
export interface CloudSnapshot {
  version: typeof SNAPSHOT_VERSION;
  createdAt: string;
  state: Omit<AppState, "words"> & {
    words: (Omit<Word, "imageUri"> & { cloudPhotoId?: string })[];
  };
  media: CloudMediaMetadata[];
}
export interface CloudConfig {
  endpoint: string;
  projectId: string;
  bucketId: string;
  platform: string;
}
const ID = /^[A-Za-z0-9._-]{1,36}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const text = (v: unknown): v is string =>
  typeof v === "string" && v.length <= 10000;
const instant = (v: unknown): v is string =>
  typeof v === "string" && ISO_INSTANT.test(v) && !Number.isNaN(Date.parse(v));
const dateKey = (v: unknown): v is string =>
  typeof v === "string" &&
  ISO_DATE.test(v) &&
  !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
const count = (v: unknown): v is number =>
  Number.isSafeInteger(v) && (v as number) >= 0;

export function readCloudConfig(
  env?: Record<string, string | undefined>,
): CloudConfig | null {
  const values = env ?? {
    EXPO_PUBLIC_APPWRITE_ENDPOINT: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
    EXPO_PUBLIC_APPWRITE_PROJECT_ID:
      process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
    EXPO_PUBLIC_APPWRITE_BUCKET_ID: process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID,
    EXPO_PUBLIC_APPWRITE_PLATFORM: process.env.EXPO_PUBLIC_APPWRITE_PLATFORM,
  };
  const endpoint = values.EXPO_PUBLIC_APPWRITE_ENDPOINT?.trim();
  const projectId = values.EXPO_PUBLIC_APPWRITE_PROJECT_ID?.trim();
  const bucketId = values.EXPO_PUBLIC_APPWRITE_BUCKET_ID?.trim();
  if (!endpoint || !projectId || !bucketId) return null;
  return {
    endpoint,
    projectId,
    bucketId,
    platform:
      values.EXPO_PUBLIC_APPWRITE_PLATFORM?.trim() || "dev.study.capwordsclone",
  };
}
export function validateMediaInput(input: {
  kind: CloudMediaKind;
  mimeType: string;
  size: number;
}): { ok: true } | { ok: false; error: string } {
  const allowed = input.kind === "photo" ? IMAGE_MIME_TYPES : VIDEO_MIME_TYPES;
  const max = input.kind === "photo" ? IMAGE_MAX_BYTES : VIDEO_MAX_BYTES;
  if (!(allowed as readonly string[]).includes(input.mimeType))
    return { ok: false, error: `Unsupported ${input.kind} MIME type` };
  if (!Number.isSafeInteger(input.size) || input.size <= 0 || input.size > max)
    return {
      ok: false,
      error: `${input.kind} exceeds the ${input.kind === "photo" ? "8MiB" : "50MB"} limit`,
    };
  return { ok: true };
}
function hasAsciiAt(bytes: Uint8Array, offset: number, value: string): boolean {
  return (
    bytes.length >= offset + value.length &&
    Array.from(value).every(
      (character, index) => character.charCodeAt(0) === bytes[offset + index],
    )
  );
}
function hasFtypBrand(bytes: Uint8Array, brands: readonly string[]): boolean {
  return (
    hasAsciiAt(bytes, 4, "ftyp") &&
    brands.some((brand) => hasAsciiAt(bytes, 8, brand))
  );
}
export function mediaSignatureMatches(
  mimeType: string,
  bytes: Uint8Array,
): boolean {
  switch (mimeType) {
    case "image/jpeg":
      return (
        bytes.length >= 3 &&
        bytes[0] === 0xff &&
        bytes[1] === 0xd8 &&
        bytes[2] === 0xff
      );
    case "image/png":
      return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
        (byte, index) => bytes[index] === byte,
      );
    case "image/webp":
      return hasAsciiAt(bytes, 0, "RIFF") && hasAsciiAt(bytes, 8, "WEBP");
    case "image/heic":
      return hasFtypBrand(bytes, [
        "heic",
        "heix",
        "hevc",
        "hevx",
        "heis",
        "hevm",
        "mif1",
        "msf1",
      ]);
    case "video/mp4":
      return hasFtypBrand(bytes, [
        "isom",
        "iso2",
        "iso3",
        "iso4",
        "iso5",
        "iso6",
        "iso8",
        "iso9",
        "mp41",
        "mp42",
        "avc1",
        "M4V ",
        "MSNV",
        "dash",
      ]);
    case "video/quicktime":
      return hasFtypBrand(bytes, ["qt  "]);
    case "video/webm":
      return (
        bytes.length >= 4 &&
        bytes[0] === 0x1a &&
        bytes[1] === 0x45 &&
        bytes[2] === 0xdf &&
        bytes[3] === 0xa3
      );
    default:
      return false;
  }
}
function review(v: unknown): WordReview | null {
  if (!v || typeof v !== "object") return null;
  const x = v as Record<string, unknown>;
  return instant(x.dueAt) && count(x.intervalDays) && count(x.repetitions)
    ? {
        dueAt: x.dueAt,
        intervalDays: x.intervalDays,
        repetitions: x.repetitions,
      }
    : null;
}
function word(v: unknown): CloudSnapshot["state"]["words"][number] | null {
  if (!v || typeof v !== "object") return null;
  const x = v as Record<string, unknown>;
  const fields = [
    "id",
    "native",
    "target",
    "phonetic",
    "example",
    "exampleTranslation",
    "emoji",
    "color",
    "category",
    "createdAt",
  ];
  if (
    !fields.every((field) => text(x[field])) ||
    !ID.test(String(x.id)) ||
    !instant(x.createdAt) ||
    typeof x.favorite !== "boolean" ||
    !review(x.review) ||
    "imageUri" in x ||
    (x.cloudPhotoId !== undefined && !ID.test(String(x.cloudPhotoId)))
  )
    return null;
  return {
    id: x.id as string,
    native: x.native as string,
    target: x.target as string,
    phonetic: x.phonetic as string,
    example: x.example as string,
    exampleTranslation: x.exampleTranslation as string,
    emoji: x.emoji as string,
    color: x.color as string,
    category: x.category as string,
    favorite: x.favorite,
    createdAt: x.createdAt as string,
    review: review(x.review)!,
    ...(x.cloudPhotoId ? { cloudPhotoId: x.cloudPhotoId as string } : {}),
  };
}
function summary(v: unknown): ReviewSummary | null | undefined {
  if (v == null) return v as null | undefined;
  if (!v || typeof v !== "object") return null;
  const x = v as Record<string, unknown>;
  return count(x.good) &&
    count(x.again) &&
    count(x.total) &&
    x.good + x.again === x.total &&
    instant(x.completedAt)
    ? {
        good: x.good,
        again: x.again,
        total: x.total,
        completedAt: x.completedAt,
      }
    : null;
}
function media(v: unknown): CloudMediaMetadata | null {
  if (!v || typeof v !== "object") return null;
  const x = v as Record<string, unknown>;
  const kind = x.kind === "photo" || x.kind === "video" ? x.kind : null;
  const mime =
    typeof x.mimeType === "string" ? (x.mimeType as CloudMediaMime) : null;
  const allowed = kind === "photo" ? IMAGE_MIME_TYPES : VIDEO_MIME_TYPES;
  const max = kind === "photo" ? IMAGE_MAX_BYTES : VIDEO_MAX_BYTES;
  return kind &&
    mime &&
    (allowed as readonly string[]).includes(mime) &&
    ID.test(String(x.fileId)) &&
    text(x.name) &&
    instant(x.createdAt) &&
    Number.isSafeInteger(x.size) &&
    (x.size as number) > 0 &&
    (x.size as number) <= max
    ? {
        fileId: x.fileId as string,
        kind,
        name: x.name as string,
        mimeType: mime,
        size: x.size as number,
        createdAt: x.createdAt as string,
      }
    : null;
}
export function snapshotFromState(
  state: AppState,
  items: CloudMediaMetadata[],
  createdAt = new Date().toISOString(),
): CloudSnapshot {
  const photos = items.filter((item) => item.kind === "photo");
  return {
    version: SNAPSHOT_VERSION,
    createdAt,
    state: {
      onboarded: state.onboarded,
      nativeLanguage: state.nativeLanguage,
      learningLanguage: state.learningLanguage,
      preferredSpeechVoiceId: state.preferredSpeechVoiceId,
      profileName: state.profileName,
      dailyGoal: state.dailyGoal,
      dailyReminderEnabled: state.dailyReminderEnabled,
      dailyReminderTime: state.dailyReminderTime,
      reviewRemindersEnabled: state.reviewRemindersEnabled,
      sound: state.sound,
      reviewDates: [...state.reviewDates],
      lastReview: state.lastReview,
      words: state.words.map(({ imageUri, ...w }) => ({
        ...w,
        ...(imageUri && photos.some((item) => item.fileId === imageUri)
          ? { cloudPhotoId: imageUri }
          : {}),
      })),
    },
    media: photos,
  };
}
export function parseSnapshot(input: unknown): CloudSnapshot {
  let bytes: number;
  try {
    bytes = new TextEncoder().encode(JSON.stringify(input)).byteLength;
  } catch {
    throw new Error("Invalid backup snapshot");
  }
  if (bytes > SNAPSHOT_MAX_BYTES || !input || typeof input !== "object")
    throw new Error("Invalid backup snapshot");
  const x = input as Record<string, unknown>;
  const s = x.state as Record<string, unknown>;
  const reminderSettingsAreValid =
    x.version === LEGACY_SNAPSHOT_VERSION
      ? typeof s?.reminders === "boolean" ||
        (typeof s?.dailyReminderEnabled === "boolean" &&
          isValidReminderTime(s?.dailyReminderTime) &&
          typeof s?.reviewRemindersEnabled === "boolean")
      : typeof s?.dailyReminderEnabled === "boolean" &&
        isValidReminderTime(s?.dailyReminderTime) &&
        typeof s?.reviewRemindersEnabled === "boolean";
  const preferredSpeechVoiceIsValid =
    s?.preferredSpeechVoiceId === undefined ||
    isValidPreferredSpeechVoiceId(s?.preferredSpeechVoiceId);
  if (
    (x.version !== SNAPSHOT_VERSION && x.version !== LEGACY_SNAPSHOT_VERSION) ||
    !instant(x.createdAt) ||
    !s ||
    typeof s !== "object" ||
    !Array.isArray(s.words) ||
    !Array.isArray(s.reviewDates) ||
    typeof s.onboarded !== "boolean" ||
    !text(s.nativeLanguage) ||
    !text(s.learningLanguage) ||
    !text(s.profileName) ||
    !count(s.dailyGoal) ||
    !reminderSettingsAreValid ||
    !preferredSpeechVoiceIsValid ||
    typeof s.sound !== "boolean" ||
    s.words.length > 10000 ||
    s.reviewDates.length > 10000 ||
    !s.reviewDates.every(dateKey) ||
    !(
      s.lastReview === null ||
      s.lastReview === undefined ||
      summary(s.lastReview)
    )
  )
    throw new Error("Unsupported or invalid backup snapshot");
  const words = s.words.map(word);
  if (words.some((w) => !w))
    throw new Error("Unsupported or invalid backup snapshot");
  const wordIds = new Set<string>();
  for (const w of words as CloudSnapshot["state"]["words"]) {
    if (wordIds.has(w.id))
      throw new Error("Backup contains duplicate word IDs");
    wordIds.add(w.id);
  }
  if (!Array.isArray(x.media) || x.media.length > 10000)
    throw new Error("Unsupported or invalid backup snapshot");
  const items = x.media.map(media);
  if (items.some((m) => !m))
    throw new Error("Unsupported or invalid backup snapshot");
  const mediaItems = items as CloudMediaMetadata[];
  const reminderSettings = migrateReminderSettings(s);
  const ids = new Set<string>();
  for (const m of mediaItems) {
    if (ids.has(m.fileId))
      throw new Error("Backup contains duplicate media IDs");
    ids.add(m.fileId);
  }
  for (const w of words as CloudSnapshot["state"]["words"])
    if (
      w.cloudPhotoId &&
      !mediaItems.some((m) => m.fileId === w.cloudPhotoId && m.kind === "photo")
    )
      throw new Error("Backup contains an invalid photo reference");
  return {
    version: SNAPSHOT_VERSION,
    createdAt: x.createdAt as string,
    state: {
      onboarded: s.onboarded,
      nativeLanguage: s.nativeLanguage as string,
      learningLanguage: s.learningLanguage as string,
      preferredSpeechVoiceId: isValidPreferredSpeechVoiceId(
        s.preferredSpeechVoiceId,
      )
        ? s.preferredSpeechVoiceId
        : null,
      profileName: s.profileName as string,
      dailyGoal: s.dailyGoal as number,
      ...reminderSettings,
      sound: s.sound,
      reviewDates: [...s.reviewDates] as string[],
      lastReview: summary(s.lastReview),
      words: words as CloudSnapshot["state"]["words"],
    },
    media: mediaItems,
  };
}
export function serializeSnapshot(snapshot: CloudSnapshot): string {
  const text = JSON.stringify(parseSnapshot(snapshot));
  if (new TextEncoder().encode(text).byteLength > SNAPSHOT_MAX_BYTES)
    throw new Error("Backup snapshot exceeds the 5MB limit");
  return text;
}
