import { Platform } from "react-native";
import CapWordsForegroundRemoval from "../../modules/capwords-foreground-removal";
import type { ForegroundRemovalResult } from "../domain/foregroundRemoval";
import type { CaptureAsset } from "./recognition";

export async function prepareForegroundRemoval(
  asset: CaptureAsset,
): Promise<CaptureAsset> {
  if (asset.foregroundRemoval?.sourceUri === asset.uri) return asset;

  if (Platform.OS !== "ios") {
    return {
      ...asset,
      foregroundRemoval: {
        status: "unsupported",
        sourceUri: asset.uri,
        reason: "platform",
      },
    };
  }

  if (!CapWordsForegroundRemoval) {
    return {
      ...asset,
      foregroundRemoval: {
        status: "unsupported",
        sourceUri: asset.uri,
        reason: "module-unavailable",
      },
    };
  }

  let result: ForegroundRemovalResult;
  try {
    const nativeResult = await CapWordsForegroundRemoval.removeForeground(
      asset.uri,
    );
    switch (nativeResult.status) {
      case "processed":
        result = {
          status: "processed",
          sourceUri: asset.uri,
          image: {
            uri: nativeResult.uri,
            mimeType: nativeResult.mimeType,
            width: nativeResult.width,
            height: nativeResult.height,
          },
        };
        break;
      case "unsupported":
        result = {
          status: "unsupported",
          sourceUri: asset.uri,
          reason: nativeResult.reason,
        };
        break;
      case "no-foreground":
        result = { status: "no-foreground", sourceUri: asset.uri };
        break;
      case "failed":
        result = {
          status: "failed",
          sourceUri: asset.uri,
          reason:
            nativeResult.reason === "unsupported-source"
              ? "unsupported-source"
              : "native-error",
        };
        break;
    }
  } catch {
    result = {
      status: "failed",
      sourceUri: asset.uri,
      reason: "native-error",
    };
  }

  return { ...asset, foregroundRemoval: result };
}
