import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
} from "expo-audio";
import { reviewPracticeCopy } from "../data/reviewCopy";
import { discardReviewVoiceAttempt } from "../services/ephemeralVoiceRecording";

type RecordingPhase =
  "idle" | "preparing" | "recording" | "stopping" | "ready" | "error";

// A prepared web MediaRecorder owns a live input stream even before record().
// Finalize a tiny discarded clip if a hold is cancelled during preparation.
const CANCELLED_PREPARATION_FLUSH_SECONDS = 0.05;

async function restorePlaybackAudioMode(): Promise<void> {
  try {
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });
  } catch {
    // Preserve the practice flow when the platform cannot restore its audio session.
  }
}

export function useReviewVoiceRecording() {
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const player = useAudioPlayer(null);
  const playerStatus = useAudioPlayerStatus(player);
  const [phase, setPhaseState] = useState<RecordingPhase>("idle");
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const phaseRef = useRef<RecordingPhase>("idle");
  const holdActiveRef = useRef(false);
  const recordingActiveRef = useRef(false);
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);
  const attemptUriRef = useRef<string | null>(null);
  const startPromiseRef = useRef<Promise<void> | null>(null);
  const stopPromiseRef = useRef<Promise<void> | null>(null);

  const updatePhase = useCallback((next: RecordingPhase) => {
    phaseRef.current = next;
    if (mountedRef.current) setPhaseState(next);
  }, []);

  const clearAttempt = useCallback(async () => {
    if (stopPromiseRef.current) await stopPromiseRef.current;
    const uri = attemptUriRef.current;
    attemptUriRef.current = null;
    player.pause();
    player.replace(null);
    if (mountedRef.current) setRecordingUri(null);
    discardReviewVoiceAttempt(uri);
  }, [player]);

  const startRecording = useCallback(async () => {
    if (holdActiveRef.current || recordingActiveRef.current) return;
    holdActiveRef.current = true;
    const requestId = ++requestIdRef.current;
    setError(null);
    updatePhase("preparing");

    const operation = (async () => {
      try {
        await clearAttempt();
        const permission = await requestRecordingPermissionsAsync();
        if (requestId !== requestIdRef.current || !holdActiveRef.current)
          return;
        if (!permission.granted) {
          setError(reviewPracticeCopy.permissionError);
          updatePhase("idle");
          return;
        }

        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
        if (requestId !== requestIdRef.current || !holdActiveRef.current) {
          await restorePlaybackAudioMode();
          return;
        }

        await recorder.prepareToRecordAsync();
        if (requestId !== requestIdRef.current || !holdActiveRef.current) {
          try {
            recorder.record({
              forDuration: CANCELLED_PREPARATION_FLUSH_SECONDS,
            });
            await recorder.stop();
            discardReviewVoiceAttempt(recorder.uri);
          } catch {
            // If setup already released the stream, there is nothing left to finalize.
          }
          await restorePlaybackAudioMode();
          return;
        }

        recorder.record();
        recordingActiveRef.current = true;
        updatePhase("recording");
      } catch {
        setError(reviewPracticeCopy.recordingError);
        updatePhase("error");
        await restorePlaybackAudioMode();
      } finally {
        if (
          requestId === requestIdRef.current &&
          phaseRef.current === "preparing"
        ) {
          updatePhase("idle");
        }
      }
    })();

    startPromiseRef.current = operation;
    try {
      await operation;
    } finally {
      if (startPromiseRef.current === operation) startPromiseRef.current = null;
    }
  }, [clearAttempt, recorder, updatePhase]);

  const stopRecording = useCallback(async () => {
    holdActiveRef.current = false;
    if (phaseRef.current === "preparing") {
      requestIdRef.current += 1;
      updatePhase("idle");
      if (startPromiseRef.current) await startPromiseRef.current;
      return;
    }
    if (stopPromiseRef.current) return stopPromiseRef.current;
    if (!recordingActiveRef.current) return;

    recordingActiveRef.current = false;
    updatePhase("stopping");
    const operation = (async () => {
      try {
        await recorder.stop();
        const uri = recorder.uri;
        if (uri && mountedRef.current) {
          attemptUriRef.current = uri;
          player.replace(uri);
          setRecordingUri(uri);
          updatePhase("ready");
        } else {
          discardReviewVoiceAttempt(uri);
          updatePhase("idle");
        }
      } catch {
        setError(reviewPracticeCopy.recordingError);
        updatePhase("error");
      } finally {
        await restorePlaybackAudioMode();
      }
    })();

    stopPromiseRef.current = operation;
    try {
      await operation;
    } finally {
      if (stopPromiseRef.current === operation) stopPromiseRef.current = null;
    }
  }, [player, recorder, updatePhase]);

  const clear = useCallback(async () => {
    holdActiveRef.current = false;
    if (phaseRef.current === "preparing") {
      requestIdRef.current += 1;
      updatePhase("idle");
      if (startPromiseRef.current) await startPromiseRef.current;
    } else if (recordingActiveRef.current) {
      await stopRecording();
    }
    if (stopPromiseRef.current) await stopPromiseRef.current;
    await clearAttempt();
    setError(null);
    updatePhase("idle");
  }, [clearAttempt, stopRecording, updatePhase]);

  const togglePlayback = useCallback(async () => {
    if (!attemptUriRef.current) return;
    setError(null);
    if (player.playing) {
      player.pause();
      return;
    }
    if (Platform.OS === "web") {
      void player.seekTo(0).catch(() => {
        setError(reviewPracticeCopy.recordingError);
      });
      player.play();
      return;
    }
    try {
      await restorePlaybackAudioMode();
      await player.seekTo(0);
      player.play();
    } catch {
      setError(reviewPracticeCopy.recordingError);
    }
  }, [player]);

  useEffect(() => {
    mountedRef.current = true;
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background") void stopRecording();
    });
    return () => {
      mountedRef.current = false;
      holdActiveRef.current = false;
      requestIdRef.current += 1;
      subscription.remove();
      player.pause();
      const uri = attemptUriRef.current;
      attemptUriRef.current = null;
      if (recordingActiveRef.current) {
        recordingActiveRef.current = false;
        void recorder
          .stop()
          .then(() => discardReviewVoiceAttempt(recorder.uri))
          .catch(() => undefined)
          .finally(() => void restorePlaybackAudioMode());
      } else {
        discardReviewVoiceAttempt(uri);
        void restorePlaybackAudioMode();
      }
    };
  }, [player, recorder, stopRecording]);

  return {
    isPreparing: phase === "preparing",
    isRecording: phase === "recording",
    isPlaying: playerStatus.playing,
    recordingUri,
    error,
    startRecording,
    stopRecording,
    togglePlayback,
    clear,
  };
}
