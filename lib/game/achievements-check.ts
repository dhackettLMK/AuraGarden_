/**
 * Checks every achievement against current stats, records new ones, pays
 * their one-time (unmultiplied) bonus and hands them to the celebration layer.
 */
import { ACHIEVEMENTS, customRankAchievements, type Achievement } from "@/config/achievements";
import { rankIndexFor, RANKS } from "@/config/ranks";
import { WARDROBE } from "@/config/wardrobe";
import { pickLine } from "@/config/oscar-lines";
import { getDB } from "../db";
import { alive, baseRecord, putMany } from "../data/core";
import { SETTINGS_ID } from "../data/settings";
import { gardenDay } from "../day";
import type { AchievementRecord } from "../types";
import { awardAura } from "./aura";
import { celebrate } from "./celebrate-bus";
import { computeStats, type Stats } from "./stats";

export function isEarned(a: Achievement, stats: Stats, projectAura: Map<string, number>, kindAura: Map<string, number>) {
  if (a.metric && a.threshold !== undefined) return stats[a.metric] >= a.threshold;
  if (a.secret) return stats.secrets.has(a.secret.key);
  if (a.rank) {
    const aura = a.rank.projectId ? (projectAura.get(a.rank.projectId) ?? 0) : (kindAura.get(a.rank.kind) ?? 0);
    return rankIndexFor(a.rank.kind, aura) >= a.rank.index;
  }
  return false;
}

/** Progress towards an achievement, 0..1, with current/target for the Trophy Room. */
export function progressOf(a: Achievement, stats: Stats, projectAura: Map<string, number>, kindAura: Map<string, number>) {
  if (a.metric && a.threshold !== undefined) return { current: stats[a.metric], target: a.threshold, ratio: Math.min(1, stats[a.metric] / a.threshold) };
  if (a.rank) {
    const aura = a.rank.projectId ? (projectAura.get(a.rank.projectId) ?? 0) : (kindAura.get(a.rank.kind) ?? 0);
    const target = RANKS[a.rank.kind][a.rank.index].at;
    return { current: aura, target, ratio: Math.min(1, aura / target) };
  }
  return { current: stats.secrets.has(a.secret!.key) ? 1 : 0, target: 1, ratio: stats.secrets.has(a.secret!.key) ? 1 : 0 };
}

export async function loadAchievementContext() {
  const db = getDB();
  const [ledger, tasks, thoughts, contacts, catchups, events, items, settings, projects, records] = await Promise.all([
    db.aura_ledger.toArray(),
    db.tasks.toArray(),
    db.thoughts.toArray(),
    db.contacts.toArray(),
    db.catchups.toArray(),
    db.events.toArray(),
    db.garden_items.count(),
    db.settings.get(SETTINGS_ID),
    db.projects.toArray(),
    db.achievements.toArray(),
  ]);
  const today = gardenDay(Date.now(), settings?.timezone);
  const projectKinds = new Map(projects.map((p) => [p.id, p.kind as string]));
  const stats = computeStats({ ledger, tasks, thoughts, contacts, catchups, events, gardenItems: items, settings, today, createdAt: settings?.createdAt, projectKinds });
  const projectAura = new Map<string, number>();
  for (const r of ledger) if (!r.voided && !r.deletedAt && r.projectId) projectAura.set(r.projectId, (projectAura.get(r.projectId) ?? 0) + r.amount);
  const liveProjects = alive(projects);
  // Starter ladders track the project of that kind (her first one, if several).
  const kindAura = new Map<string, number>();
  for (const p of liveProjects) if (p.kind !== "custom" && !kindAura.has(p.kind)) kindAura.set(p.kind, projectAura.get(p.id) ?? 0);
  const custom = liveProjects.filter((p) => p.kind === "custom").flatMap((p) => customRankAchievements(p.id, p.name));
  const starterKinds = new Set(liveProjects.map((p) => p.kind));
  const all = [...ACHIEVEMENTS.filter((a) => (!a.rank || starterKinds.has(a.rank.kind)) && (!a.projectKind || starterKinds.has(a.projectKind))), ...custom];
  return { stats, projectAura, kindAura, all, earned: new Map(records.filter((r) => !r.deletedAt).map((r) => [r.achievementId, r])), projects: liveProjects, catalogue: [...ACHIEVEMENTS, ...custom] };
}

export async function checkAchievements(): Promise<boolean> {
  const ctx = await loadAchievementContext();
  const fresh = ctx.all.filter((a) => !ctx.earned.has(a.id) && isEarned(a, ctx.stats, ctx.projectAura, ctx.kindAura));
  if (!fresh.length) return false;
  const t = Date.now();
  const rows: AchievementRecord[] = fresh.map((a) => ({ ...baseRecord(`ach_${a.id}`), achievementId: a.id, earnedAt: t, bonus: a.bonus, seen: false }));
  await putMany("achievements", rows);
  for (const a of fresh) {
    await awardAura({ id: `ach:${a.id}`, base: a.bonus, reason: `Trophy: ${a.name}`, source: a.rank ? "rank" : "achievement", multiply: false, refId: a.id, projectId: a.rank?.projectId ?? (a.rank ? ctx.projects.find((p) => p.kind === a.rank!.kind)?.id : null) ?? null });
  }
  // Celebrate the most recent few so a big jump doesn't bury her in cards.
  for (const a of fresh.slice(-3)) {
    if (a.rank) {
      const project = a.rank.projectId ? ctx.projects.find((p) => p.id === a.rank!.projectId) : ctx.projects.find((p) => p.kind === a.rank!.kind);
      const rank = RANKS[a.rank.kind][a.rank.index];
      const belt = a.rank.kind === "martial";
      celebrate({ kind: "rank", projectId: project?.id ?? "", projectName: project?.name ?? "", rank: project?.rankNames?.[a.rank.index] || rank.name, color: rank.color, belt, line: pickLine(belt ? "belt" : "rank") });
    } else {
      const outfit = WARDROBE.find((w) => w.earnedBy === a.id);
      celebrate({ kind: "achievement", achievementId: a.id, name: a.name, tier: a.tier, bonus: a.bonus, line: outfit ? `I've a new ${outfit.name.toLowerCase()}! Check the wardrobe.` : pickLine("achievement") });
    }
  }
  return true;
}
