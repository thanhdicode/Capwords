import type { Word } from "../domain/types";

export const STICKER_EMOJI = {
  blackCircle: "⚫",
  sunflower: "🌻",
  blossom: "🌼",
  iceCream: "🍦",
} as const;

export function isFlowerStickerEmoji(emoji: string): boolean {
  return emoji === STICKER_EMOJI.sunflower || emoji === STICKER_EMOJI.blossom;
}

export const stickerAssets: Record<string, number> = {
  flower: require("../../assets/stickers/flower.png"),
  icecream: require("../../assets/stickers/icecream.png"),
  portrait: require("../../assets/stickers/portrait.png"),
};

export function stickerAssetModuleFor(
  word: Pick<Word, "emoji" | "category">,
): number | undefined {
  const key =
    word.category === "People"
      ? "portrait"
      : isFlowerStickerEmoji(word.emoji)
        ? "flower"
        : word.emoji === STICKER_EMOJI.iceCream
          ? "icecream"
          : "";
  return stickerAssets[key];
}
