"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { FAMILY_LABELS, type Achievement, type Family } from "@/config/achievements";
import { RANKS } from "@/config/ranks";
import { loadAchievementContext, progressOf } from "@/lib/game/achievements-check";
import { useGame } from "@/lib/game/GameProvider";
import { useProjects } from "@/lib/hooks";
import { formatAura, formatFull, formatMultiplier } from "@/lib/format";
import { Badge } from "@/components/trophies/Badge";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { BeltIcon } from "@/components/icons/BeltIcon";
import { ProjectIcon } from "@/components/icons/ProjectIcon";
import { cn } from "@/lib/cn";

type Filter = "earned" | "almost" | "all";

const ORDER: Family[] = ["tasks", "aura", "streak", "goals", "days", "bestDay", "combos", "decks", "big", "subtasks", "thoughts", "people", "calendar", "garden", "levels", "early", "weekend", "projects", "ranks", "secret"];

/** The Trophy Room (brief 10.5): shelves by family, filters and a stats panel. */
export function TrophyRoom() {
  const game = useGame();
  const projects = useProjects() ?? [];
  // Re-read whenever the ledger or achievements change.
  const ctx = useLiveQuery(() => loadAchievementContext(), []);
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(() => {
    if (!ctx) return [];
    return ctx.all.map((a) => {
      const rec = ctx.earned.get(a.id);
      const p = progressOf(a, ctx.stats, ctx.projectAura, ctx.kindAura);
      return { a, earnedAt: rec?.earnedAt ?? null, ...p };
    });
  }, [ctx]);

  if (!ctx) return <Skeleton className="h-96 w-full rounded-[24px]" />;
  const earnedCount = rows.filter((r) => r.earnedAt).length;
  const visible = rows.filter((r) => (filter === "earned" ? r.earnedAt : filter === "almost" ? !r.earnedAt && r.ratio >= 0.75 : true));
  const byFamily = new Map<Family, typeof rows>();
  for (const r of visible) byFamily.set(r.a.family, [...(byFamily.get(r.a.family) ?? []), r]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Segmented<Filter>
            label="Filter trophies"
            size="sm"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "earned", label: "Earned" },
              { value: "almost", label: "Almost there" },
              { value: "all", label: "All" },
            ]}
          />
          <p className="text-sm font-semibold text-ink-muted">
            {earnedCount} of {rows.length} earned
          </p>
        </div>

        {visible.length === 0 && (
          <EmptyState
            title={filter === "earned" ? "The shelf is waiting" : "Nothing close just yet"}
            line={filter === "earned" ? "Finish your first task and I'll put a trophy here." : "Keep going. A few are only a handful of tasks away."}
            pose="thinking"
          />
        )}

        {ORDER.filter((f) => byFamily.has(f) && f !== "ranks").map((f) => (
          <Shelf key={f} title={FAMILY_LABELS[f]} rows={byFamily.get(f)!} />
        ))}

        {byFamily.has("ranks") && (
          <section aria-label="Project ranks">
            <h2 className="mb-3 font-display text-[20px] font-semibold">Project ranks</h2>
            <div className="space-y-3">
              {projects.map((p) => {
                const ladder = RANKS[p.kind];
                const aura = game.projectAura[p.id] ?? 0;
                return (
                  <div key={p.id} className="card p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <ProjectIcon project={p} size={36} />
                      <p className="flex-1 font-semibold">{p.name}</p>
                      <span className="text-sm tabular text-ink-muted">{formatAura(aura)} project aura</span>
                    </div>
                    <ol className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                      {ladder.map((r, i) => {
                        const got = aura >= r.at;
                        const name = p.rankNames?.[i] || r.name;
                        return (
                          <li key={i} className={cn("flex w-24 shrink-0 flex-col items-center gap-1 rounded-2xl p-2 text-center", got ? "bg-primary-soft/60" : "bg-surface-sunk opacity-70")}>
                            {p.kind === "martial" ? (
                              <BeltIcon size={40} color={got ? r.color : "#D6CFC3"} stripes={got ? r.stripes : 0} />
                            ) : (
                              <span className="mt-1 h-8 w-8 rounded-full ring-2 ring-white/70" style={{ background: got ? r.color : "#D6CFC3" }} />
                            )}
                            <span className="text-[12px] font-semibold leading-tight">{name}</span>
                            <span className="text-[11px] tabular text-ink-muted">{formatAura(r.at)}</span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <aside className="order-first lg:order-none">
        <div className="card sticky top-20 space-y-4 p-5">
          <div>
            <p className="text-sm font-semibold text-ink-muted">Lifetime aura</p>
            <p className="font-display text-[30px] font-bold leading-tight tabular">{formatFull(game.total)}</p>
            <p className="text-[15px] font-semibold">
              Level {formatFull(game.level)} · {game.title}
            </p>
          </div>
          <div className="rounded-2xl bg-surface-sunk p-3">
            <p className="mb-2 text-sm font-semibold text-ink-muted">Boosts</p>
            <div className="flex items-center justify-between text-[15px] tabular">
              <span>Streak {formatMultiplier(game.boosts.streak)}</span>
              <span>Realm {formatMultiplier(game.boosts.realm)}</span>
              <span>Trophy {formatMultiplier(game.boosts.trophy)}</span>
            </div>
            <p className="mt-2 text-right font-display text-lg font-bold">
              = <span className="aura-text">{formatMultiplier(game.boosts.total)}</span>
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-2">
            <Stat label="Tasks done" value={formatFull(ctx.stats.tasks)} />
            <Stat label="Best streak" value={`${ctx.stats.streak} ${ctx.stats.streak === 1 ? "day" : "days"}`} />
            <Stat label="Trophies" value={`${earnedCount} / ${rows.length}`} />
            <Stat label="Realms open" value={`${game.realmsOpen} / 10`} />
          </dl>
        </div>
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-sunk p-3">
      <dt className="text-[12px] font-semibold text-ink-muted">{label}</dt>
      <dd className="mt-0.5 font-display text-[19px] font-semibold tabular">{value}</dd>
    </div>
  );
}

function Shelf({ title, rows }: { title: string; rows: { a: Achievement; earnedAt: number | null; current: number; target: number; ratio: number }[] }) {
  return (
    <section aria-label={title}>
      <h2 className="mb-3 font-display text-[20px] font-semibold">{title}</h2>
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
        {rows.map(({ a, earnedAt, current, target, ratio }) => {
          const hidden = !!a.secret && !earnedAt;
          return (
            <li key={a.id} className={cn("flex flex-col items-center rounded-[20px] p-3 text-center", earnedAt ? "bg-surface shadow-[var(--shadow-soft)]" : "bg-surface-sunk/70")}>
              <Badge tier={a.tier} family={a.family} earned={!!earnedAt} secret={hidden} size={64} />
              <p className={cn("mt-1.5 text-[14px] font-semibold leading-tight", !earnedAt && "text-ink-muted")}>{hidden ? "???" : a.name}</p>
              <p className="mt-0.5 text-[12px] leading-snug text-ink-muted">{hidden ? a.secret!.hint : a.description}</p>
              {earnedAt ? (
                <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                  <span className="capitalize">{a.tier}</span> · {new Date(earnedAt).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}
                </p>
              ) : (
                !hidden && (
                  <div className="mt-2 w-full">
                    <div className="h-1.5 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(3, ratio * 100)}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] font-semibold tabular text-ink-muted">
                      {formatAura(Math.min(current, target))} / {formatAura(target)} {a.unit ?? ""}
                    </p>
                  </div>
                )
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
