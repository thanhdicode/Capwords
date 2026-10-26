import React from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Navigate, RouteName } from "../navigation/types";

export const referenceMap: Partial<Record<RouteName, string>> = {
  welcome: "003",
  intro: "004",
  home: "001",
  collection: "008",
  camera: "009",
  confirm: "012",
  result: "013",
  detail: "015",
  examples: "017",
  memoryIntro: "020",
  review: "021",
  reviewResult: "002",
  streak: "002",
  profile: "023",
  paywall: "paywall-01",
  story: "005",
};
const routes: RouteName[] = [
  "welcome",
  "intro",
  "languages",
  "home",
  "collection",
  "camera",
  "confirm",
  "result",
  "detail",
  "examples",
  "memoryIntro",
  "review",
  "reviewResult",
  "streak",
  "profile",
  "paywall",
  "story",
];
export function WebStudio({
  children,
  route,
  navigate,
  fixture,
}: {
  children: React.ReactNode;
  route: RouteName;
  navigate: Navigate;
  fixture: boolean;
}) {
  const { width, height } = useWindowDimensions();
  if (Platform.OS !== "web" || width < 650)
    return <View style={{ flex: 1, width: "100%", height }}>{children}</View>;
  if (process.env.EXPO_PUBLIC_ENABLE_STUDIO === "0")
    return (
      <View
        style={{
          flex: 1,
          height,
          alignItems: "center",
          backgroundColor: "#F4F4F4",
        }}
      >
        <View style={{ flex: 1, width: "100%", maxWidth: 480 }}>
          {children}
        </View>
      </View>
    );
  const reference = referenceMap[route];
  return (
    <ScrollView
      horizontal
      style={{ flex: 1, backgroundColor: "#202329" }}
      contentContainerStyle={{
        minWidth: width,
        minHeight: Math.max(height, 940),
        padding: 24,
        gap: 20,
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <View style={s.sidebar}>
        <Text style={s.brand}>CapWords{`\n`}Study build</Text>
        <Text style={s.note}>Gummble · 2025-09-29{`\n`}393 × 852 baseline</Text>
        <Pressable
          onPress={() => {
            window.location.search = `?screen=${route}&fixture=1`;
          }}
          style={s.fixture}
        >
          <Text style={{ color: "#E5E5E5", fontSize: 12 }}>
            {fixture ? "Reference fixture active" : "Load reference fixture"}
          </Text>
        </Pressable>
        {routes.map((name) => (
          <Pressable
            key={name}
            onPress={() => navigate(name)}
            style={[s.route, route === name && { backgroundColor: "#454A54" }]}
          >
            <Text
              style={{
                color: route === name ? "#FFF0BA" : "#AEB4C0",
                fontSize: 13,
              }}
            >
              {name}
            </Text>
          </Pressable>
        ))}
        <Text style={s.note}>
          Measured colors; inferred fonts and motion.{`\n\n`}Camera, photos,
          speech, local persistence work where supported. AI, segmentation,
          billing and speech assessment are adapters, not live services.
        </Text>
      </View>
      <View>
        <Text style={s.label}>IMPLEMENTATION · INTERACTIVE</Text>
        <View style={s.device} testID="app-stage">
          {children}
        </View>
      </View>
      <View>
        <Text style={s.label}>
          REFERENCE · {reference ? `GUMMBLE ${reference}` : "NOT YET MAPPED"}
        </Text>
        <View style={[s.device, { backgroundColor: "#2B2F36" }]}>
          {reference ? (
            <Image
              source={{ uri: `/references/${reference}.png` }}
              style={{ width: 393, height: 852 }}
              resizeMode="contain"
            />
          ) : (
            <Text style={{ color: "#BBB", padding: 35, lineHeight: 24 }}>
              This state is implemented but does not have a mapped frame in the
              initial 24-image corpus.
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  sidebar: { width: 170, paddingTop: 34 },
  brand: { fontSize: 23, fontWeight: "700", color: "#fff", lineHeight: 27 },
  note: { fontSize: 11, lineHeight: 17, color: "#9098A5", marginVertical: 18 },
  fixture: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#4C5462",
    borderRadius: 10,
    marginBottom: 12,
  },
  route: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  label: {
    color: "#919AA8",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 12,
  },
  device: {
    width: 393,
    height: 852,
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: "#F4F4F4",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 25,
  },
});
