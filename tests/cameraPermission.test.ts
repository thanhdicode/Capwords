import test from "node:test";
import assert from "node:assert/strict";
import { cameraPermissionAction } from "../src/domain/cameraPermission";

test("unknown and retryable native camera access offers a permission request", () => {
  assert.equal(cameraPermissionAction(null, false), "request");
  assert.equal(
    cameraPermissionAction({ granted: false, canAskAgain: true }, false),
    "request",
  );
});

test("permanently denied native access redirects to OS settings", () => {
  assert.equal(
    cameraPermissionAction({ granted: false, canAskAgain: false }, false),
    "settings",
  );
});

test("blocked browser camera access explains browser settings instead of OS settings", () => {
  assert.equal(
    cameraPermissionAction({ granted: false, canAskAgain: false }, true),
    "browser-settings",
  );
  assert.equal(
    cameraPermissionAction({ granted: false, canAskAgain: true }, true),
    "request",
  );
});

test("granted permission does not request or redirect", () => {
  assert.equal(
    cameraPermissionAction({ granted: true, canAskAgain: false }, false),
    "granted",
  );
  assert.equal(
    cameraPermissionAction({ granted: true, canAskAgain: false }, true),
    "granted",
  );
});
