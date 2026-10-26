const captureDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function timestampFromExifValue(value: unknown): number | undefined {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? time : undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value < 1_000_000_000_000 ? value * 1000 : value;
  }
  if (typeof value !== "string") return undefined;

  const exifDate = value.match(
    /^\s*(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?\s*$/,
  );
  if (exifDate) {
    const [
      ,
      yearText,
      monthText,
      dayText,
      hourText,
      minuteText,
      secondText,
      fraction = "",
    ] = exifDate;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const hour = Number(hourText);
    const minute = Number(minuteText);
    const second = Number(secondText);
    const millisecond = Number(fraction.padEnd(3, "0").slice(0, 3));
    const date = new Date(
      year,
      month - 1,
      day,
      hour,
      minute,
      second,
      millisecond,
    );
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day ||
      date.getHours() !== hour ||
      date.getMinutes() !== minute ||
      date.getSeconds() !== second
    ) {
      return undefined;
    }
    return date.getTime();
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function captureTimestampFromPhotoMetadata(
  exif?: Record<string, unknown> | null,
  fileLastModified?: number | null,
  fallback = Date.now(),
): number {
  for (const key of ["DateTimeOriginal", "DateTimeDigitized", "DateTime"]) {
    const timestamp = timestampFromExifValue(exif?.[key]);
    if (timestamp !== undefined) return timestamp;
  }
  if (
    typeof fileLastModified === "number" &&
    Number.isFinite(fileLastModified)
  ) {
    return fileLastModified;
  }
  return Number.isFinite(fallback) ? fallback : Date.now();
}

export function captureDateLabel(timestamp: number = Date.now()): string {
  const date = Number.isFinite(timestamp) ? new Date(timestamp) : new Date();
  return captureDateFormatter.format(date);
}
