import React, { useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Body } from "./UI";
import { PROFILE_COPY } from "../data/profileCopy";
import { HOURS_PER_DAY, MINUTES_PER_HOUR } from "../domain/profileSettings";
import { colors, profileDesign } from "../theme/tokens";

interface TimeWheelPickerProps {
  value: string;
  enabled: boolean;
  onChange: (value: string) => void;
}

function formatUnit(value: number): string {
  return String(value).padStart(2, "0");
}

interface WheelColumnProps {
  count: number;
  value: number;
  label: string;
  testID: string;
  enabled: boolean;
  onChange: (value: number) => void;
}

function WheelColumn({
  count,
  value,
  label,
  testID,
  enabled,
  onChange,
}: WheelColumnProps) {
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const rowHeight = profileDesign.reminderSheet.wheelRowHeight;
  const padding =
    rowHeight * Math.floor(profileDesign.reminderSheet.wheelVisibleRows / 2);
  const values = Array.from({ length: count }, (_, index) => index);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: value * rowHeight, animated: false });
  }, [rowHeight, value]);

  const commitOffset = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.max(
      0,
      Math.min(
        count - 1,
        Math.round(event.nativeEvent.contentOffset.y / rowHeight),
      ),
    );
    if (next !== value) onChange(next);
    scrollRef.current?.scrollTo({ y: next * rowHeight, animated: true });
  };

  const selectValue = (next: number) => {
    if (!enabled || next === value) return;
    onChange(next);
    scrollRef.current?.scrollTo({ y: next * rowHeight, animated: true });
  };

  return (
    <View accessibilityLabel={label} testID={testID} style={styles.wheelColumn}>
      <ScrollView
        ref={scrollRef}
        accessibilityLabel={label}
        accessibilityState={{ disabled: !enabled }}
        scrollEnabled={enabled}
        snapToInterval={rowHeight}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.wheelContent,
          { paddingVertical: padding },
        ]}
        onMomentumScrollEnd={commitOffset}
        onScrollEndDrag={commitOffset}
      >
        {values.map((item) => {
          const selected = item === value;
          const distance = Math.abs(item - value);
          const opacity = Math.max(
            profileDesign.reminderSheet.wheelMinOpacity,
            1 - distance * profileDesign.reminderSheet.wheelFadeStep,
          );
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={`${label} ${formatUnit(item)}`}
              accessibilityState={{ selected, disabled: !enabled }}
              disabled={!enabled}
              onPress={() => selectValue(item)}
              style={[styles.wheelRow, { height: rowHeight }]}
            >
              <Body
                style={[
                  styles.wheelValue,
                  selected ? styles.wheelSelected : styles.wheelUnselected,
                  {
                    fontSize: selected
                      ? profileDesign.reminderSheet.wheelSelectedFontSize
                      : profileDesign.reminderSheet.wheelFontSize,
                    opacity,
                  },
                ]}
              >
                {formatUnit(item)}
              </Body>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function TimeWheelPicker({
  value,
  enabled,
  onChange,
}: TimeWheelPickerProps) {
  const [hourValue, minuteValue] = value.split(":").map(Number);
  const updateHour = (hour: number) =>
    onChange(`${formatUnit(hour)}:${formatUnit(minuteValue)}`);
  const updateMinute = (minute: number) =>
    onChange(`${formatUnit(hourValue)}:${formatUnit(minute)}`);

  return (
    <View style={[styles.wheel, !enabled && styles.disabledWheel]}>
      <View pointerEvents="none" style={styles.selectedBand} />
      <WheelColumn
        count={HOURS_PER_DAY}
        value={hourValue}
        label={PROFILE_COPY.hourPicker}
        testID="reminder-hour-wheel"
        enabled={enabled}
        onChange={updateHour}
      />
      <Body style={styles.colon}>:</Body>
      <WheelColumn
        count={MINUTES_PER_HOUR}
        value={minuteValue}
        label={PROFILE_COPY.minutePicker}
        testID="reminder-minute-wheel"
        enabled={enabled}
        onChange={updateMinute}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wheel: {
    position: "relative",
    height:
      profileDesign.reminderSheet.wheelRowHeight *
      profileDesign.reminderSheet.wheelVisibleRows,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: profileDesign.reminderSheet.wheelColumnGap,
  },
  wheelColumn: {
    zIndex: 1,
    width: profileDesign.reminderSheet.wheelColumnWidth,
    height: "100%",
    overflow: "hidden",
  },
  wheelContent: { alignItems: "center" },
  wheelRow: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  wheelValue: {
    color: colors.profileWheelFade,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  wheelSelected: { color: colors.profileWheel },
  wheelUnselected: { color: colors.profileWheelFade },
  selectedBand: {
    position: "absolute",
    zIndex: 0,
    left: profileDesign.reminderSheet.wheelBandInset,
    right: profileDesign.reminderSheet.wheelBandInset,
    top:
      profileDesign.reminderSheet.wheelRowHeight *
        Math.floor(profileDesign.reminderSheet.wheelVisibleRows / 2) +
      (profileDesign.reminderSheet.wheelRowHeight -
        profileDesign.reminderSheet.wheelBandHeight) /
        2,
    height: profileDesign.reminderSheet.wheelBandHeight,
    borderRadius: profileDesign.reminderSheet.wheelBandHeight / 2,
    backgroundColor: colors.white,
  },
  colon: {
    zIndex: 1,
    color: colors.profileInk,
    fontSize: profileDesign.reminderSheet.wheelSelectedFontSize,
  },
  disabledWheel: { opacity: profileDesign.reminderSheet.disabledWheelOpacity },
});
