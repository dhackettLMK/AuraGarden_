import { getDB } from "../db";
import type { CalendarEvent } from "../types";
import { alive, baseRecord, nextOrder, patch, put, uid } from "./core";

export async function createEvent(input: Partial<CalendarEvent> & { title: string; start: number; end: number }) {
  const rows = alive(await getDB().events.toArray());
  const e: CalendarEvent = {
    ...baseRecord(uid("ev_")),
    allDay: false,
    location: "",
    notes: "",
    color: null,
    projectId: null,
    recurrence: null,
    order: nextOrder(rows),
    ...input,
  };
  return put("events", e);
}

export function updateEvent(id: string, changes: Partial<CalendarEvent>) {
  return patch("events", id, changes);
}
