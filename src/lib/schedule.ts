/**
 * Weekly-schedule date helpers.
 *
 * `ClassSchedule` rows are recurring (a weekday + a "HH:mm" start time); concrete
 * dated `ClassSession` occurrences are derived from them. These pure helpers map
 * between the Prisma `DayOfWeek` enum and JS `Date.getDay()`, and compute the
 * next occurrence dates for a recurring slot. No database access — safe to import
 * from client or server code.
 */
import type { DayOfWeek } from "@prisma/client";

/** Weekday order used across the schedule UI (Monday first). */
export const DAY_ORDER: DayOfWeek[] = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

export const DAY_SHORT: Record<DayOfWeek, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

/** JS `Date.getDay()` index (0 = Sun … 6 = Sat) for a `DayOfWeek`. */
const JS_INDEX: Record<DayOfWeek, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

/** Map a JS `Date.getDay()` value back to a `DayOfWeek`. */
export function jsIndexToDay(index: number): DayOfWeek {
  return (["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as DayOfWeek[])[
    ((index % 7) + 7) % 7
  ];
}

/** The `DayOfWeek` for a given date. */
export function dayOfDate(date: Date): DayOfWeek {
  return jsIndexToDay(date.getDay());
}

/** Parse a "HH:mm" string into `[hours, minutes]`, tolerating junk. */
function parseTime(hhmm: string): [number, number] {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  return [Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0];
}

/** Local midnight for a date — strips the time component. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * The next `count` dates a recurring slot meets, each set to its start time.
 * Today counts as the first occurrence only if its start time hasn't passed.
 */
export function nextOccurrences(
  day: DayOfWeek,
  startTime: string,
  count: number,
  from: Date = new Date(),
): Date[] {
  const [h, m] = parseTime(startTime);
  const first = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate(),
    h,
    m,
    0,
    0,
  );
  const delta = (JS_INDEX[day] - first.getDay() + 7) % 7;
  first.setDate(first.getDate() + delta);
  // If the slot lands today but has already passed, jump to next week.
  if (first.getTime() < from.getTime()) first.setDate(first.getDate() + 7);

  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(first);
    d.setDate(first.getDate() + i * 7);
    dates.push(d);
  }
  return dates;
}

/** The single next occurrence of a recurring slot. */
export function nextOccurrence(
  day: DayOfWeek,
  startTime: string,
  from: Date = new Date(),
): Date {
  return nextOccurrences(day, startTime, 1, from)[0];
}

/** Format "18:00" as "6:00 PM". */
export function formatTime(hhmm: string): string {
  const [h, m] = parseTime(hhmm);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

/** Stable week bucket index (weeks since a known Monday) for streak maths. */
export function weekIndex(date: Date): number {
  const epochMonday = Date.UTC(1970, 0, 5); // 1970-01-05 was a Monday.
  const local = startOfDay(date).getTime();
  return Math.floor((local - epochMonday) / (7 * 86_400_000));
}
