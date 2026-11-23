/**
 * Garden days end at 3 a.m. in her time zone (brief 7.4), so late-night work
 * counts for the day it belongs to. All day keys are YYYY-MM-DD strings.
 */
export const DEFAULT_TZ = "Europe/Dublin";
export const DAY_CUTOFF_HOUR = 3;

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(tz: string) {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      weekday: "short",
    });
    fmtCache.set(tz, f);
  }
  return f;
}

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 Sunday
}

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function zonedParts(at: number, tz = DEFAULT_TZ): ZonedParts {
  const parts = partsFormatter(tz).formatToParts(new Date(at));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  return {
    year: +get("year"),
    month: +get("month"),
    day: +get("day"),
    hour: +get("hour") % 24,
    minute: +get("minute"),
    weekday: WEEKDAYS[get("weekday")] ?? 0,
  };
}

export function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Calendar date key in the zone (no cut-off). */
export function calendarDay(at: number, tz = DEFAULT_TZ) {
  const p = zonedParts(at, tz);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Garden day key with the 3 a.m. cut-off. */
export function gardenDay(at: number, tz = DEFAULT_TZ) {
  return calendarDay(at - DAY_CUTOFF_HOUR * 3_600_000, tz);
}

export function addDays(day: string, n: number) {
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function dayDiff(a: string, b: string) {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

/** 0 = Sunday */
export function weekdayOf(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** ISO week key, Monday start: the Monday's date. */
export function weekStart(day: string) {
  const wd = weekdayOf(day);
  return addDays(day, -((wd + 6) % 7));
}

export type TimeOfDay = "dawn" | "morning" | "afternoon" | "golden" | "evening" | "night" | "late";

export function timeOfDay(at: number, tz = DEFAULT_TZ): TimeOfDay {
  const h = zonedParts(at, tz).hour;
  if (h < 3) return "late";
  if (h < 6) return "night";
  if (h < 8) return "dawn";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 20) return "golden";
  if (h < 23) return "evening";
  return "night";
}

export function greetingFor(at: number, tz = DEFAULT_TZ) {
  const h = zonedParts(at, tz).hour;
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 18) return "Good afternoon";
  if (h >= 18 && h < 23) return "Good evening";
  return "Hey night owl";
}

export type Season = "winter" | "spring" | "summer" | "autumn";
/** Irish seasons by month. */
export function seasonOf(at: number, tz = DEFAULT_TZ): Season {
  const m = zonedParts(at, tz).month;
  if (m === 12 || m <= 1) return "winter";
  if (m <= 4) return "spring";
  if (m <= 7) return "summer";
  if (m <= 10) return "autumn";
  return "winter";
}

/** "Today" everywhere in the app follows the garden day, so 1 a.m. still belongs to yesterday. */
export function todayKey(tz = DEFAULT_TZ, at = Date.now()) {
  return gardenDay(at, tz);
}
