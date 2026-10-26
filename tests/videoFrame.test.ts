import assert from "node:assert/strict";
import { test } from "node:test";
import {
  extractVideoFrame,
  type VideoFramePlayer,
} from "../src/domain/videoFrame";

type Frame = { released: boolean; release: () => void };

function fakePlayer(initialStatus = "loading", duration = 2) {
  let listener:
    | ((event: { status: string; error?: { message?: string } }) => void)
    | undefined;
  const calls: { times: number | number[]; options?: unknown }[] = [];
  const frame: Frame = {
    released: false,
    release() {
      this.released = true;
    },
  };
  const player: VideoFramePlayer<Frame> & { released: boolean } = {
    status: initialStatus,
    duration,
    released: false,
    addListener(eventName, callback) {
      assert.equal(eventName, "statusChange");
      listener = callback;
      return { remove: () => (listener = undefined) };
    },
    async generateThumbnailsAsync(times, options) {
      calls.push({ times, options });
      return [frame];
    },
    release() {
      this.released = true;
    },
  };
  return {
    player,
    frame,
    calls,
    notify(event: { status: string; error?: { message?: string } }) {
      listener?.(event);
    },
  };
}

test("extracts one central still after readiness and releases player and thumbnail", async () => {
  const fake = fakePlayer("loading", 2);
  let encodedFrame: Frame | undefined;
  const pending = extractVideoFrame("file:///clip.mp4", {
    createPlayer(uri) {
      assert.equal(uri, "file:///clip.mp4");
      return fake.player;
    },
    async encodeFrame(frame) {
      encodedFrame = frame;
      return { uri: "file:///frame.jpg", base64: "aGVsbG8=" };
    },
  });

  fake.notify({ status: "readyToPlay" });
  const asset = await pending;
  assert.deepEqual(fake.calls, [
    { times: [0.5], options: { maxWidth: 1280, maxHeight: 1280 } },
  ]);
  assert.equal(encodedFrame, fake.frame);
  assert.deepEqual(asset, {
    uri: "file:///frame.jpg",
    base64: "aGVsbG8=",
    mimeType: "image/jpeg",
    videoFrame: true,
  });
  assert.equal(fake.frame.released, true);
  assert.equal(fake.player.released, true);
});

test("fails closed on player errors and releases the player", async () => {
  const fake = fakePlayer("error");
  await assert.rejects(
    extractVideoFrame("file:///broken.mp4", {
      createPlayer: () => fake.player,
      async encodeFrame() {
        throw new Error("must not encode");
      },
    }),
    /could not be opened/i,
  );
  assert.equal(fake.player.released, true);
  assert.equal(fake.calls.length, 0);
});

test("does not return an unusable still when JPEG base64 is absent", async () => {
  const fake = fakePlayer("readyToPlay", 0.4);
  await assert.rejects(
    extractVideoFrame("file:///clip.mp4", {
      createPlayer: () => fake.player,
      async encodeFrame() {
        return { uri: "file:///frame.jpg" };
      },
    }),
    /could not be prepared/i,
  );
  assert.deepEqual(fake.calls[0]?.times, [0.2]);
  assert.equal(fake.frame.released, true);
  assert.equal(fake.player.released, true);
});
