import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Platform, View } from "react-native";
import { Asset } from "expo-asset";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { LilitaOne_400Regular } from "@expo-google-fonts/lilita-one";
import {
  Gelasio_400Regular,
  Gelasio_700Bold,
  Gelasio_700Bold_Italic,
} from "@expo-google-fonts/gelasio";
import { Nunito_900Black } from "@expo-google-fonts/nunito";
import * as Speech from "expo-speech";
import { captureReferenceTimestamps } from "./src/data/captureReference";
import { AppProvider, useApp } from "./src/state/AppContext";
import {
  CloudAccountProvider,
  useCloudAccount,
} from "./src/cloud/CloudAccountContext";
import { Navigate, RouteName } from "./src/navigation/types";
import {
  WelcomeScreen,
  IntroScreen,
  LanguagesScreen,
  HomeScreen,
  CollectionScreen,
  WordDetailScreen,
  CaptureScreen,
  ConfirmScreen,
  ResultScreen,
  MemoryIntroScreen,
  ReviewScreen,
  StreakScreen,
  ProfileScreen,
  PaywallScreen,
  StoryScreen,
  WebStudio,
} from "./src/navigation/lazyScreens";
import type { ReviewStats } from "./src/screens/ReviewScreen";
import type {
  CaptureAsset,
  RecognitionResult,
} from "./src/services/recognition";
import { DEMO_VOCABULARY } from "./src/data/demoVocabulary";
import { getRecognitionResultFixtureWord } from "./src/data/recognitionResultFixtures";
import { getProfileSourceFixture } from "./src/data/profileFixtures";
import { getOnboardingLanguageReference } from "./src/data/onboardingLanguageReference";
import { isReviewProgressSourceId } from "./src/data/reviewProgressReference";
import { isReviewCompletionSourceId } from "./src/data/reviewCompletionReference";
import { isReviewSummarySourceId } from "./src/data/reviewSummaryReference";
import { isReviewGoalReferenceId } from "./src/data/reviewGoalReference";
import type { ReviewCardSourceId } from "./src/data/reviewCardReference";
import { Body, PillButton, Sheet } from "./src/components/UI";
import { colors } from "./src/theme/tokens";
import { reviewDateKey, type ReviewOutcome } from "./src/domain/review";
import { RecognitionTask } from "./src/domain/recognitionTask";

const routes: RouteName[] = [
  "welcome",
  "intro",
  "languages",
  "home",
  "collection",
  "camera",
  "confirm",
  "result",
  "detail",
  "examples",
  "memoryIntro",
  "review",
  "reviewResult",
  "streak",
  "profile",
  "paywall",
  "story",
];
const back: Partial<Record<RouteName, RouteName>> = {
  intro: "welcome",
  languages: "intro",
  collection: "home",
  camera: "home",
  confirm: "camera",
  result: "camera",
  detail: "collection",
  examples: "detail",
  memoryIntro: "home",
  review: "streak",
  reviewResult: "home",
  streak: "home",
  profile: "home",
  paywall: "profile",
  story: "profile",
};
function params() {
  return Platform.OS === "web" &&
    process.env.EXPO_PUBLIC_ENABLE_STUDIO !== "0" &&
    typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : { get: (_key: string): string | null => null };
}
async function prepareCaptureAsset(asset: CaptureAsset): Promise<CaptureAsset> {
  const { prepareForegroundRemoval } =
    await import("./src/services/foregroundRemoval");
  return prepareForegroundRemoval(asset);
}
function NavigatorLoading() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator color={colors.purple} />
    </View>
  );
}

function Navigator() {
  const app = useApp();
  if (!app.ready) return <NavigatorLoading />;
  return <NavigatorContent />;
}

