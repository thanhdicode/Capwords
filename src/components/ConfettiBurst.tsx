import React, { useEffect, useState } from "react";
import { Animated, StyleSheet, View, useWindowDimensions } from "react-native";
import {
  celebrationMotion,
  metrics,
  reviewCompletionDesign,
  reviewSummaryDesign,
} from "../theme/tokens";

type ConfettiBurstVariant = "animated" | "source103" | "source105";

export function ConfettiBurst({
  variant = "animated",
}: {
  variant?: ConfettiBurstVariant;
}) {
  if (variant === "source103") return <SourceConfettiStill sourceId="103" />;
  if (variant === "source105") return <SourceConfettiStill sourceId="105" />;
  return <AnimatedConfettiBurst />;
}

function AnimatedConfettiBurst() {
  const [progress] = useState(() => new Animated.Value(0));
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: celebrationMotion.duration,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  return (
    <View
      testID="review-celebration-burst"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      {Array.from({ length: celebrationMotion.particleCount }, (_, index) => {
        const angle =
          (index / celebrationMotion.particleCount) * Math.PI * 2 - Math.PI / 2;
        const radiusX = Math.cos(angle) * celebrationMotion.burstRadius;
        const radiusY = Math.sin(angle) * celebrationMotion.burstRadius;
        const driftX = Math.cos(angle) * celebrationMotion.drift;
        const particleSize =
          celebrationMotion.particleSizes[
            index % celebrationMotion.particleSizes.length
          ];
        const color =
          celebrationMotion.colors[index % celebrationMotion.colors.length];
        const translateX = progress.interpolate({
          inputRange: [0, celebrationMotion.burstEnd, 1],
          outputRange: [0, radiusX, radiusX + driftX],
        });
        const translateY = progress.interpolate({
          inputRange: [0, celebrationMotion.burstEnd, 1],
          outputRange: [0, radiusY, radiusY + celebrationMotion.fallDistance],
        });

        return (
          <Animated.View
            key={index}
            style={{
              position: "absolute",
              top: height * celebrationMotion.originY,
              left: width * celebrationMotion.originX,
              width: particleSize,
              height: particleSize,
              backgroundColor: color,
              opacity: progress.interpolate({
                inputRange: [0, celebrationMotion.burstEnd, 0.9, 1],
                outputRange: [0, 1, 1, 0],
                extrapolate: "clamp",
              }),
              transform: [{ translateX }, { translateY }],
            }}
          />
        );
      })}
    </View>
  );
}

function SourceConfettiStill({ sourceId }: { sourceId: "103" | "105" }) {
  const { width, height } = useWindowDimensions();
  const source =
    sourceId === "103"
      ? reviewCompletionDesign.source103
      : reviewSummaryDesign.source105;
  const scaleX = width / source.referenceWidth;
  const scaleY =
    (height - metrics.top - metrics.bottom) / source.referenceContentHeight;

  return (
    <View
      testID="review-celebration-burst"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      {source.confetti.map((particle, index) => {
        const opacity = "opacity" in particle ? particle.opacity : 1;
        const rotation = "rotation" in particle ? particle.rotation : undefined;
        return (
          <View
            key={index}
            testID="review-confetti-particle"
            style={{
              position: "absolute",
              left: particle.left * scaleX,
              top: particle.top * scaleY,
              width: particle.width * scaleX,
              height: particle.height * scaleY,
              backgroundColor: particle.color,
              borderRadius: particle.radius * scaleX,
              opacity,
              transform: rotation ? [{ rotate: rotation }] : undefined,
            }}
          />
        );
      })}
    </View>
  );
}
