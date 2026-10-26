import { NativeModule, requireOptionalNativeModule } from "expo";
import type { NativeForegroundRemovalResult } from "./CapWordsForegroundRemoval.types";

declare class CapWordsForegroundRemovalModule extends NativeModule {
  removeForeground(uri: string): Promise<NativeForegroundRemovalResult>;
}

export default requireOptionalNativeModule<CapWordsForegroundRemovalModule>(
  "CapWordsForegroundRemoval",
);
