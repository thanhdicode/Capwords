import type { CaptureAsset } from "./recognition";
import { processedForegroundForSource } from "../domain/foregroundRemoval";

/** Browser blob URLs die with their document; serialize their existing bytes.
 * Native file URIs are moved to document storage by persistentImage on Save.
 */
export function imageUriForCapture(asset: CaptureAsset): string {
  if (!asset.uri.startsWith("blob:")) return asset.uri;
  if (!asset.base64) {
    throw new Error(
      "This temporary photo could not be prepared for saving. Crop or choose the photo again.",
    );
  }
  return `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`;
}

export function vocabularyImageUriForCapture(asset: CaptureAsset): string {
  return (
    processedForegroundForSource(asset.uri, asset.foregroundRemoval)?.uri ??
    imageUriForCapture(asset)
  );
}
