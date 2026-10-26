import type { NewWord } from "../domain/types";

/** Reference fixture only: never silently inserted into a user's real library. */
export const DEMO_FLOWER_WORD: NewWord = {
  native: "Sunflower",
  target: "Tournesol",
  phonetic: "/tuʁ.nə.sɔl/",
  example: "Nous avons planté des graines de tournesol dans le jardin.",
  exampleTranslation: "We planted sunflower seeds in the garden.",
  emoji: "🌻",
  color: "#E8A44D",
  category: "Nature",
  favorite: false,
};

export const DEMO_DARKNESS_WORD: NewWord = {
  native: "Darkness",
  target: "Obscurité",
  phonetic: "/ɔp.sky.ʁi.te/",
  example: "La pièce est plongée dans l’obscurité.",
  exampleTranslation: "The room is in darkness.",
  emoji: "⚫",
  color: "#222222",
  category: "Everyday",
  favorite: false,
};

/** Existing canonical ice-cream record shared by demo vocabulary and source-backed Result QA. */
export const DEMO_ICE_CREAM_WORD: NewWord = {
  native: "Ice cream cone",
  target: "Un cornet de glace",
  phonetic: "/œ̃ kɔʁ.nɛ də ɡlas/",
  example: "Je voudrais un cornet de glace à la vanille.",
  exampleTranslation: "I would like a vanilla ice cream cone.",
  emoji: "🍦",
  color: "#DCE0DF",
  category: "Food",
  favorite: false,
};

export const DEMO_VOCABULARY: readonly NewWord[] = [
  DEMO_FLOWER_WORD,
  {
    native: "A woman",
    target: "Une Femme",
    phonetic: "/yn fam/",
    example: "Une femme lit un livre dans le jardin.",
    exampleTranslation: "A woman is reading a book in the garden.",
    emoji: "👩",
    color: "#6D6A5F",
    category: "People",
    favorite: false,
  },
  DEMO_DARKNESS_WORD,
  DEMO_ICE_CREAM_WORD,
];
