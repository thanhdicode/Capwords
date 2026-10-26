import React from "react";
import { StyleSheet, View } from "react-native";
import { Body, Icon, Screen, Serif, TopBar } from "../components/UI";
import { colors } from "../theme/tokens";
import type { Navigate } from "../navigation/types";

export function StoryScreen({ navigate }: { navigate: Navigate }) {
  return (
    <Screen background="#F7F7F7" scroll>
      <TopBar onBack={() => navigate("profile")} />
      <View style={styles.content}>
        <View style={styles.mark}>
          <Icon name="planet-outline" size={54} color="#253d4a" />
        </View>
        <Serif style={styles.hero}>
          CapWords: Turning{`\n`}the Real World into a{`\n`}Language-Learning
          {`\n`}Playground
        </Serif>
        <View style={styles.drawing}>
          <View style={styles.paper}>
            <View style={styles.picture}>
              <Body style={styles.sun}>☀</Body>
              <Body style={styles.family}>♧ ♡ ♧</Body>
              <Body style={styles.house}>△</Body>
              <View style={styles.grass} />
            </View>
          </View>
        </View>
        <Serif style={styles.sectionTitle}>How Our Adventure Began</Serif>
        <Body style={styles.paragraph}>
          In the summer of 2022 my daughter stopped by a roadside plant and
          asked,
        </Body>
        <Body style={styles.quote}>“Dad, what’s this called?”</Body>
        <Body style={styles.paragraph}>
          I pulled out my phone, looked it up, and told her the name. Her eyes
          lit up—as if I suddenly knew every secret in the world.
        </Body>
        <Body style={styles.paragraph}>
          That tiny moment stayed with me. What if learning a language could
          begin in the places we already are: on a walk, at the market, or while
          sharing a curious question with someone we love?
        </Body>
        <Serif style={styles.sectionTitle}>Words are everywhere</Serif>
        <Body style={styles.paragraph}>
          CapWords was born from that idea. Point your camera at the world,
          discover a word, and keep it close enough to remember. Every new word
          becomes a little story of its own.
        </Body>
        <View style={styles.note}>
          <Icon name="sparkles" size={23} color={colors.orange} />
          <Body style={styles.noteText}>
            Learn from the things that make you curious.
          </Body>
        </View>
        <Serif style={styles.sectionTitle}>Keep exploring</Serif>
        <Body style={[styles.paragraph, { marginBottom: 50 }]}>
          We hope CapWords helps you notice more, ask more questions, and find
          joy in the language around you.
        </Body>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 29, paddingTop: 17 },
  mark: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  hero: { color: "#0b0b0b", fontSize: 38, lineHeight: 48, marginBottom: 40 },
  drawing: { alignItems: "center", marginBottom: 59 },
  paper: {
    width: 270,
    height: 211,
    backgroundColor: "#fff",
    padding: 18,
    transform: [{ rotate: "4deg" }],
    shadowColor: "#999",
    shadowOpacity: 0.2,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  picture: {
    borderWidth: 1,
    borderColor: "#ddd",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#fffef8",
  },
  sun: {
    position: "absolute",
    top: 10,
    left: 17,
    fontSize: 24,
    color: "#f3cb34",
  },
  family: { color: "#2c3841", fontSize: 31, letterSpacing: 7, marginTop: 20 },
  house: {
    color: "#cf8ba8",
    fontSize: 72,
    position: "absolute",
    right: 34,
    bottom: 20,
  },
  grass: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: "#b9d77a",
  },
  sectionTitle: {
    color: "#090909",
    fontSize: 31,
    lineHeight: 38,
    marginBottom: 25,
  },
  paragraph: {
    color: "#8a8d8e",
    fontSize: 21,
    lineHeight: 34,
    marginBottom: 2,
  },
  quote: {
    color: "#101010",
    fontSize: 21,
    lineHeight: 34,
    fontWeight: "800",
    marginBottom: 2,
  },
  note: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginVertical: 31,
  },
  noteText: { color: "#273846", fontSize: 17, flex: 1 },
});
