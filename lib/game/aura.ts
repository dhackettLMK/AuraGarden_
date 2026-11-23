/**
 * The one door for aura (brief 3, 7.4). Every award goes through awardAura,
 * which applies boosts and writes an idempotent ledger record whose id is
 * deterministic, so double taps, retries and two devices never double-award.
 */
import { getDB } from "../db";
import { now } from "../data/core";
import { putMany } from "../data/core";
import { gardenDay, todayKey } from "../day";
import { SETTINGS_ID } from "../data/settings";
import type { AuraRecord, AuraSource } from "../types";
import { activeDaysOf, applyBoost, boostsFor, computeStreak, totalOf, type Boosts } from "./engine";

export interface AwardEvent {
  id: string;
  base: number;
  reason: string;
  source: AuraSource;
  projectId?: string | null;
  refId?: string | null;
  /** Achievement bonuses are not multiplied (brief 7.1). */
  multiply?: boolean;
  at?: number;
}

export interface AwardResult {
  record: AuraRecord;
  status: "created" | "restored" | "exists";
}

export async function readGameContext(at = now()) {
  const db = getDB();
  const [ledger, settings, achievements] = await Promise.all([db.aura_ledger.toArray(), db.settings.get(SETTINGS_ID), db.achievements.toArray()]);
  const tz = settings?.timezone;
  const today = gardenDay(at, tz);
  const live = ledger.filter((r) => !r.voided && !r.deletedAt);
  const total = totalOf(live);
  const days = activeDaysOf(live);
  return { ledger, live, settings, tz, today, total, days, achievementCount: achievements.filter((a) => !a.deletedAt).length };
}

export async function currentBoosts(opts: { countToday?: boolean } = {}): Promise<Boosts & { streak: number }> {
  const ctx = await readGameContext();
  const days = new Set(ctx.days);
  if (opts.countToday) days.add(ctx.today);
  const streak = computeStreak(days, ctx.today);
  const b = boostsFor({ streakBoost: streak.boost, total: ctx.total, realmsSeen: ctx.settings?.realmsSeen, achievements: ctx.achievementCount });
  return { ...b, streak: streak.boost };
}

/** Award aura. Idempotent per id; a voided record is restored, never stacked. */
export async function awardAura(e: AwardEvent): Promise<AwardResult> {
  const db = getDB();
  const existing = await db.aura_ledger.get(e.id);
  if (existing && !existing.voided && !existing.deletedAt) return { record: existing, status: "exists" };
  if (existing) {
    const [restored] = (await putMany("aura_ledger", [{ ...existing, voided: false, deletedAt: null }]))!;
    return { record: restored, status: "restored" };
  }
  const at = e.at ?? now();
  let multiplier = 1;
  if (e.multiply !== false) {
    const b = await currentBoosts({ countToday: e.source === "task" });
    multiplier = b.total;
  }
  const ctx = await db.settings.get(SETTINGS_ID);
  const record: AuraRecord = {
    id: e.id,
    createdAt: at,
    updatedAt: at,
    deletedAt: null,
    base: e.base,
    multiplier: Math.round(multiplier * 10_000) / 10_000,
    amount: applyBoost(e.base, multiplier),
    reason: e.reason,
    source: e.source,
    day: gardenDay(at, ctx?.timezone),
    voided: false,
    projectId: e.projectId ?? null,
    refId: e.refId ?? null,
    at,
  };
  // Another tab or device may have written it between our read and write.
  const raced = await db.aura_ledger.get(e.id);
  if (raced && !raced.voided) return { record: raced, status: "exists" };
  await putMany("aura_ledger", [record], { keepTimestamps: true });
  return { record, status: "created" };
}

/** Void an award (un-ticking). Only that record; bonuses already earned stay. */
export async function voidAura(id: string) {
  const db = getDB();
  const rec = await db.aura_ledger.get(id);
  if (!rec || rec.voided) return null;
  await putMany("aura_ledger", [{ ...rec, voided: true }]);
  return rec;
}

export function taskAwardId(taskId: string, day: string) {
  return `task:${taskId}:complete:${day}`;
}

export function todayFor(tz?: string) {
  return todayKey(tz);
}
