/**
 * Achievements (brief 10). Every one pays a one-time aura bonus by tier
 * (config/tiers.ts) and adds +1% to her permanent trophy boost.
 * Within each family, earlier thresholds get lower tiers; the top two
 * thresholds of a long family are Mythic and Celestial.
 */
import { RANKS } from "./ranks";
import { TIERS, TIER_BONUS, type Tier } from "./tiers";
import type { ProjectKind } from "@/lib/types";

export type Metric =
  | "aura"
  | "tasks"
  | "bigTasks"
  | "subtasks"
  | "streak"
  | "goals"
  | "decks"
  | "combos"
  | "chain"
  | "thoughts"
  | "contacts"
  | "catchups"
  | "events"
  | "blocks"
  | "items"
  | "realms"
  | "level"
  | "earlyBird"
  | "weekends"
  | "activeDays"
  | "dayAura"
  | "tasksCollege"
  | "tasksSwapnserve"
  | "tasksHurley"
  | "tasksMartial";

export type Family =
  | "aura"
  | "tasks"
  | "big"
  | "subtasks"
  | "streak"
  | "goals"
  | "decks"
  | "combos"
  | "thoughts"
  | "people"
  | "calendar"
  | "garden"
  | "levels"
  | "early"
  | "weekend"
  | "ranks"
  | "days"
  | "bestDay"
  | "projects"
  | "secret";

export interface Achievement {
  id: string;
  family: Family;
  name: string;
  description: string;
  tier: Tier;
  bonus: number;
  /** For threshold achievements. */
  metric?: Metric;
  threshold?: number;
  unit?: string;
  /** Rank achievements. */
  rank?: { kind: ProjectKind; index: number; projectId?: string };
  secret?: { key: SecretKey; hint: string };
  /** Project milestone families only show if she still has that project. */
  projectKind?: ProjectKind;
}

export type SecretKey =
  | "stPatricks"
  | "halloween"
  | "christmas"
  | "newYear"
  | "birthday"
  | "pets100"
  | "days100"
  | "oneYear"
  | "projectDone"
  | "tenTaskDay"
  | "firstWinter";

export const FAMILY_LABELS: Record<Family, string> = {
  aura: "Lifetime aura",
  tasks: "Tasks completed",
  big: "Big tasks",
  subtasks: "Subtasks",
  streak: "Streaks",
  goals: "Daily goals",
  decks: "Clear the deck",
  combos: "Combos",
  thoughts: "Thoughts",
  people: "People",
  calendar: "Calendar",
  garden: "Garden",
  levels: "Levels",
  early: "Early bird",
  weekend: "Weekend warrior",
  ranks: "Project ranks",
  days: "Days in the garden",
  bestDay: "Best day",
  projects: "Project milestones",
  secret: "Secrets",
};

/** Spread tiers over a family; long families end Mythic then Celestial. */
export function tiersFor(n: number): Tier[] {
  if (n >= 7) {
    const head = n - 2;
    return [...Array.from({ length: head }, (_, i) => TIERS[Math.min(4, Math.floor((i * 5) / head))]), "mythic", "celestial"];
  }
  // Shorter families climb one tier per threshold: Bronze, Silver, Gold…
  return Array.from({ length: n }, (_, i) => TIERS[Math.min(5, i)]);
}

const fmt = (n: number) => (n >= 1e9 ? `${n / 1e9}B` : n >= 1e6 ? `${n / 1e6}M` : n >= 1e3 && n % 1000 === 0 ? `${n / 1e3}K` : n.toLocaleString("en-IE"));

function family(
  fam: Family,
  metric: Metric,
  thresholds: number[],
  name: (n: number, i: number) => string,
  desc: (n: number) => string,
  unit: string,
  idPrefix: string = fam,
): Achievement[] {
  const tiers = tiersFor(thresholds.length);
  return thresholds.map((t, i) => ({
    id: `${idPrefix}-${t}`,
    family: fam,
    name: name(t, i),
    description: desc(t),
    tier: tiers[i],
    bonus: TIER_BONUS[tiers[i]],
    metric,
    threshold: t,
    unit,
  }));
}

export const KIND_NAMES: Record<ProjectKind, string> = {
  martial: "Martial Arts Training",
  college: "College Work",
  swapnserve: "Swap 'N' Serve",
  hurley: "Hurley Pop's",
  custom: "a project",
};

