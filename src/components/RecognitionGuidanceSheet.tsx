import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { recognitionGuidanceCopy } from "../data/recognitionGuidance";
import { captureDesign, colors, metrics } from "../theme/tokens";
import { Body, CircleButton, Icon, Pattern } from "./UI";

export function RecognitionGuidanceSheet({
  onRetake,
  onConfirm,
  onCrop,
}: {
  onRetake: () => void;
  onConfirm: () => void;
  onCrop: () => void;
}) {
  const { height: viewportHeight } = useWindowDimensions();
  const design = captureDesign.recognitionGuidance;
  const panelHeight = viewportHeight * design.panelHeightRatio;
  const confirmDiameter = design.confirmButtonSize;

  return (
    <View
      testID="recognition-guidance-panel"
      style={[
        styles.panel,
        {
          height: panelHeight,
          maxWidth: metrics.maxSheetWidth,
          borderTopLeftRadius: design.topRadius,
          borderTopRightRadius: design.topRadius,
          backgroundColor: colors.confirmGuidanceSurface,
        },
      ]}
    >
      <Pattern
        color={colors.confirmGuidancePattern}
        opacity={design.patternOpacity}
      />
      <View
        style={[
          styles.copy,
          {
            top: panelHeight * design.copyTopRatio,
            paddingHorizontal: design.copyHorizontalInset,
          },
        ]}
      >
        <Body
          style={{
            color: colors.confirmGuidanceInk,
            fontSize: design.titleFontSize,
            fontWeight: "700",
            lineHeight: design.titleLineHeight,
            textAlign: "center",
          }}
        >
          {recognitionGuidanceCopy.title}
        </Body>
        <Body
          style={{
            color: colors.confirmGuidanceMuted,
            fontSize: design.bodyFontSize,
            lineHeight: design.bodyLineHeight,
            textAlign: "center",
          }}
        >
          {recognitionGuidanceCopy.instructionBeforeCrop}{" "}
          <Icon
            name="crop"
            size={design.instructionIconSize}
            color={colors.confirmGuidanceInk}
          />{" "}
          {recognitionGuidanceCopy.instructionAfterCrop}
        </Body>
      </View>
      <View
        style={[
          styles.controls,
          {
            top: panelHeight * design.controlsCenterRatio - confirmDiameter / 2,
            paddingHorizontal: design.controlsHorizontalInset,
          },
        ]}
      >
        <CircleButton
          label={recognitionGuidanceCopy.retakeLabel}
          icon="refresh"
          size={design.sideButtonSize}
          iconScale={design.sideIconScale}
          background={colors.confirmGuidanceButton}
          color={colors.white}
          onPress={onRetake}
        />
        <CircleButton
          label={recognitionGuidanceCopy.confirmLabel}
          icon="checkmark"
          size={confirmDiameter}
          iconScale={design.confirmIconScale}
          background={colors.white}
          color={colors.lavender}
          onPress={onConfirm}
        />
        <CircleButton
          label={recognitionGuidanceCopy.cropLabel}
          icon="crop"
          size={design.sideButtonSize}
          iconScale={design.sideIconScale}
          background={colors.confirmGuidanceButton}
          color={colors.white}
          onPress={onCrop}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    alignSelf: "center",
    overflow: "hidden",
  },
  copy: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    gap: captureDesign.recognitionGuidance.titleBodyGap,
  },
  controls: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
