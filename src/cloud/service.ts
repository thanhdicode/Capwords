import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Directory, File as ExpoFile, Paths } from "expo-file-system";
import type { AppState } from "../domain/types";
import {
  createCloudClient,
  uniqueId,
  toMediaMetadata,
  type CloudClient,
  type CloudFile,
  type CloudUser,
  type UploadSource,
} from "./client";
import { paginateFiles } from "./serviceCore";
import { createCloudQuery } from "./cloudQueries";
import {
  IMAGE_MAX_BYTES,
  SNAPSHOT_MAX_BYTES,
  parseSnapshot,
  serializeSnapshot,
  snapshotFromState,
  validateMediaInput,
  mediaSignatureMatches,
  type CloudConfig,
  type CloudMediaKind,
  type CloudMediaMetadata,
  type CloudSnapshot,
} from "./schema";

export interface CloudMediaItem extends CloudMediaMetadata {
  file: CloudFile;
}
export interface RestoreResult {
  state: AppState;
  downloadedPhotos: number;
  downloadedPhotoUris?: string[];
}
const MEDIA_PREFIX = "media-";
const BACKUP_PREFIX = "backup-";
function requireUser(user: CloudUser | null): asserts user is CloudUser {
  if (!user || user.emailVerification !== true)
    throw new Error("Verify your email before using cloud storage");
}
function kindForMime(mimeType: string): CloudMediaKind | null {
  return mimeType.startsWith("image/")
    ? "photo"
    : mimeType.startsWith("video/")
      ? "video"
      : null;
}
function permissions(client: CloudClient, userId: string): string[] {
  return ["read", "update", "delete"].map((action) =>
    client.userPermission(userId, action as "read" | "update" | "delete"),
  );
}
function safeName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]/g, "-").slice(-80) || "file";
}
function sourceFromAsset(asset: ImagePicker.ImagePickerAsset): UploadSource {
  return {
    uri: asset.uri,
    name: `${MEDIA_PREFIX}${safeName(asset.fileName || `upload-${Date.now()}`)}`,
    mimeType: asset.mimeType || "",
    size: asset.fileSize || 0,
    webFile: asset.file as File | undefined,
  };
}

