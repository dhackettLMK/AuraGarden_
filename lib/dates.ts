import { addDays, dayDiff, todayKey } from "./day";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function parseDay(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return { y, m, d, date: new Date(y, m - 1, d) };
}

export function formatTime(hhmm: string | null) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, "0")}${ampm}` : `${h12}${ampm}`;
}

/** "Today", "Tomorrow", "Yesterday", "Fri", "27 Nov", "27 Nov 2027" */
export function friendlyDay(day: string, today = todayKey()) {
  const diff = dayDiff(today, day);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  const { y, m, d, date } = parseDay(day);
  if (diff > 1 && diff < 7) return DAYS[date.getDay()];
  const thisYear = Number(today.slice(0, 4));
  return y === thisYear ? `${d} ${MONTHS[m - 1]}` : `${d} ${MONTHS[m - 1]} ${y}`;
}

export function friendlyDue(day: string | null, time: string | null, today = todayKey()) {
  if (!day) return "";
  return time ? `${friendlyDay(day, today)} ${formatTime(time)}` : friendlyDay(day, today);
}

export function longDate(day: string) {
  const { m, d, date } = parseDay(day);
  return `${DAYS_LONG[date.getDay()]} ${d} ${MONTHS[m - 1]}`;
}

export function monthName(m: number) {
  return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][m - 1];
}

export function shortMonth(m: number) {
  return MONTHS[m - 1];
}

export function dayName(i: number, long = false) {
  return long ? DAYS_LONG[i] : DAYS[i];
}

export function weekdayDates(fromDay: string, n: number) {
  return Array.from({ length: n }, (_, i) => addDays(fromDay, i));
}

export function relativeTime(ts: number, now = Date.now()) {
  const s = Math.round((now - ts) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
  const mo = Math.round(d / 30);
  return `${mo} month${mo === 1 ? "" : "s"} ago`;
}
