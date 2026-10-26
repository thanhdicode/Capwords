import React, { useEffect, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { colors, motion, profileDesign } from "../theme/tokens";

interface ProfileSwitchProps {
  accessibilityLabel: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function ProfileSwitch({
  accessibilityLabel,
  value,
  onValueChange,
}: ProfileSwitchProps) {
  const [position] = useState(() => new Animated.Value(value ? 1 : 0));
  const toggle = profileDesign.toggle;
  const thumbTravel = toggle.width - toggle.thumbDiameter - toggle.inset * 2;

  useEffect(() => {
    Animated.spring(position, {
      toValue: value ? 1 : 0,
      tension: motion.spring.tension,
      friction: motion.spring.friction,
      useNativeDriver: true,
    }).start();
  }, [position, value]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      aria-checked={value}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [
        styles.track,
        value && styles.trackOn,
        pressed && styles.pressed,
      ]}
    >
      <View pointerEvents="none" style={styles.trackContent}>
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [
                {
                  translateX: position.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, thumbTravel],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: profileDesign.toggle.width,
    height: profileDesign.toggle.height,
    borderRadius: profileDesign.toggle.height / 2,
    backgroundColor: colors.profileReminderTrack,
    justifyContent: "center",
    overflow: "visible",
  },
  trackOn: { backgroundColor: colors.profileReminderAccent },
  trackContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
  },
  thumb: {
    position: "absolute",
    left: profileDesign.toggle.inset,
    width: profileDesign.toggle.thumbDiameter,
    height: profileDesign.toggle.thumbDiameter,
    borderRadius: profileDesign.toggle.thumbDiameter / 2,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: profileDesign.toggle.thumbShadowOpacity,
    shadowRadius: profileDesign.toggle.thumbShadowRadius,
    elevation: profileDesign.toggle.thumbElevation,
  },
  pressed: { opacity: profileDesign.toggle.pressedOpacity },
});
