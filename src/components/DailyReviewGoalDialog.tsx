import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Body, PillButton, Sheet } from "./UI";
import { dailyReviewGoalCopy } from "../data/reviewGoalReference";
import { colors, reviewGoalDialogDesign as design } from "../theme/tokens";
import {
  DAILY_REVIEW_GOALS,
  DailyReviewGoal,
  isDailyReviewGoal,
} from "../domain/reviewGoal";

/** Shared visual and interaction contract for captured goal-sheet states 022/043. */
export function DailyReviewGoalDialog({
  initialGoal,
  remainingCount,
  onSave,
  onCancel,
}: {
  initialGoal: number;
  remainingCount: number;
  onSave: (goal: DailyReviewGoal) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<DailyReviewGoal | undefined>(() =>
    isDailyReviewGoal(initialGoal) ? initialGoal : undefined,
  );
  const save = () => {
    if (draft !== undefined) onSave(draft);
  };

  return (
    <Sheet
      visible
      centered
      onClose={onCancel}
      contentStyle={s.dialog}
      containerStyle={s.container}
    >
      <View
        testID="daily-review-goal"
        style={s.content}
        accessibilityViewIsModal
      >
        <Body style={s.title}>{dailyReviewGoalCopy.title}</Body>
        <Body style={s.caption}>
          {dailyReviewGoalCopy.remainingLead}{" "}
          <Body style={[s.caption, s.count]}>{remainingCount}</Body>{" "}
          {remainingCount === 1
            ? dailyReviewGoalCopy.singularWord
            : dailyReviewGoalCopy.pluralWord}{" "}
          {dailyReviewGoalCopy.remainingTail}
        </Body>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={dailyReviewGoalCopy.title}
          style={s.grid}
        >
          {DAILY_REVIEW_GOALS.map((goal) => {
            const selected = draft === goal;
            return (
              <Pressable
                key={goal}
                accessibilityRole="radio"
                accessibilityLabel={`${goal} words`}
                accessibilityState={{ checked: selected }}
                aria-checked={selected}
                onPress={() => setDraft(goal)}
                style={({ pressed }) => [
                  s.choice,
                  {
                    backgroundColor: selected
                      ? colors.goalAccent
                      : colors.goalOption,
                    opacity: pressed
                      ? design.pressedOpacity
                      : design.idleOpacity,
                  },
                ]}
              >
                <Body style={[s.choiceText, selected && s.selectedText]}>
                  {goal}
                </Body>
              </Pressable>
            );
          })}
        </View>
        <PillButton
          disabled={draft === undefined}
          onPress={save}
          style={s.done}
          textStyle={s.doneText}
        >
          {dailyReviewGoalCopy.done}
        </PillButton>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={dailyReviewGoalCopy.cancelAccessibilityLabel}
          onPress={onCancel}
          style={s.cancel}
        >
          <Body style={s.cancelText}>{dailyReviewGoalCopy.cancel}</Body>
        </Pressable>
      </View>
    </Sheet>
  );
}

const s = StyleSheet.create({
  // Source 022/043 dialog bounds: x=59..334, y=234.33..617.67 at 393×852 pt.
  container: { backgroundColor: design.overlay },
  dialog: {
    width: design.dialog.width,
    maxWidth: design.dialog.maxWidth,
    padding: 0,
    borderRadius: design.dialog.borderRadius,
    backgroundColor: colors.white,
  },
  content: {
    paddingHorizontal: design.content.paddingHorizontal,
    paddingTop: design.content.paddingTop,
    paddingBottom: design.content.paddingBottom,
  },
  title: { ...design.title, color: colors.black },
  caption: { ...design.caption, color: colors.goalMuted },
  count: { ...design.count, color: colors.goalAccent },
  grid: design.grid,
  choice: design.choice,
  choiceText: { ...design.choiceText, color: colors.goalOptionText },
  selectedText: { ...design.selectedText, color: colors.white },
  done: { ...design.done, backgroundColor: colors.goalAction },
  doneText: { ...design.doneText, color: colors.goalActionText },
  cancel: design.cancel,
  cancelText: { ...design.cancelText, color: colors.goalMuted },
});
