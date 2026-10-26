import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";
import {
  imagePersistenceErrorMessage,
  isPersistentLibraryImage,
  persistentImageDestination,
} from "../domain/imagePersistence";

export async function persistLibraryImage(
  uri: string | undefined,
  wordId: string,
): Promise<string | undefined> {
  if (!uri || Platform.OS === "web") return uri;
  const destinationUri = persistentImageDestination(
    uri,
    wordId,
    Paths.document.uri,
    Platform.OS,
  );
  if (!destinationUri || destinationUri === uri) return uri;

  const source = new File(uri);
  const destination = new File(destinationUri);
  if (destination.exists) return destination.uri;
  try {
    destination.parentDirectory.create({
      intermediates: true,
      idempotent: true,
    });
    await source.copy(destination);
    if (!destination.exists) throw new Error("The copied photo is missing.");
    return destination.uri;
  } catch (error) {
    try {
      if (destination.exists) destination.delete();
    } catch {
      // Keep the copy error visible; partial-file cleanup is best effort.
    }
    throw new Error(imagePersistenceErrorMessage(error));
  }
}

export function removeLibraryImage(uri: string | undefined): void {
  if (!uri || Platform.OS === "web") return;
  const documentUri = Paths.document.uri;
  if (!isPersistentLibraryImage(uri, documentUri)) return;
  const file = new File(uri);
  if (file.exists) file.delete();
}
