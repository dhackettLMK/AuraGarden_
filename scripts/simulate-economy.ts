/**
 * Economy simulation (brief 10.5). Runs 5 years of use at 3, 6 and 10 tasks a
 * day (with occasional missed days) against the real config files and the
 * real boost and streak rules, and prints when each realm, level title and
 * achievement lands, plus whether the pacing targets are met.
 *
 *   npx tsx scripts/simulate-economy.ts          # print
 *   npx tsx scripts/simulate-economy.ts --write  # also write docs/ECONOMY.md
 */
import { writeFileSync } from "node:fs";
import { AURA } from "../config/aura";
import { ACHIEVEMENTS, type Achievement } from "../config/achievements";
import { LEVEL_TITLES, levelFor } from "../config/levels";
import { RANKS, rankIndexFor } from "../config/ranks";
import { REALMS, UNLOCKS, realmsOpenFor } from "../config/realms";
import { addDays, weekdayOf, weekStart } from "../lib/day";
import { applyBoost, boostsFor, computeStreak } from "../lib/game/engine";
import { isEarned } from "../lib/game/achievements-check";
import type { Stats } from "../lib/game/stats";
import { CORNER_STAGES } from "../components/garden/art/corners";

const START = "2026-12-01";
const DAYS = Math.round(365.25 * 5);
const DAILY_GOAL = 6;

// Deterministic randomness so runs are comparable while tuning.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

interface Milestone {
  day: number;
  what: string;
}

interface Result {
  tpd: number;
  total: number;
  milestones: Milestone[];
  newThingDays: number[];
  withLevels: number[];
  achievements: number;
  level: number;
}

const PROJECT_WEIGHTS: [string, number][] = [
  ["college", 0.38],
  ["martial", 0.22],
  ["swapnserve", 0.18],
  ["hurley", 0.12],
  ["none", 0.1],
];

