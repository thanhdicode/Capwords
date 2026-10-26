import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { ReviewRating, Word } from "../domain/types";
import { reviewGestureCopy, reviewPracticeCopy } from "../data/reviewCopy";
import {
  colors,
  fonts,
  motion,
  reviewFrontDesign,
  reviewGesture042Design,
  reviewNeedsReview058Design,
  reviewTapDetails068Design,
  reviewMotion,
  reviewSwipe096Design,
  reviewPractice081Design,
  reviewPractice087Design,
  reviewPractice089Design,
  reviewPractice098Design,
  reviewRecordingDesign,
} from "../theme/tokens";
import { Body, Icon, Rounded } from "./UI";
import { Sticker } from "./Sticker";
import { ReviewCardTexture } from "./ReviewCardTexture";
import { ReviewProgressHeader } from "./ReviewProgressHeader";
import {
  ReviewGestureCue,
  ReviewGesturePointer,
  ReviewTapDetailsHint068,
} from "./ReviewGestureCue";
import { ReviewPortraitFrame } from "./ReviewPortraitFrame";

/** Presentation of Gummble 021. Data, playback and rating remain controller-owned. */
export function ReviewFront({
  word,
  index,
  total,
  transition,
  exitDirection,
  playing,
  busy,
  error,
  preparingRecording,
  recording,
  onBack,
  onPlay,
  onPractice,
  onStartRecording,
  onStopRecording,
  onRate,
  gestureSource,
  nextWord,
  progressCurrent,
  cardAccessibilityPrefix,
  nextCardAccessibilityPrefix,
  captureVariant,
  capturedTargetLabel,
  capturedPhoneticLabel,
  detailsCueLabel,
  practiceHintLabel,
  retryFeedback,
}: {
  word: Word;
  index: number;
  total: number;
  transition: Animated.Value;
  exitDirection: 1 | -1;
  playing: boolean;
  busy: boolean;
  error: string | null;
  preparingRecording: boolean;
  recording: boolean;
  onBack: () => void;
  onPlay: () => void;
  onPractice: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onRate: (rating: ReviewRating) => void;
  gestureSource?: "042" | "096";
  nextWord?: Word;
  progressCurrent?: number;
  cardAccessibilityPrefix?: string;
  nextCardAccessibilityPrefix?: string;
  captureVariant?: "058" | "068" | "081" | "087" | "089" | "098";
  capturedTargetLabel?: string;
  capturedPhoneticLabel?: string;
  detailsCueLabel?: string;
  practiceHintLabel?: string;
  retryFeedback?: {
    title: string;
    bodyPrefix: string;
    bodySuffix: string;
    playbackLabel: string;
  };
}) {
  const referenceIcecream = word.emoji === "🍦" && !word.imageUri;
  const [drag] = useState(() => new Animated.ValueXY({ x: 0, y: 0 }));
  const [feedback, setFeedback] = useState<ReviewRating | null>(null);
  const recordingGesture = useRef(false);
  const source042GestureActive = gestureSource === "042" || feedback === "good";
  const source096TransitionActive = gestureSource === "096";
  const source058ReviewActive = captureVariant === "058";
  const source068TapDetailsActive = captureVariant === "068";
  const source081PracticeActive = captureVariant === "081";
  const source087PracticeActive = captureVariant === "087";
  const source089PracticeActive = captureVariant === "089";
  const source098PracticeActive = captureVariant === "098";
  const backCards = source081PracticeActive
    ? []
    : source089PracticeActive
      ? reviewPractice089Design.backCards
      : source087PracticeActive
        ? reviewPractice087Design.backCards
        : reviewFrontDesign.backCards;

  useEffect(() => {
    drag.setValue({ x: 0, y: 0 });
  }, [drag, index]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          !busy &&
          Math.abs(gesture.dx) > reviewMotion.swipeStartDistance &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (_event, gesture) => {
          drag.setValue({ x: gesture.dx, y: 0 });
          const nextFeedback =
            Math.abs(gesture.dx) >= reviewMotion.swipeFeedbackDistance
              ? gesture.dx > 0
                ? "good"
                : "again"
              : null;
          setFeedback((current) =>
            current === nextFeedback ? current : nextFeedback,
          );
        },
        onPanResponderRelease: (_event, gesture) => {
          setFeedback(null);
          if (Math.abs(gesture.dx) >= reviewMotion.swipeCommitDistance) {
            onRate(gesture.dx > 0 ? "good" : "again");
            return;
          }
          Animated.spring(drag, {
            toValue: { x: 0, y: 0 },
            ...motion.spring,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          setFeedback(null);
          Animated.spring(drag, {
            toValue: { x: 0, y: 0 },
            ...motion.spring,
            useNativeDriver: true,
          }).start();
        },
      }),
    [busy, drag, onRate],
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={s.content}
    >
      <ReviewProgressHeader
        current={progressCurrent ?? index}
        total={total}
        onBack={onBack}
      />
      {source042GestureActive && (
        <ReviewGestureCue
          direction="forward"
          label={reviewGestureCopy.gotItCue}
          design={reviewGesture042Design.cue}
        />
      )}
      {source058ReviewActive && (
        <ReviewGestureCue
          direction="back"
          label={reviewGestureCopy.needsReviewCue}
          design={reviewNeedsReview058Design.cue}
        />
      )}
      {source068TapDetailsActive && detailsCueLabel && (
        <ReviewTapDetailsHint068
          label={detailsCueLabel}
          design={reviewTapDetails068Design.cue}
        />
      )}
      <View
        style={[
          s.deck,
          source096TransitionActive && s.transitionDeck,
          source081PracticeActive && s.capture081Deck,
          source089PracticeActive && s.capture089Deck,
          source098PracticeActive && s.capture098Deck,
        ]}
      >
        {source096TransitionActive ? (
          nextWord ? (
            <ReviewTransitionNextCard
              word={nextWord}
              accessibilityPrefix={nextCardAccessibilityPrefix}
            />
          ) : null
        ) : source098PracticeActive ? null : (
          backCards.map((backCard) => (
            <View
              key={backCard.angleDegrees}
              pointerEvents="none"
              style={[
                s.card,
                s.backCard,
                source089PracticeActive && s.capture089Card,
                {
                  backgroundColor: backCard.surface,
                  transform: [{ rotate: `${backCard.angleDegrees}deg` }],
                },
              ]}
            >
              <ReviewCardTexture />
            </View>
          ))
        )}
        {feedback === "again" && (
          <View
            testID="review-swipe-feedback"
            pointerEvents="none"
            style={s.swipeFeedback}
          >
            <Body style={s.swipeFeedbackText}>
              {reviewGestureCopy.needsReview}
            </Body>
          </View>
        )}
        <Animated.View
          {...(source096TransitionActive ||
          source058ReviewActive ||
          source068TapDetailsActive
            ? {}
            : panResponder.panHandlers)}
          testID="review-card"
          accessibilityLabel={
            cardAccessibilityPrefix
              ? `${cardAccessibilityPrefix}: ${word.target}`
              : undefined
          }
          accessibilityHint={reviewGestureCopy.swipeHint}
          style={[
            s.card,
            source096TransitionActive && s.transitionCard,
            source081PracticeActive && s.capture081Card,
            source089PracticeActive && s.capture089Card,
            source098PracticeActive && s.capture098Card,
            {
              backgroundColor: source081PracticeActive
                ? reviewPractice081Design.card.surfaceColor
                : referenceIcecream
                  ? colors.reviewSurface
                  : source096TransitionActive
                    ? reviewSwipe096Design.current.surfaceColor
                    : source087PracticeActive
                      ? reviewPractice087Design.card.surfaceColor
                      : source089PracticeActive
                        ? reviewPractice089Design.card.surfaceColor
                        : source098PracticeActive
                          ? reviewPractice098Design.card.surfaceColor
                          : word.color,
              opacity: transition,
              zIndex: source096TransitionActive
                ? reviewSwipe096Design.current.zIndex
                : undefined,
              borderWidth: source042GestureActive
                ? reviewGesture042Design.card.borderWidth
                : source058ReviewActive
                  ? reviewNeedsReview058Design.card.borderWidth
                  : 0,
              borderColor: source058ReviewActive
                ? reviewNeedsReview058Design.card.borderColor
                : reviewGesture042Design.card.borderColor,
              transform: [
                {
                  translateX:
                    gestureSource === "042"
                      ? Animated.add(
                          drag.x,
                          reviewGesture042Design.card.translateX,
                        )
                      : source058ReviewActive
                        ? Animated.add(
                            drag.x,
                            reviewNeedsReview058Design.card.translateX,
                          )
                        : source096TransitionActive
                          ? Animated.add(
                              drag.x,
                              reviewSwipe096Design.current.translateX,
                            )
                          : drag.x,
                },
                {
                  translateY:
                    gestureSource === "042"
                      ? Animated.add(
                          drag.y,
                          reviewGesture042Design.card.translateY,
                        )
                      : source058ReviewActive
                        ? Animated.add(
                            drag.y,
                            reviewNeedsReview058Design.card.translateY,
                          )
                        : source096TransitionActive
                          ? Animated.add(
                              drag.y,
                              reviewSwipe096Design.current.translateY,
                            )
                          : drag.y,
                },
                {
                  scale:
                    gestureSource === "042"
                      ? reviewGesture042Design.card.scale
                      : source058ReviewActive
                        ? reviewNeedsReview058Design.card.scale
                        : source096TransitionActive
                          ? reviewSwipe096Design.current.scale
                          : feedback === "good"
                            ? drag.x.interpolate({
                                inputRange: [
                                  0,
                                  reviewGesture042Design.card.translateX,
                                ],
                                outputRange: [
                                  1,
                                  reviewGesture042Design.card.scale,
                                ],
                                extrapolate: "clamp",
                              })
                            : 1,
                },
                {
                  rotate:
                    gestureSource === "042"
                      ? `${reviewGesture042Design.card.rotationDegrees}deg`
                      : source058ReviewActive
                        ? `${reviewNeedsReview058Design.card.rotationDegrees}deg`
                        : source096TransitionActive
                          ? `${reviewSwipe096Design.current.rotationDegrees}deg`
                          : feedback === "good"
                            ? drag.x.interpolate({
                                inputRange: [
                                  -reviewGesture042Design.card.translateX,
                                  0,
                                  reviewGesture042Design.card.translateX,
                                ],
                                outputRange: [
                                  `-${reviewGesture042Design.card.rotationDegrees}deg`,
                                  "0deg",
                                  `${reviewGesture042Design.card.rotationDegrees}deg`,
                                ],
                                extrapolate: "clamp",
                              })
                            : "0deg",
                },
                {
                  scale: transition.interpolate({
                    inputRange: [0, 1],
                    outputRange: [reviewMotion.entryScale, 1],
                  }),
                },
                {
                  translateX: transition.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      exitDirection * reviewMotion.cardExitDistance,
                      0,
                    ],
                  }),
                },
              ],
            },
          ]}
        >
          <ReviewCardTexture
            variant={
              source096TransitionActive
                ? "snapshot"
                : source081PracticeActive
                  ? "practice081"
                  : source087PracticeActive
                    ? "practice087"
                    : source089PracticeActive
                      ? "practice089"
                      : source098PracticeActive
                        ? "practice098"
                        : "practice"
            }
          />
          <View
            testID="review-card-illustration"
            style={[
              s.illustration,
              source096TransitionActive && s.transitionCurrentIllustration,
              source058ReviewActive && s.capture058Illustration,
              source081PracticeActive && s.capture081Illustration,
              source087PracticeActive && s.capture087Illustration,
              source089PracticeActive && s.capture089Illustration,
              source098PracticeActive && s.capture098Illustration,
            ]}
          >
            {source098PracticeActive ? (
              <ReviewPortraitFrame />
            ) : referenceIcecream ? (
              <Image
                accessibilityLabel="Ice cream sticker"
                source={
                  source042GestureActive
                    ? require("../../assets/stickers/review-icecream-042.png")
                    : require("../../assets/stickers/review-icecream.png")
                }
                resizeMode="contain"
                style={
                  source042GestureActive
                    ? s.icecream042
                    : source081PracticeActive
                      ? s.capture081Icecream
                      : s.icecream
                }
              />
            ) : (
              <Sticker
                word={word}
                size={
                  source096TransitionActive
                    ? reviewSwipe096Design.current.illustration.size
                    : source087PracticeActive
                      ? reviewPractice087Design.illustration.size
                      : source089PracticeActive
                        ? reviewPractice089Design.illustration.size
                        : reviewFrontDesign.illustration.width
                }
              />
            )}
          </View>
          <Rounded
            style={[
              s.target,
              source096TransitionActive && s.transitionCurrentTarget,
              source058ReviewActive && s.capture058Target,
              source068TapDetailsActive && s.capture068Target,
              source081PracticeActive && s.capture081Target,
              source087PracticeActive && s.capture087Target,
              source089PracticeActive && s.capture089Target,
              source098PracticeActive && s.capture098Target,
            ]}
          >
            {capturedTargetLabel ?? word.target.toLowerCase()}
          </Rounded>
          {source089PracticeActive && retryFeedback && (
            <View testID="review-retry-feedback" style={s.capture089Feedback}>
              <Image
                source={require("../../assets/stickers/review-feedback-star-089.png")}
                resizeMode="contain"
                style={s.capture089FeedbackIcon}
              />
              <View style={s.capture089FeedbackCopy}>
                <Text style={s.capture089FeedbackTitle}>
                  {retryFeedback.title}
                </Text>
                <View style={s.capture089FeedbackPrompt}>
                  <Text style={s.capture089FeedbackBody}>
                    {retryFeedback.bodyPrefix}
                  </Text>
                  <Pressable
                    testID="review-retry-feedback-audio"
                    accessibilityRole="button"
                    accessibilityLabel={retryFeedback.playbackLabel}
                    accessibilityState={{ busy: playing }}
                    aria-busy={playing}
                    disabled={busy || preparingRecording || recording}
                    onPress={onPlay}
                    style={s.capture089FeedbackAudio}
                  >
                    <Icon
                      name={playing ? "stop" : "volume-high"}
                      size={reviewPractice089Design.feedback.audioIconSize}
                      color={reviewPractice089Design.feedback.bodyColor}
                    />
                  </Pressable>
                  <Text style={s.capture089FeedbackBody}>
                    {retryFeedback.bodySuffix}
                  </Text>
                </View>
              </View>
            </View>
          )}
          <View
            style={[
              s.phonetics,
              source096TransitionActive && s.transitionCurrentPhonetics,
              source081PracticeActive && s.capture081Phonetics,
              source087PracticeActive && s.capture087Phonetics,
              source089PracticeActive && s.capture089Phonetics,
              source098PracticeActive && s.capture098Phonetics,
            ]}
          >
            <Body
              style={[
                s.phoneticText,
                source081PracticeActive && s.capture081PhoneticText,
                source087PracticeActive && s.capture087PhoneticText,
                source089PracticeActive && s.capture089PhoneticText,
              ]}
            >
              {capturedPhoneticLabel ?? word.phonetic}
            </Body>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                playing ? "Stop pronunciation" : "Play pronunciation"
              }
              accessibilityState={{ busy: playing }}
              aria-busy={playing}
              disabled={busy || preparingRecording || recording}
              onPress={onPlay}
              style={s.audio}
            >
              <Icon
                name={playing ? "stop" : "volume-high"}
                size={
                  source081PracticeActive
                    ? reviewPractice081Design.phonetics.audioIconSize
                    : source087PracticeActive
                      ? reviewPractice087Design.phonetics.iconSize
                      : source089PracticeActive
                        ? reviewPractice089Design.phonetics.audioIconSize
                        : source098PracticeActive
                          ? reviewPractice098Design.phonetics.iconSize
                          : reviewFrontDesign.audio.iconSize
                }
                color={colors.white}
              />
            </Pressable>
          </View>
          {source042GestureActive && (
            <ReviewGesturePointer design={reviewGesture042Design.pointer} />
          )}
          {source068TapDetailsActive && (
            <ReviewGesturePointer
              design={reviewTapDetails068Design.pointer}
              source={require("../../assets/stickers/review-tap-hand-068.png")}
            />
          )}
        </Animated.View>
        {source058ReviewActive && (
          <ReviewGesturePointer design={reviewNeedsReview058Design.pointer} />
        )}
      </View>
      <Body
        style={[
          s.hint,
          source081PracticeActive && s.capture081Hint,
          source089PracticeActive && s.capture089Hint,
          source098PracticeActive && s.capture098Hint,
        ]}
      >
        {practiceHintLabel ?? reviewPracticeCopy.hint}
      </Body>
      <Pressable
        testID="review-practice"
        accessibilityRole="button"
        accessibilityLabel={reviewPracticeCopy.accessibilityLabel}
        accessibilityHint={reviewPracticeCopy.accessibilityHint}
        accessibilityState={{ busy: preparingRecording || recording }}
        aria-busy={preparingRecording || recording}
        disabled={busy}
        onPressIn={() => {
          recordingGesture.current = false;
        }}
        onLongPress={() => {
          recordingGesture.current = true;
          onStartRecording();
        }}
        onPressOut={() => {
          if (recordingGesture.current) onStopRecording();
        }}
        onPress={() => {
          if (!recordingGesture.current) onPractice();
        }}
        style={[
          s.mic,
          source081PracticeActive && s.capture081Microphone,
          source089PracticeActive && s.capture089Microphone,
          source098PracticeActive && s.capture098Microphone,
          recording && s.micRecording,
        ]}
      >
        {source081PracticeActive ? (
          <Image
            testID="review-microphone-artwork"
            accessible={false}
            source={require("../../assets/stickers/review-microphone-ring-081.png")}
            resizeMode="contain"
            style={s.capture081MicrophoneArtwork}
          />
        ) : (
          <Icon
            name="mic-outline"
            size={
              source098PracticeActive
                ? reviewPractice098Design.microphone.iconSize
                : source089PracticeActive
                  ? reviewPractice089Design.microphone.iconSize
                  : reviewFrontDesign.microphone.iconSize
            }
            color={
              recording
                ? reviewRecordingDesign.activeMicrophone.iconColor
                : colors.reviewMuted
            }
          />
        )}
      </Pressable>
      {(preparingRecording || recording) && (
        <Text
          testID="review-recording-status"
          accessibilityLiveRegion="polite"
          style={s.recordingStatus}
        >
          {recording
            ? reviewPracticeCopy.recordingStatus
            : reviewPracticeCopy.preparingStatus}
        </Text>
      )}
      {error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
    </ScrollView>
  );
}

