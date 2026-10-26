import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  captureDateLabel,
  captureTimestampFromPhotoMetadata,
} from "../src/domain/captureDate";

describe("capture photo dates", () => {
  it("prefers EXIF DateTimeOriginal over file modification time", () => {
    const expected = new Date(2025, 8, 12, 10, 21, 3).getTime();
    assert.equal(
      captureTimestampFromPhotoMetadata(
        { DateTimeOriginal: "2025:09:12 10:21:03" },
        Date.UTC(2025, 8, 11, 12),
        0,
      ),
      expected,
    );
  });

  it("falls back to the browser file modification time when EXIF is absent", () => {
    const fileTime = Date.UTC(2025, 8, 12, 12);
    assert.equal(
      captureTimestampFromPhotoMetadata(null, fileTime, 0),
      fileTime,
    );
  });

  it("ignores an invalid EXIF date and uses the next reliable source", () => {
    const fileTime = Date.UTC(2025, 8, 12, 12);
    assert.equal(
      captureTimestampFromPhotoMetadata(
        { DateTimeOriginal: "2025:02:30 10:21:03" },
        fileTime,
        0,
      ),
      fileTime,
    );
  });

  it("formats a photo date as the captured month and day", () => {
    const captureTime = new Date(2025, 8, 11, 12).getTime();
    assert.equal(captureDateLabel(captureTime), "Sep 11");
  });
});
