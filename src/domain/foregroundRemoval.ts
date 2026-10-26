export interface ProcessedForegroundImage {
  uri: string;
  mimeType: "image/png";
  width: number;
  height: number;
}

export type ForegroundRemovalUnsupportedReason =
  "platform" | "module-unavailable" | "ios-version" | "unsupported-source";

export type ForegroundRemovalResult =
  | {
      status: "processed";
      sourceUri: string;
      image: ProcessedForegroundImage;
    }
  | {
      status: "unsupported";
      sourceUri: string;
      reason: ForegroundRemovalUnsupportedReason;
    }
  | { status: "no-foreground"; sourceUri: string }
  | {
      status: "failed";
      sourceUri: string;
      reason: "unsupported-source" | "native-error";
    };

export function processedForegroundForSource(
  sourceUri: string,
  result?: ForegroundRemovalResult,
): ProcessedForegroundImage | undefined {
  return result?.status === "processed" && result.sourceUri === sourceUri
    ? result.image
    : undefined;
}
