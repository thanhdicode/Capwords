import React from "react";
import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import { PROFILE_COPY } from "../data/profileCopy";
import { colors, fonts, metrics, profileDesign } from "../theme/tokens";
import { Body, CircleButton, PillButton, Serif } from "./UI";

export function ProfileVoiceDownloadCompletion({
  onBack,
  onDone,
}: {
  onBack: () => void;
  onDone: () => void;
}) {
  const design = profileDesign.voiceDownload049;
  const { width: viewportWidth } = useWindowDimensions();
  const illustrationWidth =
    Math.min(viewportWidth, metrics.maxSheetWidth) *
    design.illustrationWidthRatio;

  return (
    <View
      testID="profile-voice-download-completion-049"
      style={styles.container}
    >
      <CircleButton
        icon="chevron-back"
        label={PROFILE_COPY.voiceGuideBack}
        onPress={onBack}
        size={design.backButtonDiameter}
        background={colors.profileTutorialBack}
        color={colors.white}
        style={styles.backButton}
      />
      <Image
        source={require("../../assets/profile-voice-settings-049.png")}
        accessibilityLabel={PROFILE_COPY.voiceDownloadSettingsImage}
        resizeMode="contain"
        style={[
          styles.illustration,
          {
            width: illustrationWidth,
            height: illustrationWidth / design.illustrationAspectRatio,
          },
        ]}
      />
      <Serif style={styles.stepLabel}>{PROFILE_COPY.voiceDownloadStep}</Serif>
      <Serif style={styles.title}>{PROFILE_COPY.voiceDownloadTitle}</Serif>
      <Body style={styles.description}>
        {PROFILE_COPY.voiceDownloadDescription}
      </Body>
      <View style={styles.footer}>
        <CircleButton
          icon="refresh"
          label={PROFILE_COPY.voiceGuideRestartUnavailable}
          onPress={onBack}
          disabled
          size={design.restartDiameter}
          background={colors.white}
          color={colors.profileMuted}
        />
        <PillButton
          onPress={onDone}
          style={styles.doneButton}
          textStyle={styles.doneText}
        >
          {PROFILE_COPY.voiceDone}
        </PillButton>
      </View>
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
    top: profileDesign.voiceDownload049.backButtonTop,
    left: profileDesign.voiceDownload049.backButtonLeft,
    zIndex: 1,
  },
  illustration: {
    position: "absolute",
    top: profileDesign.voiceDownload049.illustrationTop,
    alignSelf: "center",
  },
  stepLabel: {
    position: "absolute",
    top: profileDesign.voiceDownload049.stepLabelTop,
    width: "100%",
    textAlign: "center",
    color: colors.ink,
    fontSize: profileDesign.voiceDownload049.stepLabelFontSize,
    lineHeight: profileDesign.voiceDownload049.stepLabelLineHeight,
  },
  title: {
    position: "absolute",
    top: profileDesign.voiceDownload049.titleTop,
    width: "100%",
    textAlign: "center",
    color: colors.ink,
    fontFamily: fonts.serifBold,
    fontSize: profileDesign.voiceDownload049.titleFontSize,
    lineHeight: profileDesign.voiceDownload049.titleLineHeight,
  },
  description: {
    position: "absolute",
    top: profileDesign.voiceDownload049.descriptionTop,
    left: profileDesign.voiceDownload049.descriptionHorizontalInset,
    right: profileDesign.voiceDownload049.descriptionHorizontalInset,
    color: colors.profileMuted,
    fontSize: profileDesign.voiceDownload049.descriptionFontSize,
    lineHeight: profileDesign.voiceDownload049.descriptionLineHeight,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: profileDesign.voiceDownload049.footerBottomInset,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: profileDesign.voiceDownload049.footerGap,
  },
  doneButton: {
    width: profileDesign.voiceDownload049.doneWidth,
    height: profileDesign.voiceDownload049.doneHeight,
    minHeight: profileDesign.voiceDownload049.doneHeight,
    borderRadius: profileDesign.voiceDownload049.doneRadius,
    paddingHorizontal: 0,
    backgroundColor: colors.goalAction,
  },
  doneText: {
    color: colors.goalActionText,
    fontSize: profileDesign.voiceDownload049.doneFontSize,
    lineHeight: profileDesign.voiceDownload049.doneLineHeight,
  },
});
