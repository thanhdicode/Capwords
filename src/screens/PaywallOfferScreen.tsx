import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Body,
  Icon,
  Pattern,
  PillButton,
  Screen,
  Serif,
  Sheet,
} from "../components/UI";
import { PaywallPurchaseSuccessAlert } from "../components/PaywallPurchaseSuccessAlert";
import { paywallMarketingCopy } from "../data/paywallMarketingCopy";
import { paywallMarketingDesign } from "../theme/tokens";
import type { Navigate } from "../navigation/types";

type Plan = "annual" | "monthly";
const design = paywallMarketingDesign;
const offerStyles = StyleSheet.create(design.styles);
const benefitArtwork = {
  infinite: require("../../assets/stickers/paywall-benefit-infinity-095.png"),
  book: require("../../assets/stickers/paywall-benefit-book-095.png"),
  "lock-open": require("../../assets/stickers/paywall-benefit-lock-095.png"),
} as const;
const backgroundArtwork = require("../../assets/patterns/paywall-marketing-background-095.png");

export function PaywallMarketingOffer({
  navigate,
  language,
  purchaseSuccess = false,
  showConfetti = true,
}: {
  navigate: Navigate;
  language: string;
  /** QA-only visual state; it never represents a real transaction. */
  purchaseSuccess?: boolean;
  /** Capture 095 is the settled offer; capture 073 includes confetti. */
  showConfetti?: boolean;
}) {
  const [plan, setPlan] = useState<Plan>("annual");
  const [demoOpen, setDemoOpen] = useState(false);
  const [successVisible, setSuccessVisible] = useState(purchaseSuccess);
  const annual = plan === "annual";

  return (
    <Screen
      background={design.background}
      statusBackground={design.background}
      style={offerStyles.root}
    >
      <LinearGradient
        colors={design.backgroundGradient}
        locations={design.backgroundLocations}
        start={design.gradientStart}
        end={design.gradientEnd}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Pattern
        color={design.patternColor}
        opacity={design.patternOpacity}
        rows={design.patternRows}
        columns={design.patternColumns}
        rowHeight={design.patternRowHeight}
        dotSize={design.patternDotSize}
        dotOffset={design.patternDotOffset}
        rotation={design.patternRotation}
      />
      <Image
        accessible={false}
        testID="paywall-offer-background"
        source={backgroundArtwork}
        resizeMode="stretch"
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, design.backgroundImageFrame]}
      />
      <ScrollView
        style={offerStyles.scroll}
        contentContainerStyle={offerStyles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={offerStyles.header}>
          <View style={offerStyles.headerSpacer} />
          <View style={offerStyles.poweredRow}>
            <Body style={offerStyles.poweredText}>
              {paywallMarketingCopy.poweredBy}
            </Body>
            <LinearGradient
              colors={design.badgeGradient}
              start={design.badgeGradientStart}
              end={design.badgeGradientEnd}
              style={offerStyles.aiBadge}
            >
              <Body style={offerStyles.aiBadgeText}>
                {paywallMarketingCopy.aiBadge}
              </Body>
              <Icon
                name="sparkles"
                size={design.icons.sparklesSize}
                color={design.icons.sparklesColor}
              />
            </LinearGradient>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={paywallMarketingCopy.cancel}
            onPress={() => navigate("profile")}
            style={offerStyles.cancel}
          >
            <Body style={offerStyles.cancelText}>
              {paywallMarketingCopy.cancel}
            </Body>
          </Pressable>
        </View>

        <View style={offerStyles.hero}>
          <Serif style={offerStyles.headline}>
            {paywallMarketingCopy.firstHeadline}
          </Serif>
          <Serif style={offerStyles.headline}>
            {paywallMarketingCopy.learnPrefix}{" "}
            <Serif style={offerStyles.headlineItalic}>{language}</Serif>{" "}
            {paywallMarketingCopy.learnSuffix}
          </Serif>
        </View>

        <View style={offerStyles.planRow} accessibilityRole="radiogroup">
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel={paywallMarketingCopy.annualPlanAccessibility}
            accessibilityState={{ checked: annual }}
            aria-checked={annual}
            testID="paywall-offer-annual"
            onPress={() => setPlan("annual")}
            style={[offerStyles.annualCard, annual && offerStyles.selectedCard]}
          >
            <View style={offerStyles.bestBand}>
              <Body style={offerStyles.bestText}>
                {paywallMarketingCopy.bestValue}
              </Body>
            </View>
            <View style={offerStyles.trialPlan}>
              <Body style={offerStyles.freeText}>
                {paywallMarketingCopy.free}
              </Body>
              <Serif style={offerStyles.daysText}>
                {paywallMarketingCopy.trialDays}
              </Serif>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel={paywallMarketingCopy.monthlyPlanAccessibility}
            accessibilityState={{ checked: !annual }}
            aria-checked={!annual}
            testID="paywall-offer-monthly"
            onPress={() => setPlan("monthly")}
            style={[
              offerStyles.monthlyCard,
              !annual && offerStyles.monthlyActive,
              !annual && offerStyles.selectedCard,
            ]}
          >
            <Serif
              style={[
                offerStyles.monthText,
                !annual && offerStyles.selectedText,
              ]}
            >
              {paywallMarketingCopy.monthlyPeriod}
            </Serif>
            <Serif
              style={[
                offerStyles.monthPrice,
                !annual && offerStyles.selectedText,
              ]}
            >
              {paywallMarketingCopy.monthlyPrice}
            </Serif>
          </Pressable>
        </View>

        <View style={offerStyles.award}>
          <View style={offerStyles.awardCopy}>
            <Icon
              name="logo-apple"
              size={design.icons.appleSize}
              color={design.icons.appleColor}
            />
            <Body style={offerStyles.awardTitle}>
              {paywallMarketingCopy.appleDesignAward}
            </Body>
            <Body style={offerStyles.awardYear}>
              {paywallMarketingCopy.awardYear}
            </Body>
          </View>
        </View>

        <View style={offerStyles.benefits}>
          {paywallMarketingCopy.benefits.map((benefit) => (
            <View key={benefit.label} style={offerStyles.benefitCard}>
              <Image
                accessible={false}
                testID={`paywall-benefit-icon-${benefit.icon}`}
                source={benefitArtwork[benefit.icon]}
                resizeMode="contain"
                style={design.benefitIconFrame}
              />
              <Serif style={offerStyles.benefitText}>{benefit.label}</Serif>
            </View>
          ))}
        </View>
      </ScrollView>

      {showConfetti && !purchaseSuccess && (
        <View
          testID="paywall-offer-confetti"
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          accessibilityElementsHidden
        >
          {design.confetti.map((mark, index) => (
            <View
              key={index}
              style={[
                offerStyles.confetti,
                {
                  left: mark.left,
                  top: mark.top,
                  width: mark.width,
                  height: mark.height,
                  backgroundColor: mark.color,
                  transform: [{ rotate: `${mark.rotate}deg` }],
                },
              ]}
            />
          ))}
        </View>
      )}

      <View style={offerStyles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${paywallMarketingCopy.startTrial} (${paywallMarketingCopy.demoOnly})`}
          accessibilityHint={paywallMarketingCopy.noPaymentHint}
          testID="paywall-offer-trial"
          onPress={() => setDemoOpen(true)}
          style={({ pressed }) =>
            pressed ? { opacity: design.pressedOpacity } : undefined
          }
        >
          <LinearGradient
            colors={design.ctaGradient}
            start={design.ctaGradientStart}
            end={design.ctaGradientEnd}
            style={offerStyles.cta}
          >
            <Body style={offerStyles.ctaText}>
              {annual
                ? paywallMarketingCopy.startTrial
                : paywallMarketingCopy.continue}
            </Body>
          </LinearGradient>
        </Pressable>
        <Body style={offerStyles.summary}>
          {annual
            ? paywallMarketingCopy.annualDisclosure
            : paywallMarketingCopy.monthlyDisclosure}
        </Body>
      </View>

      <Sheet visible={demoOpen} onClose={() => setDemoOpen(false)} centered>
        <Serif style={offerStyles.dialogTitle}>
          {paywallMarketingCopy.demoTitle}
        </Serif>
        <Body style={offerStyles.dialogBody}>
          {paywallMarketingCopy.demoBody}
        </Body>
        <PillButton onPress={() => setDemoOpen(false)}>
          {paywallMarketingCopy.gotIt}
        </PillButton>
      </Sheet>
      {successVisible && (
        <PaywallPurchaseSuccessAlert onClose={() => setSuccessVisible(false)} />
      )}
    </Screen>
  );
}
