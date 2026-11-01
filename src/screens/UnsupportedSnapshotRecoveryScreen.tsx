import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Icon, Screen } from "../components/UI";

const design = {
  content: {
    horizontalPadding: 24,
    verticalPadding: 32,
    maxWidth: 440,
    gap: 20,
  },
  icon: { size: 56, color: "#46534A", background: "#E9EFEA" },
  title: {
    color: "#242824",
    fontSize: 24,
    fontWeight: "700" as const,
    lineHeight: 30,
  },
  body: { color: "#505750", fontSize: 16, lineHeight: 24 },
  preservedNote: {
    gap: 12,
    padding: 14,
    borderWidth: 1,
    border: "#D9E0DA",
    borderRadius: 12,
    background: "#F3F6F3",
    text: "#405847",
  },
  instruction: { color: "#505750", fontSize: 14, lineHeight: 21 },
};

export interface UnsupportedSnapshotRecoveryScreenProps {
  storedVersion: number;
  supportedVersion: number;
}

export function UnsupportedSnapshotRecoveryScreen({
  storedVersion,
  supportedVersion,
}: UnsupportedSnapshotRecoveryScreenProps) {
  return (
    <Screen scroll style={styles.content}>
      <View
        accessibilityLiveRegion="polite"
        style={styles.message}
        testID="unsupported-snapshot-recovery-screen"
      >
        <View accessible={false} style={styles.iconBadge}>
          <Icon name="lock-closed-outline" size={design.icon.size / 2} />
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          Saved data needs a compatible app
        </Text>
        <Text style={styles.body}>
          This saved snapshot uses data version {storedVersion}. This app
          supports version {supportedVersion}.
        </Text>
        <View style={styles.preservedNote}>
          <Icon name="shield-checkmark-outline" color={design.icon.color} />
          <Text style={styles.preservedText}>
            Your saved snapshot has been left unchanged.
          </Text>
        </View>
        <Text style={styles.instruction}>
          To recover your library, open CapWords with a version that supports
          saved-data version {storedVersion}. Do not clear this app&apos;s data.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: design.content.horizontalPadding,
    paddingVertical: design.content.verticalPadding,
  },
  message: {
    width: "100%",
    maxWidth: design.content.maxWidth,
    alignItems: "center",
    gap: design.content.gap,
  },
  iconBadge: {
    width: design.icon.size,
    height: design.icon.size,
    borderRadius: design.icon.size / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: design.icon.background,
  },
  title: {
    ...design.title,
    textAlign: "center",
  },
  body: {
    ...design.body,
    textAlign: "center",
  },
  preservedNote: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: design.preservedNote.gap,
    padding: design.preservedNote.padding,
    borderWidth: design.preservedNote.borderWidth,
    borderColor: design.preservedNote.border,
    borderRadius: design.preservedNote.borderRadius,
    backgroundColor: design.preservedNote.background,
  },
  preservedText: {
    ...design.body,
    color: design.preservedNote.text,
    flex: 1,
  },
  instruction: {
    ...design.instruction,
    textAlign: "center",
  },
});
