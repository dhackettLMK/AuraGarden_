/**
 * Levels (brief 7.3). Level n needs a lifetime total of 50 × (n − 1)^2.5 aura.
 * Levels never cap.
 */
export const LEVEL_BASE = 50;
export const LEVEL_EXPONENT = 2.5;

export function auraForLevel(n: number) {
  if (n <= 1) return 0;
  return Math.round(LEVEL_BASE * (n - 1) ** LEVEL_EXPONENT);
}

export function levelFor(total: number) {
  if (total <= 0) return 1;
  let n = Math.floor((total / LEVEL_BASE) ** (1 / LEVEL_EXPONENT)) + 1;
  // Guard against float drift at the boundaries.
  while (auraForLevel(n + 1) <= total) n++;
  while (n > 1 && auraForLevel(n) > total) n--;
  return n;
}

export function levelProgress(total: number) {
  const level = levelFor(total);
  const from = auraForLevel(level);
  const to = auraForLevel(level + 1);
  return { level, from, to, progress: (total - from) / (to - from), toGo: to - total };
}

/** Titles change at milestones. */
export const LEVEL_TITLES: [number, string][] = [
  [1, "Seedling"],
  [5, "Sprout"],
  [10, "Budding"],
  [20, "Blooming"],
  [30, "Glowing"],
  [40, "Radiant"],
  [50, "Main Character"],
  [75, "Aura Farmer"],
  [100, "Garden Legend"],
  [150, "Celestial"],
  [200, "Aurora"],
  [300, "Mythic"],
  [500, "Cosmic"],
  [750, "Infinite"],
  [1000, "Aura Deity"],
];

export function titleFor(level: number) {
  let t = LEVEL_TITLES[0][1];
  for (const [at, name] of LEVEL_TITLES) if (level >= at) t = name;
  return t;
}

/** Oscar's sprout grows with her level (brief 8.1). */
export type SproutStage = "sprout" | "bud" | "daisy" | "two" | "crown" | "aurora" | "golden";
export function sproutStageFor(level: number): SproutStage {
  if (level >= 1000) return "golden";
  if (level >= 300) return "aurora";
  if (level >= 100) return "crown";
  if (level >= 50) return "two";
  if (level >= 20) return "daisy";
  if (level >= 10) return "bud";
  return "sprout";
}
