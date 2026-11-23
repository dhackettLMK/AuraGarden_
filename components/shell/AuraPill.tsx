"use client";

import { Cloud, CloudOff, CloudAlert, RefreshCw } from "lucide-react";
import { AuraOrb } from "@/components/icons/AuraOrb";
import { useGame } from "@/lib/game/GameProvider";
import { formatAura } from "@/lib/format";
import { useSettings } from "@/lib/hooks";
import { useUI } from "@/lib/ui-store";
import { useSyncStatus } from "@/lib/sync/status";
import { Odometer } from "@/components/ui/Odometer";

export function AuraPill() {
  const game = useGame();
  const settings = useSettings();
  const open = useUI((s) => s.setAuraSheetOpen);
  const style = settings?.numberStyle ?? "short";
  return (
    <button
      id="aura-pill"
      onClick={() => open(true)}
      className="group relative inline-flex h-10 items-center gap-1.5 rounded-full bg-surface pl-1.5 pr-3 shadow-[var(--shadow-soft)] ring-1 ring-line transition-transform active:scale-95"
    >
      <span className="aura-pill-glow pointer-events-none absolute inset-0 rounded-full opacity-0" aria-hidden="true" />
      <AuraOrb size={28} />
      <span className="sr-only">Aura </span>
      <span className="tabular text-[15px] font-bold tracking-tight">
        <Odometer value={game.total} format={(n) => formatAura(n, style)} />
      </span>
      <span className="sr-only">, </span>
      <span className="ml-0.5 rounded-full aura-bg px-1.5 py-[1px] text-[11px] font-bold text-[#3a2340]">Lv {game.level}</span>
      <span className="sr-only">. Open aura details ({formatAura(game.total, "full")} in full)</span>
    </button>
  );
}

export function StreakSun() {
  const { streak, streakState } = useGame();
  const open = useUI((s) => s.setAuraSheetOpen);
  const lit = streakState.todayActive;
  return (
    <button
      onClick={() => open(true)}
      className={`inline-flex h-10 items-center gap-1 rounded-full px-1.5 text-[15px] font-semibold text-ink transition-opacity hover:bg-surface-sunk ${lit ? "" : "opacity-70"}`}
      aria-label={`${streak} day streak${lit ? "" : ", not yet today"}`}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className={lit ? "" : "grayscale-[0.6]"}>
        <g stroke="#F2B84B" strokeWidth="2" strokeLinecap="round">
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * Math.PI) / 4;
            return <line key={i} x1={12 + Math.cos(a) * 8} y1={12 + Math.sin(a) * 8} x2={12 + Math.cos(a) * 10.5} y2={12 + Math.sin(a) * 10.5} />;
          })}
        </g>
        <circle cx="12" cy="12" r="5.5" fill="#FFD36E" />
        <circle cx="10.4" cy="10.4" r="1.6" fill="#FFF3C6" />
      </svg>
      <span className="tabular">{streak}</span>
    </button>
  );
}

export function SyncCloud() {
  const status = useSyncStatus();
  if (status === "off") return null;
  const map = {
    synced: { icon: Cloud, label: "Synced", cls: "text-primary" },
    syncing: { icon: RefreshCw, label: "Syncing", cls: "text-ink-muted animate-spin [animation-duration:2s]" },
    offline: { icon: CloudOff, label: "Offline", cls: "text-ink-faint" },
    attention: { icon: CloudAlert, label: "Needs attention", cls: "text-gentle-ink" },
  } as const;
  const m = map[status];
  const Icon = m.icon;
  return (
    <span className="inline-flex h-10 w-7 items-center justify-center" title={m.label} aria-label={`Sync: ${m.label}`} role="img">
      <Icon size={18} strokeWidth={1.75} className={m.cls} />
    </span>
  );
}
