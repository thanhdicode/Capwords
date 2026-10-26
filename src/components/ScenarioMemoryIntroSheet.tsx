import React from "react";
import { Image, Pressable, View, useWindowDimensions } from "react-native";
import { scenarioMemoryIntroCopy } from "../data/scenarioMemoryIntroReference";
import { colors, fonts, memoryIntroDesign, metrics } from "../theme/tokens";
import { Body, PillButton, Serif, Sheet } from "./UI";

interface ScenarioMemoryIntroSheetProps {
  onTryDemo: () => void;
  onTryLater: () => void;
}

export function ScenarioMemoryIntroSheet({
  onTryDemo,
  onTryLater,
}: ScenarioMemoryIntroSheetProps) {
  const { width, height } = useWindowDimensions();
  const design = memoryIntroDesign.scenarioCardsSheet;
  const sheetWidth = Math.min(width, metrics.maxSheetWidth);
  const scale = Math.min(sheetWidth / metrics.width, 1);
  const sheetHeight = height * (1 - design.topRatio);
  const illustrationWidth = sheetWidth * design.illustration.widthRatio;
  const illustrationHeight =
    illustrationWidth / design.illustration.aspectRatio;
  const descriptionWidth = sheetWidth * design.copy.descriptionWidthRatio;
  const actionWidth = sheetWidth * design.actions.primaryWidthRatio;
  const actionHeight = design.actions.primaryHeight * scale;

  return (
    <Sheet
      visible
      onClose={onTryLater}
      showGrabber={false}
      backdropColor={design.overlay}
      contentStyle={{
        width: "100%",
        height: sheetHeight,
        maxHeight: height,
        padding: 0,
        paddingBottom: 0,
        backgroundColor: design.surface,
        borderTopLeftRadius: design.topCornerRadius,
        borderTopRightRadius: design.topCornerRadius,
        overflow: "hidden",
      }}
    >
      <View
        testID="scenario-memory-intro-097"
        style={{ flex: 1, position: "relative", overflow: "hidden" }}
      >
        <Image
          accessible
          accessibilityLabel={
            scenarioMemoryIntroCopy.illustrationAccessibilityLabel
          }
          source={require("../../assets/scenario-memory-cards-097.png")}
          resizeMode="stretch"
          style={{
            position: "absolute",
            top: sheetHeight * design.illustration.topRatio,
            left: (sheetWidth - illustrationWidth) / 2,
            width: illustrationWidth,
            height: illustrationHeight,
          }}
        />
        <Serif
          style={{
            position: "absolute",
            top: sheetHeight * design.copy.titleTopRatio,
            left: 0,
            right: 0,
            color: colors.black,
            fontSize: design.copy.titleFontSize * scale,
            lineHeight: design.copy.titleLineHeight * scale,
            letterSpacing: design.copy.titleLetterSpacing * scale,
            textAlign: "center",
          }}
        >
          {scenarioMemoryIntroCopy.title}
        </Serif>
        <Body
          style={{
            position: "absolute",
            top: sheetHeight * design.copy.descriptionTopRatio,
            left: (sheetWidth - descriptionWidth) / 2,
            width: descriptionWidth,
            color: colors.preparedExampleBody,
            fontSize: design.copy.descriptionFontSize * scale,
            lineHeight: design.copy.descriptionLineHeight * scale,
            textAlign: "center",
          }}
        >
          {scenarioMemoryIntroCopy.description}
        </Body>
        <PillButton
          onPress={onTryDemo}
          style={{
            position: "absolute",
            top: sheetHeight * design.actions.primaryTopRatio,
            left: (sheetWidth - actionWidth) / 2,
            width: actionWidth,
            height: actionHeight,
            minHeight: actionHeight,
            borderRadius: actionHeight / 2,
            backgroundColor: colors.preparedExampleAction,
          }}
          textStyle={{
            color: colors.preparedExampleActionText,
            fontFamily: fonts.rounded,
            fontSize: design.actions.primaryFontSize * scale,
          }}
        >
          {scenarioMemoryIntroCopy.tryDemo}
        </PillButton>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={scenarioMemoryIntroCopy.tryLater}
          onPress={onTryLater}
          style={({ pressed }) => ({
            position: "absolute",
            left: 0,
            right: 0,
            bottom: sheetHeight * design.actions.secondaryBottomRatio,
            height: design.actions.secondaryHitAreaHeight * scale,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <Body
            style={{
              color: colors.preparedExampleSecondary,
              fontSize: design.actions.secondaryFontSize * scale,
              lineHeight: design.actions.secondaryLineHeight * scale,
              textAlign: "center",
            }}
          >
            {scenarioMemoryIntroCopy.tryLater}
          </Body>
        </Pressable>
      </View>
    </Sheet>
  );
}
