import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Body, CircleButton, Icon, PillButton, Serif } from "./UI";
import { PROFILE_COPY } from "../data/profileCopy";
import type { SpeechVoiceOption } from "../domain/speechVoice";
import { colors, fonts, profileDesign } from "../theme/tokens";

interface ProfileVoiceSelectorProps {
  languageName: string;
  voices: readonly SpeechVoiceOption[];
  selectedVoiceId: string | null;
  loading: boolean;
  loadError: boolean;
  previewError: boolean;
  saveError: boolean;
  onSelectVoice: (identifier: string) => void;
  onPreviewVoice: (voice: SpeechVoiceOption) => void;
  onDone: () => void;
  onClose: () => void;
  onHelp: () => void;
}

export function ProfileVoiceSelector({
  languageName,
  voices,
  selectedVoiceId,
  loading,
  loadError,
  previewError,
  saveError,
  onSelectVoice,
  onPreviewVoice,
  onDone,
  onClose,
  onHelp,
}: ProfileVoiceSelectorProps) {
  const design = profileDesign.voiceSheet;

  return (
    <>
      <View style={styles.topControls}>
        <CircleButton
          icon="close"
          label={PROFILE_COPY.closeVoiceSelector}
          onPress={onClose}
          size={design.closeDiameter}
          background={colors.profileReminderTrack}
          color={colors.white}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={PROFILE_COPY.voiceHelp}
          onPress={onHelp}
          style={styles.helpButton}
        >
          <Body style={styles.helpText}>{PROFILE_COPY.voiceHelp}</Body>
        </Pressable>
      </View>

      <Serif style={styles.title}>{PROFILE_COPY.voiceTitle}</Serif>
      <Body style={styles.instructions}>
        {PROFILE_COPY.voiceSettingsInstructions}
      </Body>
      <Body style={styles.languageLabel}>{languageName}</Body>

      <View style={styles.listViewport}>
        <ScrollView
          accessibilityLabel={`${languageName} voices`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.listMessage}>
              <ActivityIndicator color={colors.profileReminderAccent} />
              <Body style={styles.statusText}>
                {PROFILE_COPY.voiceListLoading}
              </Body>
            </View>
          ) : loadError ? (
            <Body style={styles.statusText}>{PROFILE_COPY.voiceListError}</Body>
          ) : voices.length === 0 ? (
            <Body style={styles.statusText}>{PROFILE_COPY.voiceListEmpty}</Body>
          ) : (
            voices.map((voice) => (
              <VoiceOptionRow
                key={voice.id}
                voice={voice}
                selected={voice.id === selectedVoiceId}
                onSelect={() => onSelectVoice(voice.id)}
                onPreview={() => onPreviewVoice(voice)}
              />
            ))
          )}
        </ScrollView>
        <LinearGradient
          pointerEvents="none"
          colors={[
            colors.profileBackgroundTransparent,
            colors.profileBackground,
          ]}
          locations={[0, 1]}
          style={styles.bottomFade}
        />
      </View>

      <View style={styles.footer}>
        {(previewError || saveError) && (
          <View accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Body style={styles.errorText}>
              {saveError
                ? PROFILE_COPY.voiceSaveError
                : PROFILE_COPY.voicePreviewError}
            </Body>
          </View>
        )}
        <PillButton
          disabled={loading}
          onPress={onDone}
          style={styles.doneButton}
          textStyle={styles.doneText}
        >
          {PROFILE_COPY.voiceDone}
        </PillButton>
      </View>
    </>
  );
}

