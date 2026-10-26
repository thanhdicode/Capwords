import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Body,
  Pattern,
  Screen,
  Serif,
  Sheet,
  TopBar,
  PillButton,
} from "../components/UI";
import { LANGUAGES } from "../data/languages";
import { useApp } from "../state/AppContext";
import type { Navigate } from "../navigation/types";
import { PaywallMarketingOffer } from "./PaywallOfferScreen";

type Plan = "annual" | "monthly";
type InfoSheet = "trial" | "restore" | "privacy" | "terms" | null;

const sourceLegalCopy =
  "Payment will be charged to your Apple ID account at the confirmation of purchase. Subscription automatically renews unless it is canceled at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage or cancel your subscription in your account settings after purchase. If a free trial is offered, payment will be charged after the trial period has ended.";

export function PaywallScreen({
  navigate,
  reference050 = false,
  reference073 = false,
  reference095 = false,
  reference064 = false,
  languageCodeOverride,
}: {
  navigate: Navigate;
  /** A source-state fixture only; it does not create a separate app route. */
  reference050?: boolean;
  reference073?: boolean;
  reference095?: boolean;
  reference064?: boolean;
  languageCodeOverride?: string;
}) {
  const { state } = useApp();
  const [plan, setPlan] = useState<Plan>("annual");
  const [info, setInfo] = useState<InfoSheet>(null);
  const learningCode = languageCodeOverride ?? state.learningLanguage;
  const learningLanguage =
    LANGUAGES.find((language) => language.code === learningCode)?.name ??
    "English";
  const isAnnual = plan === "annual";
  const dialogCopy = {
    trial: {
      title: "Demo mode",
      body: "This educational clone is not connected to billing. No subscription or payment has been started.",
    },
    restore: {
      title: "Restore Purchase",
      body: "Purchase restoration is unavailable because this educational clone has no app-store billing connection.",
    },
    privacy: {
      title: "Privacy Policy",
      body: "A policy document is not connected in this academic clone.",
    },
    terms: {
      title: "Terms of Service",
      body: "A terms document is not connected in this academic clone.",
    },
  } as const;
  const currentDialog = info ? dialogCopy[info] : undefined;

  if (reference073 || reference095 || reference064) {
    return (
      <PaywallMarketingOffer
        navigate={navigate}
        language={learningLanguage}
        purchaseSuccess={reference064}
        showConfetti={!reference095 && !reference064}
      />
    );
  }

  const planOption = (
    selectedPlan: Plan,
    accessibilityLabel: string,
    content: React.ReactNode,
    style: StyleProp<ViewStyle>,
  ) => (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: plan === selectedPlan }}
      aria-checked={plan === selectedPlan}
      testID={`paywall-plan-${selectedPlan}`}
      onPress={() => setPlan(selectedPlan)}
      style={({ pressed }) => [
        style,
        plan === selectedPlan && styles.planSelected,
        pressed && { opacity: 0.8 },
      ]}
    >
      {content}
    </Pressable>
  );

  return (
    <Screen background="#FFF1C4" statusBackground="#FFF1C4" style={styles.root}>
      <LinearGradient
        colors={["#FFE7A5", "#F9F3DE", "#FFFDF7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.72, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Pattern color="#E7D7A9" />
      {!reference050 && (
        <TopBar
          onBack={() => navigate("profile")}
          right={<Body style={styles.demoTag}>DEMO · NO BILLING</Body>}
        />
      )}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          reference050 && styles.referenceContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Serif style={styles.titleLine}>
            Join <Serif style={styles.gold}>CapWords</Serif>
          </Serif>
          <Serif style={styles.titleLine}>Make faster progress</Serif>
          <Serif style={styles.titleLine}>in {learningLanguage}</Serif>
        </View>

        <View style={styles.plans} accessibilityRole="radiogroup">
          {planOption(
            "annual",
            "Try it free, billed S$19.98 per year",
            <>
              <View style={styles.bestBand}>
                <Body style={styles.bestText}>✦ Best Value ✦</Body>
              </View>
              <View style={styles.annualBody}>
                <View style={styles.radioOuter}>
                  {isAnnual && <View style={styles.radioInner} />}
                </View>
                <View style={styles.planText}>
                  <View style={styles.planRow}>
                    <Body style={styles.annualTitle}>Try it free</Body>
                    <Body style={styles.annualPrice}>$1.67 / Month</Body>
                  </View>
                  <Body style={styles.annualDetail}>
                    Billed S$ 19.98 per year
                  </Body>
                </View>
              </View>
            </>,
            styles.annualCard,
          )}

          {planOption(
            "monthly",
            "1 Month, S$8.98 per month",
            <View style={styles.monthlyBody}>
              <View
                style={[
                  styles.radioOuter,
                  styles.monthlyRadio,
                  !isAnnual && styles.monthlyRadioSelected,
                ]}
              >
                {!isAnnual && <View style={styles.radioInner} />}
              </View>
              <View style={styles.planRow}>
                <Body
                  style={[
                    styles.monthlyTitle,
                    !isAnnual && styles.monthlyTitleSelected,
                  ]}
                >
                  1 Month
                </Body>
                <Body
                  style={[
                    styles.monthlyPrice,
                    !isAnnual && styles.monthlyPriceSelected,
                  ]}
                >
                  S$ 8.98 / Month
                </Body>
              </View>
            </View>,
            [styles.monthlyCard, !isAnnual && styles.monthlyActive],
          )}
        </View>

        <View style={styles.links}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setInfo("restore")}
          >
            <Serif style={styles.link}>Restore Purchase</Serif>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setInfo("privacy")}
          >
            <Serif style={styles.link}>Privacy Policy</Serif>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setInfo("terms")}
          >
            <Serif style={styles.link}>Terms of Service</Serif>
          </Pressable>
        </View>

        <Body style={styles.legal}>
          {reference050
            ? sourceLegalCopy
            : "This educational clone is not connected to an app store and does not submit purchases. The plan and price shown are for reference only."}
        </Body>
        {!reference050 && (
          <Body style={styles.demoNotice}>Educational demo · no billing</Body>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isAnnual
              ? "Start 3 days free trial (demo only)"
              : "Continue (demo only)"
          }
          accessibilityHint="Opens information only. No payment is submitted."
          testID="paywall-trial"
          onPress={() => setInfo("trial")}
          style={({ pressed }) => [pressed && { opacity: 0.86 }]}
        >
          <LinearGradient
            colors={["#FF8B54", "#F54D98"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Body style={styles.ctaText}>
              {isAnnual ? "Start 3 days free trial" : "Continue"}
            </Body>
          </LinearGradient>
        </Pressable>
        <Body style={styles.summary}>
          {isAnnual
            ? "Try 3 days free, then S$ 19.98/year"
            : "S$ 8.98/month · billed monthly"}
        </Body>
        {!reference050 && (
          <Body style={styles.footerNotice}>
            No subscription will be started
          </Body>
        )}
      </View>

      <Sheet visible={!!currentDialog} onClose={() => setInfo(null)} centered>
        {currentDialog && (
          <>
            <Serif style={styles.dialogTitle}>{currentDialog.title}</Serif>
            <Body style={styles.dialogBody}>{currentDialog.body}</Body>
            <PillButton onPress={() => setInfo(null)}>Got it</PillButton>
          </>
        )}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: "relative", overflow: "hidden" },
  scroll: { flex: 1 },
  content: {
    paddingTop: 4,
    paddingHorizontal: 20,
    paddingBottom: 136,
  },
  referenceContent: { paddingTop: 5 },
  hero: {
    alignItems: "center",
    paddingHorizontal: 6,
    marginBottom: 28,
  },
  titleLine: {
    color: "#171410",
    fontSize: 22,
    lineHeight: 28,
    textAlign: "center",
  },
  gold: { color: "#EFB331" },
  plans: { gap: 14 },
  annualCard: {
    minHeight: 107,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  planSelected: { borderColor: "#F5B51B" },
  bestBand: {
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFB915",
  },
  bestText: {
    color: "#18130A",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  annualBody: {
    minHeight: 75,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  radioOuter: {
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#F4B82E",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#F4B82E",
  },
  monthlyRadio: { borderColor: "#D4D1C9" },
  monthlyRadioSelected: { borderColor: "#F4B82E" },
  planText: { flex: 1, gap: 4 },
  planRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
  },
  annualTitle: { color: "#171717", fontSize: 18, fontWeight: "800" },
  annualPrice: { color: "#111", fontSize: 15, fontWeight: "700" },
  annualDetail: { color: "#98958F", fontSize: 13 },
  monthlyCard: {
    minHeight: 76,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: "#fff",
    opacity: 0.74,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  monthlyActive: { opacity: 1 },
  monthlyBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  monthlyTitle: { color: "#9F9F9F", fontSize: 18, fontWeight: "800" },
  monthlyTitleSelected: { color: "#171717" },
  monthlyPrice: { color: "#9F9F9F", fontSize: 15, fontWeight: "700" },
  monthlyPriceSelected: { color: "#171717" },
  links: {
    alignItems: "center",
    gap: 10,
    marginTop: 56,
  },
  link: { color: "#88847E", fontSize: 15, fontWeight: "700" },
  legal: {
    marginTop: 32,
    marginHorizontal: 30,
    color: "#96928D",
    fontSize: 11,
    lineHeight: 19,
  },
  demoNotice: {
    textAlign: "center",
    color: "#726B60",
    fontSize: 11,
    marginTop: 16,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: "#FFF9EE",
  },
  ctaGradient: {
    height: 64,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: "#fff", fontSize: 20, fontWeight: "800" },
  summary: {
    color: "#68625A",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 7,
    marginBottom: 2,
  },
  footerNotice: {
    color: "#928C83",
    fontSize: 10,
    textAlign: "center",
    marginTop: 1,
  },
  demoTag: {
    color: "#B37527",
    fontSize: 10,
    fontWeight: "800",
  },
  dialogTitle: { fontSize: 25, textAlign: "center", marginBottom: 10 },
  dialogBody: { textAlign: "center", lineHeight: 23, marginBottom: 18 },
});
