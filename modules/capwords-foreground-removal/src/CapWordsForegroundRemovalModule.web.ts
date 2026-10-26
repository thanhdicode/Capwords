import { NativeModule, registerWebModule } from "expo";
import type { NativeForegroundRemovalResult } from "./CapWordsForegroundRemoval.types";

class CapWordsForegroundRemovalModule extends NativeModule {
  async removeForeground(_uri: string): Promise<NativeForegroundRemovalResult> {
    return { status: "unsupported", reason: "platform" };
  }
}

export default registerWebModule(
  CapWordsForegroundRemovalModule,
  "CapWordsForegroundRemoval",
);
