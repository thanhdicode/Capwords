import { Asset as BundledAsset } from "expo-asset";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system/legacy";
import {
  Asset as MediaLibraryAsset,
  requestPermissionsAsync,
} from "expo-media-library";
import { Platform } from "react-native";
import { collectionSaveCopy } from "../data/collectionSaveReference";
import { stickerAssetModuleFor } from "../data/stickerAssets";
import type { Word } from "../domain/types";

export interface StickerSaveOutcome {
  copied: boolean;
}

export async function saveStickerToPhotosAndCopy(
  word: Word,
): Promise<StickerSaveOutcome> {
  if (Platform.OS === "web") {
    throw new Error(collectionSaveCopy.mobileOnly);
  }

  const permission = await requestPermissionsAsync(true);
  if (!permission.granted) {
    throw new Error(collectionSaveCopy.permissionDenied);
  }

  const localUri = await resolveStickerImageUri(word);
  await MediaLibraryAsset.create(localUri);

  try {
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: "base64",
    });
    await Clipboard.setImageAsync(base64);
    return { copied: true };
  } catch {
    return { copied: false };
  }
}

async function resolveStickerImageUri(word: Word): Promise<string> {
  if (word.imageUri) {
    if (word.imageUri.startsWith("file://")) return word.imageUri;
    throw new Error(collectionSaveCopy.imageUnavailable);
  }

  const assetModule = stickerAssetModuleFor(word);
  if (!assetModule) throw new Error(collectionSaveCopy.imageUnavailable);

  const asset = BundledAsset.fromModule(assetModule);
  await asset.downloadAsync();
  if (!asset.localUri?.startsWith("file://")) {
    throw new Error(collectionSaveCopy.imageUnavailable);
  }
  return asset.localUri;
}
