import type { CloudFile, CloudFilePage } from "./client";
import type { CloudMediaMetadata } from "./schema";

export interface CoreStorage {
  listFiles(params: {
    bucketId: string;
    queries?: string[];
  }): Promise<CloudFilePage>;
  deleteFile(params: { bucketId: string; fileId: string }): Promise<unknown>;
}
export interface CoreUpload {
  name: string;
  mimeType: string;
  size: number;
  bytes: Uint8Array;
}
export interface CoreUploader {
  upload(file: CoreUpload): Promise<CloudMediaMetadata>;
}
export function paginateFiles(
  storage: Pick<CoreStorage, "listFiles">,
  bucketId: string,
  query: (method: "limit" | "offset", value: number) => string,
): Promise<CloudFile[]> {
  return (async () => {
    const result: CloudFile[] = [];
    for (let offset = 0; ; offset += 100) {
      const page = await storage.listFiles({
        bucketId,
        queries: [query("limit", 100), query("offset", offset)],
      });
      result.push(...page.files);
      if (page.total !== undefined) {
        if (result.length >= page.total) return result;
      } else if (page.files.length < 100) {
        return result;
      }
    }
  })();
}
export function normalizedUpload(source: {
  name: string;
  mimeType: string;
  size: number;
  bytes: Uint8Array;
}): CoreUpload {
  const safe =
    source.name.replace(/[^A-Za-z0-9._-]/g, "-").slice(-80) || "file";
  const name = safe.startsWith("media-") ? safe : `media-${safe}`;
  return {
    name,
    mimeType: source.mimeType,
    size: source.size,
    bytes: source.bytes.slice(),
  };
}
export async function uploadSharedPhotos(
  uris: string[],
  sourceForUri: (uri: string, index: number) => Promise<CoreUpload>,
  uploader: CoreUploader,
  cleanup: (fileId: string) => Promise<unknown>,
): Promise<Map<string, CloudMediaMetadata>> {
  const mapping = new Map<string, CloudMediaMetadata>();
  const created: CloudMediaMetadata[] = [];
  try {
    for (let index = 0; index < uris.length; index++) {
      const uri = uris[index];
      if (!uri || mapping.has(uri)) continue;
      const item = await uploader.upload(await sourceForUri(uri, index));
      mapping.set(uri, item);
      created.push(item);
    }
    return mapping;
  } catch (error) {
    await Promise.all(created.map((item) => cleanup(item.fileId)));
    throw error;
  }
}
