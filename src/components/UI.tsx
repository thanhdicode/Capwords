import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StatusBar } from "expo-status-bar";
import {
  colors,
  cropRatioSheetDesign,
  fonts,
  metrics,
  profileDesign,
} from "../theme/tokens";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
export function Icon({
  name,
  size = 22,
  color = colors.ink,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function Serif({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[s.serif, style]}>{children}</Text>;
}
export function Body({
  children,
  style,
  numberOfLines,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  return (
    <Text numberOfLines={numberOfLines} style={[s.body, style]}>
      {children}
    </Text>
  );
}
export function Rounded({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[s.rounded, style]}>{children}</Text>;
}
export function Screen({
  children,
  background = colors.background,
  statusBackground = background,
  light = false,
  style,
  scroll = false,
  bottomSafeArea = true,
  webBottomInset = metrics.bottom,
}: {
  children: React.ReactNode;
  background?: string;
  statusBackground?: string;
  light?: boolean;
  style?: StyleProp<ViewStyle>;
  scroll?: boolean;
  bottomSafeArea?: boolean;
  webBottomInset?: number;
}) {
  const insets = useSafeAreaInsets();
  const inner = scroll ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[s.scroll, style]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[s.content, style]}>{children}</View>
  );
  if (Platform.OS === "web")
    return (
      <View style={[s.screen, { backgroundColor: background }]}>
        <View
          style={[s.webTopSafeArea, { backgroundColor: statusBackground }]}
        />
        <View style={{ flex: 1, paddingBottom: webBottomInset }}>{inner}</View>
      </View>
    );
  return (
    <SafeAreaView
      style={[s.screen, { backgroundColor: background }]}
      edges={bottomSafeArea ? ["top", "bottom"] : ["top"]}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: statusBackground,
        }}
      />
      <StatusBar style={light ? "light" : "dark"} />
      {inner}
    </SafeAreaView>
  );
}
export function CircleButton({
  icon,
  onPress,
  color = colors.faint,
  background = colors.white,
  size = 40,
  iconScale = 0.49,
  label,
  style,
  disabled = false,
  iconSource,
  iconArtworkSize,
}: {
  icon?: IconName;
  onPress: () => void;
  color?: string;
  background?: string;
  size?: number;
  iconScale?: number;
  iconSource?: React.ComponentProps<typeof Image>["source"];
  iconArtworkSize?: { width: number; height: number };
  label: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background,
          opacity: disabled ? 0.4 : pressed ? 0.65 : 1,
        },
        style,
      ]}
    >
      {iconSource ? (
        <Image
          source={iconSource}
          style={{
            width: iconArtworkSize?.width ?? size * iconScale,
            height: iconArtworkSize?.height ?? size * iconScale,
          }}
          resizeMode="contain"
        />
      ) : icon ? (
        <Icon name={icon} color={color} size={size * iconScale} />
      ) : null}
    </Pressable>
  );
}
export function PillButton({
  children,
  onPress,
  secondary = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: {
  children: React.ReactNode;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.pill,
        {
          backgroundColor: secondary ? "#fff" : "#000",
          opacity: disabled ? 0.35 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          color={secondary ? colors.purple : colors.cream}
          size={20}
        />
      )}
      <Text
        style={[
          s.pillText,
          { color: secondary ? colors.purple : colors.cream },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}
export function TopBar({
  onBack,
  title,
  subtitle,
  right,
  close = false,
  variant = "default",
}: {
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  close?: boolean;
  variant?: "default" | "profile" | "result" | "onboarding";
}) {
  return (
    <View
      style={[
        s.topbar,
        variant === "profile" && {
          height: profileDesign.navigation.compactHeight,
        },
      ]}
    >
      <View style={s.topSide}>
        {onBack &&
          (close ? (
            <CircleButton icon="close" label="Close" onPress={onBack} />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={onBack}
              style={s.back}
            >
              <Icon
                name="chevron-back"
                size={27}
                color={
                  variant === "profile"
                    ? colors.profileMuted
                    : variant === "result"
                      ? colors.muted
                      : variant === "onboarding"
                        ? colors.muted
                        : colors.black
                }
              />
            </Pressable>
          ))}
      </View>
      <View style={s.topTitle}>
        {title && (
          <Serif style={{ fontSize: 25, color: "#000" }}>{title}</Serif>
        )}
        {subtitle && (
          <Body style={{ fontSize: 14, marginTop: 2 }}>{subtitle}</Body>
        )}
      </View>
      <View style={[s.topSide, { alignItems: "flex-end" }]}>{right}</View>
    </View>
  );
}
export function Sheet({
  visible,
  onClose,
  children,
  centered = false,
  contentStyle,
  containerStyle,
  avoidKeyboard = false,
  showGrabber = true,
  backdropColor = colors.modalOverlay,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  centered?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  avoidKeyboard?: boolean;
  showGrabber?: boolean;
  backdropColor?: string;
}) {
  const content = (
    <View
      style={[
        s.modal,
        { backgroundColor: backdropColor },
        centered && { justifyContent: "center" },
        containerStyle,
      ]}
    >
      <Pressable
        accessibilityLabel="Dismiss dialog"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />
      <View style={[centered ? s.dialog : s.sheet, contentStyle]}>
        {!centered && showGrabber && <View style={s.grabber} />}
        {children}
      </View>
    </View>
  );
  return (
    <Modal
      visible={visible}
      transparent
      animationType={centered ? "fade" : "slide"}
      onRequestClose={onClose}
    >
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </Modal>
  );
}
type ActionSheetOption = {
  id: string;
  label: string;
  onPress: () => void;
};
export function ActionSheet({
  visible,
  onClose,
  options,
  cancelLabel = "Cancel",
  design = cropRatioSheetDesign,
}: {
  visible: boolean;
  onClose: () => void;
  options: readonly ActionSheetOption[];
  cancelLabel?: string;
  design?: typeof cropRatioSheetDesign;
}) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, design.bottomInset);
  const content = (
    <View style={s.actionSheetRoot}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss action sheet"
        onPress={onClose}
        style={[StyleSheet.absoluteFill, { backgroundColor: design.backdrop }]}
      />
      <View
        style={[
          s.actionSheetContent,
          {
            maxWidth: metrics.maxSheetWidth + design.horizontalInset * 2,
            paddingHorizontal: design.horizontalInset,
            paddingBottom: bottomInset,
          },
        ]}
      >
        <View
          testID="action-sheet-options"
          style={[
            s.actionSheetGroup,
            {
              borderRadius: design.cornerRadius,
              backgroundColor: design.listSurface,
            },
          ]}
        >
          {options.map((option, index) => (
            <Pressable
              key={option.id}
              testID={`action-sheet-option-${option.id}`}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              onPress={option.onPress}
              style={({ pressed }) => [
                s.actionSheetOption,
                {
                  height: design.rowHeight,
                  borderBottomColor: design.divider,
                  borderBottomWidth:
                    index === options.length - 1 ? 0 : design.dividerWidth,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color: design.labelColor,
                  fontSize: design.labelFontSize,
                  lineHeight: design.labelLineHeight,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View
          style={{
            width: "100%",
            height: design.groupGap,
            backgroundColor: design.gapSurface,
          }}
        />
        <Pressable
          testID="action-sheet-cancel"
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          onPress={onClose}
          style={({ pressed }) => [
            s.actionSheetCancel,
            {
              height: design.cancelHeight,
              borderRadius: design.cornerRadius,
              backgroundColor: design.cancelSurface,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <Text
            style={{
              color: design.labelColor,
              fontSize: design.cancelFontSize,
              lineHeight: design.cancelLineHeight,
              fontWeight: "700",
            }}
          >
            {cancelLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {content}
    </Modal>
  );
}
type PatternProps = {
  color?: string;
  opacity?: number;
  rows?: number;
  columns?: number;
  rowHeight?: number;
  dotSize?: number;
  dotOffset?: number;
  rotation?: `${number}deg`;
};
export function Pattern({
  color = "#D9D5DE",
  opacity = 0.22,
  rows = 23,
  columns = 20,
  rowHeight = 20,
  dotSize = 2,
  dotOffset = 9,
  rotation = "30deg",
}: PatternProps) {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}
    >
      {Array.from({ length: rows }, (_, row) => (
        <View
          key={row}
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            height: rowHeight,
          }}
        >
          {Array.from({ length: columns }, (_, col) => (
            <View
              key={col}
              style={{
                width: dotSize,
                height: dotSize,
                backgroundColor: color,
                opacity,
                marginTop: dotOffset,
                transform: [{ rotate: rotation }],
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, overflow: "hidden" },
  content: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 42 },
  serif: { fontFamily: fonts.serif, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 16, color: colors.muted },
  rounded: { fontFamily: fonts.rounded, color: colors.ink, fontSize: 30 },
  webTopSafeArea: { height: metrics.top, flexShrink: 0 },
  circle: { alignItems: "center", justifyContent: "center" },
  pill: {
    minHeight: 54,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
    paddingHorizontal: 22,
  },
  pillText: { fontFamily: fonts.body, fontWeight: "700", fontSize: 17 },
  topbar: {
    height: 65,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 11,
  },
  topSide: { width: 54, minHeight: 42 },
  topTitle: { flex: 1, alignItems: "center", paddingTop: 0 },
  back: { width: 40, height: 40, justifyContent: "center" },
  modal: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sheet: {
    width: "100%",
    maxWidth: metrics.maxSheetWidth,
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 42,
  },
  dialog: {
    width: 286,
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 22,
  },
  grabber: {
    alignSelf: "center",
    width: 34,
    height: 4,
    backgroundColor: "#d5d5d5",
    borderRadius: 3,
    marginBottom: 20,
  },
  actionSheetRoot: {
    ...StyleSheet.absoluteFill,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  actionSheetContent: {
    width: "100%",
    alignItems: "center",
  },
  actionSheetGroup: {
    width: "100%",
    overflow: "hidden",
  },
  actionSheetOption: {
    alignItems: "center",
    justifyContent: "center",
  },
  actionSheetCancel: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
