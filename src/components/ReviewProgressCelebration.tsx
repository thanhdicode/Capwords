import React from "react";
import { Image, StyleSheet, View } from "react-native";
import type { Word } from "../domain/types";
import { colors, reviewProgressDesign } from "../theme/tokens";
import {
  reviewProgressReference,
  type ReviewProgressSourceId,
} from "../data/reviewProgressReference";
import { Screen } from "./UI";
import { Sticker } from "./Sticker";
import { ReviewProgressRingVisual } from "./ReviewProgressRingVisual";

const studyPortrait = require("../../assets/study-portrait.jpg");

export function ReviewProgressCelebration({
  sourceId,
  words,
}: {
  sourceId: ReviewProgressSourceId;
  words: Word[];
}) {
  const capture = reviewProgressReference.states[sourceId];
  const layout =
    sourceId === "100"
      ? {
          ...reviewProgressDesign,
          progress: {
            ...reviewProgressDesign.progress,
            ...reviewProgressDesign.source100.progress,
          },
        }
      : reviewProgressDesign;
  const targets = new Map(words.map((word) => [word.target, word]));
  const filledCards = reviewProgressDesign.filledCardsBySource[sourceId];
  const placeholders = reviewProgressDesign.placeholdersBySource[sourceId];
  const transitionGlyphs =
    sourceId === "101"
      ? reviewProgressReference.states["101"].transitionGlyphs
      : undefined;
  const accessibleLabel = capture.showRing
    ? `${reviewProgressReference.headline}, ${capture.progressPercent} percent, ${reviewProgressReference.dateLabel}`
    : `${capture.progressPercent} percent`;

  return (
    <Screen background={reviewProgressDesign.backgroundBySource[sourceId]}>
      <View style={styles.content}>
        <View
          accessibilityRole="image"
          accessibilityLabel={accessibleLabel}
          testID={`review-progress-${sourceId}`}
          style={styles.stage}
        >
          {placeholders.map((placement, index) => (
            <View
              key={`placeholder-${index}`}
              accessible={false}
              style={[
                styles.placeholder,
                {
                  left: placement.centerX - placement.width / 2,
                  top: placement.centerY - placement.height / 2,
                  width: placement.width,
                  height: placement.height,
                  transform: [{ rotate: placement.rotation }],
                },
              ]}
            />
          ))}

          {filledCards.map((placement) => {
            const word = targets.get(placement.target);
            if (!word) return null;
            return (
              <View
                key={word.id}
                accessible={false}
                style={[
                  styles.filledCard,
                  {
                    left: placement.centerX - placement.width / 2,
                    top: placement.centerY - placement.height / 2,
                    width: placement.width,
                    height: placement.height,
                    backgroundColor:
                      reviewProgressDesign.cardSurfaces[placement.surface],
                    transform: [{ rotate: placement.rotation }],
                  },
                ]}
              >
                {placement.art === "portrait" ? (
                  <View style={styles.photoFrame}>
                    <Image
                      source={
                        word.imageUri ? { uri: word.imageUri } : studyPortrait
                      }
                      resizeMode="cover"
                      style={[
                        reviewProgressDesign.portraitPhotoSize,
                        !word.imageUri && styles.referencePortraitRotation,
                      ]}
                    />
                  </View>
                ) : (
                  <Sticker word={word} size={placement.mediaSize} />
                )}
              </View>
            );
          })}

          <ReviewProgressRingVisual
            layout={layout}
            progressPercent={capture.progressPercent}
            headline={reviewProgressReference.headline}
            dateLabel={reviewProgressReference.dateLabel}
            numberColor={reviewProgressDesign.progress.colorBySource[sourceId]}
            ringColor={
              reviewProgressDesign.progress.ringColorBySource[sourceId]
            }
            testID={`review-progress-percent-${sourceId}`}
            transitionGlyphs={transitionGlyphs}
            showRing={capture.showRing}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  stage: {
    width: reviewProgressDesign.stage.width,
    height: reviewProgressDesign.stage.height,
    position: "relative",
    overflow: "visible",
  },
  placeholder: {
    position: "absolute",
    backgroundColor: reviewProgressDesign.cardSurfaces.placeholder,
    borderRadius: reviewProgressDesign.cardRadius,
  },
  filledCard: {
    position: "absolute",
    borderRadius: reviewProgressDesign.cardRadius,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoFrame: {
    padding: reviewProgressDesign.photoFramePadding,
    width: reviewProgressDesign.photoFrameSize.width,
    height: reviewProgressDesign.photoFrameSize.height,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  referencePortraitRotation: { transform: [{ rotate: "90deg" }] },
});
