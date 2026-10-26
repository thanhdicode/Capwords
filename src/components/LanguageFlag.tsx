import React from "react";
import { Image, ImageSourcePropType, StyleSheet, View } from "react-native";
import { Body } from "./UI";

const SOURCE_LANGUAGE_FLAGS: Readonly<Record<string, ImageSourcePropType>> = {
  zh: require("../../assets/source-language-flags/flag-zh.png"),
  en: require("../../assets/source-language-flags/flag-en.png"),
  "en-GB": require("../../assets/source-language-flags/flag-en-GB.png"),
  fr: require("../../assets/source-language-flags/flag-fr.png"),
  es: require("../../assets/source-language-flags/flag-es.png"),
  ja: require("../../assets/source-language-flags/flag-ja.png"),
  ko: require("../../assets/source-language-flags/flag-ko.png"),
  de: require("../../assets/source-language-flags/flag-de.png"),
};

type LanguageFlagProps = {
  code: string;
  fallback: string;
  width: number;
  height: number;
  fallbackFontSize: number;
  testID?: string;
};

export function LanguageFlag({
  code,
  fallback,
  width,
  height,
  fallbackFontSize,
  testID,
}: LanguageFlagProps) {
  const source = SOURCE_LANGUAGE_FLAGS[code];

  return (
    <View testID={testID} style={[styles.frame, { width, height }]}>
      {source ? (
        <Image
          accessible={false}
          source={source}
          resizeMode="contain"
          style={styles.sourceArt}
        />
      ) : (
        <Body style={[styles.emoji, { fontSize: fallbackFontSize }]}>
          {fallback}
        </Body>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: "center",
    justifyContent: "center",
  },
  sourceArt: {
    width: "100%",
    height: "100%",
  },
  emoji: {
    textAlign: "center",
  },
});
