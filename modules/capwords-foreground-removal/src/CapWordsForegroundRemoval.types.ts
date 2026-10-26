export type NativeForegroundRemovalResult =
  | {
      status: "processed";
      uri: string;
      mimeType: "image/png";
      width: number;
      height: number;
    }
  | {
      status: "unsupported";
      reason: "platform" | "ios-version" | "unsupported-source";
    }
  | { status: "no-foreground" }
  | {
      status: "failed";
      reason: "unsupported-source" | "processing-error";
    };
