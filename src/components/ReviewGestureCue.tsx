import React from "react";
import { Image, View, type ImageSourcePropType } from "react-native";
import { fonts } from "../theme/tokens";
import { Icon, Serif } from "./UI";

type CueDesign = {
  top: number;
  fontSize: number;
  lineHeight: number;
  color: string;
  arrowSize: number;
  gap: number;
  zIndex: number;
};
type PointerDesign = {
  left: number;
  top: number;
  width: number;
  height: number;
  zIndex: number;
};

export function ReviewGestureCue({
  direction,
  label,
  design,
}: {
  direction: "forward" | "back";
  label: string;
  design: CueDesign;
}) {
  return (
    <View
      testID="review-gesture-cue"
      pointerEvents="none"
      accessible={false}
      style={{
        position: "absolute",
        top: design.top,
        left: 0,
        right: 0,
        zIndex: design.zIndex,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: design.gap,
      }}
    >
      <Icon
        name={direction === "forward" ? "arrow-forward" : "arrow-back"}
        size={design.arrowSize}
        color={design.color}
      />
      <Serif
        style={{
          fontFamily: fonts.serifBold,
          fontSize: design.fontSize,
          lineHeight: design.lineHeight,
          color: design.color,
        }}
      >
        {label}
      </Serif>
    </View>
  );
}

export function ReviewTapDetailsHint068({
  label,
  design,
}: {
  label: string;
  design: {
    top: number;
    fontSize: number;
    lineHeight: number;
    color: string;
    iconSize: number;
    gap: number;
    zIndex: number;
  };
}) {
  return (
    <View
      testID="review-tap-details-cue"
      pointerEvents="none"
      accessible={false}
      style={{
        position: "absolute",
        top: design.top,
        left: 0,
        right: 0,
        zIndex: design.zIndex,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: design.gap,
      }}
    >
      <Image
        accessible={false}
        source={require("../../assets/review-tap-details-icon-068.png")}
        resizeMode="contain"
        style={{ width: design.iconSize, height: design.iconSize }}
      />
      <Serif
        style={{
          fontFamily: fonts.serifBold,
          fontSize: design.fontSize,
          lineHeight: design.lineHeight,
          color: design.color,
        }}
      >
        {label}
      </Serif>
    </View>
  );
}

export function ReviewGesturePointer({
  design,
  source,
}: {
  design: PointerDesign;
  source?: ImageSourcePropType;
}) {
  return (
    <Image
      testID="review-gesture-pointer"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      source={source ?? require("../../assets/gummble-source-042-hand.png")}
      resizeMode="contain"
      style={{
        position: "absolute",
        left: design.left,
        top: design.top,
        width: design.width,
        height: design.height,
        zIndex: design.zIndex,
      }}
    />
  );
}
