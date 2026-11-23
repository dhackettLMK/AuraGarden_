import { getDB } from "../db";
import type { Catchup, Contact } from "../types";
import { alive, baseRecord, nextOrder, patch, put, uid } from "./core";

export const AVATAR_COLORS = ["#E8A7A0", "#A6CFA1", "#9CC9FF", "#C59BF5", "#F6C828", "#E3A04A", "#8FD3D1", "#D9A5C8"];

export function blankContact(input: Partial<Contact> & { name: string }, order = 0): Contact {
  return {
    ...baseRecord(uid("ct_")),
    photo: null,
    color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    phone: "",
    email: "",
    instagram: "",
    linkedin: "",
    organisation: "",
    role: "",
    howMet: "",
    birthday: null,
    tags: [],
    notes: "",
    projectIds: [],
    keepInTouchDays: null,
    lastContacted: null,
    order,
    ...input,
  };
}

export async function createContact(input: Partial<Contact> & { name: string }) {
  const rows = alive(await getDB().contacts.toArray());
  return put("contacts", blankContact(input, nextOrder(rows)));
}

export function updateContact(id: string, changes: Partial<Contact>) {
  return patch("contacts", id, changes);
}

export async function logCatchup(contactId: string, date: string, note: string) {
  const c: Catchup = { ...baseRecord(uid("cu_")), contactId, date, note };
  await put("catchups", c);
  const contact = await getDB().contacts.get(contactId);
  const at = new Date(`${date}T12:00:00`).getTime();
  if (contact && (!contact.lastContacted || contact.lastContacted < at)) await patch("contacts", contactId, { lastContacted: at });
  return c;
}

export function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}
