/**
 * Game actions: completing things, the bonuses that follow, and everything a
 * new total can trigger (levels, unlocks, realms). UI calls these; they write
 * through lib/data and hand celebrations to the celebration layer.
 */
import { AURA } from "@/config/aura";
import { levelFor, titleFor } from "@/config/levels";
import { REALMS, UNLOCKS, realmsOpenFor } from "@/config/realms";
import { pickLine, type LineCategory } from "@/config/oscar-lines";
import { getDB } from "../db";
import { alive, patch, put, putMany, now, baseRecord } from "../data/core";
import { blankTask, nextOccurrence } from "../data/tasks";
import { SETTINGS_ID } from "../data/settings";
import { gardenDay } from "../day";
import { formatAura } from "../format";
import type { GardenItemRecord, Task } from "../types";
import { awardAura, readGameContext, taskAwardId, voidAura } from "./aura";
import { celebrate } from "./celebrate-bus";
import { checkAchievements } from "./achievements-check";
import { realmBoost } from "./engine";

export interface CompleteOrigin {
  x: number;
  y: number;
}

async function ctxBasics() {
  const settings = await getDB().settings.get(SETTINGS_ID);
  const tz = settings?.timezone;
  return { settings, tz, at: now(), day: gardenDay(now(), tz) };
}

function lineFor(task: Task, kind: string | undefined, amount: number, name: string, multiplier: number) {
  let cat: LineCategory = "task";
  if (multiplier >= 3 && amount >= 1000) cat = "boosted";
  else if (kind && ["college", "swapnserve", "hurley", "martial"].includes(kind) && Math.random() < 0.5) cat = kind as LineCategory;
  return pickLine(cat, { name: Math.random() < 0.3 ? name : "", amount: formatAura(amount) });
}

/** Complete a task or to-do: the +25 moment (brief 7.5). */
export async function completeTask(task: Task, origin?: CompleteOrigin) {
  if (task.status === "done") return;
  const { settings, at, day } = await ctxBasics();
  const before = (await readGameContext(at)).total;

  await patch("tasks", task.id, { status: "done", completedAt: at });
  if (task.recurrence) {
    const from = task.dueDate ?? day;
    await put(
      "tasks",
      blankTask(
        {
          ...task,
          status: "todo",
          completedAt: null,
          dueDate: nextOccurrence(task.recurrence, from),
          subtasks: task.subtasks.map((s) => ({ ...s, done: false })),
        },
        task.order,
      ),
    );
  }

  const project = task.projectId ? await getDB().projects.get(task.projectId) : null;
  const base = task.big ? AURA.bigTask : AURA.task;
  const award = await awardAura({
    id: taskAwardId(task.id, day),
    base,
    reason: task.big ? `Big task: ${task.title}` : task.title,
    source: "task",
    projectId: task.projectId,
    refId: task.id,
    at,
  });

  if (award.status !== "exists") {
    celebrate({
      kind: "award",
      base: award.record.base,
      multiplier: award.record.multiplier,
      amount: award.record.amount,
      origin,
      line: lineFor(task, project?.kind, award.record.amount, settings?.displayName ?? "", award.record.multiplier),
    });
  }
  await awardBonuses(day, task.id, at);
  await afterAward(before);
}

async function awardBonuses(day: string, taskId: string, at: number) {
  const db = getDB();
  const { live, settings } = await readGameContext(at);
  const todays = live.filter((r) => r.source === "task" && r.day === day);

  // First completion of the day.
  if (todays.length >= 1) await awardAura({ id: `bonus:first:${day}`, base: AURA.firstOfDay, reason: "First of the day", source: "bonus", at });

  // Combo: 3 different tasks within 10 minutes, counted since the last combo.
  const lastCombo = Math.max(0, ...live.filter((r) => r.id.startsWith("bonus:combo:")).map((r) => r.at));
  const recent = live.filter((r) => r.source === "task" && r.at >= at - AURA.comboWindowMs && r.at > lastCombo);
  if (recent.length >= AURA.comboCount) {
    const res = await awardAura({ id: `bonus:combo:${taskId}:${day}`, base: AURA.combo, reason: "Combo", source: "bonus", at });
    if (res.status === "created") celebrate({ kind: "combo", amount: res.record.amount, line: pickLine("combo") });
  }

  // Daily goal: counts tasks, not aura.
  const goal = settings?.dailyGoal ?? 6;
  if (todays.length >= goal) {
    const res = await awardAura({ id: `bonus:goal:${day}`, base: AURA.dailyGoal, reason: "Daily goal", source: "bonus", at });
    if (res.status === "created") celebrate({ kind: "goal", amount: res.record.amount, line: pickLine("goal") });
  }

  // Clear the deck: every task due today and every Today item done (at least 3).
  const tasks = alive(await db.tasks.toArray());
  const dueToday = tasks.filter((t) => t.dueDate === day || (t.projectId === null && t.sectionId === "sec_mylist_today") || (t.today && !t.dueDate));
  const doneToday = dueToday.filter((t) => t.status === "done");
  if (dueToday.length >= AURA.clearDeckMinimum && doneToday.length === dueToday.length) {
    const res = await awardAura({ id: `bonus:deck:${day}`, base: AURA.clearDeck, reason: "Cleared the deck", source: "bonus", at });
    if (res.status === "created") celebrate({ kind: "deck", amount: res.record.amount, line: pickLine("deck") });
  }
}

/**
 * Everything a new total can trigger: level-ups, garden unlocks and realms.
 * Also checks achievements, which can award more aura (and loop once).
 */