function simulate(tpd: number, seed = 7): Result {
  const r = rng(seed * 101 + tpd);
  let total = 0;
  const activeDays: string[] = [];
  const earned = new Set<string>();
  const projectAura = new Map<string, number>();
  const milestones: Milestone[] = [];
  const newThingDays: number[] = [];
  const withLevels: number[] = [];
  const unlocked = new Set<string>();
  let realmsSeen = 1;
  let levelSeen = 1;
  const rankSeen = new Map<string, number>();
  const cornerSeen = new Map<string, number>();
  const stats: Stats = {
    aura: 0, tasks: 0, bigTasks: 0, subtasks: 0, streak: 0, goals: 0, decks: 0, combos: 0, chain: 0,
    thoughts: 0, contacts: 0, catchups: 0, events: 0, blocks: 0, items: 0, realms: 1, level: 1, earlyBird: 0, weekends: 0,
    activeDays: 0, dayAura: 0, tasksCollege: 0, tasksSwapnserve: 0, tasksHurley: 0, tasksMartial: 0,
    secrets: new Set(),
  };
  const weekendTasks = new Map<string, number>();
  const marks = [1e6, 1e7, 1e8, 1e9];
  let breakUntil = -1;

  for (let d = 0; d < DAYS; d++) {
    const day = addDays(START, d);
    let somethingNew = false;
    let levelledUp = false;
    // Occasional missed days, plus a few short breaks a year (exams, holidays).
    if (d % 122 === 80) breakUntil = d + 1 + Math.floor(r() * 2);
    const missed = d <= breakUntil || r() < 0.04;
    if (missed) continue;

    activeDays.push(day);
    stats.activeDays = activeDays.length;
    const dayStart = total;
    const streak = computeStreak(activeDays, day);
    stats.streak = Math.max(stats.streak, streak.best);
    const n = Math.max(1, Math.round(tpd + (r() - 0.5) * 2.4));
    const boost = () => boostsFor({ streakBoost: streak.boost, total, realmsSeen, achievements: earned.size }).total;

    // Completion times: sessions of 1–4 tasks, 4 minutes apart.
    let minute = 7 * 60 + Math.floor(r() * 180);
    let sinceCombo = 0;
    let chainRun = 0;
    for (let i = 0; i < n; i++) {
      const big = r() < 0.12;
      const base = big ? AURA.bigTask : AURA.task;
      const amt = applyBoost(base, boost());
      total += amt;
      const pr = r();
      let acc = 0;
      const project = PROJECT_WEIGHTS.find(([, w]) => (acc += w) >= pr)![0];
      if (project !== "none") projectAura.set(project, (projectAura.get(project) ?? 0) + amt);
      if (project === "college") stats.tasksCollege++;
      if (project === "swapnserve") stats.tasksSwapnserve++;
      if (project === "hurley") stats.tasksHurley++;
      if (project === "martial") stats.tasksMartial++;
      stats.tasks++;
      if (big) stats.bigTasks++;
      if (minute < 9 * 60) stats.earlyBird++;
      const sameSession = i > 0 && r() < 0.6;
      minute += sameSession ? 4 : 40 + Math.floor(r() * 180);
      chainRun = sameSession ? chainRun + 1 : 1;
      stats.chain = Math.max(stats.chain, chainRun);
      sinceCombo = sameSession ? sinceCombo + 1 : 1;
      if (sinceCombo >= AURA.comboCount) {
        total += applyBoost(AURA.combo, boost());
        stats.combos++;
        sinceCombo = 0;
      }
    }
    total += applyBoost(AURA.firstOfDay, boost());
    if (n >= DAILY_GOAL) {
      total += applyBoost(AURA.dailyGoal, boost());
      stats.goals++;
    }
    if (n >= AURA.clearDeckMinimum && r() < 0.3) {
      total += applyBoost(AURA.clearDeck, boost());
      stats.decks++;
    }
    // Life outside tasks: subtasks, thoughts, people, calendar.
    if (r() < 0.7) {
      total += applyBoost(AURA.subtask, boost());
      stats.subtasks++;
    }
    if (r() < 0.55) {
      total += applyBoost(AURA.thought, boost());
      stats.thoughts++;
    }
    if (r() < (d < 60 ? 0.35 : 0.04)) {
      total += applyBoost(AURA.contact, boost());
      stats.contacts++;
    }
    if (r() < 0.22) {
      total += applyBoost(AURA.catchup, boost());
      stats.catchups++;
    }
    if (r() < 0.5) stats.events++;
    if (r() < 0.3) stats.blocks++;
    const wd = weekdayOf(day);
    if (wd === 0 || wd === 6) {
      const wk = weekStart(day);
      weekendTasks.set(wk, (weekendTasks.get(wk) ?? 0) + n);
      stats.weekends = [...weekendTasks.values()].filter((x) => x >= 5).length;
    }
    const md = day.slice(5);
    if (md.startsWith("12-")) stats.secrets.add("firstWinter");
    if (md === "03-17") stats.secrets.add("stPatricks");
    if (md === "10-31") stats.secrets.add("halloween");
    if (md === "12-25") stats.secrets.add("christmas");
    if (md === "01-01") stats.secrets.add("newYear");
    if (n >= 10) stats.secrets.add("tenTaskDay");
    if (activeDays.length >= 100) stats.secrets.add("days100");
    if (d >= 365) stats.secrets.add("oneYear");
    if (d > 40) stats.secrets.add("pets100");

    stats.dayAura = Math.max(stats.dayAura, total - dayStart);
    // Settle: unlocks, realms, levels, ranks and achievements (which loop once or twice).
    for (let pass = 0; pass < 3; pass++) {
      stats.aura = total;
      const fresh = UNLOCKS.filter((u) => u.at <= total && !unlocked.has(u.id));
      for (const u of fresh) unlocked.add(u.id);
      if (fresh.some((u) => u.at > 0)) somethingNew = true;
      stats.items = unlocked.size;
      const realms = realmsOpenFor(total);
      if (realms > realmsSeen) {
        for (let k = realmsSeen + 1; k <= realms; k++) milestones.push({ day: d, what: `Realm ${k}: ${REALMS[k - 1].name}` });
        realmsSeen = realms;
      }
      stats.realms = realmsSeen;
      const level = levelFor(total);
      stats.level = level;
      for (const [at, title] of LEVEL_TITLES) if (at > levelSeen && at <= level) milestones.push({ day: d, what: `Level ${at}: ${title}` });
      if (level > levelSeen) levelledUp = true;
      levelSeen = Math.max(levelSeen, level);
      for (const kind of ["college", "martial", "swapnserve", "hurley"] as const) {
        const stage = CORNER_STAGES.filter((x) => (projectAura.get(kind) ?? 0) >= x).length;
        if (stage > (cornerSeen.get(kind) ?? 0)) {
          cornerSeen.set(kind, stage);
          somethingNew = true;
        }
        const idx = rankIndexFor(kind, projectAura.get(kind) ?? 0);
        if (idx > (rankSeen.get(kind) ?? 0)) {
          rankSeen.set(kind, idx);
          somethingNew = true;
        }
      }
      const kindAura = new Map([...projectAura.entries()]);
      const fresh2 = ACHIEVEMENTS.filter((a: Achievement) => !earned.has(a.id) && isEarned(a, stats, new Map(), kindAura));
      if (!fresh2.length) break;
      somethingNew = true;
      for (const a of fresh2) {
        earned.add(a.id);
        total += a.bonus;
        if (a.tier === "mythic" || a.tier === "celestial" || a.id === "streak-365") milestones.push({ day: d, what: `${a.tier} trophy: ${a.name}` });
      }
    }
    for (const m of marks) if (total >= m && !milestones.some((x) => x.what === `${fmt(m)} aura`)) milestones.push({ day: d, what: `${fmt(m)} aura` });
    if (somethingNew) newThingDays.push(d);
    if (somethingNew || levelledUp) withLevels.push(d);
  }
  return { tpd, total, milestones, newThingDays, withLevels, achievements: earned.size, level: levelFor(total) };
}

