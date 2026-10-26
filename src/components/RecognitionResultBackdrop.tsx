import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import {
  metrics,
  recognitionResultDesign as resultDesign,
} from "../theme/tokens";
import { Pattern } from "./UI";

export function RecognitionResultBackdrop({ warmGlow }: { warmGlow: boolean }) {
  const glow = resultDesign.warmGlow;
  const viewportHeight = metrics.height - metrics.top - metrics.bottom;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {warmGlow && (
        <Svg
          style={StyleSheet.absoluteFill}
          viewBox={`0 0 ${metrics.width} ${viewportHeight}`}
          preserveAspectRatio="none"
        >
          <Defs>
            <RadialGradient
              id="recognition-result-warm-glow"
              cx="50%"
              cy="50%"
              r="50%"
            >
              <Stop
                offset="0%"
                stopColor={glow.color}
                stopOpacity={glow.centerOpacity}
              />
              <Stop
                offset={glow.middleStopOffset}
                stopColor={glow.color}
                stopOpacity={glow.middleOpacity}
              />
              <Stop offset="100%" stopColor={glow.color} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle
            cx={glow.centerX}
            cy={glow.centerY}
            r={glow.radius}
            fill="url(#recognition-result-warm-glow)"
          />
        </Svg>
      )}
      <Pattern {...resultDesign.pattern} />
    </View>
  );
}
