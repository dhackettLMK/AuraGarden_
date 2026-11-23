/** Base aura (brief 7.1). Every base award is multiplied by her boosts. */
export const AURA = {
  task: 25,
  bigTask: 50,
  subtask: 10,
  firstOfDay: 10,
  combo: 15,
  comboCount: 3,
  comboWindowMs: 10 * 60_000,
  dailyGoal: 50,
  clearDeck: 100,
  clearDeckMinimum: 3,
  thought: 5,
  thoughtsPerDay: 3,
  catchup: 10,
  contact: 5,
  contactsPerDay: 5,
} as const;

/** Streak boost tiers (brief 7.2): [days, multiplier], ascending. */
export const STREAK_TIERS: [number, number][] = [
  [0, 1],
  [3, 1.1],
  [7, 1.25],
  [14, 1.5],
  [30, 2],
  [60, 2.5],
  [100, 3],
  [200, 4],
  [365, 5],
  [730, 7],
  [1000, 10],
];

/** ×2 for every realm opened beyond the first. */
export const REALM_BOOST_BASE = 2;

/** +1% for every achievement earned. */
export const TROPHY_BOOST_PER_ACHIEVEMENT = 0.01;

/** Completions within this window merge into one Oscar (brief 7.5). */
export const STACK_WINDOW_MS = 1500;
export const MAX_PITCH_STEPS = 5;
