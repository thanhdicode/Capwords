import React, { useEffect, useState } from "react";
import { Animated, Image, Pressable, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { videoCapturePolicy } from "../domain/videoCapturePolicy";
import { cameraRingDesign, captureDesign } from "../theme/tokens";

/** Shutter is a study asset crop, never a screenshot standing in for an app screen. */
export function CameraRing({
  size = 64,
  onPress,
  onLongPress,
  onPressOut,
  busy = false,
  disabled,
  dotted = false,
  progress,
  label = "Open camera",
  accessibilityHint,
  artworkVariant = "default",
}: {
  size?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  onPressOut?: () => void;
  busy?: boolean;
  disabled?: boolean;
  dotted?: boolean;
  progress?: number;
  label?: string;
  accessibilityHint?: string;
  artworkVariant?: "default" | "capture";
}) {
  const [rotation] = useState(() => new Animated.Value(0));
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const isRecording = progress !== undefined;
  const progressValue = Math.min(Math.max(progress ?? 0, 0), 1);
  const recordingDesign = captureDesign.liveCamera.recording;
  useEffect(() => {
    if (!busy || isRecording) {
      rotation.stopAnimation();
      rotation.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [busy, isRecording, rotation]);
  const ring =
      size *
      (dotted
        ? cameraRingDesign.dottedArtworkScale
        : cameraRingDesign.circularArtworkScale),
    pad = (size - ring) / 2;
  const idleArtwork =
    artworkVariant === "capture"
      ? require("../../assets/camera-shutter-capture.png")
      : require("../../assets/camera-shutter-transparent.png");
  const progressCenter = size / 2;
  const progressRadius = (size - recordingDesign.trackWidth) / 2;
  const progressCircumference = 2 * Math.PI * progressRadius;
  const coreOffset = (size - recordingDesign.coreSize) / 2;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      disabled={disabled ?? (busy || (!onPress && !onLongPress))}
      delayLongPress={videoCapturePolicy.longPressActivationDelayMs}
      onLongPress={
        onLongPress
          ? () => {
              setLongPressTriggered(true);
              onLongPress();
            }
          : undefined
      }
      onPress={() => {
        if (longPressTriggered) {
          setLongPressTriggered(false);
          return;
        }
        onPress?.();
      }}
      onPressOut={() => {
        onPressOut?.();
        if (longPressTriggered) {
          setTimeout(() => {
            setLongPressTriggered(false);
          }, videoCapturePolicy.pressReleaseResetDelayMs);
        }
      }}
      style={({ pressed }) => ({
        width: size,
        height: size,
        opacity: pressed && !isRecording ? 0.7 : 1,
        transform: [{ scale: pressed && !isRecording ? 0.96 : 1 }],
      })}
    >
      {isRecording ? (
        <>
          <Svg
            width={size}
            height={size}
            pointerEvents="none"
            style={{ position: "absolute" }}
            testID="camera-video-recording-progress"
          >
            <Circle
              cx={progressCenter}
              cy={progressCenter}
              r={progressRadius}
              stroke={recordingDesign.trackColor}
              strokeWidth={recordingDesign.trackWidth}
              fill="none"
            />
            <Circle
              cx={progressCenter}
              cy={progressCenter}
              r={progressRadius}
              stroke={recordingDesign.progressColor}
              strokeWidth={recordingDesign.trackWidth}
              strokeLinecap="round"
              strokeDasharray={`${progressCircumference} ${progressCircumference}`}
              strokeDashoffset={progressCircumference * (1 - progressValue)}
              rotation={-90}
              originX={progressCenter}
              originY={progressCenter}
              fill="none"
            />
          </Svg>
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: coreOffset,
              top: coreOffset,
              width: recordingDesign.coreSize,
              height: recordingDesign.coreSize,
              borderWidth: recordingDesign.coreBorderWidth,
              borderColor: recordingDesign.coreBorderColor,
              borderRadius: recordingDesign.coreSize / 2,
              backgroundColor: recordingDesign.coreBorderColor,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              source={require("../../assets/camera-recording-center-010.png")}
              style={{
                width: recordingDesign.coreArtworkSize,
                height: recordingDesign.coreArtworkSize,
                borderRadius: recordingDesign.coreArtworkSize / 2,
              }}
              resizeMode="contain"
            />
          </View>
        </>
      ) : (
        <>
          {dotted && (
            <Svg width={size} height={size} style={{ position: "absolute" }}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={size * 0.48}
                stroke="#E2E2E2"
                strokeWidth={3}
                fill="none"
                strokeDasharray="3 13"
              />
            </Svg>
          )}
          <Animated.View
            style={{
              position: "absolute",
              left: pad,
              top: pad,
              width: ring,
              height: ring,
              transform: [
                {
                  rotate: rotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
            }}
          >
            <Image
              testID={
                artworkVariant === "capture"
                  ? "capture-shutter-artwork"
                  : undefined
              }
              source={idleArtwork}
              style={{ width: ring, height: ring }}
              resizeMode="contain"
            />
          </Animated.View>
        </>
      )}
    </Pressable>
  );
}
