import { File } from "expo-file-system";
import { Platform } from "react-native";

/**
 * Review attempts are short-lived practice data, not library content. Remove
 * them when the learner changes word, exits Review, or starts another attempt.
 */
export function discardReviewVoiceAttempt(
  uri: string | null | undefined,
): void {
  if (!uri) return;
  if (Platform.OS === "web") {
    if (uri.startsWith("blob:") && typeof URL.revokeObjectURL === "function") {
      URL.revokeObjectURL(uri);
    }
    return;
  }

  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Temporary-file cleanup is best effort; the OS may reclaim cache files.
  }
}
