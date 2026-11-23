"use client";

import { create } from "zustand";

export type SyncStatus = "off" | "synced" | "syncing" | "offline" | "attention";

interface SyncStatusState {
  status: SyncStatus;
  lastSyncAt: number | null;
  message: string | null;
  set: (s: Partial<Omit<SyncStatusState, "set">>) => void;
}

export const useSyncStore = create<SyncStatusState>((set) => ({
  status: "off",
  lastSyncAt: null,
  message: null,
  set: (s) => set(s),
}));

export function useSyncStatus() {
  return useSyncStore((s) => s.status);
}
