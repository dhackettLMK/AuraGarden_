"use client";

import { createContext, useContext, useMemo } from "react";
import { useLedger } from "@/lib/hooks";
import { levelProgress, titleFor } from "@/config/levels";

export interface GameState {
  ready: boolean;
  total: number;
  level: number;
  title: string;
  levelProgress: number;
  toNextLevel: number;
  streak: number;
  projectAura: Record<string, number>;
}

const empty: GameState = { ready: false, total: 0, level: 1, title: "Seedling", levelProgress: 0, toNextLevel: 50, streak: 0, projectAura: {} };
const Ctx = createContext<GameState>(empty);

/** One place that derives game state from the ledger, shared by every screen. */
export function GameProvider({ children }: { children: React.ReactNode }) {
  const ledger = useLedger();
  const value = useMemo<GameState>(() => {
    if (!ledger) return empty;
    let total = 0;
    const projectAura: Record<string, number> = {};
    for (const r of ledger) {
      if (r.voided || r.deletedAt) continue;
      total += r.amount;
      if (r.projectId) projectAura[r.projectId] = (projectAura[r.projectId] ?? 0) + r.amount;
    }
    const lp = levelProgress(total);
    return { ready: true, total, level: lp.level, title: titleFor(lp.level), levelProgress: lp.progress, toNextLevel: lp.toGo, streak: 0, projectAura };
  }, [ledger]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame() {
  return useContext(Ctx);
}
