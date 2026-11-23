import { getDB } from "../db";
import { addDays, weekdayOf } from "../day";
import type { Recurrence, Task } from "../types";
import { alive, baseRecord, nextOrder, patch, put, uid } from "./core";

export type NewTask = Partial<Omit<Task, "id" | "createdAt" | "updatedAt" | "deletedAt">> & { title: string };

export function blankTask(input: NewTask, order = 0): Task {
  return {
    ...baseRecord(uid("tsk_")),
    notes: "",
    projectId: null,
    sectionId: null,
    status: "todo",
    priority: 0,
    dueDate: null,
    dueTime: null,
    blockStart: null,
    blockEnd: null,
    recurrence: null,
    tags: [],
    big: false,
    subtasks: [],
    completedAt: null,
    order,
    ...input,
    title: input.title.trim(),
  };
}

export async function createTask(input: NewTask) {
  const db = getDB();
  const siblings = alive(await db.tasks.toArray()).filter(
    (t) => t.projectId === (input.projectId ?? null) && t.sectionId === (input.sectionId ?? null),
  );
  // New tasks go to the top of their list so she sees them land.
  const order = siblings.length ? Math.min(...siblings.map((t) => t.order)) - 1 : 0;
  const task = blankTask(
    {
      ...input,
      sectionId: input.sectionId ?? (input.projectId ? null : "sec_mylist_today"),
    },
    order,
  );
  return put("tasks", task);
}

export function updateTask(id: string, changes: Partial<Task>) {
  return patch("tasks", id, changes);
}

export async function addSubtask(task: Task, title: string) {
  return patch("tasks", task.id, { subtasks: [...task.subtasks, { id: uid("sub_"), title, done: false }] });
}

/** The next due date for a recurring task, from the date it was due (or today). */
export function nextOccurrence(rec: Recurrence, from: string): string {
  switch (rec.kind) {
    case "daily":
      return addDays(from, 1);
    case "weekdays": {
      let d = addDays(from, 1);
      while ([0, 6].includes(weekdayOf(d))) d = addDays(d, 1);
      return d;
    }
    case "weekly": {
      const days = rec.days.length ? rec.days : [weekdayOf(from)];
      let d = addDays(from, 1);
      for (let i = 0; i < 8 && !days.includes(weekdayOf(d)); i++) d = addDays(d, 1);
      return d;
    }
    case "monthly": {
      const [y, m, day] = from.split("-").map(Number);
      const nm = m === 12 ? 1 : m + 1;
      const ny = m === 12 ? y + 1 : y;
      const last = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
      return `${ny}-${String(nm).padStart(2, "0")}-${String(Math.min(day, last)).padStart(2, "0")}`;
    }
    case "rrule":
      return nextFromRRule(rec.rule, from);
  }
}

/** Minimal RRULE support for FREQ, INTERVAL and BYDAY. */
function nextFromRRule(rule: string, from: string): string {
  const parts = Object.fromEntries(
    rule
      .replace(/^RRULE:/i, "")
      .split(";")
      .map((p) => p.split("=") as [string, string]),
  );
  const interval = Math.max(1, Number(parts.INTERVAL ?? 1));
  const freq = (parts.FREQ ?? "DAILY").toUpperCase();
  if (freq === "WEEKLY" && parts.BYDAY) {
    const map: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
    const days = String(parts.BYDAY)
      .split(",")
      .map((d) => map[d.slice(-2)])
      .filter((d) => d !== undefined);
    let d = addDays(from, 1);
    for (let i = 0; i < 7 * interval + 7 && !days.includes(weekdayOf(d)); i++) d = addDays(d, 1);
    return d;
  }
  if (freq === "WEEKLY") return addDays(from, 7 * interval);
  if (freq === "MONTHLY") {
    let d = from;
    for (let i = 0; i < interval; i++) d = nextOccurrence({ kind: "monthly" }, d);
    return d;
  }
  if (freq === "YEARLY") {
    const [y, m, day] = from.split("-");
    return `${Number(y) + interval}-${m}-${day}`;
  }
  return addDays(from, interval);
}

export function recurrenceLabel(rec: Recurrence | null): string {
  if (!rec) return "Doesn't repeat";
  switch (rec.kind) {
    case "daily":
      return "Every day";
    case "weekdays":
      return "Every weekday";
    case "weekly": {
      const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return rec.days.length ? `Every ${rec.days.map((d) => names[d]).join(", ")}` : "Every week";
    }
    case "monthly":
      return "Every month";
    case "rrule":
      return "Custom repeat";
  }
}

export async function allTags(): Promise<string[]> {
  const db = getDB();
  const tags = new Set<string>();
  for (const t of alive(await db.tasks.toArray())) t.tags.forEach((x) => tags.add(x));
  for (const t of alive(await db.thoughts.toArray())) t.tags.forEach((x) => tags.add(x));
  for (const t of alive(await db.contacts.toArray())) t.tags.forEach((x) => tags.add(x));
  return [...tags].sort();
}

export { nextOrder };
