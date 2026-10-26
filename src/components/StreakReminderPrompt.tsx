import { Image, StyleSheet, View } from "react-native";
import { PillButton, Serif } from "./UI";
import { streakReference } from "../data/streakReference";
import { streakDesign } from "../theme/tokens";

const design = streakDesign.source057.prompt;

export function StreakReminderPrompt({
  streakDays,
  buttonLabel,
  onStartReview,
}: {
  streakDays: number;
  buttonLabel: string;
  onStartReview: () => void;
}) {
  const description = streakDays
    ? streakReference.source057.reminderDescription.replace(
        "{days}",
        String(streakDays),
      )
    : streakReference.source057.firstReviewDescription;

  return (
    <View style={styles.container} testID="streak-reminder-prompt">
      <Image
        accessible={false}
        source={require("../../assets/stickers/streak-sign-mascot-057.png")}
        resizeMode="contain"
        style={styles.artwork}
        testID="streak-reminder-artwork-057"
      />
      <Serif style={styles.title}>
        {streakReference.source057.reminderTitle}
      </Serif>
      <Serif style={styles.description}>{description}</Serif>
      <PillButton style={styles.button} onPress={onStartReview}>
        {buttonLabel}
      </PillButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: design.marginTop,
  },
  artwork: {
    width: design.artworkWidth,
    height: design.artworkHeight,
  },
  title: {
    color: design.titleColor,
    fontSize: design.titleFontSize,
    lineHeight: design.titleLineHeight,
    marginTop: design.titleMarginTop,
    textAlign: "center",
  },
  description: {
    color: design.descriptionColor,
    fontSize: design.descriptionFontSize,
    lineHeight: design.descriptionLineHeight,
    marginTop: design.descriptionMarginTop,
    textAlign: "center",
  },
  button: {
    alignSelf: "center",
    width: design.buttonWidth,
    marginTop: design.buttonMarginTop,
    height: design.buttonHeight,
  },
});
