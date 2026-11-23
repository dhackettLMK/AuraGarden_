"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { REALMS, UNLOCKS } from "@/config/realms";
import { formatAura, formatMultiplier } from "@/lib/format";
import type { TimeOfDay } from "@/lib/day";
import { MeadowScene, LakeScene } from "@/components/garden/art/realms";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";

/**
 * The world map (brief 9.3): ten realms she pans across. Locked realms show
 * as misty silhouettes with their name and the aura needed.
 */
export function WorldMap({
  total,
  unlocked,
  realmsOpen,
  timeOfDay,
  onOpenHome,
}: {
  total: number;
  unlocked: Set<string>;
  realmsOpen: number;
  timeOfDay: TimeOfDay;
  onOpenHome: () => void;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const W = 340;
  const positions = REALMS.map((_, i) => ({ x: 40 + i * (W - 60), y: i % 2 ? 210 : 30 }));
  const width = positions.at(-1)!.x + W + 40;
  const realm = open ? REALMS[open - 1] : null;
  return (
    <div>
      <div className="relative -mx-4 overflow-x-auto overscroll-x-contain rounded-none bg-[radial-gradient(120%_100%_at_20%_0%,#E7F2DE,#CFE6D8_45%,#B7D5DE)] pb-4 dark:bg-[radial-gradient(120%_100%_at_20%_0%,#1F3329,#18302B_45%,#142630)] md:mx-0 md:rounded-[28px]" role="region" aria-label="World map" tabIndex={0}>
        <div className="relative h-[470px]" style={{ width }}>
          <svg className="absolute inset-0 h-full" width={width} aria-hidden="true">
            <path
              d={positions.map((p, i) => `${i ? "L" : "M"}${p.x + W / 2} ${p.y + 120}`).join(" ")}
              stroke="#FFFFFF"
              strokeWidth="6"
              strokeDasharray="2 18"
              strokeLinecap="round"
              fill="none"
              opacity=".8"
            />
          </svg>
          {REALMS.map((r, i) => {
            const isOpen = i < realmsOpen;
            const p = positions[i];
            return (
              <button
                key={r.id}
                onClick={() => (i === 0 ? onOpenHome() : setOpen(r.n))}
                className="group absolute text-left"
                style={{ left: p.x, top: p.y, width: W }}
                aria-label={isOpen ? `${r.name}, open` : `${r.name}, opens at ${formatAura(r.at, "full")} aura`}
              >
                <div className={cn("relative aspect-[16/10] overflow-hidden rounded-[24px] shadow-[var(--shadow-lift)] ring-4 ring-white/70 transition-transform group-hover:-translate-y-1", !isOpen && "ring-white/30")}>
                  <RealmArt n={r.n} unlocked={unlocked} timeOfDay={timeOfDay} />
                  {!isOpen && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/55 backdrop-blur-[6px] dark:bg-[#0e1511]/60">
                      <div className="absolute inset-0 mist" aria-hidden="true" />
                      <Lock size={22} className="relative text-ink-muted" />
                      <p className="relative mt-1 font-display text-lg font-semibold">{formatAura(r.at)} aura</p>
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-baseline justify-between px-1">
                  <span className="font-display text-[17px] font-semibold">
                    {r.n}. {r.name}
                  </span>
                  <span className="text-sm font-bold text-ink-muted">{formatMultiplier(r.boost)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-center text-sm text-ink-muted">Drag or scroll to explore. Every realm you open doubles your aura.</p>

      <Sheet open={!!realm} onOpenChange={(v) => !v && setOpen(null)} title={realm?.name ?? ""} description={realm ? (realm.n <= realmsOpen ? `Open · Realm boost ${formatMultiplier(realm.boost)}` : `Opens at ${formatAura(realm.at, "full")} aura · ${formatAura(realm.at - total)} to go`) : ""} size="xl">
        {realm && (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-[20px]">
              <RealmArt n={realm.n} unlocked={unlocked} timeOfDay={timeOfDay} />
              {realm.n > realmsOpen && <div className="mist absolute inset-0" aria-hidden="true" />}
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {UNLOCKS.filter((u) => u.realm === realm.n && !u.id.startsWith("realm-")).map((u) => {
                const got = unlocked.has(u.id);
                return (
                  <li key={u.id} className={cn("flex items-center justify-between rounded-2xl px-4 py-3", got ? "bg-primary-soft" : "bg-surface-sunk")}>
                    <span className={cn("font-medium", !got && "text-ink-muted")}>{got || realm.n <= realmsOpen ? u.name : "???"}</span>
                    <span className="text-sm font-semibold tabular text-ink-muted">{got ? "✓" : formatAura(u.at)}</span>
                  </li>
                );
              })}
            </ul>
            {!realm.drawn && <p className="text-center text-sm text-ink-muted">This realm&apos;s full art is still being painted. It&apos;ll be ready long before you get here.</p>}
          </div>
        )}
      </Sheet>
    </div>
  );
}

function RealmArt({ n, unlocked, timeOfDay }: { n: number; unlocked: Set<string>; timeOfDay: TimeOfDay }) {
  const r = REALMS[n - 1];
  if (n === 2) return <MeadowScene unlocked={unlocked} timeOfDay={timeOfDay} className="block h-full w-full" />;
  if (n === 3) return <LakeScene unlocked={unlocked} timeOfDay={timeOfDay} className="block h-full w-full" />;
  if (n === 1) return <HomeTeaser />;
  return <TeaserArt n={n} palette={r.palette} />;
}

function HomeTeaser() {
  return (
    <svg viewBox="0 0 320 200" className="block h-full w-full" aria-hidden="true">
      <rect width="320" height="200" fill="#CFE8F3" />
      <path d="M0 110c60-30 120-20 170-6s100 10 150-12v108H0z" fill="#A3C99A" />
      <rect y="120" width="320" height="80" fill="#A9D18E" />
      <path d="M140 140l20-26 20 26z" fill="#8A6242" />
      <rect x="146" y="140" width="28" height="20" fill="#C99A6B" />
      <circle cx="270" cy="40" r="18" fill="#FFE38A" />
      {[40, 70, 230, 260].map((x) => (
        <circle key={x} cx={x} cy={170} r="5" fill="#F2A3B5" />
      ))}
    </svg>
  );
}

/** Realms 4–10 launch as beautiful teaser cards. */
function TeaserArt({ n, palette }: { n: number; palette: [string, string, string] }) {
  const [a, b, c] = palette;
  return (
    <svg viewBox="0 0 320 200" className="block h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={`tz-${n}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#tz-${n})`} />
      {n === 4 && (
        <g>
          {[30, 90, 170, 250, 300].map((x, i) => (
            <path key={x} d={`M${x} 200l${-30} 0 ${30}-${110 + (i % 2) * 30} ${30} ${110 + (i % 2) * 30}z`} fill={b} opacity=".9" />
          ))}
          {[60, 140, 220].map((x) => (
            <g key={x}>
              <circle cx={x} cy={180} r="9" fill={c} />
              <rect x={x - 3} y={180} width="6" height="12" fill="#FFF6DA" />
            </g>
          ))}
        </g>
      )}
      {n === 5 && (
        <g>
          <path d="M0 140c60-10 120 10 180 0s100-10 140 0v60H0z" fill={c} />
          <path d="M0 160c80-10 160 10 320 0v40H0z" fill={b} opacity=".7" />
          <rect x="240" y="60" width="20" height="90" fill="#FFFFFF" />
          <path d="M240 80h20M240 110h20" stroke="#D9575B" strokeWidth="10" />
          <path d="M236 60h28l-14-16z" fill="#D9575B" />
        </g>
      )}
      {n === 6 && (
        <g>
          <path d="M0 200l70-130 50 70 60-110 70 120 70-60v110z" fill={b} />
          <path d="M150 40l30 40-12-4-18 12-14-14-14 6z" fill={c} />
          <path d="M60 90l10-20 12 18-10-4z" fill={c} />
        </g>
      )}
      {n === 7 && (
        <g>
          {[[60, 120, 50], [180, 80, 60], [270, 140, 36]].map(([x, y, r]) => (
            <g key={x}>
              <ellipse cx={x} cy={y} rx={r} ry={r * 0.32} fill="#A9D18E" />
              <path d={`M${x - r} ${y}q${r} ${r * 1.1} ${r * 2} 0z`} fill="#C9B6A0" />
            </g>
          ))}
          <ellipse cx="140" cy="40" rx="40" ry="14" fill="#FFFFFF" opacity=".8" />
        </g>
      )}
      {n === 8 && (
        <g>
          {Array.from({ length: 30 }).map((_, i) => (
            <circle key={i} cx={(i * 97) % 320} cy={(i * 53) % 160} r={(i % 3) + 1} fill="#FFF6DA" />
          ))}
          <circle cx="240" cy="60" r="28" fill="#FFF6DA" />
          <circle cx="252" cy="52" r="24" fill={a} />
          <path d="M40 40l200 60" stroke={c} strokeWidth="3" strokeLinecap="round" opacity=".8" />
        </g>
      )}
      {n === 9 && (
        <g>
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M0 ${60 + i * 18}c80-40 160 40 320-10`} stroke={i === 1 ? c : b} strokeWidth="16" fill="none" opacity=".55" />
          ))}
          <path d="M120 200l20-80 20 80zM170 200l14-60 14 60z" fill="#DDEEF6" />
        </g>
      )}
      {n === 10 && (
        <g>
          <circle cx="160" cy="100" r="70" fill={b} opacity=".35" />
          {Array.from({ length: 12 }).map((_, i) => (
            <ellipse key={i} cx="160" cy="62" rx="12" ry="34" fill={b} opacity=".85" transform={`rotate(${i * 30} 160 100)`} />
          ))}
          <circle cx="160" cy="100" r="20" fill={c} />
        </g>
      )}
    </svg>
  );
}
