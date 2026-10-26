import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { usePronunciation } from "../hooks/usePronunciation";
import { recognitionResultDesign } from "../theme/tokens";
import { Body, Icon } from "./UI";

const design = recognitionResultDesign.audio;

export function ResultPronunciationButton({
  text,
  language,
  preferredVoiceId,
  color = design.color,
}: {
  text: string;
  language: string;
  preferredVoiceId?: string | null;
  color?: string;
}) {
  const { play, stop, playing, error } = usePronunciation(
    text,
    language,
    preferredVoiceId,
  );

  return (
    <View style={styles.container}>
      <Pressable
        testID="result-pronunciation-button"
        accessibilityRole="button"
        accessibilityLabel={
          playing ? "Stop pronunciation" : "Play pronunciation"
        }
        accessibilityState={{ busy: playing }}
        aria-busy={playing}
        onPress={() => (playing ? stop() : void play())}
        style={styles.button}
      >
        <Icon
          name={playing ? "stop" : "volume-high"}
          size={design.iconSize}
          color={color}
        />
      </Pressable>
      {error ? <Body style={styles.error}>{error}</Body> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: design.hitTargetSize,
    alignItems: "center",
  },
  button: {
    width: design.hitTargetSize,
    height: design.hitTargetSize,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    position: "absolute",
    top: design.errorTop,
    width: design.errorWidth,
    fontSize: design.errorFontSize,
    lineHeight: design.errorFontSize * design.errorLineHeightScale,
    color: design.errorColor,
    textAlign: "center",
  },
});
