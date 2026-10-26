export type SpeechVoiceOrigin = "device" | "reference";

export interface SpeechVoiceOption {
  id: string;
  name: string;
  language: string;
  selectable: boolean;
  previewable: boolean;
  origin: SpeechVoiceOrigin;
}

function normalizeLanguageTag(value: string): string {
  return value.trim().replace(/_/g, "-").toLowerCase();
}

export function speechVoiceMatchesLanguage(
  voiceLanguage: string,
  requestedLanguage: string,
): boolean {
  const voice = normalizeLanguageTag(voiceLanguage);
  const requested = normalizeLanguageTag(requestedLanguage);
  if (!voice || !requested) return false;
  return (
    voice === requested ||
    voice.startsWith(`${requested}-`) ||
    requested.startsWith(`${voice}-`)
  );
}