function fmt(n: number) {
  if (n >= 1e12) return `${+(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${+(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${+(n / 1e6).toFixed(2)}M`;
  return Math.round(n).toLocaleString("en-IE");
}

const month = (d: number) => d / 30.44;

function maxGap(days: number[], from: number, to: number) {
  const inRange = [from - 1, ...days.filter((d) => d >= from && d < to), to];
  let gap = 0;
  for (let i = 1; i < inRange.length; i++) gap = Math.max(gap, inRange[i] - inRange[i - 1]);
  return gap;
}

function firstDay(res: Result, what: string) {
  return res.milestones.find((m) => m.what.startsWith(what))?.day;
}

const results = [3, 6, 10].map((t) => simulate(t));
const six = results[1];
const checks: [string, boolean, string][] = [];
if (process.argv.includes("--gaps")) {
  const days = six.withLevels;
  for (let i = 1; i < days.length; i++) if (days[i] - days[i - 1] > (days[i] < 30 ? 2 : days[i] < 365 ? 7 : 14)) console.log(`gap ${days[i - 1]}→${days[i]} (${days[i] - days[i - 1]} days)`);
}
const cadence: [string, number, number, number][] = [
  ["Month 1: something new at least every 2 days", 0, 30, 2],
  ["Months 2–12: something new at least weekly", 30, 365, 7],
  ["Years 2–5: something new at least every 2 weeks", 365, DAYS, 14],
];
for (const [name, from, to, limit] of cadence) {
  const strict = maxGap(six.newThingDays, from, to);
  const loose = maxGap(six.withLevels, from, to);
  checks.push([name, loose <= limit, `longest gap ${loose} days counting level-ups · ${strict} days for unlocks, trophies and ranks only`]);
}
const near = (what: string, target: number, tol: number) => {
  const d = firstDay(six, what);
  const m = d === undefined ? Infinity : month(d);
  checks.push([`${what} around month ${target}`, Math.abs(m - target) <= tol, d === undefined ? "never" : `month ${m.toFixed(1)}`]);
};
near("Realm 2", 2, 1);
near("Realm 4", 6, 1.5);
near("1M aura", 8, 2);
near("10M aura", 19, 3);
near("100M aura", 42, 6);
const billion = firstDay(six, "1B aura");
checks.push(["1B aura stays a mythic, multi-year goal", billion === undefined || month(billion) >= 36, billion === undefined ? "not within 5 years" : `month ${month(billion).toFixed(1)}`]);
const lvl1000 = firstDay(six, "Level 1000");
checks.push(["Level 1,000 stays a mythic, multi-year goal", lvl1000 === undefined || month(lvl1000) >= 36, lvl1000 === undefined ? "not within 5 years" : `month ${month(lvl1000).toFixed(1)}`]);

