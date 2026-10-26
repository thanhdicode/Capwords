import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import type { ReviewOutcome } from "../domain/review";
import type { Word } from "../domain/types";
import {
  reviewCompletionReference,
  type ReviewCompletionSourceId,
} from "../data/reviewCompletionReference";
import {
  fonts,
  metrics,
  reviewCompletionDesign,
  reviewProgressDesign,
} from "../theme/tokens";
import { ConfettiBurst } from "./ConfettiBurst";
import { ReviewProgressRingVisual } from "./ReviewProgressRingVisual";
import { Body, PillButton, Screen, Serif } from "./UI";
import { Sticker } from "./Sticker";

const studyPortrait = require("../../assets/study-portrait.jpg");

export function ReviewCompletionSummary({
  outcomes,
  words,
  sourceId,
  onFinish,
  onReviewAgain,
}: {
  outcomes: ReviewOutcome[];
  words: Word[];
  sourceId?: ReviewCompletionSourceId;
  onFinish: () => void;
  onReviewAgain: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const scale = Math.min(
    width / reviewCompletionDesign.stage.width,
    (height - metrics.top - metrics.bottom) /
      reviewCompletionDesign.stage.height,
  );
  const wordsById = new Map(words.map((word) => [word.id, word]));
  const resolveRatedWords = (rating: ReviewOutcome["rating"]) =>
    outcomes.flatMap((outcome) => {
      const word = wordsById.get(outcome.wordId);
      return outcome.rating === rating && word ? [word] : [];
    });
  const goodWords = resolveRatedWords("good");
  const reviewWords = resolveRatedWords("again");
  const total = goodWords.length + reviewWords.length;
  const progressPercent = total
    ? Math.round((goodWords.length / total) * 100)
    : 0;
  const dateLabel = sourceId
    ? reviewCompletionReference.fixtureDateLabel
    : new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date());
  const completionColors = reviewProgressDesign.progress;
  const confetti = sourceId
    ? reviewCompletionReference.captures[sourceId].confetti
    : true;

  return (
    <Screen background={reviewCompletionDesign.background}>
      <View style={styles.centeredStage}>
        <View
          testID="review-completion-summary"
          style={[styles.stage, { transform: [{ scale }] }]}
        >
          <Serif
            style={[
              styles.headline,
              {
                top: reviewCompletionDesign.headline.top,
                left: reviewCompletionDesign.headline.horizontalInset,
                right: reviewCompletionDesign.headline.horizontalInset,
                color: reviewCompletionDesign.headlineColor,
                fontFamily: fonts.serifBold,
                fontSize: reviewCompletionDesign.headline.fontSize,
                lineHeight: reviewCompletionDesign.headline.lineHeight,
              },
            ]}
          >
            {reviewCompletionReference.headline}
          </Serif>

          <ReviewProgressRingVisual
            layout={reviewCompletionDesign}
            progressPercent={progressPercent}
            headline={reviewCompletionReference.ringHeadline}
            dateLabel={dateLabel}
            numberColor={completionColors.colorBySource["102"]}
            ringColor={completionColors.ringColorBySource["102"]}
            testID="review-completion-progress"
          />

          <ReviewOutcomeGroup
            title="Got it!"
            words={goodWords}
            rating="good"
            labelTop={reviewCompletionDesign.groups.goodLabelTop}
            cardsTop={reviewCompletionDesign.groups.goodCardsTop}
          />
          <ReviewOutcomeGroup
            title="Needs review"
            words={reviewWords}
            rating="again"
            labelTop={reviewCompletionDesign.groups.reviewLabelTop}
            cardsTop={reviewCompletionDesign.groups.reviewCardsTop}
          />

          <PillButton
            style={[
              styles.finishButton,
              {
                top: reviewCompletionDesign.actions.finishTop,
                width: reviewCompletionDesign.actions.finishWidth,
                height: reviewCompletionDesign.actions.finishHeight,
              },
            ]}
            onPress={onFinish}
          >
            Finish
          </PillButton>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Review Again"
            onPress={onReviewAgain}
            style={[
              styles.secondaryAction,
              {
                top: reviewCompletionDesign.actions.secondaryTop,
                height: reviewCompletionDesign.actions.secondaryHitHeight,
              },
            ]}
          >
            <Body
              style={{
                color: reviewCompletionDesign.secondaryActionColor,
                fontSize: reviewCompletionDesign.actions.secondaryFontSize,
                lineHeight: reviewCompletionDesign.actions.secondaryLineHeight,
              }}
            >
              Review Again
            </Body>
          </Pressable>
        </View>
      </View>
      {confetti && (
        <ConfettiBurst variant={sourceId ? "source103" : "animated"} />
      )}
    </Screen>
  );
}

