const PROVIDER_INSTANT =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

/** Appwrite returns +00:00 timestamps; snapshots use canonical UTC Z values. */
export function canonicalProviderInstant(value: unknown): string {
  if (
    typeof value !== "string" ||
    !PROVIDER_INSTANT.test(value) ||
    !Number.isFinite(Date.parse(value))
  )
    throw new Error("Cloud file returned an invalid creation date");
  return new Date(value).toISOString();
}
