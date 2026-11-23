/**
 * Pure game maths: streaks, boosts and totals (brief 7). No I/O here, so the
 * economy simulation and unit tests can use exactly the same rules.
 */
import { REALM_BOOST_BASE, STREAK_TIERS, TROPHY_BOOST_PER_ACHIEVEMENT } from "@/config/aura";
import { realmsOpenFor } from "@/config/realms";
import { addDays, dayDiff, weekStart } from "@/lib/day";
import type { AuraRecord } from "@/lib/types";

export function tierIndexFor(days: number) {
  let idx = 0;
  for (let i = 0; i < STREAK_TIERS.length; i++) if (days >= STREAK_TIERS[i][0]) idx = i;
  return idx;
}

export interface StreakState {
  /** Active days in the current run (rest days bridge but don't add). */
  current: number;
  best: number;
  /** Days protected by the weekly rest day (shown as a moon). */
  restDays: string[];
  /** Tier her current streak has earned. */
  tierIdx: number;
  /** The decaying tier carried over from a broken streak. */
  decayTierIdx: number;
  /** The boost she gets: the higher of the two tiers. */
  boost: number;
  todayActive: boolean;
  /** True when the last run ended and she's rebuilding with kept glow. */
  recovering: boolean;
}

/**
 * Streak rules (brief 7.2, 7.4):
 * - a day counts if she completes at least one task or to-do;
 * - one missed day per week (Mon–Sun) is protected automatically (a moon);
 * - when a streak ends, the boost steps down one tier per missed day instead
 *   of resetting; her boost is the higher of that and her new streak's tier;
 * - today doesn't break anything until it's over.
 */
export function computeStreak(activeDaysIn: Iterable<string>, today: string): StreakState {
  const active = new Set(activeDaysIn);
  const sorted = [...active].filter((d) => d <= today).sort();
  const empty: StreakState = { current: 0, best: 0, restDays: [], tierIdx: 0, decayTierIdx: 0, boost: 1, todayActive: false, recovering: false };
  if (!sorted.length) return empty;

  let current = 0;
  let best = 0;
  let decay = 0;
  let recovering = false;
  const restWeeks = new Set<string>();
  const restDays: string[] = [];

  const span = dayDiff(sorted[0], today);
  for (let i = 0; i <= span; i++) {
    const d = addDays(sorted[0], i);
    if (active.has(d)) {
      current += 1;
      best = Math.max(best, current);
      continue;
    }
    if (d === today) break; // the day isn't over yet
    const wk = weekStart(d);
    if (current > 0 && !restWeeks.has(wk)) {
      restWeeks.add(wk);
      restDays.push(d);
      continue;
    }
    // A missed day: the streak ends, the glow steps down one tier.
    if (current > 0) {
      decay = Math.max(decay, tierIndexFor(current));
      current = 0;
      recovering = true;
    }
    decay = Math.max(0, decay - 1);
  }

  const tierIdx = tierIndexFor(current);
  const effective = Math.max(tierIdx, decay);
  return {
    current,
    best,
    restDays,
    tierIdx,
    decayTierIdx: decay,
    boost: STREAK_TIERS[effective][1],
    todayActive: active.has(today),
    recovering: recovering && decay > tierIdx,
  };
}

export function trophyBoostFor(achievements: number) {
  return 1 + TROPHY_BOOST_PER_ACHIEVEMENT * achievements;
}

export function realmBoost(realmsOpen: number) {
  return REALM_BOOST_BASE ** Math.max(0, realmsOpen - 1);
}

export interface Boosts {
  streak: number;
  realm: number;
  trophy: number;
  total: number;
  realmsOpen: number;
}

export function boostsFor(opts: { streakBoost: number; total: number; realmsSeen?: number; achievements: number }): Boosts {
  // Realms stay open permanently, even if an un-tick dips below the threshold.
  const realmsOpen = Math.max(realmsOpenFor(opts.total), opts.realmsSeen ?? 1);
  const realm = realmBoost(realmsOpen);
  const trophy = trophyBoostFor(opts.achievements);
  return { streak: opts.streakBoost, realm, trophy, total: opts.streakBoost * realm * trophy, realmsOpen };
}

export function applyBoost(base: number, multiplier: number) {
  return Math.round(base * multiplier);
}

export function liveRecords(ledger: AuraRecord[]) {
  return ledger.filter((r) => !r.voided && !r.deletedAt);
}

export function totalOf(ledger: AuraRecord[]) {
  let t = 0;
  for (const r of ledger) if (!r.voided && !r.deletedAt) t += r.amount;
  return t;
}

/** Days with at least one completed task or to-do. */
export function activeDaysOf(ledger: AuraRecord[]) {
  const days = new Set<string>();
  for (const r of ledger) if (!r.voided && !r.deletedAt && r.source === "task") days.add(r.day);
  return days;
}