const PROJECT_TASKS = [25, 100, 250, 500, 1000, 2000];
const AURA_NAMES = ["Glow Up", "Shining", "Radiant Energy", "Millionaire Mindset", "Ten Million Vibes", "Hundred Million Club", "Billionaire Bloom"];
const TASK_NAMES = ["First Seed", "Getting Going", "Fifty Strong", "Centurion", "Five Hundred Club", "Grand Total", "Unstoppable", "Five Thousand", "Ten Thousand Tasks", "Legendary Lists", "Fifty Thousand", "The Hundred Thousand"];
const STREAK_NAMES = ["Hat Trick", "Week of You", "Fortnight Flow", "Monthly Magic", "Two Months Strong", "Triple Digits", "Two Hundred Days", "A Whole Year", "Five Hundred Days", "Two Years Glowing", "A Thousand Days"];

export const ACHIEVEMENTS: Achievement[] = [
  ...family("aura", "aura", [1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9], (_, i) => AURA_NAMES[i], (n) => `Earn ${fmt(n)} lifetime aura`, "aura"),
  ...family("tasks", "tasks", [1, 10, 50, 100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000], (_, i) => TASK_NAMES[i], (n) => `Complete ${fmt(n)} task${n === 1 ? "" : "s"}`, "tasks"),
  ...family("big", "bigTasks", [1, 10, 50, 100], (n) => (n === 1 ? "Big Deal" : `${n} Big Ones`), (n) => `Complete ${n} big task${n === 1 ? "" : "s"}`, "big tasks"),
  ...family("subtasks", "subtasks", [10, 100, 1000], (n) => (n === 10 ? "Little Steps" : n === 100 ? "Step by Step" : "A Thousand Steps"), (n) => `Tick ${fmt(n)} subtasks`, "subtasks"),
  ...family("streak", "streak", [3, 7, 14, 30, 60, 100, 200, 365, 500, 730, 1000], (_, i) => STREAK_NAMES[i], (n) => `Reach a ${fmt(n)}-day streak`, "days"),
  ...family("goals", "goals", [1, 7, 30, 100, 250, 500, 1000], (n) => (n === 1 ? "Goal!" : `${fmt(n)} Goals`), (n) => `Hit your daily goal ${fmt(n)} time${n === 1 ? "" : "s"}`, "goals"),
  ...family("decks", "decks", [1, 10, 50, 100, 365], (n) => (n === 1 ? "Clean Slate" : `Deck Cleared ×${n}`), (n) => `Clear the deck ${n} time${n === 1 ? "" : "s"}`, "clear decks"),
  ...family("combos", "combos", [1, 25, 100, 500, 1000], (n) => (n === 1 ? "Combo!" : `${fmt(n)} Combos`), (n) => `Land ${fmt(n)} combo${n === 1 ? "" : "s"}`, "combos"),
  ...family("combos", "chain", [5, 10, 20], (n) => `Chain of ${n}`, (n) => `Finish ${n} tasks in a row, each within 10 minutes`, "in a row", "chain"),
  ...family("thoughts", "thoughts", [1, 10, 50, 100, 365, 1000], (n) => (n === 1 ? "Dear Diary" : `${fmt(n)} Thoughts`), (n) => `Write ${fmt(n)} thought${n === 1 ? "" : "s"}`, "thoughts"),
  ...family("people", "contacts", [10, 50, 100, 250], (n) => `${n} Friends`, (n) => `Add ${n} contacts`, "contacts", "contacts"),
  ...family("people", "catchups", [10, 50, 100, 500], (n) => `${n} Catch-ups`, (n) => `Log ${n} catch-ups`, "catch-ups", "catchups"),
  ...family("calendar", "events", [10, 100, 1000], (n) => `${fmt(n)} Plans`, (n) => `Plan ${fmt(n)} events`, "events", "events"),
  ...family("calendar", "blocks", [10, 100, 1000], (n) => `${fmt(n)} Time Blocks`, (n) => `Complete ${fmt(n)} time-blocked tasks`, "blocks", "blocks"),
  ...family("garden", "items", [10, 25, 50, 100], (n) => `${n} Things Growing`, (n) => `Unlock ${n} garden items`, "items", "items"),
  ...[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n, i): Achievement => {
    const tier = tiersFor(9)[i];
    return { id: `realm-${n}`, family: "garden", name: `Realm ${n}`, description: `Open realm ${n}`, tier, bonus: TIER_BONUS[tier], metric: "realms", threshold: n, unit: "realms" };
  }),
  ...family("levels", "level", [10, 25, 50, 100, 250, 500, 1000], (n) => `Level ${fmt(n)}`, (n) => `Reach level ${fmt(n)}`, "level"),
  ...family("early", "earlyBird", [10, 100, 1000], (n) => (n === 10 ? "Early Bird" : n === 100 ? "Dawn Chorus" : "Sunrise Legend"), (n) => `Complete ${fmt(n)} tasks before 9 a.m.`, "early tasks"),
  ...family("weekend", "weekends", [1, 10, 52], (n) => (n === 1 ? "Weekend Warrior" : `${n} Weekends`), (n) => `Do 5+ tasks on ${n} weekend${n === 1 ? "" : "s"}`, "weekends"),
  ...family("days", "activeDays", [10, 20, 30, 50, 75, 100, 150, 200, 250, 300, 365, 500, 730, 1000, 1250, 1500, 1826], (n) => (n === 365 ? "A Year of Days" : n === 730 ? "Two Years of Days" : n === 1826 ? "Five Years of You" : `${fmt(n)} Good Days`), (n) => `Complete something on ${fmt(n)} different days`, "days", "days"),
  ...family("bestDay", "dayAura", [1000, 10_000, 100_000, 1e6, 10e6, 100e6], (n) => `${fmt(n)} Day`, (n) => `Earn ${fmt(n)} aura in a single day`, "aura in a day", "bestday"),
  ...projectMilestones(),
  ...starterRanks(),
  ...secrets(),
];

