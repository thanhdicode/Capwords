import { DEMO_VOCABULARY } from "../data/demoVocabulary";
import {
  buildRecognitionRequestPayload,
  normalizeRecognitionResponse,
  validateRecognitionEndpoint,
  type RecognitionPayloadContext,
} from "../domain/recognitionPayload";
import { NewWord } from "../domain/types";
import type { ForegroundRemovalResult } from "../domain/foregroundRemoval";
import { vocabularyImageUriForCapture } from "./captureImage";

export interface CaptureAsset {
  uri: string;
  base64?: string;
  mimeType?: string;
  capturedAt?: number;
  foregroundRemoval?: ForegroundRemovalResult;
  videoFrame?: true;
}
export interface RecognitionResult {
  word: NewWord;
  mode: "provider" | "manual" | "fixture";
}

/** Local-only fallback: no photo or label is sent to a provider. */
export function manualRecognition(asset: CaptureAsset): RecognitionResult {
  return {
    mode: "manual",
    word: {
      native: "Your object",
      target: "New word",
      phonetic: "",
      example: "",
      exampleTranslation: "",
      emoji: "📸",
      imageUri: vocabularyImageUriForCapture(asset),
      color: "#D8D3CA",
      category: "Captured",
      favorite: false,
    },
  };
}

/** Configure an HTTPS service; never put a provider API key in EXPO_PUBLIC_* variables. */
export async function recognize(
  asset: CaptureAsset,
  learningLanguage: string,
  fixture = false,
  requestSignal?: AbortSignal,
  context?: RecognitionPayloadContext,
): Promise<RecognitionResult> {
  if (fixture) return { word: { ...DEMO_VOCABULARY[1] }, mode: "fixture" };
  const endpoint = process.env.EXPO_PUBLIC_RECOGNITION_ENDPOINT;
  if (!endpoint) return manualRecognition(asset);
  const validatedEndpoint = validateRecognitionEndpoint(endpoint);
  if (!asset.base64)
    throw new Error(
      "The image could not be prepared. Please choose or capture it again.",
    );
  const controller = new AbortController();
  const forwardAbort = () => controller.abort();
  if (requestSignal?.aborted) controller.abort();
  else requestSignal?.addEventListener("abort", forwardAbort, { once: true });
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (context?.accessToken)
      headers.Authorization = `Bearer ${context.accessToken}`;
    const response = await fetch(validatedEndpoint, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify(
        buildRecognitionRequestPayload(
          asset.base64,
          asset.mimeType,
          learningLanguage,
          context,
        ),
      ),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Recognition authorization failed. Please check your sign-in or access token.",
        );
      }
      if (response.status === 413) {
        throw new Error("The image is too large for the recognition service.");
      }
      if (response.status === 429) {
        throw new Error(
          "Recognition quota is temporarily exhausted. Please try again later.",
        );
      }
      throw new Error(
        `Recognition service returned status ${response.status}.`,
      );
    }
    const data: unknown = await response.json();
    return {
      mode: "provider",
      word: normalizeRecognitionResponse(
        data,
        vocabularyImageUriForCapture(asset),
      ),
    };
  } catch (error) {
    if (requestSignal?.aborted) throw error;
    if (controller.signal.aborted) {
      throw new Error("Recognition service timed out after 25 seconds.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    requestSignal?.removeEventListener("abort", forwardAbort);
  }
}
