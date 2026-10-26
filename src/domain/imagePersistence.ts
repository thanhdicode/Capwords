export type ImagePlatform = "ios" | "android" | "web" | string;

const supportedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
]);

export function persistentImageDestination(
  uri: string,
  wordId: string,
  documentUri: string,
  platform: ImagePlatform,
): string | null {
  if (platform === "web" || !uri.startsWith("file://")) return null;
  const root = `${documentUri.replace(/\/+$/, "")}/capwords-images`;
  if (uri.startsWith(`${root}/`)) return uri;
  const path = uri.split(/[?#]/, 1)[0] || uri;
  const candidate = /\.[a-zA-Z0-9]+$/.exec(path)?.[0]?.toLowerCase();
  const extension =
    candidate && supportedExtensions.has(candidate) ? candidate : ".jpg";
  const safeId = wordId.replace(/[^a-zA-Z0-9_-]/g, "_") || "image";
  return `${root}/${safeId}${extension}`;
}

export function isPersistentLibraryImage(
  uri: string,
  documentUri: string,
): boolean {
  const root = `${documentUri.replace(/\/+$/, "")}/capwords-images/`;
  return uri.startsWith(root);
}

const lowStorageSignals = [
  "enospc",
  "no space left",
  "disk full",
  "storage full",
  "not enough space",
  "quota exceeded",
];

export function imagePersistenceErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();
  if (lowStorageSignals.some((signal) => normalized.includes(signal))) {
    return "Your device is low on storage, so this photo could not be saved. Free up space and try again.";
  }
  return "Could not copy this photo to permanent storage. Check available device storage and try again, or choose a smaller photo.";
}