let out = `# AuraGarden economy\n\nGenerated by \`npx tsx scripts/simulate-economy.ts --write\` against the real config (\`config/aura.ts\`, \`config/realms.ts\`, \`config/levels.ts\`, \`config/achievements.ts\`, \`config/ranks.ts\`) and the real boost and streak rules in \`lib/game/engine.ts\`. Five years of use, starting 1 December, with about 4% of days missed at random plus a short two- or three-day break every four months.\n\n`;
out += `## Pacing targets (6 tasks a day)\n\n| Target | Result | |\n| --- | --- | --- |\n`;
for (const [name, ok, detail] of checks) out += `| ${name} | ${detail} | ${ok ? "✅" : "❌"} |\n`;
out += `\n## Milestones\n\n| Milestone | 3 tasks/day | 6 tasks/day | 10 tasks/day |\n| --- | --- | --- | --- |\n`;
const names = [...new Set(results.flatMap((r) => r.milestones.map((m) => m.what)))];
const order = (w: string) => Math.min(...results.map((r) => r.milestones.find((m) => m.what === w)?.day ?? 1e9));
for (const w of names.sort((a, b) => order(a) - order(b))) {
  out += `| ${w} | ${results.map((r) => {
    const d = r.milestones.find((m) => m.what === w)?.day;
    return d === undefined ? "—" : `month ${month(d).toFixed(1)}`;
  }).join(" | ")} |\n`;
}
out += `\n## After five years\n\n| | 3 tasks/day | 6 tasks/day | 10 tasks/day |\n| --- | --- | --- | --- |\n`;
out += `| Lifetime aura | ${results.map((r) => fmt(r.total)).join(" | ")} |\n`;
out += `| Level | ${results.map((r) => r.level.toLocaleString("en-IE")).join(" | ")} |\n`;
out += `| Achievements | ${results.map((r) => `${r.achievements} / ${ACHIEVEMENTS.length}`).join(" | ")} |\n`;
out += `\n## Robustness across random seeds (6 tasks a day)\n\nThe random misses and session patterns change with the seed, so the cadence gaps wobble by a few days. Longest gap counting level-ups, then counting only unlocks, trophies and ranks:\n\n| Seed | Month 1 (target 2) | Months 2–12 (target 7) | Years 2–5 (target 14) | 10M aura | 100M aura |\n| --- | --- | --- | --- | --- | --- |\n`;
for (const seed of [1, 3, 5, 7]) {
  const r = simulate(6, seed);
  const gaps = cadence.map(([, from, to]) => `${maxGap(r.withLevels, from, to)} · ${maxGap(r.newThingDays, from, to)}`);
  const at = (w: string) => {
    const d = firstDay(r, w);
    return d === undefined ? "—" : `month ${month(d).toFixed(1)}`;
  };
  out += `| ${seed}${seed === 7 ? " (default)" : ""} | ${gaps.join(" | ")} | ${at("10M aura")} | ${at("100M aura")} |\n`;
}
out += `\nIn later years the aura-based rewards are geometric while her growth is steady, so between garden unlocks the steady drumbeat comes from level-ups (each one is a celebrated moment with its own card), the "Days in the garden" trophies and project milestones.\n`;
out += `\nRank ladders for reference: ${Object.entries(RANKS).map(([k, v]) => `${k} ${v.length} ranks`).join(", ")}.\n`;

console.log(out);
if (process.argv.includes("--write")) {
  writeFileSync("docs/ECONOMY.md", out);
  console.log("Wrote docs/ECONOMY.md");
}
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
