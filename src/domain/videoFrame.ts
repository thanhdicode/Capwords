import type { CaptureAsset } from "../services/recognition";

export interface VideoThumbnailRef {
  release: () => void;
}

export interface VideoFramePlayer<TThumbnail extends VideoThumbnailRef> {
  readonly status: string;
  readonly duration: number;
  addListener: (
    eventName: "statusChange",
    listener: (event: { status: string; error?: { message?: string } }) => void,
  ) => { remove: () => void };
  generateThumbnailsAsync: (
    times: number | number[],
    options?: { maxWidth?: number; maxHeight?: number },
  ) => Promise<TThumbnail[]>;
  release: () => void;
}

export interface VideoFramePorts<TThumbnail extends VideoThumbnailRef> {
  createPlayer: (uri: string) => VideoFramePlayer<TThumbnail>;
  encodeFrame: (
    thumbnail: TThumbnail,
  ) => Promise<{ uri: string; base64?: string }>;
  timeoutMs?: number;
}

function readinessError(message?: string) {
  return new Error(message || "The recorded video could not be opened.");
}

function waitUntilReady<TThumbnail extends VideoThumbnailRef>(
  player: VideoFramePlayer<TThumbnail>,
  timeoutMs: number,
): Promise<void> {
  if (player.status === "readyToPlay") return Promise.resolve();
  if (player.status === "error") return Promise.reject(readinessError());

  return new Promise((resolve, reject) => {
    let subscription: { remove: () => void } | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      subscription?.remove();
      if (error) reject(error);
      else resolve();
    };

    timeout = setTimeout(
      () => finish(new Error("The recorded video took too long to load.")),
      timeoutMs,
    );
    subscription = player.addListener("statusChange", (event) => {
      if (event.status === "readyToPlay") finish();
      else if (event.status === "error")
        finish(readinessError(event.error?.message));
    });
    if (settled) subscription.remove();
    else if (player.status === "readyToPlay") finish();
    else if (player.status === "error") finish(readinessError());
  });
}

/** Extract one central still frame; this does not analyze video motion. */
export async function extractVideoFrame<TThumbnail extends VideoThumbnailRef>(
  videoUri: string,
  ports: VideoFramePorts<TThumbnail>,
): Promise<CaptureAsset> {
  const player = ports.createPlayer(videoUri);
  try {
    await waitUntilReady(player, ports.timeoutMs ?? 12_000);
    const sampleTime =
      Number.isFinite(player.duration) && player.duration > 0
        ? Math.min(0.5, player.duration / 2)
        : 0;
    const [thumbnail] = await player.generateThumbnailsAsync([sampleTime], {
      maxWidth: 1280,
      maxHeight: 1280,
    });
    if (!thumbnail)
      throw new Error("No still frame could be extracted from the video.");

    try {
      const encoded = await ports.encodeFrame(thumbnail);
      if (!encoded.uri || !encoded.base64) {
        throw new Error(
          "The extracted video frame could not be prepared for recognition.",
        );
      }
      return {
        uri: encoded.uri,
        base64: encoded.base64,
        mimeType: "image/jpeg",
        videoFrame: true,
      };
    } finally {
      thumbnail.release();
    }
  } finally {
    player.release();
  }
}
