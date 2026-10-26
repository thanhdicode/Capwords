import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import {
  Body,
  CircleButton,
  Icon,
  PillButton,
  Screen,
  Serif,
  Sheet,
  TopBar,
} from "../components/UI";
import { ProfileLearningLanguageSheet } from "../components/ProfileLearningLanguageSheet";
import { ProfileVoiceSelector } from "../components/ProfileVoiceSelector";
import { ProfileVoiceDownloadCompletion } from "../components/ProfileVoiceDownloadCompletion";
import { colors, fonts, profileDesign } from "../theme/tokens";
import { LANGUAGES } from "../data/languages";
import { useApp } from "../state/AppContext";
import { CloudAccountPanel } from "../components/CloudAccountPanel";
import { LanguageSwitchFeedback } from "../components/LanguageSwitchFeedback";
import { ProfileSwitch } from "../components/ProfileSwitch";
import { TimeWheelPicker } from "../components/TimeWheelPicker";
import { SpokenContentTutorial } from "../components/SpokenContentTutorial";
import { PROFILE_COPY } from "../data/profileCopy";
import {
  chooseProfileAvatar,
  persistProfileAvatar,
  removeProfileAvatar,
} from "../services/profileAvatar";
import {
  getAvailableSpeechVoices,
  previewSpeechVoice,
  stopSpeechVoicePreview,
} from "../services/speechVoiceCatalog";
import type { ProfileSourceFixture } from "../data/profileFixtures";
import type { SpeechVoiceOption } from "../domain/speechVoice";
import type { SpokenContentTutorialStep } from "../data/profileTutorial";
import type { Navigate } from "../navigation/types";
import type { LanguageSwitchStatus } from "../data/languageSwitchFeedback";

type SheetName =
  | "nickname"
  | "language"
  | "systemLanguage"
  | "goal"
  | "reminder"
  | "voice"
  | "contact"
  | "ambassadors"
  | null;

type VoiceLoadStatus = "idle" | "loaded" | "error";

const Row = ({
  icon,
  label,
  value,
  onPress,
  trailing,
  compactLabel = false,
  showDivider = true,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  value?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  compactLabel?: boolean;
  showDivider?: boolean;
}) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={({ pressed }) => [styles.row, pressed && { opacity: 0.62 }]}
  >
    <View style={styles.rowIcon}>
      <Icon name={icon} size={21} color="#151515" />
    </View>
    <View style={styles.rowLabelContainer}>
      <Body
        numberOfLines={1}
        style={[styles.rowLabel, compactLabel && styles.rowLabelCompact]}
      >
        {label}
      </Body>
    </View>
    {trailing ?? (
      <View style={styles.rowEnd}>
        {value && <Body style={styles.rowValue}>{value}</Body>}
        {onPress && (
          <Icon name="chevron-forward" size={21} color={colors.faint} />
        )}
      </View>
    )}
    {showDivider && <View pointerEvents="none" style={styles.rowDivider} />}
  </Pressable>
);