function projectMilestones(): Achievement[] {
  const kinds: [ProjectKind, Metric][] = [
    ["college", "tasksCollege"],
    ["swapnserve", "tasksSwapnserve"],
    ["hurley", "tasksHurley"],
    ["martial", "tasksMartial"],
  ];
  return kinds.flatMap(([kind, metric]) =>
    family("projects", metric, PROJECT_TASKS, (n) => `${KIND_NAMES[kind]}: ${fmt(n)}`, (n) => `Complete ${fmt(n)} tasks in ${KIND_NAMES[kind]}`, "tasks", `project-${kind}`).map((a) => ({ ...a, rank: undefined, projectKind: kind })),
  );
}

function rankTier(index: number, len: number): Tier {
  return tiersFor(len - 1)[index - 1];
}

/** Every rank of the four starter ladders (rank 0 is where she starts). */
function starterRanks(): Achievement[] {
  const out: Achievement[] = [];
  for (const kind of ["martial", "college", "swapnserve", "hurley"] as ProjectKind[]) {
    const ladder = RANKS[kind];
    ladder.forEach((r, i) => {
      if (i === 0) return;
      const tier = rankTier(i, ladder.length);
      out.push({ id: `rank-${kind}-${i}`, family: "ranks", name: r.name, description: `Reach ${r.name} in ${KIND_NAMES[kind]}`, tier, bonus: TIER_BONUS[tier], rank: { kind, index: i } });
    });
  }
  return out;
}


/** Projects she creates get their own rank family automatically. */
export function customRankAchievements(projectId: string, projectName: string): Achievement[] {
  const ladder = RANKS.custom;
  return ladder.slice(1).map((r, k) => {
    const i = k + 1;
    const tier = rankTier(i, ladder.length);
    return { id: `rank-${projectId}-${i}`, family: "ranks", name: `${projectName}: ${r.name}`, description: `Reach ${r.name} in ${projectName}`, tier, bonus: TIER_BONUS[tier], rank: { kind: "custom", index: i, projectId } };
  });
}

function secrets(): Achievement[] {
  const list: [SecretKey, string, string, string, Tier][] = [
    ["stPatricks", "Lá Fhéile Pádraig", "Finish a task on St Patrick's Day", "Something green happens in March.", "silver"],
    ["halloween", "Spooky Productive", "Finish a task on Halloween", "Boo. Try the last day of October.", "silver"],
    ["christmas", "Christmas Cracker", "Finish a task on Christmas Day", "Even on the 25th of December?", "gold"],
    ["newYear", "New Year, Same Legend", "Finish a task on New Year's Day", "Start the year the way you mean to go on.", "silver"],
    ["birthday", "Birthday Glow", "Finish a task on your birthday", "On your special day (set it in Settings).", "gold"],
    ["pets100", "Oscar's Best Friend", "Pet Oscar 100 times", "Oscar loves a pat. A lot of pats.", "silver"],
    ["days100", "Regular", "Open AuraGarden on 100 different days", "Keep coming back.", "gold"],
    ["oneYear", "One Year of Garden", "One year since your unwrap", "Time flies when you're glowing.", "platinum"],
    ["projectDone", "Project Complete", "Finish every task in a project (at least 5)", "Empty a whole project.", "gold"],
    ["tenTaskDay", "Ten in a Day", "Complete 10 tasks in one day", "A very, very good day.", "silver"],
    ["firstWinter", "First Winter", "Finish any task in December", "Cosy season.", "bronze"],
  ];
  return list.map(([key, name, description, hint, tier]) => ({ id: `secret-${kebab(key)}`, family: "secret", name, description, tier, bonus: TIER_BONUS[tier], secret: { key, hint } }));
}

function kebab(s: string) {
  return s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase().replace(/(\d+)/, "-$1").replace(/--/g, "-");
}

export function achievementById(id: string, extra: Achievement[] = []) {
  return ACHIEVEMENTS.find((a) => a.id === id) ?? extra.find((a) => a.id === id);
}
