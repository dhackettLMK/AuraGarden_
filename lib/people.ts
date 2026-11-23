import { addDays, dayDiff } from "./day";
import type { Contact } from "./types";

/** Days until her next birthday (0 = today), or null if unknown. */
export function daysToBirthday(birthday: string | null, today: string): number | null {
  if (!birthday) return null;
  const md = birthday.slice(-5);
  const year = Number(today.slice(0, 4));
  let next = `${year}-${md}`;
  if (md === "02-29" && !isLeap(year)) next = `${year}-02-28`;
  let diff = dayDiff(today, next);
  if (diff < 0) {
    next = `${year + 1}-${md === "02-29" && !isLeap(year + 1) ? "02-28" : md}`;
    diff = dayDiff(today, next);
  }
  return diff;
}

function isLeap(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** Days overdue for a catch-up (>= 0 means due), or null if no rhythm set. */
export function catchupDue(c: Contact, today: string): number | null {
  if (!c.keepInTouchDays) return null;
  if (!c.lastContacted) return 0;
  const last = new Date(c.lastContacted);
  const lastDay = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
  return dayDiff(addDays(lastDay, c.keepInTouchDays), today);
}

export function digits(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

/** wa.me wants the international number without + or spaces. Irish 08x numbers get 353. */
export function whatsappNumber(phone: string) {
  let d = digits(phone);
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = `353${d.slice(1)}`;
  return d;
}
