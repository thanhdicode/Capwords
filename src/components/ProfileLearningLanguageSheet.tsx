import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Body, CircleButton, PillButton, Serif, Sheet } from "./UI";
import { LanguageFlag } from "./LanguageFlag";
import { PROFILE_LEARNING_LANGUAGES } from "../data/languages";
import { PROFILE_COPY } from "../data/profileCopy";
import {
  fonts,
  languageFlagDesign,
  profileLearningLanguageSheetDesign as design,
} from "../theme/tokens";

type ProfileLearningLanguageSheetProps = {
  visible: boolean;
  selectedCode: string;
  onClose: () => void;
  onSelect: (code: string) => void;
  onDone: () => void;
  onNativeLanguagePress: () => void;
};

export function ProfileLearningLanguageSheet({
  visible,
  selectedCode,
  onClose,
  onSelect,
  onDone,
  onNativeLanguagePress,
}: ProfileLearningLanguageSheetProps) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      showGrabber={false}
      contentStyle={styles.sheet}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <CircleButton
            icon="close"
            label={PROFILE_COPY.closeLearningLanguageSheet}
            onPress={onClose}
            size={design.closeDiameter}
            background={design.closeSurface}
            color={design.closeColor}
          />
          <View style={styles.headerSpacer} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={PROFILE_COPY.changeNativeLanguage}
            onPress={onNativeLanguagePress}
          >
            <Body style={styles.nativeLanguage}>
              {PROFILE_COPY.nativeLanguage}
            </Body>
          </Pressable>
        </View>

        <Serif style={styles.title}>{PROFILE_COPY.learningLanguageTitle}</Serif>
        <Body style={styles.description}>
          {PROFILE_COPY.learningLanguageDescription}
        </Body>

        <ScrollView
          style={styles.gridScroll}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {PROFILE_LEARNING_LANGUAGES.map((language) => {
            const selected = language.code === selectedCode;
            return (
              <Pressable
                key={language.code}
                accessibilityRole="radio"
                accessibilityLabel={language.name}
                accessibilityState={{ checked: selected }}
                aria-checked={selected}
                testID={`profile-learning-language-${language.code}`}
                onPress={() => onSelect(language.code)}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <LanguageFlag
                  code={language.code}
                  fallback={language.flag}
                  {...languageFlagDesign.profileSheet}
                  testID={`language-flag-${language.code}`}
                />
                <Body style={styles.optionName}>{language.name}</Body>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.actionFooter}>
          <PillButton
            onPress={onDone}
            disabled={!selectedCode}
            style={styles.action}
            textStyle={styles.actionText}
          >
            {PROFILE_COPY.confirmLearningLanguage}
          </PillButton>
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    height: design.sheetHeight,
    padding: 0,
    paddingBottom: 0,
    borderTopLeftRadius: design.sheetTopRadius,
    borderTopRightRadius: design.sheetTopRadius,
    backgroundColor: design.sheetSurface,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    paddingTop: design.contentTopInset,
  },
  header: {
    height: design.headerHeight,
    marginHorizontal: design.headerHorizontalInset,
    flexDirection: "row",
    alignItems: "center",
  },
  headerSpacer: { flex: 1 },
  nativeLanguage: {
    color: design.nativeLanguageColor,
    fontSize: design.nativeLanguageFontSize,
  },
  title: {
    marginTop: design.titleTopGap,
    paddingHorizontal: design.titleHorizontalInset,
    fontFamily: fonts.serifBold,
    color: design.titleColor,
    fontSize: design.titleFontSize,
    lineHeight: design.titleLineHeight,
    textAlign: "center",
  },
  description: {
    marginTop: design.descriptionTopGap,
    paddingHorizontal: design.descriptionHorizontalInset,
    color: design.descriptionColor,
    fontSize: design.descriptionFontSize,
    lineHeight: design.descriptionLineHeight,
    textAlign: "center",
  },
  gridScroll: {
    flex: 1,
    marginTop: design.gridTopGap,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: design.gridRowGap,
    paddingHorizontal: design.gridHorizontalInset,
    paddingBottom: design.gridBottomPadding,
  },
  option: {
    width: design.gridColumnWidth,
    height: design.optionHeight,
    borderRadius: design.optionRadius,
    borderWidth: design.optionBorderWidth,
    borderColor: "transparent",
    backgroundColor: design.optionSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  optionSelected: {
    borderColor: design.selectedOptionBorder,
  },
  optionName: {
    marginTop: design.optionLabelGap,
    color: design.optionLabelColor,
    fontSize: design.optionLabelFontSize,
    lineHeight: design.optionLabelLineHeight,
    fontWeight: "600",
    textAlign: "center",
  },
  actionFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: design.actionBottomInset,
    alignItems: "center",
  },
  action: {
    width: design.actionWidth,
    height: design.actionHeight,
    borderRadius: design.actionRadius,
    backgroundColor: design.actionSurface,
  },
  actionText: {
    color: design.actionTextColor,
    fontSize: design.actionFontSize,
    lineHeight: design.actionLineHeight,
    fontWeight: "700",
  },
});