function NavigatorContent() {
  const app = useApp();
  const cloud = useCloudAccount();
  const [p] = useState(() => params());
  const capturePreparation = useRef(0);
  const fixture = p.get("fixture") === "1";
  const onboardingLanguageReference = getOnboardingLanguageReference(
    fixture ? p.get("languageSource") : null,
  );
  const profileSourceFixture = getProfileSourceFixture(
    fixture ? p.get("profileState") : null,
  );
  const homeReviewFixture = fixture && p.get("homeReview") === "1";
  const homeReviewSource040Fixture =
    fixture && p.get("homeReviewSource") === "040";
  const emptyStreakSource041Fixture =
    fixture && p.get("streakSource") === "041";
  const streakReminderSource057Fixture =
    fixture && p.get("streakSource") === "057";
  const emptyCollectionFixture = fixture && p.get("emptyCollection") === "1";
  const collectionLoadingFixture =
    fixture && p.get("collectionLoading") === "1";
  const fullImageHintFixture = p.get("fullImageHint") === "1";
  const recognitionGuidanceFixture =
    fixture && p.get("confirmGuidance") === "1";
  const videoFrameFixture = fixture && p.get("videoFrame") === "1";
  const captureSource034Fixture = fixture && p.get("captureState") === "034";
  const confirmSource035Fixture = fixture && p.get("confirmState") === "035";
  const imageExportFixture = fixture && p.get("imageExportFixture") === "1";
  const preparedExampleFixture = fixture && p.get("memoryIntroState") === "085";
  const scenarioMemoryIntroFixture =
    fixture && p.get("memoryIntroState") === "097";
  const reviewProgressFixture = fixture ? p.get("reviewProgress") : null;
  const reviewCompletionFixture = fixture ? p.get("reviewCompletion") : null;
  const reviewSummaryFixture = fixture ? p.get("reviewSummary") : null;
  const reviewGoalQuery = fixture ? p.get("reviewGoal") : null;
  const reviewGoalReferenceFixture = isReviewGoalReferenceId(reviewGoalQuery)
    ? reviewGoalQuery
    : undefined;
  const reviewGesture042Fixture = fixture && p.get("reviewGesture") === "042";
  const reviewSource058Fixture = fixture && p.get("reviewSource") === "058";
  const reviewSource068Fixture = fixture && p.get("reviewSource") === "068";
  const reviewSource081Fixture = fixture && p.get("reviewSource") === "081";
  const reviewSource021Fixture = fixture && p.get("reviewSource") === "021";
  const reviewSource087Fixture = fixture && p.get("reviewSource") === "087";
  const reviewSource089Fixture = fixture && p.get("reviewSource") === "089";
  const reviewSource092Fixture = fixture && p.get("reviewSource") === "092";
  const reviewSource094Fixture = fixture && p.get("reviewSource") === "094";
  const reviewSource096Fixture = fixture && p.get("reviewSource") === "096";
  const reviewSource098Fixture = fixture && p.get("reviewSource") === "098";
  const initial = p.get("screen") as RouteName;
  const [route, setRoute] = useState<RouteName>(
    routes.includes(initial)
      ? initial
      : fixture || app.state.onboarded
        ? "home"
        : "welcome",
  );
  const [wordId, setWordId] = useState<string>();
  const [collectionDayKey, setCollectionDayKey] = useState<string>();
  const [asset, setAsset] = useState<CaptureAsset>(() => ({
    uri: Asset.fromModule(
      fixture && p.get("confirmPhoto") === "012"
        ? require("./assets/gummble-source-012-photo-crop.png")
        : require("./assets/study-portrait.jpg"),
    ).uri,
    capturedAt: fixture ? captureReferenceTimestamps.source012 : undefined,
  }));
  const sourceResultWord = getRecognitionResultFixtureWord(
    fixture ? p.get("resultSource") : null,
  );
  const [result, setResult] = useState<RecognitionResult>(() => ({
    word: { ...(sourceResultWord ?? DEMO_VOCABULARY[1]) },
    mode: "fixture",
  }));
  const [recognizing, setRecognizing] = useState(false),
    [error, setError] = useState("");
  const [stats, setStats] = useState<ReviewStats>({
    good: 2,
    again: 2,
    total: 4,
  });
  const [reviewOutcomes, setReviewOutcomes] = useState<ReviewOutcome[]>();
  const [recognitionTask] = useState(() => new RecognitionTask());
  const [prepared, setPrepared] = useState(!fixture);
  const { completeOnboarding, resetDemo, updateSettings } = app;
  useEffect(() => {
    if (fixture) {
      if (
        !emptyCollectionFixture &&
        !collectionLoadingFixture &&
        !emptyStreakSource041Fixture &&
        !streakReminderSource057Fixture
      )
        resetDemo();
      completeOnboarding("en", "fr");
    }
    if (profileSourceFixture) updateSettings(profileSourceFixture.settings);
    if (!fixture && !profileSourceFixture) return;
    const preparationTimer = setTimeout(() => setPrepared(true), 0);
    return () => clearTimeout(preparationTimer);
  }, [
    completeOnboarding,
    collectionLoadingFixture,
    emptyCollectionFixture,
    emptyStreakSource041Fixture,
    fixture,
    profileSourceFixture,
    resetDemo,
    streakReminderSource057Fixture,
    updateSettings,
  ]);
  const navigate = useCallback<Navigate>(
    (next, id) => {
      capturePreparation.current += 1;
      if (recognitionTask.cancel()) setRecognizing(false);
      Speech.stop();
      if (next === "collection") {
        if (id) setCollectionDayKey(id);
        else if (route !== "detail" && route !== "examples")
          setCollectionDayKey(undefined);
      } else if (id && (next === "detail" || next === "examples")) {
        setWordId(id);
      }
      setRoute(next);
      if (
        Platform.OS === "web" &&
        process.env.EXPO_PUBLIC_ENABLE_STUDIO !== "0" &&
        typeof window !== "undefined"
      ) {
        const nextParams = new URLSearchParams(window.location.search);
        nextParams.set("screen", next);
        window.history.replaceState(null, "", `?${nextParams}`);
      }
    },
    [recognitionTask, route],
  );
  useEffect(
    () => () => {
      recognitionTask.cancel();
    },
    [recognitionTask],
  );
  useEffect(() => {
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      if (route === "home" || route === "welcome") return false;
      navigate(back[route] || "home");
      return true;
    });
    return () => listener.remove();
  }, [navigate, route]);
  const confirm = async (value: CaptureAsset) => {
    const request = recognitionTask.start();
    setRecognizing(true);
    try {
      const preparedCapture = fixture
        ? value
        : await prepareCaptureAsset(value);
      if (!recognitionTask.isCurrent(request)) return;
      setAsset(preparedCapture);
      const wantsRemote =
        !fixture &&
        Boolean(process.env.EXPO_PUBLIC_RECOGNITION_ENDPOINT?.trim());
      const signedIn = cloud.configured && cloud.ready && Boolean(cloud.user);
      const accessToken =
        wantsRemote && signedIn ? await cloud.getJWT() : undefined;
      if (!recognitionTask.isCurrent(request)) return;
      const { manualRecognition, recognize } =
        await import("./src/services/recognition");
      const next =
        wantsRemote && !signedIn
          ? manualRecognition(preparedCapture)
          : await recognize(
              preparedCapture,
              app.state.learningLanguage,
              fixture,
              request.signal,
              { nativeLanguage: app.state.nativeLanguage, accessToken },
            );
      if (!recognitionTask.complete(request)) return;
      setRecognizing(false);
      setResult(next);
      navigate("result");
    } catch (e) {
      if (!recognitionTask.isCurrent(request)) return;
      setError(
        e instanceof Error
          ? e.message
          : "Recognition was unavailable. Please try again.",
      );
    } finally {
      if (recognitionTask.complete(request)) setRecognizing(false);
    }
  };
  if (!prepared) return <NavigatorLoading />;
  let screen: React.ReactNode;
  switch (route) {
    case "welcome":
      screen = <WelcomeScreen navigate={navigate} />;
      break;
    case "intro":
      screen = <IntroScreen navigate={navigate} />;
      break;
    case "languages":
      screen = (
        <LanguagesScreen
          navigate={navigate}
          reference={onboardingLanguageReference}
        />
      );
      break;
    case "home":
      screen = (
        <HomeScreen
          navigate={navigate}
          fixture={fixture}
          reviewCardFixture={homeReviewFixture}
          reviewInvitationFixture={homeReviewSource040Fixture}
        />
      );
      break;
    case "collection":
      screen = (
        <CollectionScreen
          navigate={navigate}
          fixture={fixture}
          loading={collectionLoadingFixture}
          source033Fixture={emptyCollectionFixture}
          source099Fixture={collectionLoadingFixture}
          onSaveSticker={fixture ? async () => ({ copied: true }) : undefined}
          dayKey={collectionDayKey}
        />
      );
      break;
    case "camera":
      screen = (
        <CaptureScreen
          navigate={navigate}
          fixture={fixture}
          videoFrameFixture={videoFrameFixture}
          source034Fixture={captureSource034Fixture}
          onCapture={async (value) => {
            const request = ++capturePreparation.current;
            const preparedCapture = fixture
              ? value
              : await prepareCaptureAsset(value);
            if (request !== capturePreparation.current) return;
            setAsset(preparedCapture);
            navigate("confirm");
          }}
        />
      );
      break;
    case "confirm":
      screen = (
        <ConfirmScreen
          asset={asset}
          onConfirm={confirm}
          onBack={() => navigate("camera")}
          busy={recognizing}
          fullImageHint={fullImageHintFixture}
          recognitionGuidance={recognitionGuidanceFixture}
          source035Fixture={confirmSource035Fixture}
        />
      );
      break;
    case "result":
      screen = (
        <ResultScreen
          key={result.word.target}
          result={result}
          capturedAt={asset.capturedAt}
          learningLanguage={app.state.learningLanguage}
          preferredSpeechVoiceId={app.state.preferredSpeechVoiceId}
          onRetake={() => navigate("camera")}
          onSave={async (word) => {
            await app.addWord(word);
            if (route === "result") navigate("collection");
          }}
        />
      );
      break;
    case "detail":
    case "examples":
      screen = (
        <WordDetailScreen
          navigate={navigate}
          wordId={wordId}
          examples={route === "examples"}
          onImageExport={
            imageExportFixture
              ? async (_word, action) =>
                  `Test fixture: ${action} requested; no image was exported.`
              : undefined
          }
        />
      );
      break;
    case "memoryIntro":
      screen = scenarioMemoryIntroFixture ? (
        <>
          <CollectionScreen navigate={navigate} fixture={fixture} />
          <MemoryIntroScreen navigate={navigate} variant="scenarioCardsSheet" />
        </>
      ) : (
        <MemoryIntroScreen
          navigate={navigate}
          variant={preparedExampleFixture ? "preparedExample" : "memoryCards"}
        />
      );
      break;
    case "review":
      screen = (
        <ReviewScreen
          navigate={navigate}
          gestureSource={reviewGesture042Fixture ? "042" : undefined}
          referenceSource={
            reviewGesture042Fixture
              ? ("042" satisfies ReviewCardSourceId)
              : reviewSource058Fixture
                ? ("058" satisfies ReviewCardSourceId)
                : reviewSource068Fixture
                  ? ("068" satisfies ReviewCardSourceId)
                  : reviewSource081Fixture
                    ? ("081" satisfies ReviewCardSourceId)
                    : reviewSource021Fixture
                      ? ("021" satisfies ReviewCardSourceId)
                      : reviewSource087Fixture
                        ? ("087" satisfies ReviewCardSourceId)
                        : reviewSource089Fixture
                          ? ("089" satisfies ReviewCardSourceId)
                          : reviewSource092Fixture
                            ? ("092" satisfies ReviewCardSourceId)
                            : reviewSource094Fixture
                              ? ("094" satisfies ReviewCardSourceId)
                              : reviewSource096Fixture
                                ? ("096" satisfies ReviewCardSourceId)
                                : reviewSource098Fixture
                                  ? ("098" satisfies ReviewCardSourceId)
                                  : undefined
          }
          onFinish={(value, outcomes) => {
            setStats(value);
            setReviewOutcomes(outcomes);
            app.recordReviewSummary(value);
            navigate("reviewResult");
          }}
        />
      );
      break;
    case "reviewResult":
    case "streak":
      screen = (
        <StreakScreen
          navigate={navigate}
          completed={
            route === "reviewResult" ||
            (!emptyStreakSource041Fixture &&
              !streakReminderSource057Fixture &&
              (fixture ||
                app.state.reviewDates.includes(reviewDateKey(new Date()))))
          }
          stats={
            app.state.lastReview ??
            (fixture ? stats : { good: 0, again: 0, total: 0 })
          }
          fixture={fixture}
          source041Fixture={emptyStreakSource041Fixture}
          source057Fixture={streakReminderSource057Fixture}
          goalReferenceSource={reviewGoalReferenceFixture}
          progressSource={
            isReviewProgressSourceId(reviewProgressFixture)
              ? reviewProgressFixture
              : undefined
          }
          summarySource={
            isReviewSummarySourceId(reviewSummaryFixture)
              ? reviewSummaryFixture
              : undefined
          }
          completionSource={
            isReviewCompletionSourceId(reviewCompletionFixture)
              ? reviewCompletionFixture
              : undefined
          }
          reviewOutcomes={reviewOutcomes}
        />
      );
      break;
    case "profile":
      screen = (
        <ProfileScreen
          navigate={navigate}
          sourceFixture={profileSourceFixture}
        />
      );
      break;
    case "paywall":
      screen = (
        <PaywallScreen
          navigate={navigate}
          reference050={fixture && p.get("paywallSource") === "050"}
          reference073={fixture && p.get("paywallSource") === "073"}
          reference095={fixture && p.get("paywallSource") === "095"}
          reference064={fixture && p.get("paywallSource") === "064"}
          languageCodeOverride={
            fixture ? (p.get("paywallLanguage") ?? undefined) : undefined
          }
        />
      );
      break;
    case "story":
      screen = <StoryScreen navigate={navigate} />;
      break;
  }
  const studioEnabled =
    Platform.OS === "web" &&
    process.env.EXPO_PUBLIC_ENABLE_STUDIO !== "0" &&
    typeof window !== "undefined";
  return (
    <>
      <React.Suspense fallback={<NavigatorLoading />}>
        {studioEnabled ? (
          <WebStudio route={route} navigate={navigate} fixture={fixture}>
            {screen}
          </WebStudio>
        ) : (
          screen
        )}
      </React.Suspense>
      <Sheet visible={!!error} onClose={() => setError("")} centered>
        <Body style={{ lineHeight: 22, color: colors.ink, marginBottom: 20 }}>
          {error}
        </Body>
        {route === "confirm" && (
          <PillButton
            secondary
            onPress={async () => {
              try {
                const { manualRecognition } =
                  await import("./src/services/recognition");
                setResult(manualRecognition(asset));
                setError("");
                navigate("result");
              } catch (value) {
                setError(
                  value instanceof Error
                    ? value.message
                    : "Please choose the photo again.",
                );
              }
            }}
          >
            Enter word manually
          </PillButton>
        )}
        <PillButton onPress={() => setError("")}>OK</PillButton>
      </Sheet>
    </>
  );
}
export default function App() {
  const [loaded, fontError] = useFonts({
    LilitaOne_400Regular,
    Gelasio_400Regular,
    Gelasio_700Bold,
    Gelasio_700Bold_Italic,
    Nunito_900Black,
  });
  if (!loaded && !fontError)
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator />
      </View>
    );
  return (
    <SafeAreaProvider>
      <AppProvider>
        <CloudAccountProvider>
          <Navigator />
        </CloudAccountProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
