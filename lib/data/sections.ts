import { getDB } from "../db";
import type { Section } from "../types";
import { alive, baseRecord, nextOrder, patch, put } from "./core";

export async function createSection(projectId: string | null, name: string) {
  const all = alive(await getDB().sections.toArray()).filter((s) => s.projectId === projectId);
  const section: Section = { ...baseRecord(), projectId, name: name.trim() || "New section", order: nextOrder(all) };
  return put("sections", section);
}

export function renameSection(id: string, name: string) {
  return patch("sections", id, { name });
}
