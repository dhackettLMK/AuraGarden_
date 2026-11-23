import { patch, put } from "../data/core";
import { blankTask, nextOccurrence } from "../data/tasks";
import { todayKey } from "../day";
import type { Task } from "../types";

export interface CompleteOrigin {
  x: number;
  y: number;
}

/** Complete a task or to-do. Recurring tasks spawn their next occurrence. */
export async function completeTask(task: Task, _origin?: CompleteOrigin) {
  if (task.status === "done") return;
  const t = Date.now();
  await patch("tasks", task.id, { status: "done", completedAt: t });
  if (task.recurrence) {
    const from = task.dueDate ?? todayKey();
    const next = blankTask(
      {
        ...task,
        title: task.title,
        status: "todo",
        completedAt: null,
        dueDate: nextOccurrence(task.recurrence, from),
        subtasks: task.subtasks.map((s) => ({ ...s, done: false })),
      },
      task.order,
    );
    await put("tasks", next);
  }
}

export async function uncompleteTask(task: Task) {
  if (task.status !== "done") return;
  await patch("tasks", task.id, { status: "todo", completedAt: null });
}

export async function toggleSubtask(task: Task, subId: string) {
  const subtasks = task.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s));
  await patch("tasks", task.id, { subtasks });
}