export async function afterAward(before: number, depth = 0) {
  const db = getDB();
  const { total, settings } = await readGameContext();
  if (!settings) return;
  const changes: Partial<typeof settings> = {};

  // Levels. Several at once celebrate as one.
  const levelBefore = Math.max(settings.levelSeen ?? 1, levelFor(before));
  const levelNow = levelFor(total);
  if (levelNow > levelBefore) {
    changes.levelSeen = levelNow;
    celebrate({ kind: "levelup", from: levelBefore, to: levelNow, title: titleFor(levelNow), line: pickLine("levelup") });
  }

  // Garden unlocks (aura only goes up, so items are never taken away).
  const have = new Set((await db.garden_items.toArray()).map((g) => g.itemId));
  const fresh = UNLOCKS.filter((u) => u.at <= total && !have.has(u.id));
  if (fresh.length) {
    const t = now();
    const rows: GardenItemRecord[] = fresh.map((u) => ({
      ...baseRecord(`gi_${u.id}`),
      itemId: u.id,
      unlockedAt: t,
      auraAtUnlock: total,
      hidden: false,
      slot: null,
      variant: null,
      seen: false,
    }));
    await putMany("garden_items", rows);
    const realmsBefore = Math.max(settings.realmsSeen ?? 1, realmsOpenFor(before));
    const realmsNow = realmsOpenFor(total);
    if (realmsNow > realmsBefore) {
      changes.realmsSeen = realmsNow;
      const realm = REALMS[realmsNow - 1];
      celebrate({ kind: "realm", realm: realm.n, name: realm.name, boostFrom: realmBoost(realmsBefore), boostTo: realmBoost(realmsNow), line: pickLine("realm", { name: settings.displayName }) });
    }
    // Skip items that are realm entries (the realm sequence covers them); big jumps show the latest few.
    for (const u of fresh.filter((f) => !f.id.startsWith("realm-") && f.at > 0).slice(-3)) celebrate({ kind: "unlock", itemId: u.id, name: u.name, line: u.line ?? pickLine("unlock") });
  }

  if (Object.keys(changes).length) await patch("settings", SETTINGS_ID, changes);
  if (depth < 2) {
    const earnedSomething = await checkAchievements();
    if (earnedSomething) await afterAward(total, depth + 1);
  }
}

/** Un-ticking voids only that task's base award (brief 7.4). */
export async function uncompleteTask(task: Task) {
  if (task.status !== "done") return;
  await patch("tasks", task.id, { status: "todo", completedAt: null });
  const db = getDB();
  const awards = (await db.aura_ledger.where("refId").equals(task.id).toArray())
    .filter((r) => r.source === "task" && !r.voided)
    .sort((a, b) => b.at - a.at);
  if (awards[0]) await voidAura(awards[0].id);
}

/** Subtasks: +10 each (brief 7.1). */
export async function toggleSubtask(task: Task, subId: string) {
  const sub = task.subtasks.find((s) => s.id === subId);
  if (!sub) return;
  const done = !sub.done;
  await patch("tasks", task.id, { subtasks: task.subtasks.map((s) => (s.id === subId ? { ...s, done } : s)) });
  const { day, at } = await ctxBasics();
  const id = `subtask:${task.id}:${subId}:${day}`;
  if (done) {
    const before = (await readGameContext(at)).total;
    const res = await awardAura({ id, base: AURA.subtask, reason: sub.title, source: "subtask", projectId: task.projectId, refId: task.id, at });
    if (res.status !== "exists") celebrate({ kind: "award", base: res.record.base, multiplier: res.record.multiplier, amount: res.record.amount, line: pickLine("task", { amount: formatAura(res.record.amount) }), small: true });
    await afterAward(before);
  } else {
    await voidAura(id);
  }
}

/** Write a thought: +5, first 3 a day. */
export async function onThoughtWritten(thoughtId: string) {
  const { day, at } = await ctxBasics();
  const { live, total } = await readGameContext(at);
  if (live.some((r) => r.id === `thought:${thoughtId}`)) return;
  if (live.filter((r) => r.source === "thought" && r.day === day).length >= AURA.thoughtsPerDay) return;
  const res = await awardAura({ id: `thought:${thoughtId}`, base: AURA.thought, reason: "Wrote a thought", source: "thought", refId: thoughtId, at });
  if (res.status === "created") celebrate({ kind: "award", base: res.record.base, multiplier: res.record.multiplier, amount: res.record.amount, line: pickLine("thought"), small: true });
  await afterAward(total);
}

/** Add a contact: +5, first 5 a day. */
export async function onContactAdded(contactId: string) {
  const { day, at } = await ctxBasics();
  const { live, total } = await readGameContext(at);
  if (live.filter((r) => r.source === "contact" && r.day === day).length >= AURA.contactsPerDay) return;
  const res = await awardAura({ id: `contact:${contactId}`, base: AURA.contact, reason: "Added a contact", source: "contact", refId: contactId, at });
  if (res.status === "created") celebrate({ kind: "award", base: res.record.base, multiplier: res.record.multiplier, amount: res.record.amount, line: "A new face in the book!", small: true });
  await afterAward(total);
}

/** Log a catch-up: +10, once per person per day. */
export async function onCatchupLogged(contactId: string) {
  const { day, at } = await ctxBasics();
  const { total } = await readGameContext(at);
  const res = await awardAura({ id: `catchup:${contactId}:${day}`, base: AURA.catchup, reason: "Caught up with someone", source: "catchup", refId: contactId, at });
  if (res.status === "created") celebrate({ kind: "award", base: res.record.base, multiplier: res.record.multiplier, amount: res.record.amount, line: pickLine("catchup") });
  await afterAward(total);
}
