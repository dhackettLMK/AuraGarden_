"use client";

import { create } from "zustand";

export interface Toast {
  id: number;
  message: string;
  undo?: () => void | Promise<void>;
  tone?: "default" | "success" | "gentle";
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  show: (t: Omit<Toast, "id">) => number;
  dismiss: (id: number) => void;
}

let seq = 1;
export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  show: (t) => {
    const id = seq++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Show a toast. Deletes get a 6-second Undo (brief 6, editing rules). */
export function toast(message: string, opts: Omit<Toast, "id" | "message"> = {}) {
  return useToasts.getState().show({ message, duration: opts.undo ? 6000 : 3200, ...opts });
}

export function undoToast(message: string, undo: () => void | Promise<void>) {
  return toast(message, { undo });
}
