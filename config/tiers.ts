/** Achievement tiers (brief 10.1, 11.1). */
export type Tier = "bronze" | "silver" | "gold" | "platinum" | "diamond" | "mythic" | "celestial";

export const TIERS: Tier[] = ["bronze", "silver", "gold", "platinum", "diamond", "mythic", "celestial"];

export const TIER_BONUS: Record<Tier, number> = {
  bronze: 250,
  silver: 1_000,
  gold: 5_000,
  platinum: 25_000,
  diamond: 100_000,
  mythic: 1_000_000,
  celestial: 10_000_000,
};

export const TIER_COLORS: Record<Tier, string> = {
  bronze: "#C08552",
  silver: "#A8B2BD",
  gold: "#E7B53C",
  platinum: "#8FD3D1",
  diamond: "#9CC9FF",
  mythic: "#C59BF5",
  celestial: "linear-gradient(120deg, #B79CF2, #F59FC6 52%, #FFD36E)",
};
