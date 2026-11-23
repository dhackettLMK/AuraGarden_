import type { ProjectKind } from "@/lib/types";

/** Project ranks (brief 10.3). Project aura needed for each rank. */
export interface Rank {
  name: string;
  at: number;
  /** Belt colour for Martial Arts ranks; badge colour otherwise. */
  color: string;
  /** Dan stripes on the black belt. */
  stripes?: number;
}

const BELTS: Rank[] = [
  { name: "White belt", at: 0, color: "#F4F1EA" },
  { name: "Yellow belt", at: 1_000, color: "#F2C94C" },
  { name: "Orange belt", at: 3_000, color: "#EE8A3A" },
  { name: "Green belt", at: 7_500, color: "#4E9A5B" },
  { name: "Blue belt", at: 15_000, color: "#3D6FB6" },
  { name: "Purple belt", at: 30_000, color: "#7D4FB0" },
  { name: "Brown belt", at: 60_000, color: "#7A4E2D" },
  { name: "Black belt", at: 125_000, color: "#1F1D1B" },
  ...[250e3, 500e3, 1e6, 2.5e6, 5e6, 10e6, 25e6, 50e6, 100e6].map((at, i) => ({
    name: `${ordinal(i + 2)} Dan`,
    at,
    color: "#1F1D1B",
    stripes: i + 2,
  })),
];

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const ladder = (names: string[], ats: number[], colors: string[]): Rank[] =>
  names.map((name, i) => ({ name, at: ats[i], color: colors[i % colors.length] }));

const STAR_COLORS = ["#C08552", "#A8B2BD", "#E7B53C", "#8FD3D1", "#9CC9FF", "#C59BF5"];

export const RANKS: Record<ProjectKind, Rank[]> = {
  martial: BELTS,
  college: ladder(
    ["Fresher", "Second Year", "Third Year", "Final Year", "Graduate", "Honours", "Masters", "PhD", "Professor", "President of SETU"],
    [0, 2_500, 7_500, 20_000, 50_000, 125_000, 300_000, 1e6, 5e6, 25e6],
    ["#8FA3B5", "#7D93A6", "#6B8396", "#5A7386", "#445463", "#3B4A58", "#33404C", "#2B3640", "#232C35", "#1C232A"],
  ),
  swapnserve: ladder(
    ["Volunteer", "Helper", "Organiser", "Team Lead", "Champion", "Community Hero", "Limerick Legend", "National Treasure"],
    [0, 2_500, 10_000, 30_000, 100_000, 500_000, 2.5e6, 25e6],
    ["#F9DC7A", "#F6C828", "#E8B417", "#D9A30A", "#C89200", "#B78200", "#A47300", "#8F6400"],
  ),
  hurley: ladder(
    ["Sub", "Starter", "Free-taker", "Captain", "County Star", "All-Star", "Hall of Fame"],
    [0, 2_500, 10_000, 50_000, 250_000, 2.5e6, 25e6],
    ["#EDC58C", "#E3A04A", "#D48C33", "#C47A24", "#B0681A", "#9A5813", "#84490E"],
  ),
  custom: [
    { name: "Seedling", at: 0, color: "#A9B3AC" },
    ...["Bronze star", "Silver star", "Gold star", "Platinum star", "Diamond star", "Mythic star"].map((name, i) => ({
      name,
      at: [1e3, 1e4, 1e5, 1e6, 1e7, 1e8][i],
      color: STAR_COLORS[i],
    })),
  ],
};

export function rankIndexFor(kind: ProjectKind, projectAura: number) {
  const ladder = RANKS[kind];
  let idx = 0;
  for (let i = 0; i < ladder.length; i++) if (projectAura >= ladder[i].at) idx = i;
  return idx;
}

export function rankFor(kind: ProjectKind, projectAura: number, overrides?: Record<number, string>) {
  const ladder = RANKS[kind];
  const idx = rankIndexFor(kind, projectAura);
  const rank = ladder[idx];
  const next = ladder[idx + 1] ?? null;
  return {
    index: idx,
    rank: { ...rank, name: overrides?.[idx]?.trim() || rank.name },
    next: next ? { ...next, name: overrides?.[idx + 1]?.trim() || next.name } : null,
    progress: next ? (projectAura - rank.at) / (next.at - rank.at) : 1,
  };
}
