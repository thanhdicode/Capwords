import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, reviewFrontDesign } from "../theme/tokens";
import { Icon } from "./UI";

export function ReviewProgressHeader({
  current,
  total,
  onBack,
}: {
  current: number;
  total: number;
  onBack: () => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to review summary"
        onPress={onBack}
        style={styles.back}
      >
        <Icon
          name="chevron-back"
          size={reviewFrontDesign.backButton.iconSize}
          color={colors.reviewMuted}
        />
      </Pressable>
      <View
        testID="review-progress"
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Review progress"
        accessibilityValue={{ min: 0, max: total, now: current }}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        style={styles.progress}
      >
        <Text style={styles.progressText}>
          {current}
          <Text style={styles.remaining}> / {total}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    height: reviewFrontDesign.header.height,
    flexShrink: 0,
    alignItems: "center",
  },
  back: {
    position: "absolute",
    left: reviewFrontDesign.backButton.left,
    top: reviewFrontDesign.backButton.top,
    width: reviewFrontDesign.backButton.width,
    height: reviewFrontDesign.backButton.height,
    alignItems: "center",
    justifyContent: "center",
  },
  progress: {
    marginTop: reviewFrontDesign.progress.marginTop,
    width: reviewFrontDesign.progress.width,
    height: reviewFrontDesign.progress.height,
    borderRadius: reviewFrontDesign.progress.borderRadius,
    backgroundColor: colors.reviewCounter,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    fontFamily: fonts.serifBold,
    fontSize: reviewFrontDesign.progress.fontSize,
    lineHeight: reviewFrontDesign.progress.lineHeight,
    color: colors.black,
  },
  remaining: {
    fontFamily: fonts.serif,
    color: reviewFrontDesign.progress.remainingColor,
  },
});
