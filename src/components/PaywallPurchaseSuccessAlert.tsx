import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Body } from "./UI";
import { paywallPurchaseSuccessDesign } from "../theme/tokens";

export function PaywallPurchaseSuccessAlert({
  onClose,
}: {
  onClose: () => void;
}) {
  const design = paywallPurchaseSuccessDesign;

  return (
    <View testID="paywall-purchase-success-overlay" style={styles.backdrop}>
      <View
        accessibilityRole="alert"
        accessibilityViewIsModal
        testID="paywall-purchase-success"
        style={[
          styles.card,
          {
            backgroundColor: design.surface,
            borderRadius: design.cornerRadius,
            height: design.cardHeight,
            transform: [{ translateY: design.verticalOffset }],
            width: design.cardWidth,
          },
        ]}
      >
        <View
          style={[
            styles.copy,
            {
              height: design.copyHeight,
              paddingHorizontal: design.copyHorizontalPadding,
              paddingTop: design.copyTopPadding,
              paddingBottom: design.copyBottomPadding,
            },
          ]}
        >
          <Body
            style={[
              styles.title,
              {
                fontSize: design.titleFontSize,
                lineHeight: design.titleLineHeight,
              },
            ]}
          >
            You&apos;re all set
          </Body>
          <Body
            style={[
              styles.message,
              {
                fontSize: design.messageFontSize,
                lineHeight: design.messageLineHeight,
                marginTop: design.copyGap,
              },
            ]}
          >
            Your purchase was successful.
          </Body>
        </View>
        <View
          style={[
            styles.separator,
            {
              backgroundColor: design.separator,
              height: design.separatorHeight,
            },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="OK"
          testID="paywall-purchase-success-ok"
          onPress={onClose}
          style={[
            styles.action,
            {
              height: design.actionHeight,
              backgroundColor: design.surface,
            },
          ]}
        >
          <Body
            style={[
              styles.actionText,
              {
                color: design.actionColor,
                fontSize: design.actionFontSize,
                lineHeight: design.actionLineHeight,
              },
            ]}
          >
            OK
          </Body>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paywallPurchaseSuccessDesign.backdrop,
  },
  card: {
    overflow: "hidden",
    alignItems: "stretch",
  },
  copy: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: paywallPurchaseSuccessDesign.textColor,
    fontWeight: "600",
    textAlign: "center",
  },
  message: {
    color: paywallPurchaseSuccessDesign.textColor,
    fontWeight: "400",
    textAlign: "center",
  },
  separator: {
    width: "100%",
  },
  action: {
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontWeight: "600",
    textAlign: "center",
  },
});