function ReviewTransitionNextCard({
  word,
  accessibilityPrefix,
}: {
  word: Word;
  accessibilityPrefix?: string;
}) {
  return (
    <View
      testID="review-transition-next-card"
      accessible
      accessibilityLabel={
        accessibilityPrefix
          ? `${accessibilityPrefix}: ${word.target}`
          : undefined
      }
      pointerEvents="none"
      style={[
        s.card,
        s.transitionCard,
        s.transitionBackCard,
        {
          backgroundColor: reviewSwipe096Design.next.surfaceColor,
          transform: [
            { translateX: reviewSwipe096Design.next.translateX },
            { translateY: reviewSwipe096Design.next.translateY },
            { scale: reviewSwipe096Design.next.scale },
            { rotate: `${reviewSwipe096Design.next.rotationDegrees}deg` },
          ],
        },
      ]}
    >
      <ReviewCardTexture variant="snapshot" />
      <View style={[s.illustration, s.transitionNextIllustration]}>
        <ReviewPortraitFrame />
      </View>
      <Rounded style={s.target}>{word.target.toLowerCase()}</Rounded>
      <View style={s.phonetics}>
        <Body style={s.phoneticText}>{word.phonetic}</Body>
        <Icon
          name="volume-high"
          size={reviewFrontDesign.audio.iconSize}
          color={colors.white}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: reviewFrontDesign.content.paddingBottom,
  },
  deck: {
    position: "relative",
    width: reviewFrontDesign.card.width,
    height: reviewFrontDesign.card.height,
    marginTop: reviewFrontDesign.deck.marginTop,
  },
  transitionDeck: {
    width: reviewSwipe096Design.card.width,
    height: reviewSwipe096Design.card.height,
    marginTop: reviewSwipe096Design.deck.marginTop,
  },
  capture081Deck: {
    width: reviewPractice081Design.card.width,
    height: reviewPractice081Design.card.height,
    marginTop: reviewPractice081Design.card.marginTop,
  },
  capture089Deck: {
    width: reviewPractice089Design.card.width,
    height: reviewPractice089Design.card.height,
    marginTop: reviewPractice089Design.card.marginTop,
  },
  capture098Deck: {
    width: reviewPractice098Design.card.width,
    height: reviewPractice098Design.card.height,
    marginTop: reviewPractice098Design.card.marginTop,
  },
  swipeFeedback: {
    position: "absolute",
    top: reviewFrontDesign.swipeFeedback.top,
    left: reviewFrontDesign.swipeFeedback.horizontalInset,
    right: reviewFrontDesign.swipeFeedback.horizontalInset,
    alignItems: "center",
    zIndex: reviewFrontDesign.swipeFeedback.zIndex,
  },
  swipeFeedbackText: {
    fontSize: reviewFrontDesign.swipeFeedback.fontSize,
    fontWeight: reviewFrontDesign.swipeFeedback.fontWeight,
    color: reviewFrontDesign.swipeFeedback.color,
  },
  card: {
    width: reviewFrontDesign.card.width,
    height: reviewFrontDesign.card.height,
    borderRadius: reviewFrontDesign.card.borderRadius,
    overflow: "hidden",
  },
  transitionCard: {
    width: reviewSwipe096Design.card.width,
    height: reviewSwipe096Design.card.height,
    borderRadius: reviewSwipe096Design.card.borderRadius,
  },
  capture081Card: {
    width: reviewPractice081Design.card.width,
    height: reviewPractice081Design.card.height,
    borderRadius: reviewPractice081Design.card.borderRadius,
  },
  capture089Card: {
    width: reviewPractice089Design.card.width,
    height: reviewPractice089Design.card.height,
    borderRadius: reviewPractice089Design.card.borderRadius,
  },
  capture098Card: {
    width: reviewPractice098Design.card.width,
    height: reviewPractice098Design.card.height,
    borderRadius: reviewPractice098Design.card.borderRadius,
  },
  backCard: { position: "absolute" },
  transitionBackCard: {
    position: "absolute",
    zIndex: reviewSwipe096Design.next.zIndex,
  },
  illustration: {
    position: "absolute",
    top: reviewFrontDesign.illustration.top,
    left: reviewFrontDesign.illustration.left,
    width: reviewFrontDesign.illustration.width,
    height: reviewFrontDesign.illustration.height,
    alignItems: "center",
    justifyContent: "center",
  },
  transitionNextIllustration: {
    top: reviewSwipe096Design.next.illustration.top,
    left: reviewSwipe096Design.next.illustration.left,
    width: reviewSwipe096Design.next.illustration.width,
    height: reviewSwipe096Design.next.illustration.height,
  },
  transitionCurrentIllustration: {
    top: reviewSwipe096Design.current.illustration.top,
    left: reviewSwipe096Design.current.illustration.left,
  },
  capture081Illustration: {
    top: reviewPractice081Design.illustration.top,
    left: reviewPractice081Design.illustration.left,
    width: reviewPractice081Design.illustration.width,
    height: reviewPractice081Design.illustration.height,
  },
  capture087Illustration: {
    top: reviewPractice087Design.illustration.top,
    left: reviewPractice087Design.illustration.left,
    width: reviewPractice087Design.illustration.size,
    height: reviewPractice087Design.illustration.size,
  },
  capture089Illustration: {
    top: reviewPractice089Design.illustration.top,
    left: reviewPractice089Design.illustration.left,
    width: reviewPractice089Design.illustration.size,
    height: reviewPractice089Design.illustration.size,
  },
  capture098Illustration: {
    top: reviewPractice098Design.illustration.top,
    left: reviewPractice098Design.illustration.left,
    width: reviewPractice098Design.illustration.size,
    height: reviewPractice098Design.illustration.size,
  },
  capture058Illustration: {
    top: reviewNeedsReview058Design.illustration.top,
    left: reviewNeedsReview058Design.illustration.left,
  },
  icecream: {
    width: reviewFrontDesign.illustration.icecreamWidth,
    height: reviewFrontDesign.illustration.height,
  },
  capture081Icecream: {
    width: reviewPractice081Design.sticker.width,
    height: reviewPractice081Design.sticker.height,
  },
  icecream042: {
    position: "absolute",
    top: reviewGesture042Design.icecream.top,
    width: reviewGesture042Design.icecream.width,
    height: reviewGesture042Design.icecream.height,
    alignSelf: "center",
  },
  target: {
    position: "absolute",
    top: reviewFrontDesign.target.top,
    left: reviewFrontDesign.target.left,
    width: reviewFrontDesign.targetLabelWidth,
    fontSize: reviewFrontDesign.target.fontSize,
    lineHeight: reviewFrontDesign.target.lineHeight,
    textAlign: "center",
    color: colors.white,
  },
  capture058Target: {
    top: reviewNeedsReview058Design.target.top,
    left: reviewNeedsReview058Design.target.left,
  },
  capture068Target: {
    top: reviewTapDetails068Design.target.top,
  },
  capture081Target: {
    top: reviewPractice081Design.target.top,
    left: reviewPractice081Design.target.left,
    width: reviewPractice081Design.target.width,
    fontSize: reviewPractice081Design.target.fontSize,
    lineHeight: reviewPractice081Design.target.lineHeight,
  },
  transitionCurrentTarget: {
    left: reviewSwipe096Design.current.targetLeft,
    top: reviewSwipe096Design.current.targetTop,
  },
  capture087Target: {
    left: reviewPractice087Design.target.left,
    top: reviewPractice087Design.target.top,
  },
  capture089Target: {
    left: reviewPractice089Design.target.left,
    top: reviewPractice089Design.target.top,
    width: reviewPractice089Design.target.width,
    fontSize: reviewPractice089Design.target.fontSize,
    lineHeight: reviewPractice089Design.target.lineHeight,
  },
  capture098Target: {
    left: reviewPractice098Design.target.left,
    top: reviewPractice098Design.target.top,
    width: reviewPractice098Design.target.width,
    fontSize: reviewPractice098Design.target.fontSize,
    lineHeight: reviewPractice098Design.target.lineHeight,
  },
  phonetics: {
    position: "absolute",
    bottom: reviewFrontDesign.phonetics.bottom,
    left: reviewFrontDesign.phonetics.left,
    right: reviewFrontDesign.phonetics.right,
    height: reviewFrontDesign.phonetics.height,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  transitionCurrentPhonetics: {
    bottom: reviewSwipe096Design.current.phoneticsBottom,
  },
  capture081Phonetics: {
    bottom: reviewPractice081Design.phonetics.bottom,
    height: reviewPractice081Design.phonetics.height,
  },
  capture081PhoneticText: {
    fontSize: reviewPractice081Design.phonetics.fontSize,
    lineHeight: reviewPractice081Design.phonetics.lineHeight,
    transform: [
      { rotate: `${reviewPractice081Design.phonetics.rotationDegrees}deg` },
    ],
  },
  capture087Phonetics: {
    bottom: reviewPractice087Design.phonetics.bottom,
  },
  capture087PhoneticText: {
    fontSize: reviewPractice087Design.phonetics.fontSize,
    lineHeight: reviewPractice087Design.phonetics.lineHeight,
  },
  capture089Phonetics: {
    bottom: reviewPractice089Design.phonetics.bottom,
    height: reviewPractice089Design.phonetics.height,
  },
  capture089PhoneticText: {
    fontSize: reviewPractice089Design.phonetics.fontSize,
    lineHeight: reviewPractice089Design.phonetics.lineHeight,
    transform: [
      { rotate: `${reviewPractice089Design.phonetics.rotationDegrees}deg` },
    ],
  },
  capture098Phonetics: {
    bottom: reviewPractice098Design.phonetics.bottom,
    left: reviewPractice098Design.phonetics.left,
    right: reviewPractice098Design.phonetics.right,
    height: reviewPractice098Design.phonetics.height,
  },
  phoneticText: {
    color: colors.white,
    fontSize: reviewFrontDesign.phoneticText.fontSize,
    lineHeight: reviewFrontDesign.phoneticText.lineHeight,
  },
  capture089Feedback: {
    position: "absolute",
    top: reviewPractice089Design.feedback.top,
    left: 0,
    right: 0,
    height: reviewPractice089Design.feedback.height,
    paddingLeft: reviewPractice089Design.feedback.paddingLeft,
    paddingRight: reviewPractice089Design.feedback.paddingRight,
    backgroundColor: reviewPractice089Design.feedback.backgroundColor,
    flexDirection: "row",
    alignItems: "center",
    gap: reviewPractice089Design.feedback.gap,
  },
  capture089FeedbackIcon: {
    width: reviewPractice089Design.feedback.iconWidth,
    height: reviewPractice089Design.feedback.iconHeight,
  },
  capture089FeedbackCopy: {
    width: reviewPractice089Design.feedback.copyWidth,
    marginTop: reviewPractice089Design.feedback.copyTopInset,
  },
  capture089FeedbackTitle: {
    fontFamily: reviewPractice089Design.feedback.titleFontFamily,
    color: colors.black,
    fontSize: reviewPractice089Design.feedback.titleFontSize,
    lineHeight: reviewPractice089Design.feedback.titleLineHeight,
  },
  capture089FeedbackPrompt: {
    flexDirection: "row",
    alignItems: "center",
  },
  capture089FeedbackBody: {
    fontFamily: reviewPractice089Design.feedback.bodyFontFamily,
    color: reviewPractice089Design.feedback.bodyColor,
    fontSize: reviewPractice089Design.feedback.bodyFontSize,
    lineHeight: reviewPractice089Design.feedback.bodyLineHeight,
  },
  capture089FeedbackAudio: {
    width: reviewPractice089Design.feedback.audioButtonSize,
    height: reviewPractice089Design.feedback.audioButtonSize,
    alignItems: "center",
    justifyContent: "center",
  },
  audio: {
    width: reviewFrontDesign.audio.size,
    height: reviewFrontDesign.audio.size,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontSize: reviewFrontDesign.hint.fontSize,
    lineHeight: reviewFrontDesign.hint.lineHeight,
    textAlign: "center",
    marginTop: reviewFrontDesign.hint.marginTop,
    color: colors.reviewMuted,
  },
  capture081Hint: {
    fontSize: reviewPractice081Design.hint.fontSize,
    lineHeight: reviewPractice081Design.hint.lineHeight,
    marginTop: reviewPractice081Design.hint.marginTop,
    color: reviewPractice081Design.hint.color,
  },
  capture098Hint: {
    fontSize: reviewPractice098Design.hint.fontSize,
    lineHeight: reviewPractice098Design.hint.lineHeight,
    marginTop: reviewPractice098Design.hint.marginTop,
    color: reviewPractice098Design.hint.color,
  },
  capture089Hint: {
    fontSize: reviewPractice089Design.hint.fontSize,
    lineHeight: reviewPractice089Design.hint.lineHeight,
    marginTop: reviewPractice089Design.hint.marginTop,
  },
  mic: {
    marginTop: reviewFrontDesign.microphone.marginTop,
    width: reviewFrontDesign.microphone.size,
    height: reviewFrontDesign.microphone.size,
    borderRadius: reviewFrontDesign.microphone.borderRadius,
    borderWidth: reviewFrontDesign.microphone.borderWidth,
    borderStyle: reviewFrontDesign.microphone.borderStyle,
    borderColor: reviewFrontDesign.microphone.borderColor,
    alignItems: "center",
    justifyContent: "center",
  },
  capture081Microphone: {
    marginTop: reviewPractice081Design.microphone.marginTop,
    width: reviewPractice081Design.microphone.size,
    height: reviewPractice081Design.microphone.size,
    borderWidth: 0,
  },
  capture081MicrophoneArtwork: {
    width: reviewPractice081Design.microphone.size,
    height: reviewPractice081Design.microphone.size,
  },
  capture089Microphone: {
    marginTop: reviewPractice089Design.microphone.marginTop,
    width: reviewPractice089Design.microphone.size,
    height: reviewPractice089Design.microphone.size,
    borderRadius: reviewPractice089Design.microphone.borderRadius,
    borderWidth: reviewPractice089Design.microphone.borderWidth,
    borderStyle: reviewPractice089Design.microphone.borderStyle,
    borderColor: reviewPractice089Design.microphone.borderColor,
  },
  capture098Microphone: {
    marginTop: reviewPractice098Design.microphone.marginTop,
    width: reviewPractice098Design.microphone.size,
    height: reviewPractice098Design.microphone.size,
    borderRadius: reviewPractice098Design.microphone.borderRadius,
    borderWidth: reviewPractice098Design.microphone.borderWidth,
    borderStyle: reviewPractice098Design.microphone.borderStyle,
    borderColor: reviewPractice098Design.microphone.borderColor,
  },
  micRecording: {
    backgroundColor: reviewRecordingDesign.activeMicrophone.backgroundColor,
    borderColor: reviewRecordingDesign.activeMicrophone.borderColor,
    borderStyle: reviewRecordingDesign.activeMicrophone.borderStyle,
  },
  recordingStatus: {
    fontFamily: fonts.body,
    fontSize: reviewRecordingDesign.status.fontSize,
    lineHeight: reviewRecordingDesign.status.lineHeight,
    marginTop: reviewRecordingDesign.status.marginTop,
    color: reviewRecordingDesign.status.color,
    textAlign: "center",
  },
  error: {
    fontFamily: fonts.body,
    color: reviewFrontDesign.error.color,
    fontSize: reviewFrontDesign.error.fontSize,
    textAlign: "center",
    marginTop: reviewFrontDesign.error.marginTop,
    paddingHorizontal: reviewFrontDesign.error.paddingHorizontal,
  },
});
