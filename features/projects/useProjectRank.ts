"use client";

import { rankFor, RANKS } from "@/config/ranks";
import type { Project } from "@/lib/types";

export function projectRank(project: Pick<Project, "kind" | "rankNames">, aura: number) {
  return rankFor(project.kind, aura, project.rankNames);
}

/** The belt icon changes colour with her Martial Arts rank (brief 6.2). */
export function useProjectBelt(project: Pick<Project, "kind" | "icon" | "rankNames">, aura: number) {
  if (project.icon.kind !== "custom" || project.icon.name !== "belt") return undefined;
  if (project.kind !== "martial") return { color: RANKS.martial[0].color };
  const { rank } = rankFor("martial", aura, project.rankNames);
  return { color: rank.color, stripes: rank.stripes };
}

export { RANKS };
