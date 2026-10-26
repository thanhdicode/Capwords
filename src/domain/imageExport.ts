import type { Word } from "./types";

export type ImageExportAction = "download" | "save" | "share";
export type ImageExportPlatform = "web" | "native";

export interface ImageExportSource {
  uri: string;
  mimeType: string;
  extension: string;
}

export interface PreparedImageFile {
  uri: string;
  cleanup?: () => void | Promise<void>;
}

export interface ImageExportPorts {
  platform: ImageExportPlatform;
  resolveSource: (word: Word) => Promise<ImageExportSource | null>;
  prepareNativeFile: (
    source: ImageExportSource,
    filename: string,
  ) => Promise<PreparedImageFile>;
  downloadWeb: (source: ImageExportSource, filename: string) => Promise<void>;
  saveToPhotos: (uri: string) => Promise<void>;
  shareFile: (uri: string, mimeType: string, title: string) => Promise<void>;
}

export function imageExportFilename(target: string, extension: string): string {
  const slug = target
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .toLowerCase();
  const safeSlug = slug || "word";
  const safeExtension = extension
    .replace(/^\./, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const allowedExtensions = new Set([
    "jpg",
    "jpeg",
    "png",
    "webp",
    "heic",
    "heif",
  ]);
  return `CapWords-${safeSlug}.${allowedExtensions.has(safeExtension) ? safeExtension : "jpg"}`;
}

export async function runImageExport(
  word: Word,
  action: ImageExportAction,
  ports: ImageExportPorts,
): Promise<string> {
  const source = await ports.resolveSource(word);
  if (!source) {
    throw new Error("This word has no saved image to export.");
  }

  const filename = imageExportFilename(word.target, source.extension);
  if (ports.platform === "web") {
    if (action !== "download") {
      throw new Error(
        "Use the iOS or Android app to share or save images to Photos.",
      );
    }
    await ports.downloadWeb(source, filename);
    return "Image download started.";
  }

  if (action === "download") {
    throw new Error("Use Save to Photos in the mobile app.");
  }

  const prepared = await ports.prepareNativeFile(source, filename);
  try {
    if (action === "save") {
      await ports.saveToPhotos(prepared.uri);
      return "Image saved to Photos.";
    }
    await ports.shareFile(
      prepared.uri,
      source.mimeType,
      `Share ${word.target}`,
    );
    return "The system share sheet closed. The image is sent only if you selected a destination.";
  } finally {
    await prepared.cleanup?.();
  }
}
