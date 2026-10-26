const MAX_DOWNLOAD_BYTES = 50_000_000;

interface PrivateDownloadOptions {
  endpoint: string;
  projectId: string;
  bucketId: string;
  fileId: string;
  createJWT: () => Promise<{ jwt: string }>;
  fetcher?: typeof fetch;
}

/** User-scoped access only; no admin keys, persistent tokens, or public file URLs. */
export async function downloadPrivateFile({
  endpoint,
  projectId,
  bucketId,
  fileId,
  createJWT,
  fetcher = fetch,
}: PrivateDownloadOptions): Promise<ArrayBuffer> {
  const { jwt } = await createJWT();
  if (typeof jwt !== "string" || !jwt)
    throw new Error("Cloud authentication returned no access token");
  const url = `${endpoint.replace(/\/$/, "")}/storage/buckets/${encodeURIComponent(bucketId)}/files/${encodeURIComponent(fileId)}/download`;
  const response = await fetcher(url, {
    method: "GET",
    headers: {
      "X-Appwrite-Project": projectId,
      "X-Appwrite-JWT": jwt,
    },
    credentials: "omit",
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(`Cloud download failed (HTTP ${response.status})`);
  const declaredLength = Number(response.headers.get("content-length"));
  if (declaredLength > MAX_DOWNLOAD_BYTES) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error("Cloud download exceeds the file limit");
  }
  // SDK Client.call parses application/json before honoring arrayBuffer. Use the
  // authenticated public HTTP endpoint here so JSON snapshots retain raw bytes.
  const bytes = await response.arrayBuffer();
  if (!bytes.byteLength) throw new Error("Cloud download returned no bytes");
  if (bytes.byteLength > MAX_DOWNLOAD_BYTES)
    throw new Error("Cloud download exceeds the file limit");
  return bytes;
}
