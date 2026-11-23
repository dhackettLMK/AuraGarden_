/**
 * Lifetime stats for achievements and the Trophy Room, derived from data.
 * Pure: takes plain arrays so tests and the simulation can use it too.
 */
import type { Metric, SecretKey } from "@/config/achievements";
import { levelFor } from "@/config/levels";
import { realmsOpenFor } from "@/config/realms";
import { zonedParts, weekStart, weekdayOf, dayDiff, gardenDay } from "@/lib/day";
import type { AuraRecord, CalendarEvent, Catchup, Contact, Settings, Task, Thought } from "@/lib/types";
import { activeDaysOf, computeStreak, totalOf } from "./engine";

export interface StatsInput {
  ledger: AuraRecord[];
  tasks: Task[];
  thoughts: Thought[];
  contacts: Contact[];
  catchups: Catchup[];
  events: CalendarEvent[];
  gardenItems: number;
  settings?: Settings;
  today: string;
  createdAt?: number;
  now?: number;
}

export type Stats = Record<Metric, number> & { secrets: Set<SecretKey> };

export function computeStats(input: StatsInput & { projectKinds?: Map<string, string> }): Stats {
  const tz = input.settings?.timezone;
  const live = input.ledger.filter((r) => !r.voided && !r.deletedAt);
  const total = totalOf(live);
  const taskAwards = live.filter((r) => r.source === "task").sort((a, b) => a.at - b.at);
  const days = activeDaysOf(live);
  const streak = computeStreak(days, input.today);

  // Longest chain: consecutive completions each within 10 minutes of the last.
  let chain = 0;
  let run = 0;
  for (let i = 0; i < taskAwards.length; i++) {
    run = i > 0 && taskAwards[i].at - taskAwards[i - 1].at <= 10 * 60_000 ? run + 1 : 1;
    chain = Math.max(chain, run);
  }

  const dayAura = new Map<string, number>();
  for (const r of live) dayAura.set(r.day, (dayAura.get(r.day) ?? 0) + r.amount);
  const kindTasks: Record<string, number> = {};
  for (const r of taskAwards) {
    const k = r.projectId ? input.projectKinds?.get(r.projectId) : undefined;
    if (k) kindTasks[k] = (kindTasks[k] ?? 0) + 1;
  }
  let earlyBird = 0;
  const perDay = new Map<string, number>();
  const weekendCounts = new Map<string, number>();
  const secrets = new Set<SecretKey>();
  const birthday = input.settings?.birthday?.slice(-5); // MM-DD
  for (const r of taskAwards) {
    const p = zonedParts(r.at, tz);
    if (p.hour >= 3 && p.hour < 9) earlyBird++;
    perDay.set(r.day, (perDay.get(r.day) ?? 0) + 1);
    const wd = weekdayOf(r.day);
    if (wd === 0 || wd === 6) {
      const wk = weekStart(r.day);
      weekendCounts.set(wk, (weekendCounts.get(wk) ?? 0) + 1);
    }
    const md = r.day.slice(5);
    if (md === "03-17") secrets.add("stPatricks");
    if (md === "10-31") secrets.add("halloween");
    if (md === "12-25") secrets.add("christmas");
    if (md === "01-01") secrets.add("newYear");
    if (md.startsWith("12-")) secrets.add("firstWinter");
    if (birthday && md === birthday) secrets.add("birthday");
  }
  if ([...perDay.values()].some((n) => n >= 10)) secrets.add("tenTaskDay");
  if ((input.settings?.petCount ?? 0) >= 100) secrets.add("pets100");
  if ((input.settings?.openDays?.length ?? 0) >= 100) secrets.add("days100");
  const since = input.settings?.unwrappedAt ?? input.createdAt;
  if (since && dayDiff(gardenDay(since, tz), input.today) >= 365) secrets.add("oneYear");
  const tasks = input.tasks.filter((t) => !t.deletedAt);
  const byProject = new Map<string, Task[]>();
  for (const t of tasks) if (t.projectId) byProject.set(t.projectId, [...(byProject.get(t.projectId) ?? []), t]);
  for (const list of byProject.values()) if (list.length >= 5 && list.every((t) => t.status === "done")) secrets.add("projectDone");

  return {
    aura: total,
    tasks: taskAwards.length,
    bigTasks: taskAwards.filter((r) => r.base === 50).length,
    subtasks: live.filter((r) => r.source === "subtask").length,
    streak: streak.best,
    goals: live.filter((r) => r.id.startsWith("bonus:goal:")).length,
    decks: live.filter((r) => r.id.startsWith("bonus:deck:")).length,
    combos: live.filter((r) => r.id.startsWith("bonus:combo:")).length,
    chain,
    thoughts: input.thoughts.filter((t) => !t.deletedAt).length,
    contacts: input.contacts.filter((c) => !c.deletedAt).length,
    catchups: input.catchups.filter((c) => !c.deletedAt).length,
    events: input.events.filter((e) => !e.deletedAt).length,
    blocks: tasks.filter((t) => t.status === "done" && t.blockStart).length,
    items: input.gardenItems,
    realms: Math.max(realmsOpenFor(total), input.settings?.realmsSeen ?? 1),
    level: levelFor(total),
    earlyBird,
    weekends: [...weekendCounts.values()].filter((n) => n >= 5).length,
    activeDays: days.size,
    dayAura: Math.max(0, ...dayAura.values()),
    tasksCollege: kindTasks.college ?? 0,
    tasksSwapnserve: kindTasks.swapnserve ?? 0,
    tasksHurley: kindTasks.hurley ?? 0,
    tasksMartial: kindTasks.martial ?? 0,
    secrets,
  };
}