function ReviewCompletionPortrait({ word }: { word: Word }) {
  const portrait = reviewCompletionDesign.cards.portraitSurface;
  const frame = portrait.frame;
  return (
    <LinearGradient
      colors={portrait.gradientColors}
      locations={[...portrait.gradientLocations]}
      start={portrait.gradientStart}
      end={portrait.gradientEnd}
      style={StyleSheet.absoluteFill}
    >
      <View
        style={[
          styles.portraitFrame,
          {
            left: frame.leftInset,
            top: frame.top,
            width: frame.width,
            height: frame.height,
            paddingTop: frame.insetTop,
            paddingHorizontal: frame.insetHorizontal,
            paddingBottom: frame.insetBottom,
            backgroundColor: frame.color,
          },
        ]}
      >
        <Image
          source={word.imageUri ? { uri: word.imageUri } : studyPortrait}
          resizeMode="cover"
          style={{ width: frame.imageWidth, height: frame.imageHeight }}
        />
      </View>
    </LinearGradient>
  );
}

function ReviewOutcomeGroup({
  title,
  words,
  rating,
  labelTop,
  cardsTop,
}: {
  title: string;
  words: Word[];
  rating: ReviewOutcome["rating"];
  labelTop: number;
  cardsTop: number;
}) {
  const surfaceByCategory = reviewCompletionDesign.cards.surfaceByCategory;
  return (
    <View
      testID={`review-completion-group-${rating}`}
      accessibilityLabel={`${title}, ${words.length} words`}
      style={[
        styles.group,
        {
          left: reviewCompletionDesign.groups.left,
          top: labelTop,
        },
      ]}
    >
      <Serif
        style={{
          color: reviewCompletionDesign.sectionLabelColor,
          fontFamily: fonts.serifBold,
          fontSize: reviewCompletionDesign.groups.labelFontSize,
          lineHeight: reviewCompletionDesign.groups.labelLineHeight,
        }}
      >
        {title}
      </Serif>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.cards, { top: cardsTop - labelTop }]}
        contentContainerStyle={{ gap: reviewCompletionDesign.cards.gap }}
      >
        {words.map((word) => (
          <View
            key={word.id}
            testID="review-completion-word-card"
            accessibilityRole="image"
            accessibilityLabel={word.target}
            style={[
              styles.wordCard,
              {
                width: reviewCompletionDesign.cards.width,
                height: reviewCompletionDesign.cards.height,
                borderRadius: reviewCompletionDesign.cards.radius,
                backgroundColor: surfaceByCategory[word.category] ?? word.color,
              },
            ]}
          >
            {word.category === "People" ? (
              <ReviewCompletionPortrait word={word} />
            ) : (
              <Sticker
                word={word}
                size={reviewCompletionDesign.cards.artworkSize}
              />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centeredStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stage: {
    width: reviewCompletionDesign.stage.width,
    height: reviewCompletionDesign.stage.height,
    position: "relative",
  },
  headline: {
    position: "absolute",
    textAlign: "center",
  },
  group: {
    position: "absolute",
    right: reviewCompletionDesign.groups.left,
  },
  cards: {
    position: "absolute",
    left: 0,
    right: 0,
    height: reviewCompletionDesign.cards.height,
    overflow: "visible",
  },
  wordCard: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  portraitFrame: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  finishButton: {
    position: "absolute",
    left: "50%",
    marginLeft: -reviewCompletionDesign.actions.finishWidth / 2,
  },
  secondaryAction: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
