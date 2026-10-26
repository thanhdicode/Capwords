import type { Word } from "./types";
import { reviewDateKey } from "./review";

export interface HomeTimelineDay {
  dateKey: string;
  date: Date;
  dayLabel: string;
  monthKey: string;
  monthLabel: string;
  isToday: boolean;
  words: Word[];
}

function dateFromKey(dateKey: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  return reviewDateKey(date) === dateKey ? date : null;
}

export function formatHomeDate(dateKey: string): string {
  const date = dateFromKey(dateKey);
  return date
    ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : dateKey;
}

export function wordsForHomeDate(words: Word[], dateKey: string): Word[] {
  if (!dateFromKey(dateKey)) return [];
  return words.filter((word) => {
    const createdAt = new Date(word.createdAt);
    return (
      Number.isFinite(createdAt.getTime()) &&
      reviewDateKey(createdAt) === dateKey
    );
  });
}

export function buildHomeTimeline(
  words: Word[],
  today = new Date(),
): HomeTimelineDay[] {
  const todayKey = reviewDateKey(today);
  const byDay = new Map<string, Word[]>();
  for (const word of words) {
    const createdAt = new Date(word.createdAt);
    if (!Number.isFinite(createdAt.getTime())) continue;
    const key = reviewDateKey(createdAt);
    const dayWords = byDay.get(key) ?? [];
    dayWords.push(word);
    byDay.set(key, dayWords);
  }
  const orderedKeys = [
    todayKey,
    ...[...byDay.keys()]
      .filter((key) => key !== todayKey)
      .sort((a, b) => b.localeCompare(a)),
  ];
  return orderedKeys.flatMap((dateKey) => {
    const date = dateFromKey(dateKey);
    if (!date) return [];
    const yearOptions: Intl.DateTimeFormatOptions =
      date.getFullYear() === today.getFullYear()
        ? { month: "long" }
        : { month: "long", year: "numeric" };
    return [
      {
        dateKey,
        date,
        dayLabel: formatHomeDate(dateKey),
        monthKey: dateKey.slice(0, 7),
        monthLabel: date.toLocaleDateString("en-US", yearOptions),
        isToday: dateKey === todayKey,
        words: (byDay.get(dateKey) ?? []).sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      },
    ];
  });
}
