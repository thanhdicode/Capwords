import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Body, PillButton, Sheet } from "./UI";
import { colors, fonts } from "../theme/tokens";
import { commitObjectNameDraft, type ObjectName } from "../domain/objectName";

/** Gummble gallery 014, 4117a5ee-b85a-4b0e-acaa-f25034d3bdc5.
 * This edits labels only: it does not claim to rerun recognition/translation.
 * Mount on open so every dismissal discards the uncommitted draft.
 */
export function ObjectNameEditor({
  initialValue,
  manual = false,
  onSave,
  onCancel,
}: {
  initialValue: ObjectName;
  manual?: boolean;
  onSave: (value: ObjectName) => void;
  onCancel: () => void;
}) {
  const [target, setTarget] = useState("");
  const [native, setNative] = useState(initialValue.native);
  const value = commitObjectNameDraft({ target, native }, initialValue, manual);
  const canSave = value !== null;
  const save = () => {
    if (!value) return;
    onSave(value);
  };

  return (
    <Sheet
      visible
      centered
      avoidKeyboard
      onClose={onCancel}
      contentStyle={s.dialog}
      containerStyle={s.container}
    >
      <View testID="object-name-editor" style={s.content}>
        <Body style={s.title}>Enter target object name</Body>
        <TextInput
          accessibilityLabel="Target object name"
          value={target}
          placeholder={initialValue.target}
          placeholderTextColor={colors.inputPlaceholder}
          onChangeText={setTarget}
          onSubmitEditing={save}
          returnKeyType="done"
          autoCorrect={false}
          autoCapitalize="none"
          selectTextOnFocus
          style={s.input}
        />
        {manual && (
          <TextInput
            accessibilityLabel="Native language meaning"
            value={native}
            placeholder="Meaning in your language"
            placeholderTextColor={colors.inputPlaceholder}
            onChangeText={setNative}
            onSubmitEditing={save}
            returnKeyType="done"
            style={s.meaning}
          />
        )}
        <PillButton
          disabled={!canSave}
          onPress={save}
          style={[
            s.save,
            { backgroundColor: canSave ? colors.black : colors.disabledAction },
          ]}
          textStyle={[
            s.actionText,
            { color: canSave ? colors.cream : colors.disabledText },
          ]}
        >
          Save
        </PillButton>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel object name"
          onPress={onCancel}
          style={s.cancel}
        >
          <Body style={[s.actionText, { color: colors.disabledAction }]}>
            Cancel
          </Body>
        </Pressable>
      </View>
    </Sheet>
  );
}

const s = StyleSheet.create({
  // Source rectangle: x=59..334.33, y=243.33..508.67 at ~393×852.
  // Elevation is measured in this no-keyboard capture, not an animation spec.
  container: { paddingBottom: 100, backgroundColor: "#0000001A" },
  dialog: {
    width: 275.33,
    maxWidth: "90%",
    borderRadius: 30,
    padding: 0,
    backgroundColor: colors.dialog,
  },
  content: { paddingHorizontal: 30, paddingTop: 35, paddingBottom: 22 },
  title: {
    textAlign: "center",
    color: colors.black,
    fontWeight: "700",
    fontSize: 15.5,
    lineHeight: 21,
  },
  input: {
    height: 60,
    marginTop: 17,
    padding: 0,
    textAlign: "center",
    fontFamily: fonts.rounded,
    fontSize: 28,
    color: colors.ink,
  },
  meaning: {
    height: 44,
    marginBottom: 16,
    padding: 0,
    fontFamily: fonts.body,
    fontSize: 16,
    textAlign: "center",
    color: colors.ink,
  },
  save: { height: 50, minHeight: 50, paddingHorizontal: 0, opacity: 1 },
  actionText: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  cancel: {
    height: 44,
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
