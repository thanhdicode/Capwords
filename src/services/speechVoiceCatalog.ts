import * as Speech from "expo-speech";
import type { SpeechVoiceOption } from "../domain/speechVoice";
import { speechVoiceMatchesLanguage } from "../domain/speechVoice";

const VOICE_PREVIEW_RATE = 0.9;
let previewRequestId = 0;

export async function getAvailableSpeechVoices(
  languageCode: string,
): Promise<SpeechVoiceOption[]> {
  const voices = await Speech.getAvailableVoicesAsync();
  return voices
    .filter((voice) => speechVoiceMatchesLanguage(voice.language, languageCode))
    .map((voice) => ({
      id: voice.identifier,
      name: voice.name,
      language: voice.language,
      selectable: true,
      previewable: true,
      origin: "device",
    }));
}

export function previewSpeechVoice(
  voice: SpeechVoiceOption,
  text: string,
  onDone: () => void,
  onError: () => void,
): void {
  const requestId = ++previewRequestId;
  void Speech.stop()
    .catch(() => undefined)
    .then(() => {
      if (requestId !== previewRequestId) return;
      try {
        Speech.speak(text, {
          ...(voice.origin === "device" ? { voice: voice.id } : {}),
          language: voice.language,
          rate: VOICE_PREVIEW_RATE,
          onDone,
          onStopped: onDone,
          onError,
        });
      } catch {
        onError();
      }
    });
}

export function stopSpeechVoicePreview(): void {
  previewRequestId += 1;
  void Speech.stop().catch(() => undefined);
}
