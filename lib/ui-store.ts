"use client";

import { create } from "zustand";
import type { Task } from "./types";

export type QuickAddType = "task" | "todo" | "thought" | "event" | "person";

interface UIState {
  quickAdd: { open: boolean; type: QuickAddType; projectId: string | null; mode: "add" | "search" };
  openQuickAdd: (opts?: Partial<{ type: QuickAddType; projectId: string | null; mode: "add" | "search" }>) => void;
  closeQuickAdd: () => void;
  moreOpen: boolean;
  setMoreOpen: (v: boolean) => void;
  auraSheetOpen: boolean;
  setAuraSheetOpen: (v: boolean) => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (v: boolean) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  editingTask: Task | null;
  openTask: (t: Task | null) => void;
}

export const useUI = create<UIState>((set) => ({
  quickAdd: { open: false, type: "task", projectId: null, mode: "add" },
  openQuickAdd: (opts = {}) =>
    set((s) => ({ quickAdd: { ...s.quickAdd, mode: "add", projectId: null, ...opts, open: true } })),
  closeQuickAdd: () => set((s) => ({ quickAdd: { ...s.quickAdd, open: false } })),
  moreOpen: false,
  setMoreOpen: (moreOpen) => set({ moreOpen }),
  auraSheetOpen: false,
  setAuraSheetOpen: (auraSheetOpen) => set({ auraSheetOpen }),
  shortcutsOpen: false,
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  sidebarCollapsed: typeof window !== "undefined" && localStorage.getItem("ag-sidebar") === "rail",
  toggleSidebar: () =>
    set((s) => {
      const next = !s.sidebarCollapsed;
      localStorage.setItem("ag-sidebar", next ? "rail" : "full");
      return { sidebarCollapsed: next };
    }),
  editingTask: null,
  openTask: (editingTask) => set({ editingTask }),
}));
