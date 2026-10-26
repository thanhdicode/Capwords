import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { collectionLoadingReference } from "../data/collectionLoadingReference";
import { collectionLoadingDesign } from "../theme/tokens";

export function CollectionLoadingIndicator() {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={collectionLoadingReference.accessibilityLabel}
      testID="collection-loading-indicator"
    >
      <Image
        source={require("../../assets/gummble-source-099-spinner.png")}
        resizeMode="contain"
        style={styles.indicator}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  indicator: {
    width: collectionLoadingDesign.indicatorSize,
    height: collectionLoadingDesign.indicatorSize,
  },
});
