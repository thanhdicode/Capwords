import React from "react";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";

type ArtworkActionButtonProps = {
  label: string;
  hint?: string;
  source: ImageSourcePropType;
  iconSize: { width: number; height: number };
  onPress: () => void;
  hitSlop?: number;
  selected?: boolean;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export function ArtworkActionButton({
  label,
  hint,
  source,
  iconSize,
  onPress,
  hitSlop,
  selected = false,
  disabled = false,
  testID,
  style,
}: ArtworkActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      testID={testID}
      style={[styles.action, style]}
    >
      <Image
        accessible={false}
        source={source}
        style={iconSize}
        resizeMode="contain"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: { alignItems: "center", justifyContent: "center" },
});
