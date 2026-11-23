/**
 * iCalendar parsing with recurrence expansion (brief 6.7), shared by the
 * server feed route and on-device .ics import.
 */
import ICAL from "ical.js";

export interface ParsedEvent {
  uid: string;
  title: string;
  start: number;
  end: number;
  allDay: boolean;
  location: string;
  description: string;
}

const MAX_OCCURRENCES_PER_EVENT = 800;
const MAX_EVENTS = 5000;

export class ICalError extends Error {}

/** Parse an .ics text and expand recurrences between `from` and `to` (ms). */
export function parseICS(text: string, from: number, to: number): ParsedEvent[] {
  if (!/BEGIN:VCALENDAR/i.test(text)) throw new ICalError("That doesn't look like an iCalendar file.");
  let comp: ICAL.Component;
  try {
    comp = new ICAL.Component(ICAL.parse(text));
  } catch {
    throw new ICalError("Couldn't read that calendar.");
  }
  // Register embedded time zones so local times resolve correctly.
  for (const tz of comp.getAllSubcomponents("vtimezone")) {
    try {
      ICAL.TimezoneService.register(tz);
    } catch {
      /* ignore broken zones */
    }
  }
  const out: ParsedEvent[] = [];
  const vevents = comp.getAllSubcomponents("vevent");
  // Exceptions (RECURRENCE-ID) are applied by ICAL.Event when related.
  const byUid = new Map<string, ICAL.Component[]>();
  for (const v of vevents) {
    const uid = String(v.getFirstPropertyValue("uid") ?? Math.random());
    byUid.set(uid, [...(byUid.get(uid) ?? []), v]);
  }
  for (const [uid, comps] of byUid) {
    const master = comps.find((c) => !c.hasProperty("recurrence-id")) ?? comps[0];
    const event = new ICAL.Event(master);
    for (const ex of comps) if (ex !== master && ex.hasProperty("recurrence-id")) event.relateException(ex);
    if (!event.startDate) continue;
    const allDay = event.startDate.isDate;
    const durMs = event.endDate ? event.endDate.toJSDate().getTime() - event.startDate.toJSDate().getTime() : allDay ? 86_400_000 : 3_600_000;
    const base = { title: event.summary || "Busy", location: event.location || "", description: (event.description || "").slice(0, 2000) };
    if (event.isRecurring()) {
      const it = event.iterator();
      let next: ICAL.Time | null;
      let n = 0;
      while ((next = it.next()) && n < MAX_OCCURRENCES_PER_EVENT) {
        const startMs = next.toJSDate().getTime();
        if (startMs > to) break;
        n++;
        const details = event.getOccurrenceDetails(next);
        const s = details.startDate.toJSDate().getTime();
        const e = details.endDate.toJSDate().getTime();
        if (e < from) continue;
        out.push({ uid: `${uid}:${s}`, ...base, title: details.item.summary || base.title, start: s, end: e, allDay });
        if (out.length > MAX_EVENTS) return out;
      }
    } else {
      const s = event.startDate.toJSDate().getTime();
      const e = s + durMs;
      if (e >= from && s <= to) out.push({ uid, ...base, start: s, end: e, allDay });
    }
    if (out.length > MAX_EVENTS) break;
  }
  return out.sort((a, b) => a.start - b.start);
}

/** Six months either side of now. */
export function feedWindow(now = Date.now()) {
  const six = 183 * 86_400_000;
  return { from: now - six, to: now + six };
}
