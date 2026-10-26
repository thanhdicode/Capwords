import test from "node:test";
import assert from "node:assert/strict";
import {
  videoCapturePolicy,
  videoCaptureProgress,
} from "../src/domain/videoCapturePolicy";

test("video recording progress starts at zero and clamps negative elapsed time", () => {
  assert.equal(videoCaptureProgress(0), 0);
  assert.equal(videoCaptureProgress(-300), 0);
});

test("video recording progress follows elapsed time over the maximum duration", () => {
  assert.equal(
    videoCaptureProgress(
      (videoCapturePolicy.maximumDurationSeconds * 1000) / 2,
    ),
    0.5,
  );
});

test("video recording progress caps at completion and handles non-finite input", () => {
  assert.equal(
    videoCaptureProgress(videoCapturePolicy.maximumDurationSeconds * 1000),
    1,
  );
  assert.equal(videoCaptureProgress(90000), 1);
  assert.equal(videoCaptureProgress(Number.POSITIVE_INFINITY), 1);
  assert.equal(videoCaptureProgress(Number.NaN), 0);
});
