import { getDB } from "../db";
import type { Thought } from "../types";
import { alive, baseRecord, patch, put, uid } from "./core";

export async function createThought(input: Partial<Thought> = {}) {
  const rows = alive(await getDB().thoughts.toArray());
  const t: Thought = {
    ...baseRecord(uid("th_")),
    title: "",
    body: "",
    text: "",
    tags: [],
    projectIds: [],
    pinned: false,
    mood: null,
    prompt: null,
    order: rows.length ? Math.min(...rows.map((r) => r.order)) - 1 : 0,
    ...input,
  };
  return put("thoughts", t);
}

export function updateThought(id: string, changes: Partial<Thought>) {
  return patch("thoughts", id, changes);
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
