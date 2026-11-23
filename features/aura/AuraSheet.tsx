"use client";

import { Moon, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { AuraOrb } from "@/components/icons/AuraOrb";
import { useUI } from "@/lib/ui-store";
import { useGame } from "@/lib/game/GameProvider";
import { useLedger, useSettings } from "@/lib/hooks";
import { formatAura, formatFull, formatMultiplier } from "@/lib/format";
import { addDays } from "@/lib/day";
import { friendlyDay, dayName } from "@/lib/dates";
import { STREAK_TIERS } from "@/config/aura";
import { REALMS } from "@/config/realms";
import { titleFor } from "@/config/levels";
import { weekdayOf } from "@/lib/day";

/** The Aura sheet (brief 5): totals, level, boosts, next unlock, today and history. */
export function AuraSheet() {
  const open = useUI((s) => s.auraSheetOpen);
  const setOpen = useUI((s) => s.setAuraSheetOpen);
  return (
    <Sheet open={open} onOpenChange={setOpen} title="Your aura" size="md">
      {open && <AuraBody />}
    </Sheet>
  );
}

function AuraBody() {
  const g = useGame();
  const settings = useSettings();
  const ledger = useLedger() ?? [];
  const [showAll, setShowAll] = useState(false);
  const live = useMemo(() => ledger.filter((r) => !r.voided && !r.deletedAt).sort((a, b) => b.at - a.at), [ledger]);
  const days = useMemo(() => {
    const out: { day: string; amount: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = addDays(g.today || "2026-01-01", -i);
      out.push({ day: d, amount: live.filter((r) => r.day === d).reduce((s, r) => s + r.amount, 0) });
    }
    return out;
  }, [live, g.today]);
  const max = Math.max(1, ...days.map((d) => d.amount));
  const st = g.streakState;
  const streakTierDays = STREAK_TIERS.find(([, m]) => m === g.boosts.streak)?.[0] ?? 0;
  const nextTier = STREAK_TIERS.find(([d]) => d > st.current);
  const realm = REALMS[g.realmsOpen - 1];
  const week = Array.from({ length: 7 }, (_, i) => addDays(g.today || "2026-01-01", i - 6));
  const activeDays = new Set(live.filter((r) => r.source === "task").map((r) => r.day));

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[24px] p-5 text-center">
        <div className="absolute inset-0 aura-bg opacity-25 dark:opacity-20" aria-hidden="true" />
        <div className="relative">
          <AuraOrb size={56} className="mx-auto" />
          <p className="mt-2 font-display text-[40px] font-bold leading-none tabular" aria-label={`${formatFull(g.total)} aura`}>
            {formatFull(g.total)}
          </p>
          <p className="mt-1 text-sm font-semibold text-ink-muted">lifetime aura · never spent, never lost</p>
          <div className="mx-auto mt-4 max-w-xs">
            <div className="flex items-baseline justify-between text-sm font-semibold">
              <span>
                Level {formatFull(g.level)} · {g.title}
              </span>
              <span className="text-ink-muted">Lv {formatFull(g.level + 1)}</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface/70">
              <div className="h-full rounded-full aura-bg transition-[width] duration-700" style={{ width: `${Math.max(2, g.levelProgress * 100)}%` }} />
            </div>
            <p className="mt-1.5 text-[13px] font-medium text-ink-muted">
              {formatAura(g.toNextLevel, settings?.numberStyle)} aura to level {formatFull(g.level + 1)}
              {titleFor(g.level + 1) !== g.title ? ` · ${titleFor(g.level + 1)}` : ""}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-2 font-display text-lg font-semibold">Boosts</h3>
        <div className="rounded-[20px] bg-surface-sunk p-1.5">
          <BoostRow label="Streak boost" detail={st.recovering ? "I kept some of your glow for you." : st.current ? `${st.current}-day streak${nextTier ? ` · ${nextTier[0] - st.current} more for ${formatMultiplier(nextTier[1])}` : ""}` : "Complete a task to start a streak"} value={g.boosts.streak} hint={streakTierDays ? `${streakTierDays}+ days` : ""} />
          <BoostRow label="Realm boost" detail={`${g.realmsOpen} ${g.realmsOpen === 1 ? "realm" : "realms"} open · ${realm.name}`} value={g.boosts.realm} />
          <BoostRow label="Trophy boost" detail={`${g.achievements} ${g.achievements === 1 ? "trophy" : "trophies"} · +1% each`} value={g.boosts.trophy} />
          <div className="mt-1 flex items-center justify-between rounded-[16px] bg-surface px-4 py-3">
            <span className="font-semibold">Every task earns</span>
            <span className="tabular font-display text-[20px] font-bold">
              <span className="text-ink-muted">+25 {formatMultiplier(g.boosts.total)} → </span>
              <span className="aura-text">+{formatAura(Math.round(25 * g.boosts.total))}</span>
            </span>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-2 font-display text-lg font-semibold">This week</h3>
        <ol className="grid grid-cols-7 gap-1.5" aria-label="Streak this week">
          {week.map((d) => {
            const isActive = activeDays.has(d);
            const isRest = st.restDays.includes(d);
            return (
              <li key={d} className="flex flex-col items-center gap-1">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${isActive ? "bg-[#FFE7A6] dark:bg-[#5a4a1f]" : isRest ? "bg-[#DDE3F4] dark:bg-[#2b3350]" : "bg-surface-sunk"}`} title={isActive ? "Active" : isRest ? "Rest day" : ""}>
                  {isActive ? <span className="text-lg" aria-label="active">☀️</span> : isRest ? <Moon size={16} className="text-[#6C7FB8]" aria-label="rest day" /> : null}
                </span>
                <span className="text-xs font-semibold text-ink-muted">{dayName(weekdayOf(d)).slice(0, 2)}</span>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-[13px] text-ink-muted">
          Best streak: {st.best} {st.best === 1 ? "day" : "days"}. One rest day a week keeps it safe automatically.
        </p>
      </section>

      {g.nextUnlock && (
        <section className="rounded-[20px] bg-primary-soft/60 p-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <p className="font-semibold">
              Next up: {g.nextUnlock.name}
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (g.total / g.nextUnlock.at) * 100)}%` }} />
          </div>
          <p className="mt-1.5 text-[13px] font-medium text-ink-muted">{formatAura(g.nextUnlock.at - g.total, settings?.numberStyle)} aura to go</p>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="font-display text-lg font-semibold">History</h3>
          <span className="text-sm font-semibold text-ink-muted">
            Today <span className="aura-text">+{formatAura(g.todayAura)}</span>
          </span>
        </div>
        <div className="flex h-24 items-end gap-1" role="img" aria-label="Aura per day, last 14 days">
          {days.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center justify-end" title={`${friendlyDay(d.day)}: +${formatFull(d.amount)}`}>
              <div className={`w-full rounded-t-md ${d.day === g.today ? "aura-bg" : "bg-primary/40"}`} style={{ height: `${Math.max(d.amount ? 6 : 2, (d.amount / max) * 88)}px` }} />
            </div>
          ))}
        </div>
        <ul className="mt-4 space-y-1">
          {(showAll ? live.slice(0, 80) : live.slice(0, 8)).map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-xl px-2 py-2 text-[15px]">
              <span className="min-w-0 flex-1 truncate">{r.reason}</span>
              {r.multiplier > 1 && <span className="text-xs font-semibold text-ink-muted tabular">{formatMultiplier(r.multiplier)}</span>}
              <span className="tabular font-semibold">+{formatAura(r.amount)}</span>
              <span className="w-20 text-right text-xs text-ink-faint">{friendlyDay(r.day)}</span>
            </li>
          ))}
          {!live.length && <li className="px-2 py-3 text-ink-muted">Your first task brings your first +25.</li>}
        </ul>
        {live.length > 8 && !showAll && (
          <button onClick={() => setShowAll(true)} className="mt-1 h-10 w-full rounded-full text-sm font-semibold text-primary hover:bg-surface-sunk">
            Show more
          </button>
        )}
      </section>
    </div>
  );
}

function BoostRow({ label, detail, value, hint }: { label: string; detail: string; value: number; hint?: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {label} {hint && <span className="text-xs font-medium text-ink-faint">{hint}</span>}
        </p>
        <p className="truncate text-[13px] text-ink-muted">{detail}</p>
      </div>
      <span className="tabular font-display text-[20px] font-bold">{formatMultiplier(value)}</span>
    </div>
  );
}
