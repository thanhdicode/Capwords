import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Word } from "../domain/types";
import { colors, fonts, reviewFeedbackSnapshotDesign } from "../theme/tokens";
import { Body, Icon, Rounded, Serif } from "./UI";
import { Sticker } from "./Sticker";
import { ReviewCardTexture } from "./ReviewCardTexture";
import { ReviewProgressHeader } from "./ReviewProgressHeader";

export function ReviewFeedbackSnapshot({
  word,
  current,
  total,
  skipLabel,
  cardAccessibilityPrefix,
  encouragementIcon,
  encouragementTitle,
  encouragementBody,
  onBack,
}: {
  word: Word;
  current: number;
  total: number;
  skipLabel: string;
  cardAccessibilityPrefix: string;
  encouragementIcon: string;
  encouragementTitle: string;
  encouragementBody: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.root}>
      <ReviewProgressHeader current={current} total={total} onBack={onBack} />
      <View
        testID="review-feedback-card"
        accessible
        accessibilityLabel={`${cardAccessibilityPrefix}: ${word.target}`}
        style={styles.card}
      >
        <ReviewCardTexture variant="feedback" />
        <View pointerEvents="none" style={styles.illustration}>
          <Sticker
            word={word}
            size={reviewFeedbackSnapshotDesign.illustration.size}
          />
        </View>
        <Rounded style={styles.target}>{word.target}</Rounded>
        <View style={styles.phonetics}>
          <Body style={styles.phoneticText}>{word.phonetic}</Body>
          <Icon
            name="volume-high"
            size={reviewFeedbackSnapshotDesign.phonetics.audioIconSize}
            color={colors.white}
          />
        </View>
        <View pointerEvents="none" style={styles.feedback}>
          <Text style={styles.feedbackIcon}>{encouragementIcon}</Text>
          <View style={styles.feedbackCopy}>
            <Serif style={styles.feedbackTitle}>{encouragementTitle}</Serif>
            <Serif style={styles.feedbackBody}>{encouragementBody}</Serif>
          </View>
        </View>
      </View>
      <Pressable
        testID="review-feedback-skip"
        accessibilityRole="button"
        accessibilityLabel={skipLabel}
        disabled
        style={styles.skip}
      >
        <Icon
          name="archive-outline"
          size={reviewFeedbackSnapshotDesign.skip.iconSize}
          color={reviewFeedbackSnapshotDesign.skip.contentColor}
        />
        <Body style={styles.skipText}>{skipLabel}</Body>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center" },
  card: {
    width: reviewFeedbackSnapshotDesign.card.width,
    height: reviewFeedbackSnapshotDesign.card.height,
    marginTop: reviewFeedbackSnapshotDesign.card.marginTop,
    borderRadius: reviewFeedbackSnapshotDesign.card.borderRadius,
    overflow: "hidden",
    backgroundColor: reviewFeedbackSnapshotDesign.card.surfaceColor,
  },
  illustration: {
    position: "absolute",
    top: reviewFeedbackSnapshotDesign.illustration.top,
    left: 0,
    right: 0,
    height: reviewFeedbackSnapshotDesign.illustration.size,
    alignItems: "center",
    justifyContent: "center",
  },
  target: {
    position: "absolute",
    top: reviewFeedbackSnapshotDesign.target.top,
    left: reviewFeedbackSnapshotDesign.target.horizontalInset,
    right: reviewFeedbackSnapshotDesign.target.horizontalInset,
    fontSize: reviewFeedbackSnapshotDesign.target.fontSize,
    lineHeight: reviewFeedbackSnapshotDesign.target.lineHeight,
    textAlign: "center",
    color: colors.white,
  },
  phonetics: {
    position: "absolute",
    bottom: reviewFeedbackSnapshotDesign.phonetics.bottom,
    left: reviewFeedbackSnapshotDesign.phonetics.horizontalInset,
    right: reviewFeedbackSnapshotDesign.phonetics.horizontalInset,
    height: reviewFeedbackSnapshotDesign.phonetics.height,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: reviewFeedbackSnapshotDesign.phonetics.gap,
  },
  phoneticText: {
    color: colors.white,
    fontSize: reviewFeedbackSnapshotDesign.phonetics.fontSize,
    lineHeight: reviewFeedbackSnapshotDesign.phonetics.lineHeight,
    transform: [
      {
        rotate: `${reviewFeedbackSnapshotDesign.phonetics.rotationDegrees}deg`,
      },
    ],
  },
  feedback: {
    position: "absolute",
    top: reviewFeedbackSnapshotDesign.feedback.top,
    left: 0,
    right: 0,
    height: reviewFeedbackSnapshotDesign.feedback.height,
    paddingLeft: reviewFeedbackSnapshotDesign.feedback.paddingLeft,
    paddingRight: reviewFeedbackSnapshotDesign.feedback.paddingRight,
    backgroundColor: reviewFeedbackSnapshotDesign.feedback.backgroundColor,
    flexDirection: "row",
    alignItems: "center",
    gap: reviewFeedbackSnapshotDesign.feedback.gap,
  },
  feedbackIcon: {
    width: reviewFeedbackSnapshotDesign.feedback.iconSize,
    fontSize: reviewFeedbackSnapshotDesign.feedback.iconSize,
    lineHeight: reviewFeedbackSnapshotDesign.feedback.iconSize,
  },
  feedbackCopy: { width: reviewFeedbackSnapshotDesign.feedback.copyWidth },
  feedbackTitle: {
    fontFamily: fonts.serif,
    color: colors.black,
    fontSize: reviewFeedbackSnapshotDesign.feedback.titleFontSize,
    lineHeight: reviewFeedbackSnapshotDesign.feedback.titleLineHeight,
  },
  feedbackBody: {
    fontFamily: fonts.serif,
    color: reviewFeedbackSnapshotDesign.feedback.bodyColor,
    fontSize: reviewFeedbackSnapshotDesign.feedback.bodyFontSize,
    lineHeight: reviewFeedbackSnapshotDesign.feedback.bodyLineHeight,
  },
  skip: {
    position: "absolute",
    bottom: reviewFeedbackSnapshotDesign.skip.bottom,
    width: reviewFeedbackSnapshotDesign.skip.width,
    height: reviewFeedbackSnapshotDesign.skip.height,
    borderRadius: reviewFeedbackSnapshotDesign.skip.borderRadius,
    backgroundColor: reviewFeedbackSnapshotDesign.skip.backgroundColor,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: reviewFeedbackSnapshotDesign.skip.gap,
  },
  skipText: {
    color: reviewFeedbackSnapshotDesign.skip.contentColor,
    fontFamily: fonts.body,
    fontSize: reviewFeedbackSnapshotDesign.skip.fontSize,
    lineHeight: reviewFeedbackSnapshotDesign.skip.lineHeight,
    fontWeight: "700",
  },
});
