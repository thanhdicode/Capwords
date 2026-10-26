import type { NewWord } from "../domain/types";
import {
  DEMO_DARKNESS_WORD,
  DEMO_FLOWER_WORD,
  DEMO_ICE_CREAM_WORD,
} from "./demoVocabulary";

const SOURCE_013_WORD: NewWord = {
  ...DEMO_FLOWER_WORD,
  native: "Flower",
  target: "La Fleur",
  phonetic: "",
  example: "",
  exampleTranslation: "",
};

const SOURCE_053_WORD: NewWord = {
  ...DEMO_DARKNESS_WORD,
  phonetic: "",
  example: "",
  exampleTranslation: "",
};

// Source 093's title-case labels reuse the saved vocabulary and mapped sticker artwork.
const SOURCE_093_WORD: NewWord = {
  ...DEMO_ICE_CREAM_WORD,
  native: "Ice Cream Cone",
  target: "Un Cornet De Glace",
};

/** Visible text and artwork references from the captured Result screens. */
export function getRecognitionResultFixtureWord(
  sourceId: string | null,
): NewWord | undefined {
  if (sourceId === "013") return { ...SOURCE_013_WORD };
  if (sourceId === "053") return { ...SOURCE_053_WORD };
  if (sourceId === "055") return { ...DEMO_FLOWER_WORD };
  if (sourceId === "093") return { ...SOURCE_093_WORD };
  return undefined;
}
