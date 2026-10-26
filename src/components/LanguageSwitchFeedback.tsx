import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Body, PillButton, Serif, Sheet } from "./UI";
import { LANGUAGE_SWITCH_COPY } from "../data/languageSwitchFeedback";
import type { LanguageSwitchStatus } from "../data/languageSwitchFeedback";
import { colors, profileDesign } from "../theme/tokens";

interface LanguageSwitchFeedbackProps {
  status: LanguageSwitchStatus;
  onDismiss: () => void;
  onRetry: () => void;
}

export function LanguageSwitchFeedback({
  status,
  onDismiss,
  onRetry,
}: LanguageSwitchFeedbackProps) {
  const showsPendingIndicator = status === "saving" || status === "success";
  return (
    <>
      {showsPendingIndicator && (
        <View
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          testID="language-switch-loading"
          style={styles.loadingPill}
        >
          <Image
            source={require("../../assets/language-switch-loading-indicator.png")}
            accessibilityLabel="Loading"
            resizeMode="contain"
            style={styles.loadingIndicator}
          />
          <Body style={styles.loadingText}>{LANGUAGE_SWITCH_COPY.loading}</Body>
        </View>
      )}

      <Sheet
        visible={status === "success"}
        centered
        onClose={onDismiss}
        backdropColor={colors.profileOverlay}
        contentStyle={styles.successDialog}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="OK"
          testID="language-switch-success"
          onPress={onDismiss}
          style={styles.successContent}
        >
          <Image
            source={require("../../assets/language-switch-success-illustration.png")}
            accessibilityLabel="A smiling phone on a desk"
            resizeMode="contain"
            style={styles.illustration}
          />
          <Body numberOfLines={2} style={styles.successTitle}>
            {LANGUAGE_SWITCH_COPY.successTitle}
          </Body>
          <Body numberOfLines={2} style={styles.successBody}>
            {LANGUAGE_SWITCH_COPY.successBody}
          </Body>
        </Pressable>
      </Sheet>

      <Sheet
        visible={status === "error"}
        centered
        onClose={onDismiss}
        backdropColor={colors.profileOverlay}
        contentStyle={styles.errorDialog}
      >
        <Serif style={styles.errorTitle}>
          {LANGUAGE_SWITCH_COPY.errorTitle}
        </Serif>
        <Body style={styles.errorBody}>{LANGUAGE_SWITCH_COPY.errorBody}</Body>
        <PillButton onPress={onRetry} style={styles.errorAction}>
          {LANGUAGE_SWITCH_COPY.retry}
        </PillButton>
        <PillButton secondary onPress={onDismiss} style={styles.errorAction}>
          {LANGUAGE_SWITCH_COPY.cancel}
        </PillButton>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  loadingPill: {
    alignSelf: "center",
    width: profileDesign.languageLoading.width,
    minHeight: profileDesign.languageLoading.height,
    marginTop: profileDesign.languageLoading.topGap,
    marginBottom: profileDesign.languageLoading.bottomGap,
    paddingHorizontal: profileDesign.languageLoading.horizontalPadding,
    borderRadius: profileDesign.languageLoading.height,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: profileDesign.languageLoading.contentGap,
  },
  loadingIndicator: {
    width: profileDesign.languageLoading.indicatorSize,
    height: profileDesign.languageLoading.indicatorSize,
  },
  loadingText: {
    color: colors.profileMuted,
    fontSize: profileDesign.languageLoading.fontSize,
    fontWeight: "600",
  },
  successDialog: {
    width: profileDesign.languageSuccess.dialogWidth,
    borderRadius: profileDesign.languageSuccess.dialogRadius,
    paddingHorizontal: profileDesign.languageSuccess.horizontalPadding,
    paddingTop: profileDesign.languageSuccess.topPadding,
    paddingBottom: profileDesign.languageSuccess.bottomPadding,
    alignItems: "center",
  },
  successContent: { alignItems: "center", width: "100%" },
  illustration: {
    width: profileDesign.languageSuccess.illustrationWidth,
    height: profileDesign.languageSuccess.illustrationHeight,
  },
  successTitle: {
    color: colors.profileInk,
    fontSize: profileDesign.languageSuccess.titleFontSize,
    lineHeight: profileDesign.languageSuccess.titleLineHeight,
    maxWidth: profileDesign.languageSuccess.titleMaxWidth,
    fontWeight: "700",
    textAlign: "center",
  },
  successBody: {
    alignSelf: "stretch",
    marginTop: profileDesign.languageSuccess.bodyGap,
    color: colors.profileMuted,
    fontSize: profileDesign.languageSuccess.bodyFontSize,
    lineHeight: profileDesign.languageSuccess.bodyLineHeight,
    textAlign: "center",
  },
  errorDialog: {
    width: profileDesign.languageError.dialogWidth,
    borderRadius: profileDesign.languageError.dialogRadius,
    padding: profileDesign.languageError.padding,
  },
  errorTitle: {
    fontSize: profileDesign.languageError.titleFontSize,
    textAlign: "center",
  },
  errorBody: {
    marginTop: profileDesign.languageError.bodyGap,
    textAlign: "center",
  },
  errorAction: {
    marginTop: profileDesign.languageError.actionGap,
  },
});
