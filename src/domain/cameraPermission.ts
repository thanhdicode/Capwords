export type CameraPermissionSnapshot =
  | {
      granted: boolean;
      canAskAgain: boolean;
    }
  | null
  | undefined;

export type CameraPermissionAction =
  "granted" | "request" | "settings" | "browser-settings";

export function cameraPermissionAction(
  permission: CameraPermissionSnapshot,
  web: boolean,
): CameraPermissionAction {
  if (permission?.granted) return "granted";
  if (web && permission && !permission.canAskAgain) return "browser-settings";
  if (!web && permission && !permission.canAskAgain) return "settings";
  return "request";
}
