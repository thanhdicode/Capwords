import { useCallback, useEffect, useRef, useState } from "react";
import * as Speech from "expo-speech";

export function usePronunciation(
  text: string,
  language: string,
  preferredVoiceId?: string | null,
) {
  const request = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => () => {
      request.current += 1;
      void Speech.stop().catch(() => undefined);
    },
    [text, language, preferredVoiceId],
  );

  const stop = useCallback(() => {
    request.current += 1;
    setPlaying(false);
    setError(null);
    void Speech.stop().catch(() => undefined);
  }, []);

  const play = useCallback(async () => {
    const current = ++request.current;
    setError(null);
    setPlaying(true);
    const complete = () => {
      if (request.current === current) setPlaying(false);
    };
    const failed = () => {
      if (request.current !== current) return;
      setPlaying(false);
      setError("Pronunciation playback unavailable. Try again.");
    };
    try {
      // speak queues utterances: wait for stop, then verify this is still latest.
      await Speech.stop();
      if (request.current !== current) return;
      Speech.speak(text, {
        language,
        ...(preferredVoiceId ? { voice: preferredVoiceId } : {}),
        rate: 0.8,
        onDone: complete,
        onStopped: complete,
        onError: failed,
      });
    } catch {
      failed();
    }
  }, [text, language, preferredVoiceId]);

  return { play, stop, playing, error };
}
