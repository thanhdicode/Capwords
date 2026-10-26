import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Path,
  Text as SvgText,
  TextPath,
} from "react-native-svg";
import { fonts } from "../theme/tokens";

export interface ReviewProgressRingLayout {
  stage: { width: number; height: number };
  ring: {
    centerX: number;
    centerY: number;
    radius: number;
    headlineFontSize: number;
    dateFontSize: number;
    letterSpacing: number;
    sideDotRadius: number;
  };
  progress: {
    top: number;
    fontSize: number;
    lineHeight: number;
    percentSize: number;
    percentTop: number;
    numberOffsetX: number;
    numberLetterSpacing: number;
    percentGap: number;
    numberScaleX?: number;
    transition101?: {
      previousDigit: {
        left: number;
        top: number;
        fontSize: number;
        lineHeight: number;
      };
      currentValue: {
        left: number;
        top: number;
        fontSize: number;
        lineHeight: number;
      };
      dash: { left: number; top: number; width: number; height: number };
      percentSign: {
        left: number;
        top: number;
        fontSize: number;
        lineHeight: number;
      };
    };
  };
}

export interface ReviewProgressTransitionGlyphs {
  previousDigit: string;
  currentPrefix?: string;
}

export function ReviewProgressRingVisual({
  layout,
  progressPercent,
  headline,
  dateLabel,
  numberColor,
  ringColor,
  testID,
  transitionGlyphs,
  showRing = true,
}: {
  layout: ReviewProgressRingLayout;
  progressPercent: number;
  headline: string;
  dateLabel: string;
  numberColor: string;
  ringColor: string;
  testID: string;
  transitionGlyphs?: ReviewProgressTransitionGlyphs;
  showRing?: boolean;
}) {
  const { ring, progress } = layout;
  const transition = progress.transition101;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {showRing && (
        <Svg
          width={layout.stage.width}
          height={layout.stage.height}
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <Path
              id={`${testID}-upper-arc`}
              d={`M ${ring.centerX - ring.radius} ${ring.centerY} A ${ring.radius} ${ring.radius} 0 0 1 ${ring.centerX + ring.radius} ${ring.centerY}`}
            />
            <Path
              id={`${testID}-lower-arc`}
              d={`M ${ring.centerX - ring.radius} ${ring.centerY} A ${ring.radius} ${ring.radius} 0 0 0 ${ring.centerX + ring.radius} ${ring.centerY}`}
            />
          </Defs>
          <SvgText
            fill={ringColor}
            fontFamily={fonts.serif}
            fontSize={ring.headlineFontSize}
            letterSpacing={ring.letterSpacing}
            textAnchor="middle"
          >
            <TextPath href={`#${testID}-upper-arc`} startOffset="50%">
              {headline}
            </TextPath>
          </SvgText>
          <SvgText
            fill={ringColor}
            fontFamily={fonts.serif}
            fontSize={ring.dateFontSize}
            letterSpacing={ring.letterSpacing}
            textAnchor="middle"
          >
            <TextPath href={`#${testID}-lower-arc`} startOffset="50%">
              {dateLabel}
            </TextPath>
          </SvgText>
          <Circle
            cx={ring.centerX - ring.radius}
            cy={ring.centerY}
            r={ring.sideDotRadius}
            fill={ringColor}
          />
          <Circle
            cx={ring.centerX + ring.radius}
            cy={ring.centerY}
            r={ring.sideDotRadius}
            fill={ringColor}
          />
        </Svg>
      )}

      {transitionGlyphs && transition ? (
        <View
          testID={testID}
          style={StyleSheet.absoluteFill}
          accessibilityRole="image"
          accessibilityLabel={`${progressPercent} percent`}
        >
          <Text
            style={[
              styles.transitionGlyph,
              transition.previousDigit,
              { color: numberColor },
            ]}
          >
            {transitionGlyphs.previousDigit}
          </Text>
          {transitionGlyphs.currentPrefix ? (
            <View
              testID="review-progress-transition-dash-101"
              style={[
                styles.transitionDash,
                transition.dash,
                { backgroundColor: numberColor },
              ]}
            />
          ) : null}
          <View style={[styles.transitionCurrent, transition.currentValue]}>
            <Text
              style={[
                styles.progressNumber,
                {
                  color: numberColor,
                  fontSize: transition.currentValue.fontSize,
                  lineHeight: transition.currentValue.lineHeight,
                },
              ]}
            >
              {progressPercent}
            </Text>
          </View>
          <Text
            style={[
              styles.transitionPercent,
              transition.percentSign,
              { color: numberColor, fontFamily: fonts.serifBold },
            ]}
          >
            %
          </Text>
        </View>
      ) : (
        <View
          testID={testID}
          style={[
            styles.progress,
            {
              top: progress.top,
              transform: [{ translateX: progress.numberOffsetX }],
            },
          ]}
          accessibilityRole={showRing ? "image" : undefined}
          accessibilityLabel={
            showRing ? `${progressPercent} percent` : undefined
          }
        >
          <Text
            style={[
              styles.progressNumber,
              {
                color: numberColor,
                fontSize: progress.fontSize,
                lineHeight: progress.lineHeight,
                letterSpacing: progress.numberLetterSpacing,
                transform:
                  progress.numberScaleX === undefined
                    ? undefined
                    : [{ scaleX: progress.numberScaleX }],
              },
            ]}
          >
            {progressPercent}
          </Text>
          <Text
            style={[
              styles.percentSign,
              {
                color: numberColor,
                fontSize: progress.percentSize,
                top: progress.percentTop,
                marginLeft: progress.percentGap,
              },
            ]}
          >
            %
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  progressNumber: {
    fontFamily: fonts.serifBold,
    fontWeight: "700",
    includeFontPadding: false,
  },
  transitionGlyph: {
    position: "absolute",
    fontFamily: fonts.serifBold,
    fontWeight: "700",
    includeFontPadding: false,
  },
  transitionCurrent: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  transitionDash: { position: "absolute" },
  transitionPercent: { position: "absolute" },
  progress: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  percentSign: {
    position: "relative",
    lineHeight: 30,
    fontFamily: fonts.serifBold,
    fontWeight: "700",
  },
});
