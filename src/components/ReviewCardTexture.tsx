import React from "react";
import { Image, StyleSheet } from "react-native";
import {
  reviewFeedbackSnapshotDesign,
  reviewFrontDesign,
  reviewPractice081Design,
  reviewPractice087Design,
  reviewPractice089Design,
  reviewPractice098Design,
  reviewSnapshotDesign,
} from "../theme/tokens";

/** Source-derived paper speckles for the reusable Review card surfaces. */
export function ReviewCardTexture({
  variant = "practice",
}: {
  variant?:
    | "practice"
    | "practice081"
    | "practice087"
    | "practice089"
    | "snapshot"
    | "feedback"
    | "practice098";
}) {
  const snapshot = variant === "snapshot";
  const feedback = variant === "feedback";
  const practice081 = variant === "practice081";
  const practice087 = variant === "practice087";
  const practice089 = variant === "practice089";
  const practice098 = variant === "practice098";
  return (
    <Image
      accessible={false}
      pointerEvents="none"
      source={
        snapshot
          ? require("../../assets/patterns/review-card-speckles-094.png")
          : feedback
            ? require("../../assets/patterns/review-card-speckles-092.png")
            : practice081
              ? require("../../assets/patterns/review-card-speckles-081.png")
              : practice087
                ? require("../../assets/patterns/review-card-speckles-087.png")
                : practice089
                  ? require("../../assets/patterns/review-card-speckles-089.png")
                  : practice098
                    ? require("../../assets/patterns/review-card-speckles-098.png")
                    : require("../../assets/patterns/review-card-speckles-021.png")
      }
      resizeMode="stretch"
      style={[
        StyleSheet.absoluteFill,
        {
          opacity: snapshot
            ? reviewSnapshotDesign.card.textureOpacity
            : feedback
              ? reviewFeedbackSnapshotDesign.card.textureOpacity
              : practice081
                ? reviewPractice081Design.card.textureOpacity
                : practice087
                  ? reviewPractice087Design.card.textureOpacity
                  : practice089
                    ? reviewPractice089Design.card.textureOpacity
                    : practice098
                      ? reviewPractice098Design.card.textureOpacity
                      : reviewFrontDesign.card.textureOpacity,
        },
      ]}
    />
  );
}
