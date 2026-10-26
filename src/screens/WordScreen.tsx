import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import * as Speech from "expo-speech";
import { useApp } from "../state/AppContext";
import { Navigate } from "../navigation/types";
import {
  Body,
  CircleButton,
  Icon,
  PillButton,
  Rounded,
  Screen,
  Serif,
  Sheet,
  TopBar,
} from "../components/UI";
import { Sticker } from "../components/Sticker";
import { colors } from "../theme/tokens";
import { Word } from "../domain/types";
import type { ImageExportAction } from "../domain/imageExport";
import { canExportWordImage, exportWordImage } from "../services/imageExport";

export function WordDetailScreen({
  navigate,
  wordId,
  examples = false,
  onImageExport,
}: {
  navigate: Navigate;
  wordId?: string;
  examples?: boolean;
  onImageExport?: (word: Word, action: ImageExportAction) => Promise<string>;
}) {
  const { state, editWord, toggleFavorite, deleteWord } = useApp();
  const word = state.words.find((w) => w.id === wordId) || state.words[0];
  const [edit, setEdit] = useState(false),
    [menu, setMenu] = useState(false),
    [text, setText] = useState("");
  const [exporting, setExporting] = useState<ImageExportAction | null>(null);
  const [exportFeedback, setExportFeedback] = useState("");
  if (!word)
    return (
      <Screen>
        <TopBar onBack={() => navigate("home")} />
        <Body style={{ textAlign: "center", marginTop: 100 }}>
          Your next word is waiting outside.
        </Body>
        <PillButton style={{ margin: 30 }} onPress={() => navigate("camera")}>
          Capture a word
        </PillButton>
      </Screen>
    );
  const speak = (value = word.target) => {
    Speech.stop();
    Speech.speak(value, {
      language: state.learningLanguage || "fr",
      ...(state.preferredSpeechVoiceId
        ? { voice: state.preferredSpeechVoiceId }
        : {}),
      rate: 0.83,
    });
  };
  const exportImage = onImageExport ?? exportWordImage;
  const runExport = async (action: ImageExportAction) => {
    setExporting(action);
    setExportFeedback("");
    try {
      const message = await exportImage(word, action);
      if (action !== "share" || onImageExport) setExportFeedback(message);
      setMenu(false);
    } catch (error) {
      setExportFeedback(
        error instanceof Error
          ? error.message
          : "The image could not be exported. Please try again.",
      );
      setMenu(false);
    } finally {
      setExporting(null);
    }
  };
  const openEdit = () => {
    setText(word.target);
    setMenu(false);
    setEdit(true);
  };
  return (
    <Screen>
      <TopBar
        onBack={() => navigate("collection")}
        right={
          <Pressable
            accessibilityLabel="Word actions"
            onPress={() => setMenu(true)}
            style={{ padding: 10 }}
          >
            <Icon name="ellipsis-horizontal" color={colors.muted} size={21} />
          </Pressable>
        }
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 23,
          alignSelf: "center",
          alignItems: "center",
        }}
      >
        <Serif style={{ fontSize: 28, lineHeight: 34, color: "#000" }}>
          Sep 11
        </Serif>
        <Body style={{ fontSize: 14, lineHeight: 18, color: "#666" }}>
          {state.words.length} Words
        </Body>
      </View>
      <View style={s.thumbs}>
        {state.words.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => navigate("detail", item.id)}
            style={{ opacity: word.id === item.id ? 1 : 0.5 }}
          >
            <Sticker word={item} size={42} />
          </Pressable>
        ))}
      </View>
      {examples ? (
        <View style={s.examples}>
          <Rounded style={{ fontSize: 30, marginBottom: 25 }}>
            {word.target}
          </Rounded>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Pressable
              onPress={() =>
                speak(
                  `Le ${word.target.toLowerCase()} est un symbole d'espoir.`,
                )
              }
              style={{ opacity: 0.22, marginBottom: 28 }}
            >
              <Body style={s.exampleText}>
                Le {word.target.toLowerCase()} est un symbole d&apos;espoir.
              </Body>
              <Body style={s.exampleText}>
                The {word.native.toLowerCase()} is a symbol of hope.
              </Body>
            </Pressable>
            <Pressable onPress={() => speak(word.example)}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Body
                    style={[
                      s.exampleText,
                      { color: colors.ink, fontWeight: "700" },
                    ]}
                  >
                    {word.example}
                  </Body>
                  <Body
                    style={[
                      s.exampleText,
                      { color: colors.ink, fontWeight: "600", marginTop: 4 },
                    ]}
                  >
                    {word.exampleTranslation}
                  </Body>
                </View>
                <Icon name="volume-high" color="#CF8A3C" size={26} />
              </View>
            </Pressable>
            <View style={{ opacity: 0.22, marginTop: 30 }}>
              <Body style={s.exampleText}>
                Le champ de tournesol était magnifique au coucher du soleil.
              </Body>
              <Body style={s.exampleText}>
                The sunflower field looked amazing at sunset.
              </Body>
            </View>
          </ScrollView>
          <CircleButton
            label="Close examples"
            icon="close"
            onPress={() => navigate("detail", word.id)}
            style={{ alignSelf: "center", marginTop: 12 }}
          />
        </View>
      ) : (
        <>
          <View style={s.hero}>
            <Sticker word={word} size={220} />
            <Rounded style={s.word}>{word.target}</Rounded>
            <Body style={s.native}>{word.native}</Body>
            <Pressable
              accessibilityLabel="Listen to pronunciation"
              onPress={() => speak()}
              style={s.pronunciation}
            >
              <Body style={{ fontSize: 21 }}>{word.phonetic}</Body>
              <Icon name="volume-high" size={23} color={colors.muted} />
            </Pressable>
          </View>
          <PillButton
            secondary
            icon="bulb"
            style={s.exampleButton}
            textStyle={{ fontSize: 20, fontWeight: "600" }}
            onPress={() => navigate("examples", word.id)}
          >
            View examples
          </PillButton>
        </>
      )}
      <Sheet visible={menu} onClose={() => setMenu(false)}>
        <Rounded
          style={{ fontSize: 25, textAlign: "center", marginBottom: 20 }}
        >
          {word.target}
        </Rounded>
        {canExportWordImage(word) ? (
          <>
            {Platform.OS !== "web" && (
              <PillButton
                secondary
                icon="share-outline"
                disabled={!!exporting}
                onPress={() => void runExport("share")}
              >
                {exporting === "share" ? "Preparing share…" : "Share image"}
              </PillButton>
            )}
            {Platform.OS === "web" ? (
              <PillButton
                secondary
                icon="download-outline"
                disabled={!!exporting}
                onPress={() => void runExport("download")}
              >
                {exporting === "download"
                  ? "Preparing download…"
                  : "Download image"}
              </PillButton>
            ) : (
              <PillButton
                secondary
                icon="download-outline"
                disabled={!!exporting}
                onPress={() => void runExport("save")}
              >
                {exporting === "save" ? "Saving…" : "Save image to Photos"}
              </PillButton>
            )}
            <View style={{ height: 10 }} />
          </>
        ) : (
          <Body style={{ textAlign: "center", marginBottom: 14 }}>
            This word has no saved image to export.
          </Body>
        )}
        <PillButton secondary icon="create-outline" onPress={openEdit}>
          Edit word
        </PillButton>
        <View style={{ height: 10 }} />
        <PillButton
          secondary
          icon={word.favorite ? "heart" : "heart-outline"}
          onPress={() => {
            toggleFavorite(word.id);
            setMenu(false);
          }}
        >
          {word.favorite ? "Remove favorite" : "Add favorite"}
        </PillButton>
        <View style={{ height: 10 }} />
        <PillButton
          secondary
          icon="trash-outline"
          onPress={() => {
            deleteWord(word.id);
            setMenu(false);
            navigate("collection");
          }}
        >
          Delete word
        </PillButton>
      </Sheet>
      <Sheet visible={edit} onClose={() => setEdit(false)} centered>
        <Body
          style={{
            textAlign: "center",
            color: "#000",
            fontSize: 15,
            fontWeight: "700",
          }}
        >
          Enter target object name
        </Body>
        <TextInput
          accessibilityLabel="Target object name"
          value={text}
          onChangeText={setText}
          style={s.input}
          autoFocus
        />
        <PillButton
          disabled={!text.trim()}
          style={{ minHeight: 42 }}
          textStyle={{ fontSize: 14 }}
          onPress={() => {
            editWord(word.id, { target: text.trim() });
            setEdit(false);
          }}
        >
          Save
        </PillButton>
        <Pressable
          onPress={() => setEdit(false)}
          style={{ padding: 17, alignItems: "center" }}
        >
          <Body style={{ fontSize: 14, color: "#333" }}>Cancel</Body>
        </Pressable>
      </Sheet>
      <Sheet
        visible={!!exportFeedback}
        onClose={() => setExportFeedback("")}
        centered
      >
        <Body style={{ textAlign: "center", marginBottom: 18 }}>
          {exportFeedback}
        </Body>
        <PillButton onPress={() => setExportFeedback("")}>Done</PillButton>
      </Sheet>
    </Screen>
  );
}
const s = StyleSheet.create({
  thumbs: {
    flexDirection: "row",
    gap: 31,
    paddingHorizontal: 24,
    marginTop: 28,
    height: 48,
  },
  hero: { alignItems: "center", marginTop: 55 },
  word: { fontSize: 38, lineHeight: 48, marginTop: 16, textAlign: "center" },
  native: { fontSize: 21, marginTop: 5, lineHeight: 28 },
  pronunciation: {
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    marginTop: 9,
  },
  exampleButton: {
    position: "absolute",
    bottom: 34,
    width: 253,
    height: 64,
    alignSelf: "center",
  },
  examples: {
    flex: 1,
    paddingHorizontal: 27,
    paddingTop: 50,
    paddingBottom: 60,
  },
  exampleText: { fontSize: 19, lineHeight: 24 },
  input: {
    height: 66,
    fontSize: 23,
    color: colors.ink,
    textAlign: "center",
    marginVertical: 12,
  },
});
