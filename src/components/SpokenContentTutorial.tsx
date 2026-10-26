import React from "react";
import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import type { SpokenContentTutorialStep } from "../data/profileTutorial";
import { CircleButton, PillButton, Serif } from "./UI";
import { PROFILE_COPY } from "../data/profileCopy";
import { colors, fonts, metrics, profileDesign } from "../theme/tokens";

export function SpokenContentTutorial({
  step,
  onBack,
  onNext,
}: {
  step: SpokenContentTutorialStep;
  onBack: () => void;
  onNext: () => void;
}) {
  const isFirstStep = step === 1;
  const layout = profileDesign.spokenContentTutorial;
  const { width: viewportWidth } = useWindowDimensions();
  const illustrationWidth =
    Math.min(viewportWidth, metrics.maxSheetWidth) *
    layout.illustrationWidthRatio;
  const illustrationHeight = illustrationWidth / layout.illustrationAspectRatio;

  return (
    <View
      testID={`spoken-content-tutorial-step-${step}`}
      style={styles.container}
    >
      <CircleButton
        icon="chevron-back"
        label={
          isFirstStep
            ? PROFILE_COPY.spokenContentBackToVoice
            : PROFILE_COPY.spokenContentBackToStep1
        }
        onPress={onBack}
        size={layout.backButtonDiameter}
        background={colors.profileTutorialBack}
        color={colors.white}
        style={styles.backButton}
      />
      <Image
        source={
          isFirstStep
            ? require("../../assets/spoken-content-settings-step1.png")
            : require("../../assets/spoken-content-settings-step3.png")
        }
        accessibilityLabel={
          isFirstStep
            ? PROFILE_COPY.spokenContentStep1Image
            : PROFILE_COPY.spokenContentStep3Image
        }
        resizeMode="contain"
        style={[
          styles.illustration,
          { width: illustrationWidth, height: illustrationHeight },
        ]}
      />
      <Serif style={styles.stepLabel}>
        {isFirstStep
          ? PROFILE_COPY.spokenContentStep1
          : PROFILE_COPY.spokenContentStep3}
      </Serif>
      <Serif style={styles.instruction}>
        {isFirstStep
          ? PROFILE_COPY.spokenContentOpenSettings
          : PROFILE_COPY.spokenContentSelect}
      </Serif>
      <PillButton
        onPress={onNext}
        style={styles.nextButton}
        textStyle={styles.nextButtonText}
      >
        {PROFILE_COPY.spokenContentNext}
      </PillButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.profileTutorialSurface,
  },
  backButton: {
    position: "absolute",
    top: profileDesign.spokenContentTutorial.backButtonTop,
    left: profileDesign.spokenContentTutorial.backButtonLeft,
    zIndex: 1,
  },
  illustration: {
    position: "absolute",
    top: profileDesign.spokenContentTutorial.illustrationTop,
    alignSelf: "center",
  },
  stepLabel: {
    position: "absolute",
    top: profileDesign.spokenContentTutorial.stepLabelTop,
    width: "100%",
    textAlign: "center",
    color: colors.ink,
    fontSize: profileDesign.spokenContentTutorial.stepLabelFontSize,
  },
  instruction: {
    position: "absolute",
    top: profileDesign.spokenContentTutorial.instructionTop,
    left: profileDesign.spokenContentTutorial.instructionHorizontalInset,
    right: profileDesign.spokenContentTutorial.instructionHorizontalInset,
    textAlign: "center",
    color: colors.ink,
    fontFamily: fonts.serifBold,
    fontSize: profileDesign.spokenContentTutorial.instructionFontSize,
  },
  nextButton: {
    position: "absolute",
    top: profileDesign.spokenContentTutorial.nextButtonTop,
    width: profileDesign.spokenContentTutorial.nextButtonWidth,
    height: profileDesign.spokenContentTutorial.nextButtonHeight,
    minHeight: profileDesign.spokenContentTutorial.nextButtonHeight,
    alignSelf: "center",
    backgroundColor: colors.goalAction,
  },
  nextButtonText: {
    fontSize: profileDesign.spokenContentTutorial.nextButtonFontSize,
  },
});
