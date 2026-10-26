import type { NewWord } from "./types";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_WORD_FIELD_LENGTH = 200;
export const MAX_OPTIONAL_FIELD_LENGTH = 500;

const DEFAULT_COLOR = "#D8D3CA";
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export interface RecognitionPayloadContext {
  nativeLanguage?: string;
  accessToken?: string;
}

export interface RecognitionRequestPayload {
  image: string;
  learningLanguage: string;
  nativeLanguage?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`The recognition service returned an invalid ${field}.`);
  }
  if (value.length > MAX_WORD_FIELD_LENGTH) {
    throw new Error(
      `The recognition service returned an overly long ${field}.`,
    );
  }
  return value;
}

function optionalString(
  value: unknown,
  field: string,
  fallback: string,
): string {
  if (value === undefined) return fallback;
  if (typeof value !== "string") {
    throw new Error(`The recognition service returned an invalid ${field}.`);
  }
  if (value.length > MAX_OPTIONAL_FIELD_LENGTH) {
    throw new Error(
      `The recognition service returned an overly long ${field}.`,
    );
  }
  return value;
}

/** Validate the endpoint before any request is made. Production is restricted to the project's Worker host. */
export function validateRecognitionEndpoint(endpoint: string): URL {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error("The recognition service URL is invalid.");
  }
  const localHost =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "[::1]" ||
    url.hostname === "::1";
  const trustedWorker =
    url.hostname.toLowerCase() ===
    "capwords-recognition-worker.capwords-1suen5.workers.dev";
  if (
    url.username ||
    url.password ||
    (!localHost && !trustedWorker) ||
    (trustedWorker && url.port)
  ) {
    throw new Error("The recognition service URL is not allowed.");
  }
  if (url.protocol !== "https:" && !(url.protocol === "http:" && localHost)) {
    throw new Error("The recognition service must use HTTPS.");
  }
  return url;
}

/** Return decoded base64 size without decoding or retaining image bytes. */
export function decodedBase64ByteLength(base64: string): number {
  if (
    typeof base64 !== "string" ||
    base64.length === 0 ||
    base64.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(base64) ||
    (base64.includes("=") && !/=+$/.test(base64))
  ) {
    throw new Error(
      "The image could not be prepared. Please choose or capture it again.",
    );
  }
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length / 4) * 3 - padding;
}

export function assertImageWithinLimit(base64: string): void {
  if (decodedBase64ByteLength(base64) > MAX_IMAGE_BYTES) {
    throw new Error(
      "The image is too large. Please choose an image smaller than 8 MB.",
    );
  }
}

export function buildRecognitionRequestPayload(
  base64: string,
  mimeType: string | undefined,
  learningLanguage: string,
  context?: RecognitionPayloadContext,
): RecognitionRequestPayload {
  assertImageWithinLimit(base64);
  const payload: RecognitionRequestPayload = {
    image: `data:${mimeType || "image/jpeg"};base64,${base64}`,
    learningLanguage,
  };
  if (context?.nativeLanguage !== undefined) {
    payload.nativeLanguage = context.nativeLanguage;
  }
  return payload;
}

/** Normalize only provider data; the capture URI is deliberately supplied by the caller. */
export function normalizeRecognitionResponse(
  value: unknown,
  captureImageUri: string,
): NewWord {
  if (!isRecord(value)) {
    throw new Error("The recognition service returned an invalid word.");
  }
  const target = requiredString(value.target, "target");
  const native = requiredString(value.native, "native");
  const phonetic = optionalString(value.phonetic, "phonetic", "");
  const example = optionalString(value.example, "example", "");
  const exampleTranslation = optionalString(
    value.exampleTranslation,
    "exampleTranslation",
    "",
  );
  const emoji = optionalString(value.emoji, "emoji", "📸");
  const category = optionalString(value.category, "category", "Captured");
  const color = value.color === undefined ? DEFAULT_COLOR : value.color;
  if (typeof color !== "string" || !HEX_COLOR.test(color)) {
    throw new Error("The recognition service returned an invalid color.");
  }
  if (color.length > MAX_OPTIONAL_FIELD_LENGTH) {
    throw new Error("The recognition service returned an overly long color.");
  }
  return {
    target,
    native,
    phonetic,
    example,
    exampleTranslation,
    emoji,
    imageUri: captureImageUri,
    color,
    category,
    favorite: false,
  };
}
