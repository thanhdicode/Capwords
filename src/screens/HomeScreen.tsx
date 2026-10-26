import React, { useEffect, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useApp } from "../state/AppContext";
import { Navigate } from "../navigation/types";
import {
  Body,
  CircleButton,
  Pattern,
  PillButton,
  Screen,
  Serif,
  TopBar,
} from "../components/UI";
import { CameraRing } from "../components/CameraRing";
import { CollectionLoadingIndicator } from "../components/CollectionLoadingIndicator";
import { Sticker } from "../components/Sticker";
import { CardFan } from "../components/CardFan";
import { CollectionSavedToast } from "../components/CollectionSavedToast";
import { CollectionTileActions } from "../components/CollectionTileActions";
import {
  collectionDesign,
  collectionLoadingDesign,
  collectionInlineActionsDesign,
  homeTimelineDesign,
  homeReviewInvitationDesign,
  collectionSaveToastDesign,
} from "../theme/tokens";
import { homeReviewReference } from "../data/homeReviewReference";
import { collectionSaveCopy } from "../data/collectionSaveReference";
import { collectionLoadingReference } from "../data/collectionLoadingReference";
import {
  collectionCountCopy,
  formatCollectionWordCount,
} from "../data/collectionDisplayReference";
import {
  buildHomeTimeline,
  formatHomeDate,
  wordsForHomeDate,
  type HomeTimelineDay,
} from "../domain/homeTimeline";
import { dueWords, reviewDateKey } from "../domain/review";
import type { Word } from "../domain/types";
import {
  saveStickerToPhotosAndCopy,
  type StickerSaveOutcome,
} from "../services/stickerExport";