function VoiceOptionRow({
  voice,
  selected,
  onSelect,
  onPreview,
}: {
  voice: SpeechVoiceOption;
  selected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  const design = profileDesign.voiceSheet;

  return (
    <View
      style={[styles.voiceRow, !voice.selectable && styles.unavailableVoice]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${PROFILE_COPY.voicePreviewPrefix} ${voice.name}`}
        accessibilityState={{ disabled: !voice.previewable }}
        disabled={!voice.previewable}
        onPress={onPreview}
        style={styles.previewButton}
      >
        <Icon
          name="play-circle-outline"
          size={design.playIconSize}
          color={colors.profileReminderAccent}
        />
      </Pressable>
      <Pressable
        accessibilityRole="radio"
        accessibilityLabel={voice.name}
        aria-checked={selected}
        accessibilityState={{
          checked: selected,
          disabled: !voice.selectable,
        }}
        disabled={!voice.selectable}
        onPress={onSelect}
        style={styles.voiceChoice}
      >
        <Body style={styles.voiceName}>{voice.name}</Body>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && (
            <Icon
              name="checkmark"
              size={design.selectedCheckSize}
              color={colors.white}
            />
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  topControls: {
    height: profileDesign.voiceSheet.controlsHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: profileDesign.voiceSheet.topControlsBottomGap,
    paddingLeft: profileDesign.voiceSheet.controlsLeadingInset,
  },
  helpButton: {
    paddingHorizontal: profileDesign.voiceSheet.helpHorizontalPadding,
  },
  helpText: {
    color: colors.profileVoiceHelp,
    fontSize: profileDesign.voiceSheet.helpFontSize,
    fontWeight: profileDesign.voiceSheet.helpFontWeight,
  },
  title: {
    alignSelf: "center",
    width: profileDesign.voiceSheet.titleMaxWidth,
    color: colors.black,
    fontFamily: fonts.serifBold,
    fontSize: profileDesign.voiceSheet.titleFontSize,
    lineHeight: profileDesign.voiceSheet.titleLineHeight,
    textAlign: "center",
    marginBottom: profileDesign.voiceSheet.titleBottomGap,
  },
  instructions: {
    alignSelf: "center",
    width: profileDesign.voiceSheet.bodyMaxWidth,
    color: colors.profileVoiceCopy,
    fontSize: profileDesign.voiceSheet.bodyFontSize,
    lineHeight: profileDesign.voiceSheet.bodyLineHeight,
    textAlign: "center",
    marginBottom: profileDesign.voiceSheet.bodyBottomGap,
  },
  languageLabel: {
    color: colors.profileVoiceLanguage,
    fontSize: profileDesign.voiceSheet.languageFontSize,
    lineHeight: profileDesign.voiceSheet.languageLineHeight,
    marginBottom: profileDesign.voiceSheet.languageBottomGap,
  },
  listViewport: {
    flex: 1,
    minHeight: 0,
    position: "relative",
  },
  listContent: {
    rowGap: profileDesign.voiceSheet.rowGap,
    paddingBottom: profileDesign.voiceSheet.listBottomFadeHeight,
  },
  listMessage: {
    alignItems: "center",
    rowGap: profileDesign.voiceSheet.rowGap,
  },
  statusText: {
    color: colors.profileMuted,
    fontSize: profileDesign.voiceSheet.bodyFontSize,
    lineHeight: profileDesign.voiceSheet.bodyLineHeight,
    textAlign: "center",
  },
  voiceRow: {
    height: profileDesign.voiceSheet.rowHeight,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: profileDesign.voiceSheet.rowRadius,
    paddingHorizontal: profileDesign.voiceSheet.rowHorizontalPadding,
  },
  unavailableVoice: {
    opacity: profileDesign.voiceSheet.disabledVoiceOpacity,
  },
  previewButton: {
    width: profileDesign.voiceSheet.playIconSize,
    height: profileDesign.voiceSheet.playIconSize,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceChoice: {
    flex: 1,
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: profileDesign.voiceSheet.rowIconLabelGap,
  },
  voiceName: {
    color: colors.profileVoiceName,
    fontSize: profileDesign.voiceSheet.voiceNameFontSize,
    fontWeight: profileDesign.voiceSheet.voiceNameFontWeight,
  },
  radio: {
    width: profileDesign.voiceSheet.radioDiameter,
    height: profileDesign.voiceSheet.radioDiameter,
    borderRadius: profileDesign.voiceSheet.radioDiameter / 2,
    borderWidth: profileDesign.voiceSheet.radioBorderWidth,
    borderColor: colors.profileLine,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderWidth: 0,
    backgroundColor: colors.profileReminderAccent,
  },
  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: profileDesign.voiceSheet.listBottomFadeHeight,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: profileDesign.voiceSheet.bottomInset,
    alignItems: "center",
  },
  errorText: {
    color: colors.profileMuted,
    fontSize: profileDesign.voiceSheet.saveErrorFontSize,
    textAlign: "center",
    marginBottom: profileDesign.voiceSheet.doneTopGap,
  },
  doneButton: {
    width: profileDesign.voiceSheet.doneWidth,
    height: profileDesign.voiceSheet.doneHeight,
    minHeight: profileDesign.voiceSheet.doneHeight,
    borderRadius: profileDesign.voiceSheet.doneRadius,
    paddingHorizontal: 0,
  },
  doneText: {
    color: colors.white,
    fontSize: profileDesign.voiceSheet.doneFontSize,
  },
});
