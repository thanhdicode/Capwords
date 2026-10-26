import React, { useState } from "react";
import { Image, Pressable, View } from "react-native";
import { Body, Pattern, PillButton, Screen, Serif } from "./UI";
import { preparedExampleIntroCopy } from "../data/preparedExampleIntro";
import { colors, fonts, memoryIntroDesign, metrics } from "../theme/tokens";

interface PreparedExampleIntroProps {
  onTryDemo: () => void;
  onSnapFirstWord: () => void;
}

export function PreparedExampleIntro({
  onTryDemo,
  onSnapFirstWord,
}: PreparedExampleIntroProps) {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const design = memoryIntroDesign.preparedExample;
  const scale = Math.min(viewport.width / metrics.width || 1, 1);
  const patternRows =
    Math.ceil(viewport.height / design.pattern.rowHeight) +
    design.pattern.overscanRows;
  const photoWidth = viewport.width * design.photo.widthRatio;
  const photoHeight = viewport.height * design.photo.heightRatio;
  const titleInset = viewport.width * design.copy.titleHorizontalInsetRatio;
  const bodyInset = viewport.width * design.copy.bodyHorizontalInsetRatio;
  const primaryHeight = viewport.height * design.actions.primaryHeightRatio;

  return (
    <Screen background={colors.preparedExampleBackground}>
      <View
        testID="prepared-example-085"
        style={{ flex: 1, overflow: "hidden" }}
        onLayout={({ nativeEvent: { layout } }) =>
          setViewport({ width: layout.width, height: layout.height })
        }
      >
        <Pattern
          color={design.pattern.color}
          opacity={design.pattern.opacity}
          rows={Math.max(patternRows, design.pattern.overscanRows)}
          columns={design.pattern.columns}
          rowHeight={design.pattern.rowHeight}
          dotSize={design.pattern.dotSize}
          dotOffset={design.pattern.dotOffset}
          rotation={design.pattern.rotation}
        />
        {viewport.width > 0 && viewport.height > 0 && (
          <>
            <Image
              accessibilityLabel={
                preparedExampleIntroCopy.imageAccessibilityLabel
              }
              resizeMode="contain"
              source={require("../../assets/prepared-example-085.png")}
              style={{
                position: "absolute",
                top: viewport.height * design.photo.topRatio,
                left: (viewport.width - photoWidth) / 2,
                width: photoWidth,
                height: photoHeight,
              }}
            />
            <Serif
              style={{
                position: "absolute",
                top: viewport.height * design.copy.titleTopRatio,
                left: titleInset,
                right: titleInset,
                color: colors.black,
                fontFamily: fonts.serifBold,
                fontSize: design.copy.titleFontSize * scale,
                lineHeight: design.copy.titleLineHeight * scale,
                textAlign: "center",
              }}
            >
              {preparedExampleIntroCopy.title}
            </Serif>
            <Body
              style={{
                position: "absolute",
                top: viewport.height * design.copy.descriptionTopRatio,
                left: bodyInset,
                right: bodyInset,
                color: colors.preparedExampleBody,
                fontSize: design.copy.descriptionFontSize * scale,
                lineHeight: design.copy.descriptionLineHeight * scale,
                textAlign: "center",
              }}
            >
              {preparedExampleIntroCopy.description}
            </Body>
            <PillButton
              onPress={onTryDemo}
              style={{
                position: "absolute",
                left:
                  (viewport.width -
                    viewport.width * design.actions.primaryWidthRatio) /
                  2,
                bottom: viewport.height * design.actions.primaryBottomRatio,
                width: viewport.width * design.actions.primaryWidthRatio,
                height: primaryHeight,
                borderRadius: primaryHeight / 2,
                backgroundColor: colors.preparedExampleAction,
              }}
              textStyle={{
                color: colors.preparedExampleActionText,
                fontFamily: fonts.rounded,
                fontSize: design.actions.primaryFontSize * scale,
              }}
            >
              {preparedExampleIntroCopy.demoAction}
            </PillButton>
            <Serif
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: viewport.height * design.actions.separatorBottomRatio,
                color: colors.preparedExampleBody,
                fontSize: design.actions.separatorFontSize * scale,
                lineHeight: design.actions.separatorLineHeight * scale,
                textAlign: "center",
              }}
            >
              {preparedExampleIntroCopy.separator}
            </Serif>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={preparedExampleIntroCopy.firstWordAction}
              onPress={onSnapFirstWord}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: viewport.height * design.actions.secondaryBottomRatio,
                height: design.actions.secondaryHitAreaHeight * scale,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Body
                style={{
                  color: colors.preparedExampleSecondary,
                  fontSize: design.actions.secondaryFontSize * scale,
                  lineHeight: design.actions.secondaryLineHeight * scale,
                  textAlign: "center",
                }}
              >
                {preparedExampleIntroCopy.firstWordAction}
              </Body>
            </Pressable>
          </>
        )}
      </View>
    </Screen>
  );
}
