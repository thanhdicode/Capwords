export const videoCapturePolicy = {
  longPressActivationDelayMs: 450,
  pressReleaseResetDelayMs: 120,
  recordingStartDelayMs: 650,
  shortReleaseGraceMs: 300,
  maximumDurationSeconds: 8,
  maximumFileSizeBytes: 20 * 1024 * 1024,
  progressUpdateIntervalSeconds: 0.25,
  progressRefreshIntervalMs: 250,
} as const;

export function videoCaptureProgress(elapsedMilliseconds: number): number {
  if (!Number.isFinite(elapsedMilliseconds)) {
    return elapsedMilliseconds === Number.POSITIVE_INFINITY ? 1 : 0;
  }
  return Math.min(
    Math.max(elapsedMilliseconds, 0) /
      (videoCapturePolicy.maximumDurationSeconds * 1000),
    1,
  );
}
