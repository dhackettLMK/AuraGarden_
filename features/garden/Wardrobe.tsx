"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Lock } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Oscar } from "@/components/oscar/Oscar";
import { getDB } from "@/lib/db";
import { updateSettings } from "@/lib/data/settings";
import { useSettings } from "@/lib/hooks";
import { useGame } from "@/lib/game/GameProvider";
import { WARDROBE } from "@/config/wardrobe";
import { cn } from "@/lib/cn";

/** She chooses what Oscar wears from the accessories she has earned. */
export function Wardrobe({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const settings = useSettings();
  const game = useGame();
  const earned = useLiveQuery(async () => new Set((await getDB().achievements.toArray()).filter((a) => !a.deletedAt).map((a) => a.achievementId)), []);
  const outfit = settings?.oscarOutfit ?? null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Oscar's wardrobe" description="Earned through trophies. Pick what he wears.">
      <div className="mb-4 flex justify-center rounded-[24px] bg-primary-soft/60 py-4">
        <Oscar size={150} pose="proud" level={game.level} outfit={outfit} />
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <li>
          <button
            onClick={() => updateSettings({ oscarOutfit: null })}
            aria-pressed={!outfit}
            className={cn("flex h-full w-full flex-col items-center gap-1 rounded-2xl bg-surface-sunk p-3 text-center text-sm font-semibold", !outfit && "ring-2 ring-primary")}
          >
            <Oscar size={64} level={game.level} alive={false} />
            Just Oscar
          </button>
        </li>
        {WARDROBE.map((w) => {
          const have = earned?.has(w.earnedBy);
          return (
            <li key={w.id}>
              <button
                disabled={!have}
                onClick={() => updateSettings({ oscarOutfit: w.id })}
                aria-pressed={outfit === w.id}
                className={cn(
                  "relative flex h-full w-full flex-col items-center gap-1 rounded-2xl bg-surface-sunk p-3 text-center text-sm font-semibold",
                  outfit === w.id && "ring-2 ring-primary",
                  !have && "cursor-not-allowed",
                )}
              >
                <span className={cn(!have && "opacity-30 grayscale")}>
                  <Oscar size={64} level={game.level} outfit={w.id} alive={false} />
                </span>
                {w.name}
                {!have && (
                  <span className="flex items-center gap-1 text-xs font-medium text-ink-muted">
                    <Lock size={12} /> {w.how}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
