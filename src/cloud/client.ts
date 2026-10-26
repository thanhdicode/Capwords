import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import type { CloudConfig, CloudMediaKind, CloudMediaMetadata } from "./schema";
import { downloadPrivateFile } from "./download";
import { canonicalProviderInstant } from "./metadata";

export interface CloudUser {
  $id: string;
  email: string;
  name?: string;
  emailVerification?: boolean;
}
export interface UploadSource {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
  webFile?: File;
}
export interface NativeInputFile {
  name: string;
  type: string;
  size: number;
  uri: string;
}
export interface CloudFile {
  $id: string;
  name: string;
  mimeType: string;
  sizeOriginal: number;
  $createdAt: string;
}
export interface CloudFilePage {
  files: CloudFile[];
  total?: number;
}
export interface CloudClient {
  account: {
    get(): Promise<CloudUser>;
    createEmailToken(params: {
      userId: string;
      email: string;
      phrase?: boolean;
    }): Promise<{ userId: string; secret: string }>;
    createSession(params: { userId: string; secret: string }): Promise<unknown>;
    createJWT(): Promise<{ jwt: string }>;
    deleteSession(params: { sessionId: string }): Promise<unknown>;
  };
  storage: {
    listFiles(params: {
      bucketId: string;
      queries?: string[];
    }): Promise<CloudFilePage>;
    createFile(params: {
      bucketId: string;
      fileId: string;
      file: File | NativeInputFile;
      permissions: string[];
    }): Promise<CloudFile>;
    getFile(params: { bucketId: string; fileId: string }): Promise<CloudFile>;
    getFileDownload(params: {
      bucketId: string;
      fileId: string;
    }): Promise<ArrayBuffer>;
    deleteFile(params: { bucketId: string; fileId: string }): Promise<unknown>;
  };
  userPermission(userId: string, action: "read" | "update" | "delete"): string;
}

function makeWeb(config: CloudConfig): CloudClient {
  const { Client, Account, Storage, Permission, Role } =
    require("appwrite") as typeof import("appwrite");
  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId);
  const account = new Account(client);
  const storage = new Storage(client);
  return {
    account,
    storage: {
      listFiles: (params) => storage.listFiles(params),
      getFile: (params) => storage.getFile(params),
      getFileDownload: (params) =>
        downloadPrivateFile({
          ...params,
          endpoint: config.endpoint,
          projectId: config.projectId,
          createJWT: () => account.createJWT(),
        }),
      deleteFile: (params) => storage.deleteFile(params),
      createFile: async (params) => {
        if (!(params.file instanceof File))
          throw new Error("Web uploads require file bytes");
        return storage.createFile({ ...params, file: params.file });
      },
    },
    userPermission: (userId, action) => Permission[action](Role.user(userId)),
  };
}

function makeNative(config: CloudConfig): CloudClient {
  const { Client, Account, Storage, Permission, Role } =
    require("react-native-appwrite") as typeof import("react-native-appwrite");
  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setPlatform(config.platform);
  const account = new Account(client);
  const storage = new Storage(client);
  return {
    account,
    storage: {
      listFiles: (params) => storage.listFiles(params),
      getFile: (params) => storage.getFile(params),
      getFileDownload: (params) =>
        downloadPrivateFile({
          ...params,
          endpoint: config.endpoint,
          projectId: config.projectId,
          createJWT: () => account.createJWT(),
        }),
      deleteFile: (params) => storage.deleteFile(params),
      createFile: (params) => {
        if (!("uri" in params.file))
          throw new Error("Native uploads require a local URI");
        return storage.createFile({ ...params, file: params.file });
      },
    },
    userPermission: (userId, action) => Permission[action](Role.user(userId)),
  };
}

export function createCloudClient(config: CloudConfig): CloudClient {
  return Platform.OS === "web" ? makeWeb(config) : makeNative(config);
}
export function uniqueId(): string {
  const module =
    Platform.OS === "web"
      ? require("appwrite")
      : require("react-native-appwrite");
  return module.ID.unique();
}
export function toMediaMetadata(
  file: CloudFile,
  kind: CloudMediaKind,
): CloudMediaMetadata {
  return {
    fileId: file.$id,
    kind,
    name: file.name,
    mimeType: file.mimeType as CloudMediaMetadata["mimeType"],
    size: file.sizeOriginal,
    createdAt: canonicalProviderInstant(file.$createdAt),
  };
}