export function HomeScreen({
  navigate,
  fixture = false,
  reviewCardFixture = false,
  reviewInvitationFixture = false,
}: {
  navigate: Navigate;
  fixture?: boolean;
  reviewCardFixture?: boolean;
  reviewInvitationFixture?: boolean;
}) {
  const { state } = useApp();
  const [reviewLater, setReviewLater] = useState(false);
  const sourceReviewFixture =
    fixture && (reviewCardFixture || reviewInvitationFixture);
  const source040Fixture = fixture && reviewInvitationFixture;
  const today = sourceReviewFixture
    ? new Date(`${homeReviewReference.source040.dateKey}T12:00:00`)
    : new Date();
  const date = fixture
    ? sourceReviewFixture
      ? homeReviewReference.source040.displayedDate
      : "Sep 11"
    : today.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
  const month = fixture
    ? homeReviewReference.source040.month
    : today.toLocaleDateString("en-US", { month: "long" });
  const words = state.words;
  const dueReviewWords = dueWords(words);
  const showReviewPrompt =
    dueReviewWords.length > 0 &&
    (sourceReviewFixture ||
      (!fixture && !state.reviewDates.includes(reviewDateKey(today)))) &&
    !reviewLater;
  const source040Invitation = source040Fixture && showReviewPrompt;
  const timelineWords = sourceReviewFixture
    ? words.map((word) => ({
        ...word,
        createdAt: new Date(
          `${homeReviewReference.source040.previousDateKey}T12:00:00`,
        ).toISOString(),
      }))
    : words;
  const timeline = buildHomeTimeline(timelineWords, today);
  const months = timeline.reduce<
    { key: string; label: string; days: HomeTimelineDay[] }[]
  >((groups, day) => {
    const key = day.monthKey;
    let group = groups.find((item) => item.key === key);
    if (!group) {
      group = {
        key,
        label: fixture ? "September" : day.monthLabel,
        days: [],
      };
      groups.push(group);
    }
    group.days.push(day);
    return groups;
  }, []);
  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.home}
      >
        <View style={s.top}>
          <CircleButton
            icon="school-outline"
            label="Daily review"
            onPress={() => navigate("streak")}
          />
          <CircleButton
            icon="person-outline"
            label="Profile and settings"
            onPress={() => navigate("profile")}
          />
        </View>
        {(!showReviewPrompt || source040Invitation) && (
          <>
            <View
              style={[s.greeting, source040Invitation && s.source040Greeting]}
            >
              {source040Invitation && (
                <Image
                  accessible={false}
                  source={require("../../assets/gummble-source-040-sprout.png")}
                  resizeMode="contain"
                  style={homeReviewInvitationDesign.source040.brandMark}
                />
              )}
              <Serif style={s.date}>{date}</Serif>
              <Serif style={s.heading}>
                {source040Invitation
                  ? homeReviewReference.source040.greeting
                  : "Good Afternoon"}
              </Serif>
              <Serif style={s.subtitle}>
                {source040Invitation
                  ? homeReviewReference.source040.subtitle
                  : words.length
                    ? `Awesome! You've snapped ${words.length} words!`
                    : "Discover the words around you."}
              </Serif>
            </View>
            {!showReviewPrompt && (
              <View style={s.camera}>
                <CameraRing
                  size={250}
                  dotted
                  onPress={() => navigate("camera")}
                />
              </View>
            )}
          </>
        )}
        {showReviewPrompt && (
          <View style={s.reviewPrompt} testID="home-review-prompt">
            <View
              style={[
                s.reviewFan,
                source040Invitation && {
                  height: homeReviewInvitationDesign.source040.fanHeight,
                },
              ]}
            >
              <CardFan
                words={dueReviewWords}
                animated={!sourceReviewFixture}
                layout={
                  source040Invitation
                    ? homeReviewInvitationDesign.source040.reviewFan
                    : homeTimelineDesign.source056.reviewFan
                }
              />
            </View>
            <PillButton
              style={[
                s.reviewStart,
                source040Invitation &&
                  homeReviewInvitationDesign.source040.startButton,
              ]}
              textStyle={homeReviewInvitationDesign.source040.startButtonText}
              onPress={() => navigate("review")}
            >
              {homeReviewReference.actions.startReview}
            </PillButton>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={homeReviewReference.actions.reviewLater}
              onPress={() => setReviewLater(true)}
              style={[
                s.reviewLater,
                source040Invitation && {
                  marginTop:
                    homeReviewInvitationDesign.source040.laterMarginTop,
                },
              ]}
            >
              <Body style={s.reviewLaterText}>
                {homeReviewReference.actions.reviewLater}
              </Body>
            </Pressable>
          </View>
        )}
        <View
          style={[
            s.history,
            showReviewPrompt && !source040Invitation && s.historyAfterReview,
            source040Invitation && {
              marginTop: homeReviewInvitationDesign.source040.historyMarginTop,
            },
          ]}
        >
          {months.map((group) => (
            <View key={group.key}>
              <Serif style={s.month}>{fixture ? month : group.label}</Serif>
              {group.days.map((day) => {
                const dayLabel = fixture ? "Sep 11" : day.dayLabel;
                const visibleDayLabel = sourceReviewFixture
                  ? day.isToday
                    ? "Sep 12"
                    : day.dayLabel
                  : dayLabel;
                const emptyToday = day.isToday && day.words.length === 0;
                return (
                  <Pressable
                    key={day.dateKey}
                    accessibilityRole="button"
                    accessibilityLabel={
                      emptyToday
                        ? `Start a new word for ${visibleDayLabel}`
                        : `Open ${visibleDayLabel} word collection`
                    }
                    onPress={() =>
                      emptyToday
                        ? navigate("camera")
                        : navigate("collection", day.dateKey)
                    }
                    style={[
                      s.dayCard,
                      emptyToday && s.emptyDayCard,
                      group.days[group.days.length - 1].dateKey !==
                        day.dateKey && s.dayCardSpacing,
                    ]}
                  >
                    <Serif style={s.cardDate}>{visibleDayLabel}</Serif>
                    {day.words.length ? (
                      <>
                        <Body style={s.wordCount}>
                          {day.words.length}{" "}
                          {day.words.length === 1 ? "Word" : "Words"}
                        </Body>
                        <View style={s.stickerRow}>
                          {day.words.slice(0, 4).map((word) => (
                            <Sticker key={word.id} word={word} size={55} />
                          ))}
                        </View>
                      </>
                    ) : (
                      <>
                        <Body style={s.emptyDayText}>
                          Start your day with a new word.
                        </Body>
                        <Body style={s.emptyDayText}>
                          Snap something nearby!
                        </Body>
                      </>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
export function CollectionScreen({
  navigate,
  fixture = false,
  loading = false,
  source099Fixture = false,
  source033Fixture = false,
  dayKey,
  onSaveSticker,
}: {
  navigate: Navigate;
  fixture?: boolean;
  loading?: boolean;
  source099Fixture?: boolean;
  source033Fixture?: boolean;
  dayKey?: string;
  onSaveSticker?: (word: Word) => Promise<StickerSaveOutcome>;
}) {
  const { state, deleteWord } = useApp();
  const [selected, setSelected] = useState<string>();
  const collectionWords = dayKey
    ? wordsForHomeDate(state.words, dayKey)
    : state.words;
  const words = source099Fixture
    ? collectionWords.filter(
        (word) => word.target === collectionLoadingReference.wordTarget,
      )
    : collectionWords;
  const countLabel = source033Fixture
    ? collectionCountCopy.source033Snapshot
    : formatCollectionWordCount(
        words.length,
        source099Fixture ? collectionLoadingReference.countUnit : undefined,
      );
  const [savedToast, setSavedToast] = useState<
    | {
        word: Word;
        count: number;
        copied: boolean;
      }
    | undefined
  >();
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const saveAction = onSaveSticker ?? saveStickerToPhotosAndCopy;
  const showSaveAction = Platform.OS !== "web" || onSaveSticker !== undefined;

  useEffect(() => {
    if (!savedToast) return;
    const timer = setTimeout(
      () => setSavedToast(undefined),
      collectionSaveToastDesign.dismissAfterMs,
    );
    return () => clearTimeout(timer);
  }, [savedToast]);

  const saveSelectedSticker = async () => {
    const selectedWord = words.find((word) => word.id === selected);
    if (!selectedWord || saveBusy) return;
    setSaveBusy(true);
    setSaveError(undefined);
    try {
      const outcome = await saveAction(selectedWord);
      setSavedToast((previous) => ({
        word: selectedWord,
        count: (previous?.count ?? 0) + 1,
        copied: outcome.copied,
      }));
      setSelected(undefined);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : collectionSaveCopy.saveFailed,
      );
    } finally {
      setSaveBusy(false);
    }
  };

  const deleteSelectedSticker = () => {
    if (!selected) return;
    deleteWord(selected);
    setSelected(undefined);
    setSaveError(undefined);
  };

  const date = fixture
    ? "Sep 11"
    : dayKey
      ? formatHomeDate(dayKey)
      : new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
  return (
    <Screen background={collectionDesign.background}>
      <Pattern {...collectionDesign.pattern} />
      <TopBar onBack={() => navigate("home")} />
      <View style={s.collectionHeader}>
        <Serif style={s.collectionDate}>{date}</Serif>
        <Body style={s.collectionCount}>{countLabel}</Body>
      </View>
      <ScrollView
        contentContainerStyle={s.grid}
        showsVerticalScrollIndicator={false}
      >
        {words.map((word) => {
          const isSelected = selected === word.id;
          const tileStyle = isSelected
            ? s.selectedSticker
            : selected
              ? s.dimmedSticker
              : undefined;
          return (
            <View
              key={word.id}
              style={[s.gridItem, isSelected && s.selectedGridItem]}
            >
              <Pressable
                accessibilityLabel={`Open ${word.target}`}
                accessibilityHint={collectionSaveCopy.actionHint}
                onPress={() => navigate("detail", word.id)}
                onLongPress={() => {
                  setSaveError(undefined);
                  setSelected(isSelected ? undefined : word.id);
                }}
                style={s.wordTrigger}
                testID="collection-word-card"
              >
                <View style={tileStyle}>
                  <Sticker
                    word={word}
                    size={
                      source099Fixture
                        ? collectionLoadingDesign.stickerSize
                        : collectionDesign.grid.stickerSize
                    }
                    label
                    labelStyle={s.collectionWordLabel}
                    labelText={
                      source099Fixture
                        ? collectionLoadingReference.stickerLabel
                        : undefined
                    }
                  />
                </View>
              </Pressable>
              {isSelected && (
                <CollectionTileActions
                  error={saveError}
                  onDelete={deleteSelectedSticker}
                  onSave={saveSelectedSticker}
                  saving={saveBusy}
                  showSaveAction={showSaveAction}
                />
              )}
            </View>
          );
        })}
        {words.length === 0 && (
          <View style={s.emptyCollection} testID="empty-collection-state">
            <View style={s.emptyEyes} accessibilityElementsHidden>
              <View style={s.eye}>
                <View style={s.eyePupil} />
              </View>
              <View style={s.eye}>
                <View style={s.eyePupil} />
              </View>
            </View>
            <Body style={s.emptyCollectionCopy}>
              {"Haven't snapped anything yet?\nTake a look around you!"}
            </Body>
          </View>
        )}
      </ScrollView>
      {loading ? (
        <View style={s.collectionLoading} testID="collection-loading-state">
          <CollectionLoadingIndicator />
        </View>
      ) : (
        <View style={s.capture}>
          <CameraRing size={84} onPress={() => navigate("camera")} />
        </View>
      )}
      {savedToast && (
        <CollectionSavedToast
          word={savedToast.word}
          count={savedToast.count}
          copied={savedToast.copied}
        />
      )}
    </Screen>
  );
}
const s = StyleSheet.create({
  home: { paddingTop: 11, paddingBottom: 18, minHeight: 771 },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  greeting: { alignItems: "center", marginTop: 18 },
  source040Greeting: {
    marginTop: homeReviewInvitationDesign.source040.greetingMarginTop,
  },
  date: { fontSize: 15, color: "#7b7b7b", lineHeight: 20 },
  heading: { fontSize: 36, lineHeight: 44, marginTop: 5, letterSpacing: -1.1 },
  subtitle: {
    fontSize: 23,
    lineHeight: 28,
    color: "#969b9d",
    marginTop: 2,
    textAlign: "center",
    letterSpacing: -0.7,
  },
  camera: { alignItems: "center", marginTop: 38 },
  reviewPrompt: { alignItems: "center" },
  reviewFan: { height: 213, width: "100%", overflow: "visible" },
  reviewStart: {
    width: 196,
    height: 58,
    alignSelf: "center",
    marginTop: -48,
  },
  reviewLater: { alignSelf: "center", marginTop: 16, paddingVertical: 2 },
  reviewLaterText: { color: "#8e8e8e", fontSize: 17 },
  // Shared copy style for both Home review-prompt visual states.
  history: {
    marginTop: 56,
    paddingHorizontal: homeTimelineDesign.source056.historyPaddingHorizontal,
  },
  historyAfterReview: { marginTop: 6 },
  month: { fontSize: 28, lineHeight: 36, marginLeft: 20, marginBottom: 12 },
  dayCard: {
    height: homeTimelineDesign.source056.dayCardHeight,
    borderRadius: homeTimelineDesign.source056.dayCardRadius,
    backgroundColor: homeTimelineDesign.source056.savedDaySurface,
    paddingHorizontal: homeTimelineDesign.source056.cardPaddingHorizontal,
    paddingTop: homeTimelineDesign.source056.cardPaddingTop,
  },
  dayCardSpacing: {
    marginBottom: homeTimelineDesign.source056.dayCardSpacing,
  },
  emptyDayCard: {
    backgroundColor: homeTimelineDesign.source056.emptyDaySurface,
  },
  cardDate: { fontSize: 28, lineHeight: 34, color: "#141f20" },
  wordCount: { color: "#414c4b", fontSize: 16, marginTop: 2 },
  emptyDayText: { color: "#747474", fontSize: 18, lineHeight: 24 },
  stickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
  },
  collectionHeader: {
    paddingHorizontal: collectionDesign.header.horizontalInset,
    marginTop: collectionDesign.header.topInset,
  },
  collectionDate: {
    fontSize: collectionDesign.header.dateFontSize,
    color: collectionDesign.header.dateColor,
  },
  collectionCount: {
    fontSize: collectionDesign.header.countFontSize,
    color: collectionDesign.header.countColor,
    marginTop: collectionDesign.header.countMarginTop,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: collectionDesign.grid.horizontalInset,
    paddingTop: collectionDesign.grid.topInset,
    rowGap: collectionDesign.grid.rowGap,
    paddingBottom: collectionDesign.grid.bottomInset,
  },
  gridItem: {
    width: collectionDesign.grid.itemWidth,
    height: collectionDesign.grid.itemHeight,
    position: "relative",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  selectedGridItem: {
    zIndex: collectionInlineActionsDesign.selectedGridItemLayer,
  },
  wordTrigger: { alignItems: "center", justifyContent: "flex-start" },
  collectionWordLabel: {
    maxWidth: collectionDesign.grid.stickerLabelMaxWidth,
  },
  selectedSticker: {
    transform: [{ scale: collectionInlineActionsDesign.selectedScale }],
  },
  dimmedSticker: { opacity: collectionInlineActionsDesign.unselectedOpacity },
  emptyCollection: {
    width: "100%",
    paddingTop: 359,
    paddingHorizontal: 0,
    alignItems: "center",
  },
  emptyEyes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eye: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E2E4",
    alignItems: "center",
    justifyContent: "center",
  },
  eyePupil: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#26353C",
  },
  emptyCollectionCopy: {
    marginTop: 34,
    color: "#26353C",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
    textAlign: "center",
  },
  capture: { position: "absolute", bottom: 8, alignSelf: "center" },
  collectionLoading: {
    position: "absolute",
    bottom: collectionLoadingDesign.bottomOffset,
    alignSelf: "center",
  },
});
