import { DEMO_VOCABULARY } from "./demoVocabulary";

const iceCreamWord = DEMO_VOCABULARY.find((word) => word.emoji === "🍦");
if (!iceCreamWord) {
  throw new Error(
    "The source-099 reference word is missing from demo vocabulary",
  );
}

/** Source-derived display copy for the deterministic 099 Collection fixture. */
export const collectionLoadingReference = {
  wordTarget: iceCreamWord.target,
  stickerLabel: `Un ${iceCreamWord.target}`,
  countUnit: "Words",
  accessibilityLabel: "Loading collection",
} as const;
