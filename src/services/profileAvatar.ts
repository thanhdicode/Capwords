import * as ImagePicker from "expo-image-picker";
import { Paths } from "expo-file-system";
import { isPersistentLibraryImage } from "../domain/imagePersistence";
import { persistLibraryImage, removeLibraryImage } from "./persistentImage";

export async function chooseProfileAvatar(): Promise<ImagePicker.ImagePickerAsset | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });
  return result.canceled || !result.assets[0] ? null : result.assets[0];
}

export async function persistProfileAvatar(uri: string): Promise<string> {
  const revisionId = `profile-avatar-${Date.now()}`;
  const savedUri = (await persistLibraryImage(uri, revisionId)) ?? uri;
  if (!isPersistentLibraryImage(savedUri, Paths.document.uri)) {
    throw new Error("The selected profile photo could not be saved locally.");
  }
  return savedUri;
}

export function removeProfileAvatar(uri: string | undefined): void {
  removeLibraryImage(uri);
}
