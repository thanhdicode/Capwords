import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Body,
  Pattern,
  PillButton,
  Screen,
  Serif,
  TopBar,
} from "../components/UI";
import { LanguageFlag } from "../components/LanguageFlag";
import { useApp } from "../state/AppContext";
import {
  LANGUAGES,
  LEARNING_LANGUAGE_ORDER,
  ONBOARDING_NATIVE_LANGUAGE_ORDER,
} from "../data/languages";
import type { OnboardingLanguageReference } from "../data/onboardingLanguageReference";
import { Navigate } from "../navigation/types";
import {
  colors,
  languageFlagDesign,
  onboardingLanguageDesign,
} from "../theme/tokens";

export function WelcomeScreen({ navigate }: { navigate: Navigate }) {
  return (
    <Screen background={colors.onboarding}>
      <Pattern />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Welcome to CapWords. Continue"
        onPress={() => navigate("intro")}
        style={s.welcome}
      >
        <View style={{ alignItems: "center" }}>
          <Image
            source={require("../../assets/logo-mark.png")}
            style={{ width: 90, height: 90 }}
            resizeMode="contain"
          />
          <Body style={{ fontSize: 16, marginTop: 12 }}>Welcome to</Body>
          <Serif style={{ fontSize: 30, fontWeight: "700", marginTop: 6 }}>
            CapWords
          </Serif>
        </View>
      </Pressable>
    </Screen>
  );
}
export function IntroScreen({ navigate }: { navigate: Navigate }) {
  return (
    <Screen background={colors.onboarding}>
      <Pattern />
      <Image
        source={require("../../assets/onboarding-phone.png")}
        style={s.phone}
        resizeMode="contain"
      />
      <Serif style={s.introTitle}>See it. Snap it.{`\n`}Learn the words</Serif>
      <View style={s.powered}>
        <Body style={{ fontSize: 16, color: "#80828A" }}>Powered by</Body>
        <LinearGradient
          colors={["#C475F4", "#F2A9E0", "#FFD064"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.ai}
        >
          <Body style={{ fontSize: 17, fontWeight: "800", color: "#fff" }}>
            AI✦
          </Body>
        </LinearGradient>
      </View>
      <PillButton
        style={s.start}
        textStyle={{ fontSize: 20 }}
        onPress={() => navigate("languages")}
      >
        Get Started
      </PillButton>
      <Body style={s.legal}>
        By tapping Get Started above, you agree to our{`\n`}
        <Body style={{ textDecorationLine: "underline", fontSize: 12 }}>
          Privacy Policy and Terms of Use
        </Body>
      </Body>
    </Screen>
  );
}
export function LanguagesScreen({
  navigate,
  reference,
}: {
  navigate: Navigate;
  reference?: OnboardingLanguageReference;
}) {
  const { completeOnboarding } = useApp();
  const [stage, setStage] = useState<"native" | "learning">("native");
  const [native, setNative] = useState(reference?.nativeLanguageCode ?? "");
  const [learning, setLearning] = useState("");
  const screenDesign = reference
    ? onboardingLanguageDesign.source080
    : onboardingLanguageDesign.default;
  const options = (
    stage === "native"
      ? ONBOARDING_NATIVE_LANGUAGE_ORDER
      : LEARNING_LANGUAGE_ORDER
  ).flatMap((code) => LANGUAGES.filter((language) => language.code === code));
  const selectedDesign =
    stage === "native" ? screenDesign : onboardingLanguageDesign.default;
  const flagDesign =
    stage === "native"
      ? languageFlagDesign.onboardingNative
      : languageFlagDesign.onboardingLearning;
  const selected = stage === "native" ? native : learning;
  const choose = (code: string) => {
    if (stage === "native") setNative(code);
    else setLearning(code);
  };
  const next = () => {
    if (stage === "native") {
      if (!native) return;
      setStage("learning");
    } else {
      if (!learning) return;
      completeOnboarding(native, learning);
      navigate("home");
    }
  };
  return (
    <Screen background={screenDesign.background}>
      {screenDesign.showPattern && <Pattern />}
      <TopBar
        variant="onboarding"
        onBack={() =>
          stage === "learning" ? setStage("native") : navigate("intro")
        }
      />
      <View
        style={[
          s.languageHeader,
          screenDesign.header && {
            paddingBottom: screenDesign.header.bottomInset,
          },
        ]}
      >
        <Image
          source={
            reference?.logoArtwork === "source080Sticker"
              ? require("../../assets/onboarding/language-logo-sticker-080.png")
              : require("../../assets/logo-mark.png")
          }
          style={[
            s.languageLogo,
            screenDesign.header && {
              transform: [
                { translateX: screenDesign.header.logoOffsetX },
                { translateY: screenDesign.header.logoOffsetY },
              ],
            },
          ]}
          resizeMode="contain"
        />
        <Serif
          style={[
            s.languageTitle,
            screenDesign.header && {
              fontSize: screenDesign.header.titleFontSize,
              lineHeight: screenDesign.header.titleLineHeight,
              transform: [{ translateY: screenDesign.header.titleOffsetY }],
            },
          ]}
        >
          {stage === "native"
            ? "Choose Your\nNative Language"
            : "Which language do\nyou want to learn?"}
        </Serif>
      </View>
      <ScrollView
        key={stage}
        testID={stage === "native" ? "languages-native" : "languages-learning"}
        showsVerticalScrollIndicator={false}
        style={
          stage === "native"
            ? { marginTop: screenDesign.list.topOffset }
            : undefined
        }
        contentContainerStyle={[
          stage === "native" ? s.nativeList : s.learningGrid,
          stage === "native" && { gap: screenDesign.list.rowGap },
        ]}
      >
        {options.map((language) => (
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel={language.name}
            accessibilityState={{ checked: selected === language.code }}
            aria-checked={selected === language.code}
            testID={`language-option-${language.code}`}
            key={language.code}
            onPress={() => choose(language.code)}
            style={[
              stage === "native" ? s.nativeOption : s.learningOption,
              stage === "native" && {
                height:
                  selected === language.code
                    ? screenDesign.list.selectedOptionHeight
                    : screenDesign.list.optionHeight,
              },
              selected === language.code && s.selectedLanguage,
              selected === language.code && {
                borderColor: selectedDesign.selectedBorderColor,
                borderWidth: selectedDesign.selectedBorderWidth,
              },
            ]}
          >
            <View
              style={stage === "native" ? s.nativeFlagSlot : s.learningFlagSlot}
            >
              <LanguageFlag
                code={language.code}
                fallback={language.flag}
                width={flagDesign.width}
                height={flagDesign.height}
                fallbackFontSize={flagDesign.fallbackFontSize}
                testID={`language-flag-${language.code}`}
              />
            </View>
            <Body style={stage === "native" ? s.nativeName : s.learningName}>
              {language.name}
            </Body>
          </Pressable>
        ))}
      </ScrollView>
      {screenDesign.fade && (
        <LinearGradient
          pointerEvents="none"
          colors={[...screenDesign.fade.colors]}
          locations={[...screenDesign.fade.locations]}
          style={[
            s.nativeLanguageFade,
            {
              height: screenDesign.fade.height,
              bottom: screenDesign.fade.bottomInset,
            },
          ]}
        />
      )}
      {stage === "native" && native && (
        <View
          style={[
            s.next,
            {
              bottom: screenDesign.action.bottomInset,
              left: screenDesign.action.horizontalInset,
              right: screenDesign.action.horizontalInset,
            },
          ]}
        >
          <PillButton
            style={[
              s.nativeNext,
              {
                width: screenDesign.action.width,
                height: screenDesign.action.height,
                marginTop: screenDesign.action.marginTop,
                backgroundColor: screenDesign.action.background,
              },
            ]}
            textStyle={{ fontSize: screenDesign.action.fontSize }}
            onPress={next}
          >
            Next
          </PillButton>
        </View>
      )}
      {stage === "learning" && learning && (
        <View
          style={[
            s.next,
            {
              bottom: screenDesign.action.bottomInset,
              left: screenDesign.action.horizontalInset,
              right: screenDesign.action.horizontalInset,
            },
          ]}
        >
          <PillButton
            style={[
              s.nativeNext,
              {
                width: screenDesign.action.width,
                height: screenDesign.action.height,
                backgroundColor: screenDesign.action.background,
              },
            ]}
            textStyle={{ fontSize: screenDesign.action.fontSize }}
            onPress={next}
          >
            Next
          </PillButton>
        </View>
      )}
    </Screen>
  );
}
const s = StyleSheet.create({
  welcome: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 30,
  },
  phone: {
    position: "absolute",
    top: 14,
    alignSelf: "center",
    width: 222,
    height: 450,
  },
  introTitle: {
    position: "absolute",
    top: 506,
    width: "100%",
    textAlign: "center",
    fontSize: 36,
    lineHeight: 43,
    fontWeight: "700",
    letterSpacing: -1.1,
  },
  powered: {
    position: "absolute",
    top: 602,
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  ai: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#fff",
  },
  start: {
    position: "absolute",
    top: 653,
    alignSelf: "center",
    width: 220,
    height: 60,
    backgroundColor: "#191A13",
  },
  legal: {
    position: "absolute",
    bottom: -8,
    width: "100%",
    textAlign: "center",
    fontSize: 12,
    lineHeight: 17,
    color: "#B9B9BB",
  },
  languageHeader: {
    alignItems: "center",
    paddingHorizontal: onboardingLanguageDesign.native.header.horizontalInset,
    paddingTop: onboardingLanguageDesign.native.header.topInset,
    paddingBottom: onboardingLanguageDesign.native.header.bottomInset,
  },
  languageLogo: {
    width: onboardingLanguageDesign.native.header.logoSize,
    height: onboardingLanguageDesign.native.header.logoSize,
  },
  languageTitle: {
    marginTop: onboardingLanguageDesign.native.header.titleGap,
    fontSize: onboardingLanguageDesign.native.header.titleFontSize,
    lineHeight: onboardingLanguageDesign.native.header.titleLineHeight,
    fontWeight: onboardingLanguageDesign.native.header.titleFontWeight,
    color: onboardingLanguageDesign.native.header.titleColor,
    textAlign: "center",
  },
  nativeList: {
    paddingHorizontal: onboardingLanguageDesign.native.list.horizontalInset,
    paddingTop: onboardingLanguageDesign.native.list.topInset,
    paddingBottom: onboardingLanguageDesign.native.list.bottomPadding,
    gap: onboardingLanguageDesign.native.list.rowGap,
  },
  nativeOption: {
    flexDirection: "row",
    alignItems: "center",
    height: onboardingLanguageDesign.native.option.height,
    paddingHorizontal: onboardingLanguageDesign.native.option.horizontalPadding,
    borderRadius: onboardingLanguageDesign.native.option.radius,
    backgroundColor: onboardingLanguageDesign.native.option.surface,
    borderWidth: onboardingLanguageDesign.native.option.borderWidth,
    borderColor: onboardingLanguageDesign.native.option.surface,
  },
  nativeFlagSlot: {
    width: languageFlagDesign.onboardingNative.slotWidth,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  nativeName: {
    fontSize: onboardingLanguageDesign.native.option.labelFontSize,
    color: onboardingLanguageDesign.native.option.labelColor,
  },
  learningGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 3,
    paddingBottom: 108,
    gap: 12,
  },
  learningOption: {
    width: "48%",
    height: 103,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#FFFEFF",
    borderWidth: 2,
    borderColor: "#FFFEFF",
  },
  learningFlagSlot: {
    height: languageFlagDesign.onboardingLearning.slotHeight,
    marginBottom: languageFlagDesign.onboardingLearning.labelGap,
    alignItems: "center",
    justifyContent: "center",
  },
  learningName: { fontSize: 16, color: "#34353A", fontWeight: "600" },
  selectedLanguage: {
    borderColor: onboardingLanguageDesign.default.selectedBorderColor,
    borderWidth: onboardingLanguageDesign.default.selectedBorderWidth,
  },
  nativeNext: {
    alignSelf: "center",
  },
  nativeLanguageFade: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  next: {
    position: "absolute",
    alignItems: "center",
  },
});
