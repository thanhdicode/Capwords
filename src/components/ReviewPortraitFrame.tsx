import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { reviewPractice098Design } from "../theme/tokens";

const illustration = reviewPractice098Design.illustration;

/** Shared source-measured Polaroid frame; photo pixels are isolated from source 098. */
export function ReviewPortraitFrame() {
  return (
    <View
      testID="review-portrait-frame"
      pointerEvents="none"
      style={styles.frame}
    >
      <Image
        accessible={false}
        source={require("../../assets/stickers/review-portrait-photo-098.png")}
        resizeMode="stretch"
        style={styles.photo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: illustration.size,
    height: illustration.size,
    paddingTop: illustration.framePaddingTop,
    paddingHorizontal: illustration.framePaddingHorizontal,
    paddingBottom: illustration.framePaddingBottom,
    alignItems: "center",
    backgroundColor: illustration.frameColor,
    overflow: "hidden",
  },
  photo: {
    width: illustration.photoWidth,
    height: illustration.photoHeight,
  },
});
