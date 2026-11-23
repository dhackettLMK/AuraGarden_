"use client";

import { create } from "zustand";
import type { Task } from "@/lib/types";

interface PickerState {
  kind: "schedule" | "move" | null;
  task: Task | null;
  bulkIds: string[] | null;
  open: (kind: "schedule" | "move", task: Task | null, bulkIds?: string[]) => void;
  close: () => void;
}

export const useTaskPicker = create<PickerState>((set) => ({
  kind: null,
  task: null,
  bulkIds: null,
  open: (kind, task, bulkIds) => set({ kind, task, bulkIds: bulkIds ?? null }),
  close: () => set({ kind: null }),
}));
