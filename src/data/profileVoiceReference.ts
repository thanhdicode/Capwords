import type { SpeechVoiceOption } from "../domain/speechVoice";

/** Visible source-048 rows; identifiers are fixture-only and are never sent to system speech APIs. */
export const SOURCE_048_VOICE_OPTIONS: readonly SpeechVoiceOption[] = [
  {
    id: "source048:majed",
    name: "Majed",
    language: "ko-KR",
    selectable: true,
    previewable: true,
    origin: "reference",
  },
  {
    id: "source048:daria",
    name: "Daria",
    language: "ko-KR",
    selectable: true,
    previewable: true,
    origin: "reference",
  },
  {
    id: "source048:montse",
    name: "Montse",
    language: "ko-KR",
    selectable: true,
    previewable: true,
    origin: "reference",
  },
  {
    id: "source048:zuzana",
    name: "Zuzana",
    language: "ko-KR",
    selectable: false,
    previewable: false,
    origin: "reference",
  },
];

export const SOURCE_048_SELECTED_VOICE_ID = "source048:montse";
