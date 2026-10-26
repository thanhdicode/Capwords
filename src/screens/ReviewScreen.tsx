import React, { useEffect, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../state/AppContext";
import { Navigate } from "../navigation/types";
import type { ReviewRating, Word } from "../domain/types";
import { calendarMonthDate, currentStreak } from "../domain/streak";
import {
  dueWords,
  isValidReviewGoal,
  reviewDateKey,
  type ReviewOutcome,
} from "../domain/review";
import {
  Body,
  CircleButton,
  Icon,
  PillButton,
  Rounded,
  Screen,
  Serif,
  Sheet,
  TopBar,
} from "../components/UI";
import { CardFan } from "../components/CardFan";
import { PreparedExampleIntro } from "../components/PreparedExampleIntro";
import { ScenarioMemoryIntroSheet } from "../components/ScenarioMemoryIntroSheet";
import { StreakReminderPrompt } from "../components/StreakReminderPrompt";
import { ConfettiBurst } from "../components/ConfettiBurst";
import { ReviewProgressCelebration } from "../components/ReviewProgressCelebration";
import { DailyReviewGoalDialog } from "../components/DailyReviewGoalDialog";
import { ReviewFront } from "../components/ReviewFront";
import { ReviewSnapshotFront } from "../components/ReviewSnapshotFront";
import { ReviewFeedbackSnapshot } from "../components/ReviewFeedbackSnapshot";
import { ReviewCompletionSummary } from "../components/ReviewCompletionSummary";
import {
  reviewCardReference,
  type ReviewCardSourceId,
} from "../data/reviewCardReference";
import type { ReviewProgressSourceId } from "../data/reviewProgressReference";
import {
  getReviewCompletionFixtureOutcomes,
  type ReviewCompletionSourceId,
} from "../data/reviewCompletionReference";
import {
  reviewSummaryReference,
  type ReviewSummarySourceId,
} from "../data/reviewSummaryReference";
import { streakReference } from "../data/streakReference";
import {
  reviewGoalReference,
  type ReviewGoalReferenceId,
} from "../data/reviewGoalReference";
import { reviewPracticeCopy } from "../data/reviewCopy";
import { usePronunciation } from "../hooks/usePronunciation";
import { useReviewVoiceRecording } from "../hooks/useReviewVoiceRecording";
import {
  colors,
  motion,
  reviewMotion,
  reviewPracticeSheetDesign,
  reviewFeedbackSnapshotDesign,
  reviewPractice081Design,
  reviewPractice087Design,
  reviewPractice089Design,
  reviewPractice098Design,
  reviewRecordingDesign,
  reviewSnapshotDesign,
  streakDesign,
} from "../theme/tokens";

export interface ReviewStats {
  good: number;
  again: number;
  total: number;
}
export function MemoryIntroScreen({
  navigate,
  variant = "memoryCards",
}: {
  navigate: Navigate;
  variant?: "memoryCards" | "preparedExample" | "scenarioCardsSheet";
}) {
  if (variant === "scenarioCardsSheet")
    return (
      <ScenarioMemoryIntroSheet
        onTryDemo={() => navigate("review")}
        onTryLater={() => navigate("collection")}
      />
    );

  if (variant === "preparedExample")
    return (
      <PreparedExampleIntro
        onTryDemo={() => navigate("review")}
        onSnapFirstWord={() => navigate("camera")}
      />
    );

  return (
    <Screen background={colors.blue} light>
      <TopBar onBack={() => navigate("home")} close />
      <View style={{ marginTop: 57 }}>
        <CardFan size={1.08} />
      </View>
      <Serif
        style={{
          fontSize: 27,
          color: "#fff",
          textAlign: "center",
          marginTop: 133,
        }}
      >
        Scenario Memory Cards
      </Serif>
      <Serif
        style={{
          fontSize: 18,
          lineHeight: 23,
          color: "#E2E6F1",
          textAlign: "center",
          paddingHorizontal: 34,
          marginTop: 12,
        }}
      >
        CapWords will help you review{`\n`}captured words using the memory{`\n`}
        curve.
      </Serif>
      <PillButton
        secondary
        style={{
          position: "absolute",
          bottom: 18,
          width: 262,
          alignSelf: "center",
          height: 60,
        }}
        textStyle={{ color: colors.blue, fontSize: 15 }}
        onPress={() => navigate("review")}
      >
        Try a Demo
      </PillButton>
    </Screen>
  );
}
export function ReviewScreen({
  navigate,
  onFinish,
  gestureSource,
  referenceSource,
}: {
  navigate: Navigate;
  onFinish: (stats: ReviewStats, outcomes: ReviewOutcome[]) => void;
  gestureSource?: "042" | "096";
  referenceSource?: ReviewCardSourceId;
}) {
  const { state, rateWord } = useApp();
  const goalValid = isValidReviewGoal(state.dailyGoal);
  const [words] = useState<Word[]>(() =>
    goalValid ? dueWords(state.words).reverse().slice(0, state.dailyGoal) : [],
  );
  const [index, setIndex] = useState(
      referenceSource === "098"
        ? reviewCardReference["098"].progressCurrent
        : 0,
    ),
    [good, setGood] = useState(0),
    [again, setAgain] = useState(0),
    [outcomes, setOutcomes] = useState<ReviewOutcome[]>([]),
    [practice, setPractice] = useState(false),
    [busy, setBusy] = useState(false);
  const [card] = useState(() => new Animated.Value(1));
  const [exitDirection, setExitDirection] = useState<1 | -1>(1);
  const snapshotReference =
    referenceSource === "058" ||
    referenceSource === "068" ||
    referenceSource === "081" ||
    referenceSource === "087" ||
    referenceSource === "089" ||
    referenceSource === "092" ||
    referenceSource === "094" ||
    referenceSource === "096" ||
    referenceSource === "098"
      ? reviewCardReference[referenceSource]
      : undefined;
  const snapshotWord = snapshotReference
    ? words.find(
        (candidate) => candidate.target === snapshotReference.targetWord,
      )
    : undefined;
  const transitionNextWord =
    referenceSource === "096"
      ? words.find(
          (candidate) =>
            candidate.target === reviewCardReference["096"].nextTargetWord,
        )
      : undefined;
  const word = snapshotWord ?? words[index];
  const playback = usePronunciation(
    word?.target ?? "",
    state.learningLanguage || "fr",
    state.preferredSpeechVoiceId,
  );
  const voiceRecording = useReviewVoiceRecording();
  const clearVoiceRecording = voiceRecording.clear;
  useEffect(() => {
    void clearVoiceRecording();
  }, [word?.id, clearVoiceRecording]);
  if (!words.length) {
    return (
      <Screen background={colors.reviewBackground}>
        <TopBar onBack={() => navigate("streak")} close />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 30,
          }}
        >
          <Serif style={{ fontSize: 27, textAlign: "center" }}>
            {goalValid ? "You're all caught up" : "Choose a review goal"}
          </Serif>
          <Body
            style={{
              textAlign: "center",
              marginTop: 12,
              marginBottom: 24,
              lineHeight: 22,
            }}
          >
            {goalValid
              ? "No words are due right now. Come back later to review."
              : "Set a daily review count before starting a session."}
          </Body>
          <PillButton onPress={() => navigate(goalValid ? "home" : "streak")}>
            {goalValid ? "Back to Home" : "Go to streak settings"}
          </PillButton>
        </View>
      </Screen>
    );
  }
  const onSnapshotBack = () => {
    playback.stop();
    void voiceRecording.clear();
    navigate("streak");
  };
  if (referenceSource === "092" && snapshotWord) {
    const reference = reviewCardReference["092"];
    return (
      <Screen background={reviewFeedbackSnapshotDesign.screenBackground}>
        <ReviewFeedbackSnapshot
          word={snapshotWord}
          current={reference.progressCurrent}
          total={reference.progressTotal}
          skipLabel={reference.skipLabel}
          cardAccessibilityPrefix={reference.cardAccessibilityPrefix}
          encouragementIcon={reference.encouragementIcon}
          encouragementTitle={reference.encouragementTitle}
          encouragementBody={reference.encouragementBody}
          onBack={onSnapshotBack}
        />
      </Screen>
    );
  }
  if (referenceSource === "094" && snapshotWord) {
    const reference = reviewCardReference["094"];
    return (
      <Screen background={reviewSnapshotDesign.screenBackground}>
        <ReviewSnapshotFront
          word={snapshotWord}
          current={reference.progressCurrent}
          total={reference.progressTotal}
          skipLabel={reference.skipLabel}
          cardAccessibilityPrefix={reference.cardAccessibilityPrefix}
          onBack={onSnapshotBack}
        />
      </Screen>
    );
  }
  const rate = (rating: ReviewRating) => {
    if (busy || !word) return;
    playback.stop();
    void voiceRecording.clear();
    setBusy(true);
    setPractice(false);
    const direction: 1 | -1 = rating === "good" ? 1 : -1;
    setExitDirection(direction);
    Animated.timing(card, {
      toValue: 0,
      duration: reviewMotion.cardExitDuration,
      useNativeDriver: true,
    }).start(() => {
      if (state.words.some((w) => w.id === word.id)) rateWord(word.id, rating);
      const nextGood = good + (rating === "good" ? 1 : 0),
        nextAgain = again + (rating === "again" ? 1 : 0);
      const nextOutcomes = [...outcomes, { wordId: word.id, rating }];
      setGood(nextGood);
      setAgain(nextAgain);
      if (index + 1 >= words.length) {
        onFinish(
          { good: nextGood, again: nextAgain, total: words.length },
          nextOutcomes,
        );
      } else {
        setOutcomes(nextOutcomes);
        setIndex(index + 1);
        card.setValue(0.5);
        Animated.spring(card, {
          toValue: 1,
          ...motion.spring,
          useNativeDriver: true,
        }).start();
        setBusy(false);
      }
    });
  };
  return (
    <Screen
      background={
        referenceSource === "081"
          ? reviewPractice081Design.screenBackground
          : referenceSource === "087"
            ? reviewPractice087Design.screenBackground
            : referenceSource === "089"
              ? reviewPractice089Design.screenBackground
              : referenceSource === "098"
                ? reviewPractice098Design.screenBackground
                : colors.reviewBackground
      }
    >
      <ReviewFront
        word={word}
        index={index}
        total={
          referenceSource
            ? reviewCardReference[referenceSource].progressTotal
            : words.length
        }
        transition={card}
        exitDirection={exitDirection}
        playing={playback.playing}
        busy={busy}
        error={voiceRecording.error ?? playback.error}
        preparingRecording={voiceRecording.isPreparing}
        recording={voiceRecording.isRecording}
        onBack={() => {
          playback.stop();
          void voiceRecording.clear();
          navigate("streak");
        }}
        onPlay={() => {
          if (playback.playing) playback.stop();
          else void playback.play();
        }}
        onPractice={() => setPractice(true)}
        onStartRecording={() => {
          playback.stop();
          void voiceRecording.startRecording();
        }}
        onStopRecording={() => void voiceRecording.stopRecording()}
        onRate={rate}
        gestureSource={
          gestureSource ?? (referenceSource === "096" ? "096" : undefined)
        }
        nextWord={transitionNextWord}
        progressCurrent={
          referenceSource === "058"
            ? reviewCardReference["058"].progressCurrent
            : referenceSource === "068"
              ? reviewCardReference["068"].progressCurrent
              : referenceSource === "081"
                ? reviewCardReference["081"].progressCurrent
                : referenceSource === "087"
                  ? reviewCardReference["087"].progressCurrent
                  : referenceSource === "089"
                    ? reviewCardReference["089"].progressCurrent
                    : referenceSource === "096"
                      ? reviewCardReference["096"].progressCurrent
                      : referenceSource === "098"
                        ? reviewCardReference["098"].progressCurrent
                        : undefined
        }
        cardAccessibilityPrefix={
          referenceSource === "058"
            ? reviewCardReference["058"].cardAccessibilityPrefix
            : referenceSource === "068"
              ? reviewCardReference["068"].cardAccessibilityPrefix
              : referenceSource === "081"
                ? reviewCardReference["081"].cardAccessibilityPrefix
                : referenceSource === "087"
                  ? reviewCardReference["087"].cardAccessibilityPrefix
                  : referenceSource === "089"
                    ? reviewCardReference["089"].cardAccessibilityPrefix
                    : referenceSource === "096"
                      ? reviewCardReference["096"].cardAccessibilityPrefix
                      : referenceSource === "098"
                        ? reviewCardReference["098"].cardAccessibilityPrefix
                        : undefined
        }
        captureVariant={
          referenceSource === "058"
            ? "058"
            : referenceSource === "068"
              ? "068"
              : referenceSource === "081"
                ? "081"
                : referenceSource === "087"
                  ? "087"
                  : referenceSource === "089"
                    ? "089"
                    : referenceSource === "098"
                      ? "098"
                      : undefined
        }
        capturedTargetLabel={
          referenceSource === "087"
            ? reviewCardReference["087"].capturedTargetLabel
            : referenceSource === "089"
              ? reviewCardReference["089"].capturedTargetLabel
              : referenceSource === "098"
                ? reviewCardReference["098"].capturedTargetLabel
                : referenceSource === "081"
                  ? reviewCardReference["081"].capturedTargetLabel
                  : undefined
        }
        capturedPhoneticLabel={
          referenceSource === "081"
            ? reviewCardReference["081"].capturedPhoneticLabel
            : undefined
        }
        practiceHintLabel={
          referenceSource === "081"
            ? reviewCardReference["081"].hintLabel
            : undefined
        }
        detailsCueLabel={
          referenceSource === "068"
            ? reviewCardReference["068"].cueLabel
            : undefined
        }
        retryFeedback={
          referenceSource === "089"
            ? {
                title: reviewCardReference["089"].feedbackTitle,
                bodyPrefix: reviewCardReference["089"].feedbackBodyPrefix,
                bodySuffix: reviewCardReference["089"].feedbackBodySuffix,
                playbackLabel: reviewCardReference["089"].feedbackPlaybackLabel,
              }
            : undefined
        }
        nextCardAccessibilityPrefix={
          referenceSource === "096"
            ? reviewCardReference["096"].nextCardAccessibilityPrefix
            : undefined
        }
      />
      <Sheet
        visible={practice}
        onClose={() => {
          playback.stop();
          void voiceRecording.stopRecording();
          setPractice(false);
        }}
      >
        <Serif style={reviewPracticeSheetDesign.title}>
          Practice {word.target}
        </Serif>
        <Body style={reviewPracticeSheetDesign.body}>
          {reviewPracticeCopy.sheetDescription}
        </Body>
        {(voiceRecording.isPreparing || voiceRecording.isRecording) && (
          <View accessibilityLiveRegion="polite">
            <Body
              style={[
                reviewPracticeSheetDesign.disclosure,
                reviewRecordingDesign.status,
              ]}
            >
              {voiceRecording.isRecording
                ? reviewPracticeCopy.recordingStatus
                : reviewPracticeCopy.preparingStatus}
            </Body>
          </View>
        )}
        {voiceRecording.recordingUri && (
          <Body style={reviewPracticeSheetDesign.disclosure}>
            {reviewPracticeCopy.recordedAttempt}
          </Body>
        )}
        {voiceRecording.error && (
          <View accessibilityRole="alert">
            <Body style={reviewPracticeSheetDesign.error}>
              {voiceRecording.error}
            </Body>
          </View>
        )}
        <PillButton
          secondary
          icon={voiceRecording.isRecording ? "stop" : "mic-outline"}
          style={reviewPracticeSheetDesign.recordingAction}
          disabled={busy || voiceRecording.isPreparing}
          onPress={() => {
            if (voiceRecording.isRecording) {
              void voiceRecording.stopRecording();
            } else {
              playback.stop();
              void voiceRecording.startRecording();
            }
          }}
        >
          {voiceRecording.isRecording
            ? reviewPracticeCopy.stopRecording
            : reviewPracticeCopy.startRecording}
        </PillButton>
        {voiceRecording.recordingUri && (
          <PillButton
            secondary
            icon={voiceRecording.isPlaying ? "stop" : "play"}
            style={reviewPracticeSheetDesign.playbackAction}
            onPress={() => {
              playback.stop();
              void voiceRecording.togglePlayback();
            }}
          >
            {voiceRecording.isPlaying
              ? reviewPracticeCopy.stopAttempt
              : reviewPracticeCopy.playAttempt}
          </PillButton>
        )}
        <PillButton
          secondary
          icon="volume-high"
          style={reviewPracticeSheetDesign.listenAction}
          disabled={
            busy || voiceRecording.isPreparing || voiceRecording.isRecording
          }
          onPress={() => void playback.play()}
        >
          Listen
        </PillButton>
        <View style={reviewPracticeSheetDesign.ratingRow}>
          <PillButton
            secondary
            style={{ flex: 1 }}
            disabled={busy}
            onPress={() => rate("again")}
          >
            Needs review
          </PillButton>
          <PillButton
            disabled={busy}
            style={{ flex: 1 }}
            onPress={() => rate("good")}
          >
            Got it!
          </PillButton>
        </View>
      </Sheet>
    </Screen>
  );
}
function StreakNumber({ value = 2 }: { value?: number }) {
  const design = streakDesign.number;
  return (
    <View
      style={{
        width: design.width,
        height: design.height,
        backgroundColor: design.backgroundColor,
        borderRadius: design.borderRadius,
        shadowColor: design.shadowColor,
        shadowOpacity: design.shadowOpacity,
        shadowRadius: design.shadowRadius,
      }}
    >
      {design.shadowOffsets.map(([x, y], i) => (
        <Rounded
          key={i}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: design.width,
            fontSize: design.fontSize,
            lineHeight: design.lineHeight,
            color: colors.white,
            textAlign: "center",
          }}
        >
          {value}
        </Rounded>
      ))}
      <Rounded
        style={{
          width: design.width,
          fontSize: design.fontSize,
          lineHeight: design.lineHeight,
          color: colors.black,
          textAlign: "center",
        }}
      >
        {value}
      </Rounded>
    </View>
  );
}
export function StreakScreen({
  navigate,
  completed = false,
  stats = { good: 2, again: 2, total: 4 },
  fixture = false,
  progressSource,
  summarySource,
  completionSource,
  reviewOutcomes,
  source041Fixture = false,
  source057Fixture = false,
  goalReferenceSource,
}: {
  navigate: Navigate;
  completed?: boolean;
  stats?: ReviewStats;
  fixture?: boolean;
  progressSource?: ReviewProgressSourceId;
  summarySource?: ReviewSummarySourceId;
  completionSource?: ReviewCompletionSourceId;
  reviewOutcomes?: ReviewOutcome[];
  source041Fixture?: boolean;
  source057Fixture?: boolean;
  goalReferenceSource?: ReviewGoalReferenceId;
}) {
  const { state, updateSettings } = useApp();
  const [goal, setGoal] = useState(false),
    [monthOffset, setMonthOffset] = useState(0),
    [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const remainingCount = dueWords(state.words).length;
  const emptyReviewState = !completed && remainingCount === 0;
  const goalValid = isValidReviewGoal(state.dailyGoal);
  const now = source041Fixture
    ? new Date(`${streakReference.source041.dateKey}T12:00:00`)
    : source057Fixture
      ? new Date(`${streakReference.source057.captureDateKey}T12:00:00`)
      : fixture
        ? new Date(2025, 8, 12)
        : new Date();
  const streakDays = currentStreak(state.reviewDates, now);
  const background = emptyReviewState
    ? streakDesign.source041Screen
    : streakDesign.defaultScreen;
  const source041Calendar = streakDesign.source041.calendar;
  const calendarDate = calendarMonthDate(now, monthOffset);
  const displayDate = selectedDate ?? calendarDate;
  const days = new Date(
    calendarDate.getFullYear(),
    calendarDate.getMonth() + 1,
    0,
  ).getDate();
  const offset = new Date(
    calendarDate.getFullYear(),
    calendarDate.getMonth(),
    1,
  ).getDay();
  const summaryStats = summarySource
    ? reviewSummaryReference[summarySource]
    : stats;
  const rate = summaryStats.total
    ? Math.round((summaryStats.good / summaryStats.total) * 100)
    : 0;
  const completionOutcomes = completionSource
    ? getReviewCompletionFixtureOutcomes(completionSource, state.words)
    : (reviewOutcomes ?? []);
  if (completed && (completionSource !== undefined || reviewOutcomes?.length)) {
    return (
      <ReviewCompletionSummary
        outcomes={completionOutcomes}
        words={state.words}
        sourceId={completionSource}
        onFinish={() => navigate("home")}
        onReviewAgain={() => navigate(remainingCount ? "review" : "home")}
      />
    );
  }
  if (progressSource) {
    return (
      <ReviewProgressCelebration
        sourceId={progressSource}
        words={state.words}
      />
    );
  }
  return (
    <Screen
      background={background.surface}
      statusBackground={background.statusSurface}
    >
      <LinearGradient
        colors={background.gradientColors}
        locations={background.gradientLocations}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        testID="review-result-scroll"
        contentContainerStyle={{ paddingBottom: 35 }}
      >
        <View style={s.closeRow}>
          <CircleButton
            icon="close"
            label="Close streak"
            onPress={() => navigate("home")}
          />
        </View>
        {!emptyReviewState && (
          <View style={{ marginTop: 29 }}>
            <CardFan
              words={state.words}
              animated={!fixture}
              size={source057Fixture ? undefined : 0.8}
              layout={
                source057Fixture ? streakDesign.source057.cardFan : undefined
              }
            />
          </View>
        )}
        {emptyReviewState ? (
          <>
            <View style={s.emptyStreakHeader}>
              <StreakNumber value={streakDays} />
              <Serif style={s.emptyStreakLabel}>
                {streakReference.source041.label}
              </Serif>
            </View>
            <View style={s.emptyReviewMessage} testID="empty-review-streak">
              <Image
                accessible={false}
                source={require("../../assets/gummble-source-041-empty-tray.png")}
                resizeMode="contain"
                style={s.emptyReviewTray}
              />
              <Serif style={s.emptyReviewTitle}>
                {streakReference.source041.emptyTitle}
              </Serif>
              <Serif style={s.emptyReviewDescription}>
                {streakReference.source041.emptyDescription}
              </Serif>
            </View>
          </>
        ) : completed ? (
          <>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 13,
                marginTop: 6,
              }}
            >
              <StreakNumber
                value={
                  summarySource
                    ? reviewSummaryReference[summarySource].streakDays
                    : fixture
                      ? 2
                      : streakDays
                }
              />
              <Serif style={{ fontSize: 23, color: "#000" }}>Day streak</Serif>
            </View>
            <View style={s.stats}>
              <View style={s.statLine}>
                <Body style={s.statBody}>You learned</Body>
                <Body
                  style={[s.statBody, s.chip, { backgroundColor: "#B4E6EE" }]}
                >
                  {summaryStats.total} words
                </Body>
                <Body style={s.statBody}>In total</Body>
              </View>
              <View style={s.statLine}>
                <Body style={s.statBody}>with a</Body>
                <Body
                  style={[s.statBody, s.chip, { backgroundColor: "#F7D765" }]}
                >
                  {rate}%
                </Body>
                <Body style={s.statBody}>rate.</Body>
                <Body
                  style={[s.statBody, s.chip, { backgroundColor: "#C9E9B4" }]}
                >
                  Got it! {summaryStats.good}
                </Body>
                <Body style={s.statBody}>&</Body>
              </View>
              <View style={s.statLine}>
                <Body
                  style={[s.statBody, s.chip, { backgroundColor: "#E6C4C7" }]}
                >
                  Needs review {summaryStats.again}
                </Body>
              </View>
            </View>
            <PillButton
              style={{
                alignSelf: "center",
                width: 204,
                marginTop: 45,
                height: 60,
              }}
              onPress={() => navigate(remainingCount ? "review" : "home")}
            >
              {remainingCount ? "Review Again" : "Back to Home"}
            </PillButton>
          </>
        ) : (
          <>
            <StreakReminderPrompt
              streakDays={streakDays}
              buttonLabel={
                !goalValid
                  ? "Set Review Goal"
                  : state.words.length && !remainingCount
                    ? "Back to Home"
                    : streakReference.source057.startReview
              }
              onStartReview={() => {
                if (!goalValid) {
                  setGoal(true);
                  return;
                }
                if (state.words.length && !remainingCount) {
                  navigate("home");
                  return;
                }
                navigate(state.words.length ? "review" : "memoryIntro");
              }}
            />
          </>
        )}
        <View
          style={[
            s.calendar,
            emptyReviewState && {
              marginTop: streakDesign.source041.calendarMarginTop,
            },
          ]}
        >
          <View
            style={[
              s.calendarHead,
              emptyReviewState && {
                paddingHorizontal: source041Calendar.headerInset,
              },
            ]}
          >
            <Pressable
              style={
                emptyReviewState
                  ? s.source041CalendarNavigationButton
                  : undefined
              }
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              onPress={() => {
                setSelectedDate(null);
                setMonthOffset((v) => v - 1);
              }}
            >
              <Icon
                name="chevron-back"
                color={streakDesign.calendar.chevronColor}
                size={streakDesign.calendar.chevronSize}
              />
            </Pressable>
            <Serif
              style={[
                {
                  fontSize: emptyReviewState
                    ? source041Calendar.titleFontSize
                    : streakDesign.calendar.titleFontSize,
                  color: streakDesign.calendar.titleColor,
                },
                emptyReviewState && {
                  transform: [{ translateY: source041Calendar.titleOffsetY }],
                },
              ]}
            >
              {displayDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Serif>
            <Pressable
              style={
                emptyReviewState
                  ? s.source041CalendarNavigationButton
                  : undefined
              }
              accessibilityRole="button"
              accessibilityLabel="Next month"
              onPress={() => {
                setSelectedDate(null);
                setMonthOffset((v) => v + 1);
              }}
            >
              <Icon
                name="chevron-forward"
                color={streakDesign.calendar.chevronColor}
                size={streakDesign.calendar.chevronSize}
              />
            </Pressable>
          </View>
          <View
            style={[
              s.week,
              emptyReviewState && {
                paddingHorizontal: source041Calendar.gridPaddingHorizontal,
                transform: [{ translateX: source041Calendar.gridOffsetX }],
              },
            ]}
          >
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <Body
                key={i}
                style={{
                  width: streakDesign.calendar.dayCellWidth,
                  textAlign: "center",
                  fontWeight: "700",
                  fontSize: streakDesign.calendar.weekFontSize,
                  color: emptyReviewState
                    ? source041Calendar.weekColor
                    : streakDesign.calendar.weekColor,
                }}
              >
                {day}
              </Body>
            ))}
          </View>
          <View
            style={[
              s.days,
              emptyReviewState && {
                paddingHorizontal: source041Calendar.gridPaddingHorizontal,
                transform: [{ translateX: source041Calendar.gridOffsetX }],
              },
            ]}
          >
            {Array.from({ length: offset }, (_, i) => (
              <View key={`blank${i}`} style={s.dayCell} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const day = i + 1;
              const date = new Date(
                calendarDate.getFullYear(),
                calendarDate.getMonth(),
                day,
                12,
              );
              const dateKey = reviewDateKey(date);
              const active = source041Fixture
                ? false
                : fixture && !source057Fixture
                  ? dateKey === streakReference.source041.dateKey
                  : state.reviewDates.includes(dateKey);
              const today =
                calendarDate.getFullYear() === now.getFullYear() &&
                calendarDate.getMonth() === now.getMonth() &&
                day === now.getDate();
              const selected =
                selectedDate?.getFullYear() === date.getFullYear() &&
                selectedDate?.getMonth() === date.getMonth() &&
                selectedDate?.getDate() === day;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Calendar day ${day}${selected ? ", selected" : ""}`}
                  accessibilityState={{ selected }}
                  key={day}
                  onPress={() => setSelectedDate(date)}
                  style={s.dayCell}
                >
                  <View
                    style={[
                      s.dayDot,
                      emptyReviewState && {
                        width: source041Calendar.dotSize,
                        height: source041Calendar.dotSize,
                        borderRadius: source041Calendar.dotRadius,
                        backgroundColor: source041Calendar.emptyDot,
                      },
                      active &&
                        !source057Fixture && {
                          backgroundColor: streakDesign.calendar.activeDay,
                        },
                      selected && {
                        borderWidth: streakDesign.calendar.selectionBorderWidth,
                        borderColor: streakDesign.calendar.selectedDay,
                      },
                      today && {
                        borderWidth: streakDesign.calendar.selectionBorderWidth,
                        borderColor: emptyReviewState
                          ? source041Calendar.today
                          : streakDesign.calendar.today,
                        backgroundColor: streakDesign.calendar.surface,
                      },
                    ]}
                    testID={
                      emptyReviewState
                        ? `streak-empty-calendar-day-dot-${day}`
                        : source057Fixture
                          ? `streak-reminder-calendar-day-dot-${day}`
                          : undefined
                    }
                  >
                    {source057Fixture && active && (
                      <Image
                        accessible={false}
                        source={require("../../assets/streak-calendar-active-057.png")}
                        resizeMode="contain"
                        style={s.source057CalendarMarker}
                        testID={`streak-reminder-calendar-marker-057-${day}`}
                      />
                    )}
                  </View>
                  <Body
                    style={{
                      fontSize: streakDesign.calendar.dayFontSize,
                      color:
                        active || today || selected
                          ? streakDesign.calendar.markedDayText
                          : streakDesign.calendar.dayText,
                      marginTop: streakDesign.calendar.dayTextMarginTop,
                    }}
                  >
                    {day}
                  </Body>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Set Daily Review Count"
          onPress={() => setGoal(true)}
          style={{
            alignSelf: "center",
            padding: 18,
            marginTop: 15,
            backgroundColor: "#F0F0F0",
            borderRadius: 12,
          }}
        >
          <Body style={{ fontSize: 13, color: "#B8B8B8" }}>
            Set Daily Review Count
          </Body>
        </Pressable>
      </ScrollView>
      {completed && (!fixture || summarySource === "105") && (
        <ConfettiBurst
          variant={summarySource === "105" ? "source105" : "animated"}
        />
      )}
      {goal && (
        <DailyReviewGoalDialog
          initialGoal={
            goalReferenceSource
              ? reviewGoalReference[goalReferenceSource].selectedGoal
              : state.dailyGoal
          }
          remainingCount={
            goalReferenceSource
              ? reviewGoalReference[goalReferenceSource].remainingCount
              : remainingCount
          }
          onCancel={() => setGoal(false)}
          onSave={(dailyGoal) => {
            if (!goalReferenceSource) updateSettings({ dailyGoal });
            setGoal(false);
          }}
        />
      )}
    </Screen>
  );
}
const s = StyleSheet.create({
  stats: { alignItems: "center", marginTop: 20, gap: 4 },
  statLine: { flexDirection: "row", alignItems: "center", gap: 5 },
  statBody: { fontSize: 20, color: "#000", lineHeight: 35 },
  chip: { borderRadius: 20, paddingHorizontal: 12 },
  closeRow: {
    paddingLeft: streakDesign.source041.close.paddingLeft,
    paddingTop: streakDesign.source041.close.paddingTop,
  },
  emptyStreakHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: streakDesign.source041.header.gap,
    marginTop: streakDesign.source041.header.marginTop,
  },
  emptyStreakLabel: {
    fontSize: streakDesign.source041.header.labelFontSize,
    color: streakDesign.source041.header.labelColor,
  },
  emptyReviewMessage: {
    alignItems: "center",
    marginTop: streakDesign.source041.emptyContent.marginTop,
    paddingHorizontal: streakDesign.source041.emptyContent.paddingHorizontal,
  },
  emptyReviewTray: {
    width: streakDesign.source041.tray.width,
    height: streakDesign.source041.tray.height,
  },
  emptyReviewTitle: {
    textAlign: "center",
    color: streakDesign.source041.emptyTitle.color,
    fontSize: streakDesign.source041.emptyTitle.fontSize,
    lineHeight: streakDesign.source041.emptyTitle.lineHeight,
    marginTop: streakDesign.source041.emptyTitle.marginTop,
  },
  emptyReviewDescription: {
    textAlign: "center",
    color: streakDesign.source041.emptyDescription.color,
    fontSize: streakDesign.source041.emptyDescription.fontSize,
    lineHeight: streakDesign.source041.emptyDescription.lineHeight,
    marginTop: streakDesign.source041.emptyDescription.marginTop,
  },
  calendar: {
    marginTop: streakDesign.calendar.marginTop,
    marginHorizontal: streakDesign.calendar.marginHorizontal,
    borderRadius: streakDesign.calendar.borderRadius,
    backgroundColor: streakDesign.calendar.surface,
    overflow: "hidden",
    paddingBottom: streakDesign.calendar.paddingBottom,
  },
  calendarHead: {
    height: streakDesign.calendar.headerHeight,
    borderBottomWidth: 1,
    borderBottomColor: streakDesign.calendar.divider,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: streakDesign.calendar.headerPaddingHorizontal,
  },
  source041CalendarNavigationButton: {
    width: streakDesign.source041.calendar.navButtonSize,
    height: streakDesign.source041.calendar.navButtonSize,
    borderRadius: streakDesign.source041.calendar.navButtonSize / 2,
    backgroundColor: streakDesign.source041.calendar.navButtonBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  week: {
    flexDirection: "row",
    paddingHorizontal: streakDesign.calendar.weekPaddingHorizontal,
    marginTop: streakDesign.calendar.weekMarginTop,
    marginBottom: streakDesign.calendar.weekMarginBottom,
  },
  days: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: streakDesign.calendar.weekPaddingHorizontal,
  },
  dayCell: {
    width: streakDesign.calendar.dayCellWidth,
    height: streakDesign.calendar.dayCellHeight,
    alignItems: "center",
  },
  dayDot: {
    width: streakDesign.calendar.dotSize,
    height: streakDesign.calendar.dotSize,
    borderRadius: streakDesign.calendar.dotRadius,
    backgroundColor: streakDesign.calendar.emptyDot,
  },
  source057CalendarMarker: {
    position: "absolute",
    top: streakDesign.source057.calendarMarker.offset,
    left: streakDesign.source057.calendarMarker.offset,
    width: streakDesign.source057.calendarMarker.frameSize,
    height: streakDesign.source057.calendarMarker.frameSize,
  },
});