export function ProfileScreen({
  navigate,
  sourceFixture,
}: {
  navigate: Navigate;
  sourceFixture?: ProfileSourceFixture;
}) {
  const {
    state,
    updateSettings,
    updateSettingsAndPersist,
    mergeCloudSnapshot,
  } = useApp();
  const [sheet, setSheet] = useState<SheetName>(
    sourceFixture?.initialSheet ?? null,
  );
  const [tutorialStep, setTutorialStep] =
    useState<SpokenContentTutorialStep | null>(
      sourceFixture?.tutorialStep ?? null,
    );
  const [voiceDownloadCompletion, setVoiceDownloadCompletion] = useState(
    sourceFixture?.voiceDownloadCompletion ?? false,
  );
  const [nickname, setNickname] = useState(state.profileName || "");
  const [webAvatarUri, setWebAvatarUri] = useState<string>();
  const [avatarPickerBusy, setAvatarPickerBusy] = useState(false);
  const [avatarPickerError, setAvatarPickerError] = useState(false);
  const [languageSwitchStatus, setLanguageSwitchStatus] =
    useState<LanguageSwitchStatus>(
      sourceFixture?.languageSwitchStatus ?? "idle",
    );
  const [pendingLanguage, setPendingLanguage] = useState<string | null>(null);
  const [learningLanguageDraft, setLearningLanguageDraft] = useState<
    string | null
  >(null);
  const mountedRef = useRef(true);
  const [reminderTime, setReminderTime] = useState(state.dailyReminderTime);
  const [voiceDraft, setVoiceDraft] = useState<string | null>(
    sourceFixture?.settings.preferredSpeechVoiceId ??
      state.preferredSpeechVoiceId,
  );
  const [deviceVoices, setDeviceVoices] = useState<SpeechVoiceOption[]>([]);
  const [voiceLoadStatus, setVoiceLoadStatus] =
    useState<VoiceLoadStatus>("idle");
  const [voicePreviewError, setVoicePreviewError] = useState(false);
  const [voiceSaveError, setVoiceSaveError] = useState(false);
  const selectedLanguage = useMemo(
    () =>
      LANGUAGES.find((language) => language.code === state.learningLanguage),
    [state.learningLanguage],
  );
  const close = () => setSheet(null);
  const closeVoice = () => {
    setTutorialStep(null);
    setVoiceDownloadCompletion(false);
    setVoiceDraft(state.preferredSpeechVoiceId);
    setVoicePreviewError(false);
    setVoiceSaveError(false);
    stopSpeechVoicePreview();
    close();
  };
  const openVoice = () => {
    setVoiceDraft(state.preferredSpeechVoiceId);
    setVoicePreviewError(false);
    setVoiceSaveError(false);
    setTutorialStep(null);
    setVoiceDownloadCompletion(false);
    setVoiceLoadStatus("idle");
    setSheet("voice");
  };
  const openNickname = () => {
    setNickname(state.profileName || "");
    setSheet("nickname");
  };
  const closeNickname = () => {
    setNickname(state.profileName || "");
    close();
  };
  const chooseProfilePhoto = async () => {
    if (avatarPickerBusy) return;
    setAvatarPickerBusy(true);
    let persistedUri: string | undefined;
    try {
      const asset = await chooseProfileAvatar();
      if (!asset) return;
      if (Platform.OS === "web") {
        if (mountedRef.current) setWebAvatarUri(asset.uri);
        return;
      }
      persistedUri = await persistProfileAvatar(asset.uri);
      await updateSettingsAndPersist({ profileAvatarUri: persistedUri });
      if (state.profileAvatarUri && state.profileAvatarUri !== persistedUri) {
        try {
          removeProfileAvatar(state.profileAvatarUri);
        } catch {
          // A stale avatar file is safe to clean up later.
        }
      }
    } catch {
      if (persistedUri && persistedUri !== state.profileAvatarUri) {
        try {
          removeProfileAvatar(persistedUri);
        } catch {
          // Failed-save cleanup is best effort; keep the original error visible.
        }
      }
      if (mountedRef.current) setAvatarPickerError(true);
    } finally {
      if (mountedRef.current) setAvatarPickerBusy(false);
    }
  };
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  useEffect(() => {
    if (sheet !== "voice" || tutorialStep !== null || voiceDownloadCompletion)
      return;
    if (sourceFixture?.voiceOptions) return;
    let active = true;
    void getAvailableSpeechVoices(state.learningLanguage)
      .then((voices) => {
        if (!active) return;
        setDeviceVoices(voices);
        setVoiceLoadStatus("loaded");
      })
      .catch(() => {
        if (active) setVoiceLoadStatus("error");
      });
    return () => {
      active = false;
      stopSpeechVoicePreview();
    };
  }, [
    sheet,
    tutorialStep,
    voiceDownloadCompletion,
    state.learningLanguage,
    sourceFixture?.voiceOptions,
  ]);
  const openReminder = () => {
    setReminderTime(state.dailyReminderTime);
    setSheet("reminder");
  };
  const saveLearningLanguage = async (languageCode: string) => {
    if (languageCode === state.learningLanguage) {
      close();
      return;
    }
    setPendingLanguage(languageCode);
    close();
    setLanguageSwitchStatus("saving");
    try {
      await updateSettingsAndPersist({ learningLanguage: languageCode });
      if (mountedRef.current) setLanguageSwitchStatus("success");
    } catch {
      if (mountedRef.current) setLanguageSwitchStatus("error");
    }
  };
  const openLearningLanguageSelector = () => {
    setLearningLanguageDraft(state.learningLanguage || null);
    setSheet("language");
  };
  const closeLearningLanguageSelector = () => {
    setLearningLanguageDraft(null);
    close();
  };
  const openNativeLanguageSelector = () => {
    setLearningLanguageDraft(null);
    setSheet("systemLanguage");
  };
  const confirmLearningLanguage = () => {
    const nextLanguage = learningLanguageDraft;
    setLearningLanguageDraft(null);
    close();
    if (nextLanguage) void saveLearningLanguage(nextLanguage);
  };
  const dismissLanguageFeedback = () => {
    setLanguageSwitchStatus("idle");
    setPendingLanguage(null);
  };
  const retryLanguageSave = () => {
    if (pendingLanguage) void saveLearningLanguage(pendingLanguage);
    else dismissLanguageFeedback();
  };
  const handleReminderTimeChange = (value: string) => {
    setReminderTime(value);
    updateSettings({ dailyReminderTime: value });
  };
  const handleVoicePreview = (voice: SpeechVoiceOption) => {
    setVoicePreviewError(false);
    previewSpeechVoice(
      voice,
      PROFILE_COPY.voicePreviewText,
      () => undefined,
      () => {
        if (mountedRef.current) setVoicePreviewError(true);
      },
    );
  };
  const saveVoiceSelection = async () => {
    setVoiceSaveError(false);
    try {
      await updateSettingsAndPersist({ preferredSpeechVoiceId: voiceDraft });
      closeVoice();
    } catch {
      setVoiceSaveError(true);
    }
  };
  const nicknameValue = nickname.trim();
  const goal = state.dailyGoal || 10;
  const avatarUri = webAvatarUri ?? state.profileAvatarUri;

  return (
    <Screen
      background={colors.profileBackground}
      scroll
      bottomSafeArea={false}
      webBottomInset={profileDesign.navigation.webBottomInset}
    >
      <TopBar onBack={() => navigate("home")} variant="profile" />
      <View
        style={[
          styles.profileHeader,
          languageSwitchStatus !== "idle" && styles.profileHeaderTransition,
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={PROFILE_COPY.chooseProfilePhoto}
          accessibilityHint={PROFILE_COPY.chooseProfilePhotoHint}
          onPress={() => void chooseProfilePhoto()}
          disabled={avatarPickerBusy}
          style={styles.avatar}
        >
          <Image
            source={
              avatarUri
                ? { uri: avatarUri }
                : require("../../assets/profile-avatar.png")
            }
            accessibilityLabel={PROFILE_COPY.profilePortrait}
            resizeMode="cover"
            style={styles.avatarImage}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={PROFILE_COPY.editNickname}
          onPress={openNickname}
        >
          <Serif
            style={[
              styles.title,
              languageSwitchStatus !== "idle" && styles.titleTransition,
            ]}
          >
            {state.profileName || "Edit Profile"}
          </Serif>
        </Pressable>
        {languageSwitchStatus === "idle" && (
          <Pressable
            onPress={openLearningLanguageSelector}
            style={styles.languageChip}
            accessibilityRole="button"
            accessibilityLabel="Choose learning language"
          >
            <Body style={styles.flag}>{selectedLanguage?.flag || "🌐"}</Body>
            <Body style={styles.languageText}>
              {selectedLanguage?.name || "Choose a language"}
            </Body>
            <Icon name="chevron-forward" size={18} color={colors.faint} />
          </Pressable>
        )}
      </View>

      <LanguageSwitchFeedback
        status={languageSwitchStatus}
        onDismiss={dismissLanguageFeedback}
        onRetry={retryLanguageSave}
      />

      <View style={styles.divider} />
      <Body style={styles.sectionTitle}>Settings</Body>
      <View style={styles.card}>
        <Row
          icon="notifications"
          label="Daily Reminder"
          value={state.dailyReminderEnabled ? "On" : "Off"}
          onPress={openReminder}
        />
        <Row
          icon="globe"
          label="System Language"
          value={
            LANGUAGES.find((l) => l.code === state.nativeLanguage)?.name ||
            "English"
          }
          onPress={() => setSheet("systemLanguage")}
        />
        <Row icon="radio" label="Change Voice" onPress={openVoice} />
        <Row
          icon="square-outline"
          label="Review Reminders"
          compactLabel
          trailing={
            <ProfileSwitch
              accessibilityLabel={PROFILE_COPY.reviewRemindersEnabled}
              value={state.reviewRemindersEnabled}
              onValueChange={(value) =>
                updateSettings({ reviewRemindersEnabled: value })
              }
            />
          }
        />
        <Row
          icon="sparkles"
          label="Subscription"
          value="Premium"
          onPress={() => navigate("paywall")}
          showDivider={false}
        />
      </View>

      <Body style={styles.sectionTitle}>Learning</Body>
      <View style={styles.card}>
        <Row
          icon="flame"
          label="Daily review amount"
          value={`${goal} words`}
          onPress={() => setSheet("goal")}
          showDivider={false}
        />
      </View>
      <View style={styles.linkList}>
        <Row
          icon="mail"
          label="Contact & Support"
          onPress={() => setSheet("contact")}
        />
        <Row
          icon="megaphone"
          label="App Ambassadors"
          onPress={() => setSheet("ambassadors")}
        />
        <Row icon="book" label="Our Story" onPress={() => navigate("story")} />
      </View>

      <CloudAccountPanel state={state} onRestore={mergeCloudSnapshot} />

      <Sheet
        visible={avatarPickerError}
        onClose={() => setAvatarPickerError(false)}
        centered
      >
        <Serif style={styles.dialogTitle}>
          {PROFILE_COPY.avatarPickerErrorTitle}
        </Serif>
        <Body style={styles.dialogCopy}>{PROFILE_COPY.avatarPickerError}</Body>
        <PillButton onPress={() => setAvatarPickerError(false)}>
          {PROFILE_COPY.dismissAvatarPickerError}
        </PillButton>
      </Sheet>

      <Sheet visible={sheet === "nickname"} onClose={closeNickname} centered>
        <View style={styles.dialogAvatar}>
          <Icon name="happy-outline" size={38} color="#b9b9b9" />
        </View>
        <Serif style={styles.dialogTitle}>Edit Nickname</Serif>
        <Body style={styles.dialogCopy}>
          {PROFILE_COPY.nicknameEditorDescription}
        </Body>
        <TextInput
          accessibilityLabel="Nickname"
          maxLength={40}
          value={nickname}
          onChangeText={setNickname}
          placeholder="Your name"
          placeholderTextColor="#a3a3a3"
          style={styles.input}
          autoFocus
        />
        <PillButton
          disabled={
            !nicknameValue || nicknameValue === state.profileName.trim()
          }
          onPress={() => {
            updateSettings({ profileName: nicknameValue });
            close();
          }}
        >
          Save
        </PillButton>
        <Pressable onPress={closeNickname} style={styles.cancel}>
          <Body style={styles.cancelText}>Cancel</Body>
        </Pressable>
      </Sheet>

      <ProfileLearningLanguageSheet
        visible={sheet === "language"}
        selectedCode={learningLanguageDraft ?? state.learningLanguage}
        onClose={closeLearningLanguageSelector}
        onSelect={setLearningLanguageDraft}
        onDone={confirmLearningLanguage}
        onNativeLanguagePress={openNativeLanguageSelector}
      />

      <Sheet visible={sheet === "systemLanguage"} onClose={close}>
        <Serif style={styles.sheetTitle}>Choose language</Serif>
        {LANGUAGES.map((language) => (
          <Pressable
            key={language.code}
            onPress={() => {
              updateSettings({ nativeLanguage: language.code });
              close();
            }}
            style={styles.choice}
          >
            <Body style={styles.choiceFlag}>{language.flag}</Body>
            <Body style={styles.choiceName}>{language.name}</Body>
            {state.nativeLanguage === language.code && (
              <Icon name="checkmark" size={22} color={colors.orange} />
            )}
          </Pressable>
        ))}
      </Sheet>

      <Sheet visible={sheet === "goal"} onClose={close}>
        <Serif style={styles.sheetTitle}>Daily review amount</Serif>
        <Body style={styles.sheetCopy}>
          Choose how many words you want to review each day.
        </Body>
        <View style={styles.goalGrid}>
          {[5, 10, 15, 20, 30].map((amount) => (
            <Pressable
              key={amount}
              onPress={() => {
                updateSettings({ dailyGoal: amount });
                close();
              }}
              style={[
                styles.goalOption,
                goal === amount && styles.goalSelected,
              ]}
            >
              <Body
                style={goal === amount ? styles.goalSelectedText : undefined}
              >
                {amount}
              </Body>
            </Pressable>
          ))}
        </View>
      </Sheet>

      <Sheet
        visible={sheet === "reminder"}
        onClose={close}
        showGrabber={false}
        backdropColor={colors.profileReminderOverlay}
        contentStyle={styles.reminderSheet}
      >
        <View style={styles.reminderTopControls}>
          <CircleButton
            icon="close"
            label={PROFILE_COPY.closeReminder}
            onPress={close}
            size={profileDesign.reminderSheet.closeDiameter}
            background={colors.profileReminderTrack}
            color={colors.white}
          />
          <View style={styles.reminderTopSpacer} />
          <View style={styles.reminderSwitchOffset}>
            <ProfileSwitch
              accessibilityLabel={PROFILE_COPY.dailyReminderEnabled}
              value={state.dailyReminderEnabled}
              onValueChange={(value) =>
                updateSettings({ dailyReminderEnabled: value })
              }
            />
          </View>
        </View>
        <View style={styles.reminderHeading}>
          <Icon
            name="notifications-outline"
            size={profileDesign.reminderSheet.iconSize}
            color={colors.profileInk}
          />
          <Serif style={styles.reminderTitle}>
            {PROFILE_COPY.dailyReminderTitle}
          </Serif>
          <Body style={styles.reminderCopy}>
            {PROFILE_COPY.dailyReminderPrompt}
          </Body>
        </View>
        <View style={styles.reminderWheel}>
          <TimeWheelPicker
            value={reminderTime}
            enabled={state.dailyReminderEnabled}
            onChange={handleReminderTimeChange}
          />
        </View>
        <Body style={styles.reminderTip}>{PROFILE_COPY.dailyReminderTip}</Body>
      </Sheet>

      <Sheet
        visible={sheet === "voice"}
        onClose={closeVoice}
        showGrabber={false}
        backdropColor={colors.profileReminderOverlay}
        contentStyle={
          voiceDownloadCompletion
            ? styles.voiceDownload049Sheet
            : tutorialStep !== null
              ? styles.spokenContentSheet
              : styles.voiceSheet
        }
      >
        {voiceDownloadCompletion ? (
          <ProfileVoiceDownloadCompletion
            onBack={() => setVoiceDownloadCompletion(false)}
            onDone={closeVoice}
          />
        ) : tutorialStep !== null ? (
          <SpokenContentTutorial
            step={tutorialStep}
            onBack={() =>
              setTutorialStep((current) => (current === 3 ? 1 : null))
            }
            onNext={() => {
              if (tutorialStep === 1) setTutorialStep(3);
              else closeVoice();
            }}
          />
        ) : (
          <ProfileVoiceSelector
            languageName={selectedLanguage?.name || state.learningLanguage}
            voices={sourceFixture?.voiceOptions ?? deviceVoices}
            selectedVoiceId={voiceDraft}
            loading={!sourceFixture?.voiceOptions && voiceLoadStatus === "idle"}
            loadError={voiceLoadStatus === "error"}
            previewError={voicePreviewError}
            saveError={voiceSaveError}
            onSelectVoice={(identifier) => {
              setVoiceDraft(identifier);
              setVoiceSaveError(false);
            }}
            onPreviewVoice={handleVoicePreview}
            onDone={() => void saveVoiceSelection()}
            onClose={closeVoice}
            onHelp={() => setTutorialStep(1)}
          />
        )}
      </Sheet>

      <Sheet visible={sheet === "contact"} onClose={close}>
        <Serif style={styles.sheetTitle}>Contact & Support</Serif>
        <Body style={styles.sheetCopy}>
          We’re happy to help with questions, feedback, or a tricky word.
        </Body>
        {["Email support", "Send feedback", "Help center"].map((item) => (
          <View key={item} style={styles.supportRow}>
            <Icon name="mail-outline" size={21} color="#222" />
            <Body>{item}</Body>
            <Icon name="chevron-forward" size={19} color={colors.faint} />
          </View>
        ))}
      </Sheet>

      <Sheet visible={sheet === "ambassadors"} onClose={close}>
        <View style={styles.ambassadorArt}>
          <Icon name="megaphone" size={62} color={colors.orange} />
        </View>
        <Serif style={styles.sheetTitle}>App Ambassadors</Serif>
        <Body style={styles.sheetCopy}>
          If you’re an influencer who would like to review and recommend our
          app, apply for a free premium account.
        </Body>
        {["Email", "Telegram", "X"].map((item) => (
          <View key={item} style={styles.supportRow}>
            <Icon
              name={item === "Email" ? "mail" : "paper-plane"}
              size={21}
              color="#222"
            />
            <Body>{item}</Body>
            <Icon name="chevron-forward" size={19} color={colors.faint} />
          </View>
        ))}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: "center",
    paddingTop: profileDesign.header.topInset,
    paddingBottom: profileDesign.header.bottomInset,
  },
  profileHeaderTransition: {
    paddingBottom: profileDesign.header.transitionBottomInset,
  },
  avatar: {
    width: profileDesign.header.avatarDiameter,
    height: profileDesign.header.avatarDiameter,
    borderRadius: profileDesign.header.avatarDiameter / 2,
    backgroundColor: colors.profileBackground,
    borderWidth: profileDesign.header.avatarRing,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: profileDesign.header.avatarNameGap,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius:
      (profileDesign.header.avatarDiameter -
        profileDesign.header.avatarRing * 2) /
      2,
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: profileDesign.header.nameFontSize,
    color: colors.profileInk,
    marginBottom: profileDesign.header.nameToLanguageGap,
  },
  titleTransition: { marginBottom: 0 },
  languageChip: {
    backgroundColor: colors.white,
    borderRadius: profileDesign.header.languageChipRadius,
    minWidth: profileDesign.header.languageChipMinWidth,
    paddingVertical: profileDesign.header.languageChipVerticalPadding,
    paddingHorizontal: profileDesign.header.languageChipHorizontalPadding,
    flexDirection: "row",
    alignItems: "center",
    gap: profileDesign.header.languageChipGap,
    justifyContent: "center",
  },
  flag: { fontSize: profileDesign.header.languageFlagSize },
  languageText: {
    color: colors.profileMuted,
    fontSize: profileDesign.header.languageTextSize,
  },
  divider: {
    height: 1,
    backgroundColor: colors.profileLine,
    marginHorizontal: profileDesign.settings.dividerInset,
    marginBottom: profileDesign.settings.dividerBottomGap,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: profileDesign.settings.sectionTitleSize,
    fontWeight: "700",
    marginHorizontal: profileDesign.settings.sectionInset,
    marginBottom: profileDesign.settings.sectionTitleBottomGap,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: profileDesign.settings.cardRadius,
    marginHorizontal: profileDesign.settings.cardInset,
    overflow: "hidden",
    marginBottom: profileDesign.settings.cardBottomGap,
  },
  row: {
    minHeight: profileDesign.settings.rowHeight,
    paddingLeft: profileDesign.settings.rowLeadingInset,
    paddingRight: profileDesign.settings.rowTrailingInset,
    flexDirection: "row",
    alignItems: "center",
    gap: profileDesign.settings.rowGap,
  },
  rowIcon: {
    width: profileDesign.settings.rowIconWidth,
    alignItems: "center",
  },
  rowLabelContainer: { flex: 1, minWidth: 0 },
  rowLabel: {
    color: colors.ink,
    fontSize: profileDesign.settings.rowLabelSize,
  },
  rowLabelCompact: {
    maxWidth: profileDesign.settings.reviewReminderLabelMaxWidth,
  },
  rowDivider: {
    position: "absolute",
    left: profileDesign.settings.rowDividerInset,
    right: profileDesign.settings.rowDividerInset,
    bottom: 0,
    height: 1,
    backgroundColor: profileDesign.settings.rowBorder,
  },
  rowEnd: { flexDirection: "row", alignItems: "center", gap: 7 },
  rowValue: { color: colors.faint, fontSize: 16 },
  linkList: {
    backgroundColor: "#fff",
    borderRadius: 28,
    marginHorizontal: 20,
    overflow: "hidden",
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 27,
    textAlign: "center",
    color: "#202020",
    marginBottom: 9,
  },
  sheetCopy: { textAlign: "center", marginBottom: 20, lineHeight: 23 },
  choice: {
    height: 51,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  choiceFlag: { fontSize: 23 },
  choiceName: { flex: 1, color: colors.ink, fontSize: 17 },
  goalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginBottom: 8,
  },
  goalOption: {
    width: 58,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  goalSelected: { backgroundColor: colors.orange },
  goalSelectedText: { color: "#fff", fontWeight: "700" },
  reminderSheet: {
    height: profileDesign.reminderSheet.height,
    backgroundColor: colors.profileBackground,
    borderTopLeftRadius: profileDesign.reminderSheet.topRadius,
    borderTopRightRadius: profileDesign.reminderSheet.topRadius,
    paddingHorizontal: profileDesign.reminderSheet.horizontalPadding,
    paddingTop: profileDesign.reminderSheet.topInset,
    paddingBottom: profileDesign.reminderSheet.tipBottomPadding,
  },
  reminderTopControls: {
    height: profileDesign.reminderSheet.controlsHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reminderTopSpacer: { flex: 1 },
  reminderSwitchOffset: {
    marginRight: profileDesign.reminderSheet.switchRightOffset,
  },
  reminderHeading: {
    alignItems: "center",
    marginTop: profileDesign.reminderSheet.headingTopGap,
  },
  reminderTitle: {
    fontFamily: fonts.serifBold,
    color: colors.black,
    fontSize: profileDesign.reminderSheet.titleFontSize,
    marginTop: profileDesign.reminderSheet.iconTitleGap,
  },
  reminderCopy: {
    width: profileDesign.reminderSheet.copyMaxWidth,
    color: colors.profileMuted,
    fontSize: profileDesign.reminderSheet.bodyFontSize,
    lineHeight: profileDesign.reminderSheet.copyLineHeight,
    textAlign: "center",
    marginTop: profileDesign.reminderSheet.titleCopyGap,
  },
  reminderWheel: { marginTop: profileDesign.reminderSheet.wheelTopGap },
  reminderTip: {
    marginTop: "auto",
    color: colors.profileMuted,
    fontSize: profileDesign.reminderSheet.tipFontSize,
    lineHeight: profileDesign.reminderSheet.tipLineHeight,
    textAlign: "center",
  },
  voiceSheet: {
    height: profileDesign.voiceSheet.height,
    backgroundColor: colors.profileBackground,
    borderTopLeftRadius: profileDesign.voiceSheet.topRadius,
    borderTopRightRadius: profileDesign.voiceSheet.topRadius,
    paddingHorizontal: profileDesign.voiceSheet.horizontalPadding,
    paddingTop: profileDesign.voiceSheet.topInset,
    paddingBottom: 0,
    overflow: "hidden",
  },
  voiceDownload049Sheet: {
    height: profileDesign.voiceDownload049.sheetHeight,
    padding: 0,
    paddingTop: 0,
    paddingBottom: 0,
    borderTopLeftRadius: profileDesign.voiceDownload049.sheetRadius,
    borderTopRightRadius: profileDesign.voiceDownload049.sheetRadius,
    backgroundColor: colors.profileTutorialSurface,
    overflow: "hidden",
  },
  spokenContentSheet: {
    height: profileDesign.spokenContentTutorial.sheetHeight,
    padding: 0,
    paddingTop: 0,
    paddingBottom: 0,
    borderTopLeftRadius: profileDesign.spokenContentTutorial.sheetRadius,
    borderTopRightRadius: profileDesign.spokenContentTutorial.sheetRadius,
    backgroundColor: colors.profileTutorialSurface,
    overflow: "hidden",
  },
  supportRow: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  ambassadorArt: {
    width: 112,
    height: 82,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  dialogAvatar: {
    alignSelf: "center",
    width: 94,
    height: 94,
    borderRadius: 48,
    backgroundColor: "#f4f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  dialogTitle: { color: "#b9b9b9", fontSize: 29, marginBottom: 10 },
  dialogCopy: { fontSize: 15, lineHeight: 22, marginBottom: 10 },
  input: {
    backgroundColor: "#f4f4f4",
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 48,
    fontFamily: fonts.body,
    fontSize: 16,
    marginBottom: 15,
  },
  cancel: { alignItems: "center", paddingTop: 17 },
  cancelText: { color: "#777", fontWeight: "700" },
  sheet: {},
});
