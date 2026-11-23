"use client";

import { create } from "zustand";

/**
 * Just-completed rows stay where they are briefly, then glide into Done
 * (brief 7.5 step 4). Grouping reads this to keep them in place.
 */
interface HoldState {
  held: Record<string, string>; // taskId -> group it was in
  hold: (id: string, group: string, ms?: number) => void;
}

export const useHold = create<HoldState>((set) => ({
  held: {},
  hold: (id, group, ms = 1000) => {
    set((s) => ({ held: { ...s.held, [id]: group } }));
    setTimeout(() => set((s) => {
      const next = { ...s.held };
      delete next[id];
      return { held: next };
    }), ms);
  },
}));
