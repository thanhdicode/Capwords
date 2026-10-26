import React from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import { collectionSaveCopy } from "../data/collectionSaveReference";
import type { Word } from "../domain/types";
import { collectionSaveToastDesign as design } from "../theme/tokens";
import { Sticker } from "./Sticker";
import { Body } from "./UI";

export function CollectionSavedToast({
  word,
  count,
  copied,
}: {
  word: Word;
  count: number;
  copied: boolean;
}) {
  return (
    <View
      accessibilityLiveRegion="polite"
      pointerEvents="none"
      style={[
        styles.toast,
        Platform.OS === "web" && { bottom: design.webBottomInset },
      ]}
      testID="collection-save-toast"
    >
      <Image
        accessible={false}
        accessibilityElementsHidden
        source={require("../../assets/patterns/collection-toast-sparkles-039.png")}
        style={styles.sparkleSprite}
        testID="collection-save-toast-sparkles"
      />
      <View style={styles.stickerSlot}>
        <Sticker
          word={word}
          size={design.stickerSize}
          label
          labelStyle={design.stickerLabel}
        />
      </View>
      <View style={styles.messageSlot}>
        <Body numberOfLines={1} style={styles.title}>
          {collectionSaveCopy.toastTitle}
        </Body>
        <Body numberOfLines={1} style={styles.subtitle}>
          {copied
            ? collectionSaveCopy.toastCopied
            : collectionSaveCopy.toastCopyUnavailable}
        </Body>
      </View>
      <Body style={styles.count}>+{count}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: design.horizontalInset,
    right: design.horizontalInset,
    bottom: design.bottomInset,
    height: design.height,
    borderRadius: design.borderRadius,
    backgroundColor: design.background,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: design.paddingLeft,
    paddingRight: design.paddingRight,
    zIndex: design.toastZIndex,
  },
  sparkleSprite: {
    position: "absolute",
    left: 0,
    top: 0,
    width: design.sparkleSpriteWidth,
    height: design.height,
  },
  stickerSlot: {
    width: design.stickerSlotWidth,
    height: design.height,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: design.stickerOffsetY }],
  },
  messageSlot: {
    flex: 1,
    marginLeft: design.messageOffset,
  },
  title: {
    color: design.titleColor,
    fontSize: design.titleFontSize,
    lineHeight: design.titleLineHeight,
    fontWeight: design.titleFontWeight,
  },
  subtitle: {
    color: design.subtitleColor,
    fontSize: design.subtitleFontSize,
    lineHeight: design.subtitleLineHeight,
  },
  count: {
    width: design.countColumnWidth,
    color: design.titleColor,
    fontSize: design.countFontSize,
    lineHeight: design.countLineHeight,
    fontWeight: design.countFontWeight,
    textAlign: "right",
  },
});
