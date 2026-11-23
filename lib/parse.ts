import * as chrono from "chrono-node";
import type { Priority, Project } from "./types";
import { pad } from "./day";

export interface ParsedInput {
  title: string;
  dueDate: string | null;
  dueTime: string | null;
  projectId: string | null;
  projectName: string | null;
  priority: Priority;
  tags: string[];
  dateText: string | null;
}

const PRIORITY: Record<string, Priority> = {
  high: 3, hi: 3, h: 3, "3": 3, urgent: 3,
  medium: 2, med: 2, m: 2, "2": 2,
  low: 1, lo: 1, l: 1, "1": 1,
};

function normalise(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Match "#college" to "College Work", "#swap" to "Swap 'N' Serve", etc. */
export function matchProject(tag: string, projects: Pick<Project, "id" | "name">[]) {
  const t = normalise(tag);
  if (!t) return null;
  const exact = projects.find((p) => normalise(p.name) === t);
  if (exact) return exact;
  const prefix = projects.find((p) => normalise(p.name).startsWith(t));
  if (prefix) return prefix;
  const word = projects.find((p) => p.name.toLowerCase().split(/[\s']+/).some((w) => normalise(w).startsWith(t) && t.length >= 3));
  return word ?? null;
}

/**
 * Natural-language add (brief 6.3): "essay draft fri 5pm #college !high"
 * becomes a title plus chips for date, project and priority.
 */
export function parseQuickInput(
  input: string,
  projects: Pick<Project, "id" | "name">[],
  ref: Date = new Date(),
): ParsedInput {
  let text = ` ${input} `;
  let priority: Priority = 0;
  const tags: string[] = [];
  let project: Pick<Project, "id" | "name"> | null = null;

  text = text.replace(/\s!(\w+)/g, (m, p: string) => {
    const v = PRIORITY[p.toLowerCase()];
    if (v === undefined) return m;
    priority = v;
    return " ";
  });
  text = text.replace(/\s#([\p{L}\p{N}_'-]+)/gu, (_m, tag: string) => {
    const hit = !project ? matchProject(tag, projects) : null;
    if (hit) project = hit;
    else tags.push(tag.toLowerCase());
    return " ";
  });

  let dueDate: string | null = null;
  let dueTime: string | null = null;
  let dateText: string | null = null;
  const results = chrono.en.GB.parse(text, ref, { forwardDate: true });
  const r = results[0];
  if (r) {
    const d = r.start.date();
    dueDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (r.start.isCertain("hour")) dueTime = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    dateText = r.text;
    text = text.slice(0, r.index) + " " + text.slice(r.index + r.text.length);
  }
  const title = text.replace(/\s+/g, " ").trim();
  const p = project as Pick<Project, "id" | "name"> | null;
  return { title, dueDate, dueTime, projectId: p?.id ?? null, projectName: p?.name ?? null, priority, tags, dateText };
}
