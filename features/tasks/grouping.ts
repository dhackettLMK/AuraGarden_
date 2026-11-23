import { addDays, dayDiff, weekStart } from "@/lib/day";
import type { Task } from "@/lib/types";

export type GroupKey = "overdue" | "today" | "tomorrow" | "week" | "later" | "nodate" | "done";

export const GROUP_LABELS: Record<GroupKey, string> = {
  overdue: "Still waiting for you",
  today: "Today",
  tomorrow: "Tomorrow",
  week: "This week",
  later: "Later",
  nodate: "No date",
  done: "Done",
};

export function groupOf(task: Task, today: string): GroupKey {
  if (task.status === "done") return "done";
  if (!task.dueDate) return task.today ? "today" : "nodate";
  const diff = dayDiff(today, task.dueDate);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  const endOfWeek = addDays(weekStart(today), 6);
  if (dayDiff(task.dueDate, endOfWeek) >= 0) return "week";
  return "later";
}

export function sortTasks(a: Task, b: Task) {
  if (a.status === "done" && b.status === "done") return (b.completedAt ?? 0) - (a.completedAt ?? 0);
  if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
  if ((a.dueTime ?? "99") !== (b.dueTime ?? "99")) return (a.dueTime ?? "99") < (b.dueTime ?? "99") ? -1 : 1;
  if (a.priority !== b.priority) return b.priority - a.priority;
  return a.order - b.order;
}

export function groupTasks(tasks: Task[], today: string) {
  const groups = new Map<GroupKey, Task[]>();
  for (const k of Object.keys(GROUP_LABELS) as GroupKey[]) groups.set(k, []);
  for (const t of tasks) groups.get(groupOf(t, today))!.push(t);
  for (const list of groups.values()) list.sort(sortTasks);
  return groups;
}

export interface TaskFilter {
  projectId?: string | null | "all";
  tag?: string | null;
  priority?: number | null;
  status?: Task["status"] | null;
  query?: string;
}

export function applyFilter(tasks: Task[], f: TaskFilter) {
  return tasks.filter((t) => {
    if (f.projectId !== undefined && f.projectId !== "all" && t.projectId !== f.projectId) return false;
    if (f.tag && !t.tags.includes(f.tag)) return false;
    if (f.priority && t.priority !== f.priority) return false;
    if (f.status && t.status !== f.status) return false;
    if (f.query && !t.title.toLowerCase().includes(f.query.toLowerCase())) return false;
    return true;
  });
}
