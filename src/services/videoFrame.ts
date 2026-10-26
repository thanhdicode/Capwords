import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { createVideoPlayer, type VideoThumbnail } from "expo-video";
import { extractVideoFrame, type VideoFramePorts } from "../domain/videoFrame";

const ports: VideoFramePorts<VideoThumbnail> = {
  createPlayer: (uri) => createVideoPlayer(uri),
  encodeFrame: async (thumbnail) => {
    const rendered = await ImageManipulator.manipulate(thumbnail).renderAsync();
    try {
      const saved = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.85,
        base64: true,
      });
      return { uri: saved.uri, base64: saved.base64 };
    } finally {
      rendered.release();
    }
  },
};

export function createVideoRecognitionFrame(videoUri: string) {
  return extractVideoFrame(videoUri, ports);
}
