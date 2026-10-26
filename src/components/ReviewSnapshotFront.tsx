import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { Word } from "../domain/types";
import { colors, fonts, reviewSnapshotDesign } from "../theme/tokens";
import { Body, Icon, Rounded } from "./UI";
import { Sticker } from "./Sticker";
import { ReviewCardTexture } from "./ReviewCardTexture";
import { ReviewProgressHeader } from "./ReviewProgressHeader";

export function ReviewSnapshotFront({
  word,
  current,
  total,
  skipLabel,
  cardAccessibilityPrefix,
  onBack,
}: {
  word: Word;
  current: number;
  total: number;
  skipLabel: string;
  cardAccessibilityPrefix: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.root}>
      <ReviewProgressHeader current={current} total={total} onBack={onBack} />
      <View
        testID="review-snapshot-card"
        accessible
        accessibilityLabel={`${cardAccessibilityPrefix}: ${word.target}`}
        style={styles.card}
      >
        <ReviewCardTexture variant="snapshot" />
        <View pointerEvents="none" style={styles.illustration}>
          <Sticker word={word} size={reviewSnapshotDesign.illustration.size} />
        </View>
        <Rounded style={styles.target}>{word.target}</Rounded>
        <View style={styles.phonetics}>
          <Body style={styles.phoneticText}>{word.phonetic}</Body>
          <Icon
            name="volume-high"
            size={reviewSnapshotDesign.phonetics.audioIconSize}
            color={colors.white}
          />
        </View>
      </View>
      <Pressable
        testID="review-snapshot-skip"
        accessibilityRole="button"
        accessibilityLabel={skipLabel}
        disabled
        style={styles.skip}
      >
        <Icon
          name="archive-outline"
          size={reviewSnapshotDesign.skip.iconSize}
          color={reviewSnapshotDesign.skip.contentColor}
        />
        <Body style={styles.skipText}>{skipLabel}</Body>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center" },
  card: {
    width: reviewSnapshotDesign.card.width,
    height: reviewSnapshotDesign.card.height,
    marginTop: reviewSnapshotDesign.card.marginTop,
    borderRadius: reviewSnapshotDesign.card.borderRadius,
    overflow: "hidden",
    backgroundColor: reviewSnapshotDesign.card.surfaceColor,
  },
  illustration: {
    position: "absolute",
    top: reviewSnapshotDesign.illustration.top,
    left: 0,
    right: 0,
    height: reviewSnapshotDesign.illustration.size,
    alignItems: "center",
    justifyContent: "center",
  },
  target: {
    position: "absolute",
    top: reviewSnapshotDesign.target.top,
    left: reviewSnapshotDesign.target.horizontalInset,
    right: reviewSnapshotDesign.target.horizontalInset,
    fontSize: reviewSnapshotDesign.target.fontSize,
    lineHeight: reviewSnapshotDesign.target.lineHeight,
    textAlign: "center",
    color: colors.white,
  },
  phonetics: {
    position: "absolute",
    bottom: reviewSnapshotDesign.phonetics.bottom,
    left: reviewSnapshotDesign.phonetics.horizontalInset,
    right: reviewSnapshotDesign.phonetics.horizontalInset,
    height: reviewSnapshotDesign.phonetics.height,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: reviewSnapshotDesign.phonetics.gap,
  },
  phoneticText: {
    color: colors.white,
    fontSize: reviewSnapshotDesign.phonetics.fontSize,
    lineHeight: reviewSnapshotDesign.phonetics.lineHeight,
    transform: [
      { rotate: `${reviewSnapshotDesign.phonetics.rotationDegrees}deg` },
    ],
  },
  skip: {
    position: "absolute",
    bottom: reviewSnapshotDesign.skip.bottom,
    width: reviewSnapshotDesign.skip.width,
    height: reviewSnapshotDesign.skip.height,
    borderRadius: reviewSnapshotDesign.skip.borderRadius,
    backgroundColor: reviewSnapshotDesign.skip.backgroundColor,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: reviewSnapshotDesign.skip.gap,
  },
  skipText: {
    color: reviewSnapshotDesign.skip.contentColor,
    fontFamily: fonts.body,
    fontSize: reviewSnapshotDesign.skip.fontSize,
    lineHeight: reviewSnapshotDesign.skip.lineHeight,
    fontWeight: "700",
  },
});
