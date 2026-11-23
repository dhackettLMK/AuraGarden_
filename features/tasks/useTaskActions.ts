"use client";

import { useCallback } from "react";
import { softDelete, put } from "@/lib/data/core";
import { updateTask, blankTask } from "@/lib/data/tasks";
import { completeTask, uncompleteTask } from "@/lib/game/actions";
import { undoToast, toast } from "@/components/ui/toast-store";
import { todayKey } from "@/lib/day";
import type { Task } from "@/lib/types";
import { useHold } from "./hold-store";
import { groupOf } from "./grouping";

export function useTaskActions() {
  const hold = useHold((s) => s.hold);

  const toggle = useCallback(
    async (task: Task, done: boolean, origin?: { x: number; y: number }) => {
      if (done) {
        hold(task.id, groupOf(task, todayKey()));
        await completeTask(task, origin);
      } else {
        await uncompleteTask(task);
      }
    },
    [hold],
  );

  const remove = useCallback(async (task: Task) => {
    const undo = await softDelete("tasks", task.id);
    undoToast(`Deleted "${truncate(task.title)}"`, undo);
  }, []);

  const removeMany = useCallback(async (ids: string[]) => {
    const undo = await softDelete("tasks", ids);
    undoToast(`Deleted ${ids.length} task${ids.length === 1 ? "" : "s"}`, undo);
  }, []);

  const schedule = useCallback(async (task: Task, dueDate: string | null) => {
    await updateTask(task.id, { dueDate, dueTime: dueDate ? task.dueTime : null });
  }, []);

  const move = useCallback(async (task: Task, projectId: string | null, sectionId: string | null = null) => {
    await updateTask(task.id, { projectId, sectionId: projectId ? sectionId : (sectionId ?? "sec_mylist_today") });
    toast(projectId ? "Moved" : "Moved to My List");
  }, []);

  const duplicate = useCallback(async (task: Task) => {
    await put("tasks", blankTask({ ...task, title: `${task.title} (copy)`, status: "todo", completedAt: null }, task.order));
    toast("Duplicated");
  }, []);

  return { toggle, remove, removeMany, schedule, move, duplicate };
}

function truncate(s: string, n = 32) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
