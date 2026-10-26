import React from "react";
import {
  Image,
  StyleProp,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { Word } from "../domain/types";
import { STICKER_EMOJI, stickerAssetModuleFor } from "../data/stickerAssets";
import {
  colors,
  recognitionResultDesign,
  stickerLabelDesign,
} from "../theme/tokens";
import { Rounded } from "./UI";

const resultArtworkDesign = recognitionResultDesign.artwork;

export function Sticker({
  word,
  size = 110,
  label = false,
  labelText,
  style,
  labelStyle,
}: {
  word: Pick<Word, "emoji" | "target" | "imageUri" | "category">;
  size?: number;
  label?: boolean;
  labelText?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}) {
  const asset = word.imageUri
    ? { uri: word.imageUri }
    : stickerAssetModuleFor(word);
  return (
    <View style={[{ alignItems: "center", justifyContent: "center" }, style]}>
      {word.emoji === STICKER_EMOJI.blackCircle ? (
        <View
          style={{
            width: size * resultArtworkDesign.blackCircleRatio,
            height: size * resultArtworkDesign.blackCircleRatio,
            borderRadius: size,
            borderWidth: resultArtworkDesign.blackCircleBorderWidth,
            borderColor: colors.white,
            backgroundColor: colors.black,
          }}
        />
      ) : asset ? (
        <Image
          source={asset}
          resizeMode="contain"
          style={{ width: size, height: size }}
        />
      ) : (
        <Text style={{ fontSize: size * 0.72, lineHeight: size }}>
          {word.emoji || "✦"}
        </Text>
      )}
      {label && (
        <Rounded
          style={[
            {
              fontSize: stickerLabelDesign.fontSize,
              lineHeight: stickerLabelDesign.lineHeight,
              backgroundColor: stickerLabelDesign.backgroundColor,
              borderRadius: stickerLabelDesign.borderRadius,
              paddingHorizontal: stickerLabelDesign.paddingHorizontal,
              marginTop: stickerLabelDesign.marginTop,
              maxWidth: size + stickerLabelDesign.maxWidthGutter,
              textAlign: stickerLabelDesign.textAlign,
            },
            labelStyle,
          ]}
        >
          {labelText ?? word.target}
        </Rounded>
      )}
    </View>
  );
}
