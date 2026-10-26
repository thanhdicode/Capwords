export const reviewGestureCopy = {
  gotItCue: "Got it!",
  needsReview: "← Needs review",
  needsReviewCue: "Needs review",
  swipeHint: "Swipe right for Got it; swipe left for Needs review.",
} as const;

export const reviewPracticeCopy = {
  hint: "Hold to speak → master the word!",
  accessibilityLabel: "Hold to record your pronunciation attempt",
  accessibilityHint:
    "Press and hold to record a temporary attempt; tap for pronunciation playback and manual recall ratings. Recordings stay on this device, are deleted when you leave the word, and are not automatically scored.",
  recordingStatus: "Recording… release to finish",
  preparingStatus: "Waiting for microphone…",
  permissionError:
    "Microphone access is needed to record. You can still listen and rate yourself.",
  recordingError:
    "Recording is unavailable right now. You can still listen and rate yourself.",
  sheetDescription:
    "Listen to the model, say the word, then rate your recall. You can record and replay a temporary attempt; automatic speech assessment is not connected.",
  recordedAttempt:
    "Your attempt stays temporary on this device; it is not uploaded or automatically scored.",
  playAttempt: "Listen to your attempt",
  stopAttempt: "Stop your attempt",
  startRecording: "Start recording",
  stopRecording: "Stop recording",
} as const;