async function readMediaHeader(source: UploadSource): Promise<Uint8Array> {
  if (Platform.OS === "web") {
    if (!source.webFile) throw new Error("Web uploads require file bytes");
    return new Uint8Array(await source.webFile.slice(0, 12).arrayBuffer());
  }
  const reader = new ExpoFile(source.uri).readableStream().getReader();
  try {
    const { done, value } = await reader.read();
    return done || !value ? new Uint8Array() : value.slice(0, 12);
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

function extensionForMime(mime: string): string {
  return mime === "image/jpeg"
    ? ".jpg"
    : mime === "image/png"
      ? ".png"
      : mime === "image/webp"
        ? ".webp"
        : ".heic";
}
function mimeForExtension(ext: string): string {
  return ext === ".png"
    ? "image/png"
    : ext === ".webp"
      ? "image/webp"
      : ext === ".heic"
        ? "image/heic"
        : "image/jpeg";
}
export class CloudService {
  readonly client: CloudClient;
  readonly config: CloudConfig;
  constructor(config: CloudConfig, client = createCloudClient(config)) {
    this.config = config;
    this.client = client;
  }
  async getUser(): Promise<CloudUser | null> {
    try {
      return await this.client.account.get();
    } catch {
      return null;
    }
  }
  async sendCode(email: string): Promise<string> {
    const normalized = email.trim();
    if (!normalized) throw new Error("Enter an email address");
    return (
      await this.client.account.createEmailToken({
        userId: uniqueId(),
        email: normalized,
        phrase: false,
      })
    ).userId;
  }
  async verifyCode(userId: string, secret: string): Promise<CloudUser> {
    await this.client.account.createSession({
      userId: userId.trim(),
      secret: secret.trim(),
    });
    const user = await this.client.account.get();
    requireUser(user);
    return user;
  }
  async signOut(): Promise<void> {
    await this.client.account.deleteSession({ sessionId: "current" });
  }
  async getJWT(): Promise<string> {
    const user = await this.getUser();
    requireUser(user);
    return (await this.client.account.createJWT()).jwt;
  }
  private async allFiles(): Promise<CloudFile[]> {
    return paginateFiles(
      this.client.storage,
      this.config.bucketId,
      createCloudQuery,
    );
  }
  async listMedia(): Promise<CloudMediaItem[]> {
    const user = await this.getUser();
    requireUser(user);
    return (await this.allFiles())
      .filter((file) => file.name.startsWith(MEDIA_PREFIX))
      .flatMap((file) => {
        const kind = kindForMime(file.mimeType);
        return kind ? [{ ...toMediaMetadata(file, kind), file }] : [];
      });
  }
  async uploadMedia(
    source: UploadSource,
    user?: CloudUser | null,
  ): Promise<CloudMediaItem> {
    const current = user || (await this.getUser());
    requireUser(current);
    const kind = kindForMime(source.mimeType);
    if (!kind) throw new Error("Unsupported media MIME type");
    const checked = validateMediaInput({
      kind,
      mimeType: source.mimeType,
      size: source.size,
    });
    if (!checked.ok) throw new Error(checked.error);
    const header = await readMediaHeader(source);
    if (!mediaSignatureMatches(source.mimeType, header))
      throw new Error("The file contents do not match the declared media type");
    const normalized = {
      ...source,
      name: source.name.startsWith(MEDIA_PREFIX)
        ? source.name
        : `${MEDIA_PREFIX}${safeName(source.name)}`,
    };
    const file = await this.client.storage.createFile({
      bucketId: this.config.bucketId,
      fileId: uniqueId(),
      file:
        Platform.OS === "web"
          ? (() => {
              if (!normalized.webFile)
                throw new Error("Web uploads require file bytes");
              return new File([normalized.webFile], normalized.name, {
                type: normalized.mimeType,
              });
            })()
          : {
              name: normalized.name,
              type: normalized.mimeType,
              size: normalized.size,
              uri: normalized.uri,
            },
      permissions: permissions(this.client, current.$id),
    });
    return { ...toMediaMetadata(file, kind), file };
  }
  async pickAndUpload(kind: CloudMediaKind): Promise<CloudMediaItem> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: kind === "photo" ? ["images"] : ["videos"],
      allowsMultipleSelection: false,
      quality: 1,
    });
    if (result.canceled || !result.assets[0])
      throw new Error("Selection canceled");
    return this.uploadMedia(sourceFromAsset(result.assets[0]));
  }
  private async sourceForPhoto(
    uri: string,
    index: number,
  ): Promise<UploadSource> {
    if (Platform.OS === "web") {
      const response = await fetch(uri);
      if (!response.ok)
        throw new Error(`Could not read photo (${response.status})`);
      const blob = await response.blob();
      const mimeType = blob.type || "image/jpeg";
      return {
        uri,
        name: `${MEDIA_PREFIX}word-${index}.${mimeType.split("/")[1] || "jpg"}`,
        mimeType,
        size: blob.size,
        webFile: new File(
          [blob],
          `${MEDIA_PREFIX}word-${index}${extensionForMime(mimeType)}`,
          { type: mimeType },
        ),
      };
    }
    const file = new ExpoFile(uri);
    const info = file.info();
    const extension = (file.extension || ".jpg").toLowerCase();
    const mimeType = mimeForExtension(extension);
    return {
      uri,
      name: `${MEDIA_PREFIX}word-${index}${extension}`,
      mimeType,
      size: info.size || 0,
    };
  }
  async backup(
    state: AppState,
  ): Promise<{ snapshot: CloudSnapshot; partialMediaErrors: string[] }> {
    const user = await this.getUser();
    requireUser(user);
    const uploaded: CloudMediaMetadata[] = [];
    const errors: string[] = [];
    const mapping = new Map<string, CloudMediaMetadata>();
    for (let index = 0; index < state.words.length; index++) {
      const uri = state.words[index].imageUri;
      if (!uri) continue;
      try {
        let item = mapping.get(uri);
        if (!item) {
          item = await this.uploadMedia(
            await this.sourceForPhoto(uri, index),
            user,
          );
          mapping.set(uri, item);
        }
        if (!uploaded.some((existing) => existing.fileId === item.fileId))
          uploaded.push(item);
      } catch (error) {
        errors.push(
          `Word ${index + 1}: ${error instanceof Error ? error.message : "photo upload failed"}`,
        );
      }
    }
    if (errors.length) {
      await Promise.all(
        uploaded.map((item) =>
          this.client.storage.deleteFile({
            bucketId: this.config.bucketId,
            fileId: item.fileId,
          }),
        ),
      );
      throw new Error(
        `Backup not created. Fix and retry: ${errors.join("; ")}`,
      );
    }
    const media = uploaded;
    let snapshot: CloudSnapshot;
    try {
      snapshot = snapshotFromState(
        {
          ...state,
          words: state.words.map((word) => ({
            ...word,
            imageUri: word.imageUri
              ? mapping.get(word.imageUri)?.fileId
              : undefined,
          })),
        },
        media,
      );
      const text = serializeSnapshot(snapshot);
      const name = `${BACKUP_PREFIX}${Date.now()}.json`;
      if (Platform.OS === "web") {
        const file = new File([text], name, { type: "application/json" });
        await this.client.storage.createFile({
          bucketId: this.config.bucketId,
          fileId: uniqueId(),
          file,
          permissions: permissions(this.client, user.$id),
        });
      } else {
        const local = new ExpoFile(Paths.cache, name);
        await local.write(text);
        try {
          await this.client.storage.createFile({
            bucketId: this.config.bucketId,
            fileId: uniqueId(),
            file: {
              name,
              type: "application/json",
              size: new TextEncoder().encode(text).byteLength,
              uri: local.uri,
            },
            permissions: permissions(this.client, user.$id),
          });
        } finally {
          try {
            local.delete();
          } catch {
            /* best effort */
          }
        }
      }
    } catch (error) {
      await Promise.all(
        uploaded.map((item) =>
          this.client.storage.deleteFile({
            bucketId: this.config.bucketId,
            fileId: item.fileId,
          }),
        ),
      );
      throw error;
    }
    return { snapshot, partialMediaErrors: [] };
  }
  async cleanupRestoredFiles(uris: string[]): Promise<void> {
    if (Platform.OS === "web") return;
    for (const uri of uris) {
      try {
        new ExpoFile(uri).delete();
      } catch {
        /* best effort */
      }
    }
  }

  async restoreNewest(): Promise<RestoreResult> {
    const user = await this.getUser();
    requireUser(user);
    const files = (await this.allFiles())
      .filter((file) => file.name.startsWith(BACKUP_PREFIX))
      .sort((a, b) => b.$createdAt.localeCompare(a.$createdAt));
    if (!files[0]) throw new Error("No cloud backup found");
    const backupBytes = await this.client.storage.getFileDownload({
      bucketId: this.config.bucketId,
      fileId: files[0].$id,
    });
    if (backupBytes.byteLength > SNAPSHOT_MAX_BYTES)
      throw new Error("Backup snapshot exceeds the 5MB limit");
    let snapshot: CloudSnapshot;
    try {
      snapshot = parseSnapshot(
        JSON.parse(new TextDecoder().decode(backupBytes)),
      );
    } catch (error) {
      throw new Error(
        `Backup is invalid: ${error instanceof Error ? error.message : "parse failed"}`,
      );
    }
    const downloaded: Record<string, string> = {};
    const owned: ExpoFile[] = [];
    const directory =
      Platform.OS === "web"
        ? null
        : new Directory(Paths.document, "capwords-images");
    if (directory) directory.create({ intermediates: true, idempotent: true });
    try {
      for (const media of snapshot.media) {
        const metadata = await this.client.storage.getFile({
          bucketId: this.config.bucketId,
          fileId: media.fileId,
        });
        if (
          metadata.sizeOriginal !== media.size ||
          metadata.mimeType !== media.mimeType
        )
          throw new Error(`Photo metadata changed for ${media.fileId}`);
        const data = await this.client.storage.getFileDownload({
          bucketId: this.config.bucketId,
          fileId: media.fileId,
        });
        if (data.byteLength !== media.size || data.byteLength > IMAGE_MAX_BYTES)
          throw new Error(`Photo size is invalid for ${media.fileId}`);
        if (Platform.OS === "web")
          downloaded[media.fileId] =
            `data:${media.mimeType};base64,${arrayBufferToBase64(data)}`;
        else {
          const file = new ExpoFile(
            directory!,
            `${safeName(media.fileId)}-${Date.now()}-${safeName(media.name)}`,
          );
          await file.write(new Uint8Array(data));
          owned.push(file);
          downloaded[media.fileId] = file.uri;
        }
      }
    } catch (error) {
      for (const file of owned)
        try {
          file.delete();
        } catch {
          /* best effort */
        }
      throw new Error(
        `Restore failed while downloading media: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
    return {
      state: {
        ...snapshot.state,
        words: snapshot.state.words.map((word) => ({
          ...word,
          ...(word.cloudPhotoId
            ? { imageUri: downloaded[word.cloudPhotoId] }
            : {}),
        })),
      },
      downloadedPhotos: Object.keys(downloaded).length,
      downloadedPhotoUris: Object.values(downloaded),
    };
  }
}
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  new Uint8Array(buffer).forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}
