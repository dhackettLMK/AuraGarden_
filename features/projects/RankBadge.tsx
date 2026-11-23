"use client";

import { cn } from "@/lib/cn";
import type { Project } from "@/lib/types";
import { projectRank } from "./useProjectRank";

/** The current rank as a small badge next to the project, everywhere (brief 10.3). */
export function RankBadge({ project, aura, compact = false, className }: { project: Project; aura: number; compact?: boolean; className?: string }) {
  const { rank, index } = projectRank(project, aura);
  if (compact && index === 0) return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-sunk font-semibold text-ink-muted",
        compact ? "h-6 px-2 text-[11px]" : "h-7 px-2.5 text-xs",
        className,
      )}
      title={rank.name}
    >
      <span className="h-2 w-2 rounded-full ring-1 ring-black/10" style={{ background: rank.color }} aria-hidden="true" />
      {compact ? shortRank(rank.name) : rank.name}
    </span>
  );
}

function shortRank(name: string) {
  return name.replace(" belt", "").replace(" star", "★");
}
