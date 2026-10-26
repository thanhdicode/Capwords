import { Asset } from "expo-asset";
import { File, Paths } from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import type { Word } from "../domain/types";
import {
  runImageExport,
  type ImageExportAction,
  type ImageExportPorts,
  type ImageExportSource,
} from "../domain/imageExport";
import { stickerAssetModuleFor } from "../data/stickerAssets";

function imageFormat(
  uri: string,
): Pick<ImageExportSource, "extension" | "mimeType"> {
  const dataMime = uri
    .match(/^data:(image\/[a-z0-9.+-]+)/i)?.[1]
    ?.toLowerCase();
  const path = uri.split(/[?#]/, 1)[0];
  const extension = path.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  const byMime: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
  };
  const byExtension: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
  };
  if (dataMime && byMime[dataMime]) {
    return { mimeType: dataMime, extension: byMime[dataMime] };
  }
  if (extension && byExtension[extension]) {
    return { mimeType: byExtension[extension], extension };
  }
  return { mimeType: "image/jpeg", extension: "jpg" };
}

async function resolveSource(word: Word): Promise<ImageExportSource | null> {
  let uri = word.imageUri;
  if (!uri) {
    const moduleId = stickerAssetModuleFor(word);
    if (!moduleId) return null;
    const asset = Asset.fromModule(moduleId);
    if (Platform.OS === "web") {
      uri = asset.uri;
    } else {
      await asset.downloadAsync();
      uri = asset.localUri ?? asset.uri;
    }
  }
  if (!uri) return null;
  return { uri, ...imageFormat(uri) };
}

async function prepareNativeFile(
  source: ImageExportSource,
  filename: string,
): Promise<{ uri: string; cleanup: () => void }> {
  const destination = new File(Paths.cache, filename);
  try {
    if (destination.exists) destination.delete();
    if (source.uri.startsWith("file://")) {
      const input = new File(source.uri);
      if (!input.exists)
        throw new Error("The saved image is no longer available.");
      input.copy(destination);
    } else if (/^https:\/\//i.test(source.uri)) {
      const url = new URL(source.uri);
      if (url.username || url.password) {
        throw new Error("This image link cannot be exported safely.");
      }
      await File.downloadFileAsync(source.uri, destination, {
        idempotent: true,
      });
    } else if (/^(data:|blob:|content:)/i.test(source.uri)) {
      const response = await fetch(source.uri);
      if (!response.ok) throw new Error("The saved image could not be opened.");
      const blob = await response.blob();
      if (blob.type && !blob.type.toLowerCase().startsWith("image/")) {
        throw new Error("Only image files can be exported.");
      }
      destination.create({ intermediates: true, overwrite: true });
      await destination.write(new Uint8Array(await blob.arrayBuffer()));
    } else {
      throw new Error("This saved image format is not available for export.");
    }
    if (!destination.exists || destination.size === 0) {
      throw new Error("The image file could not be prepared for export.");
    }
    return {
      uri: destination.uri,
      cleanup() {
        if (destination.exists) destination.delete();
      },
    };
  } catch (error) {
    try {
      if (destination.exists) destination.delete();
    } catch {
      // Keep the export error visible; partial cache cleanup is best effort.
    }
    throw error;
  }
}

async function downloadWeb(
  source: ImageExportSource,
  filename: string,
): Promise<void> {
  if (
    typeof document === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    throw new Error("Image downloads are unavailable in this browser.");
  }
  const response = await fetch(source.uri);
  if (!response.ok) throw new Error("The saved image could not be downloaded.");
  const blob = await response.blob();
  if (
    blob.size === 0 ||
    (blob.type && !blob.type.toLowerCase().startsWith("image/"))
  ) {
    throw new Error("The saved file is not a usable image.");
  }
  const downloadUri = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUri;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUri), 1000);
}

async function saveToPhotos(uri: string): Promise<void> {
  const permission = await MediaLibrary.requestPermissionsAsync(true, [
    "photo",
  ]);
  if (!permission.granted) {
    throw new Error(
      permission.canAskAgain
        ? "Photos permission was not granted. Nothing was saved."
        : "Photos add-only access is disabled. Enable it in device Settings to save this image.",
    );
  }
  await MediaLibrary.Asset.create(uri);
}

async function shareFile(
  uri: string,
  mimeType: string,
  title: string,
): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("System sharing is unavailable on this device.");
  }
  await Sharing.shareAsync(uri, { mimeType, dialogTitle: title });
}

const ports: ImageExportPorts = {
  platform: Platform.OS === "web" ? "web" : "native",
  resolveSource,
  prepareNativeFile,
  downloadWeb,
  saveToPhotos,
  shareFile,
};

export function canExportWordImage(word: Word): boolean {
  return Boolean(word.imageUri || stickerAssetModuleFor(word));
}

export function exportWordImage(
  word: Word,
  action: ImageExportAction,
): Promise<string> {
  return runImageExport(word, action, ports);
}
