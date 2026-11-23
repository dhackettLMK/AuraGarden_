"use client";

import { createContext, useContext, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDB } from "@/lib/db";
import { useLedger, useNow, useSettings } from "@/lib/hooks";
import { levelProgress, titleFor } from "@/config/levels";
import { nextUnlock, realmsOpenFor, REALMS, type Unlock } from "@/config/realms";
import { gardenDay } from "@/lib/day";
import { activeDaysOf, boostsFor, computeStreak, type Boosts, type StreakState } from "./engine";

export interface GameState {
  ready: boolean;
  total: number;
  level: number;
  title: string;
  levelProgress: number;
  toNextLevel: number;
  nextLevelAt: number;
  streak: number;
  streakState: StreakState;
  boosts: Boosts;
  projectAura: Record<string, number>;
  projectAuraWeek: Record<string, number>;
  todayAura: number;
  todayCompletions: number;
  nextUnlock: Unlock | null;
  realmsOpen: number;
  achievements: number;
  today: string;
}

const emptyStreak: StreakState = { current: 0, best: 0, restDays: [], tierIdx: 0, decayTierIdx: 0, boost: 1, todayActive: false, recovering: false };
const empty: GameState = {
  ready: false,
  total: 0,
  level: 1,
  title: "Seedling",
  levelProgress: 0,
  toNextLevel: 50,
  nextLevelAt: 50,
  streak: 0,
  streakState: emptyStreak,
  boosts: { streak: 1, realm: 1, trophy: 1, total: 1, realmsOpen: 1 },
  projectAura: {},
  projectAuraWeek: {},
  todayAura: 0,
  todayCompletions: 0,
  nextUnlock: nextUnlock(0),
  realmsOpen: 1,
  achievements: 0,
  today: "",
};
const Ctx = createContext<GameState>(empty);

/** One place that derives game state from the ledger, shared by every screen. */
export function GameProvider({ children }: { children: React.ReactNode }) {
  const ledger = useLedger();
  const settings = useSettings();
  const achievements = useLiveQuery(async () => (await getDB().achievements.toArray()).filter((a) => !a.deletedAt).length, []);
  const now = useNow(60_000);
  const tz = settings?.timezone;
  const value = useMemo<GameState>(() => {
    if (!ledger) return empty;
    const today = gardenDay(now, tz);
    let total = 0;
    let todayAura = 0;
    let todayCompletions = 0;
    const projectAura: Record<string, number> = {};
    const projectAuraWeek: Record<string, number> = {};
    const weekAgo = now - 7 * 86_400_000;
    const live = ledger.filter((r) => !r.voided && !r.deletedAt);
    for (const r of live) {
      total += r.amount;
      if (r.day === today) {
        todayAura += r.amount;
        if (r.source === "task") todayCompletions++;
      }
      if (r.projectId) {
        projectAura[r.projectId] = (projectAura[r.projectId] ?? 0) + r.amount;
        if (r.at >= weekAgo) projectAuraWeek[r.projectId] = (projectAuraWeek[r.projectId] ?? 0) + r.amount;
      }
    }
    const lp = levelProgress(total);
    const streakState = computeStreak(activeDaysOf(live), today);
    const ach = achievements ?? 0;
    const boosts = boostsFor({ streakBoost: streakState.boost, total, realmsSeen: settings?.realmsSeen, achievements: ach });
    return {
      ready: true,
      total,
      level: lp.level,
      title: titleFor(lp.level),
      levelProgress: lp.progress,
      toNextLevel: lp.toGo,
      nextLevelAt: lp.to,
      streak: streakState.current,
      streakState,
      boosts,
      projectAura,
      projectAuraWeek,
      todayAura,
      todayCompletions,
      nextUnlock: nextUnlock(total),
      realmsOpen: Math.max(realmsOpenFor(total), settings?.realmsSeen ?? 1),
      achievements: ach,
      today,
    };
  }, [ledger, now, tz, achievements, settings?.realmsSeen]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame() {
  return useContext(Ctx);
}

export { REALMS };
