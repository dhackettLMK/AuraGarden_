"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Oscar, type OscarPose } from "@/components/oscar/Oscar";
import type { Season, TimeOfDay } from "@/lib/day";
import type { GardenItemRecord, ProjectKind } from "@/lib/types";
import { cn } from "@/lib/cn";
import {
  AppleTree, Balloon, BenchFeeder, Butterflies, CardboardBox, CherryTree, Cottage, DaisyPatch, FairyLights, Fountain,
  Gate, Gazebo, Greenhouse, Hut, Lantern, Pond, Pool, ShellVilla, Sprout, SteppingStones, Sunflowers, TreeWithHammock,
  TulipBed, WishingWell, type ArtProps,
} from "./art/home";
import { Corner } from "./art/corners";
import { DECOR_SPOTS, PATH_STONES, SLOTS, STAGE, WAYPOINTS, type Layout } from "./slots";

export interface CornerSpec {
  key: string;
  kind: ProjectKind;
  stage: number;
  color: string;
  name: string;
  slot: string;
}

export interface SceneProps {
  layout: Layout;
  unlocked: Set<string>;
  records?: Map<string, GardenItemRecord>;
  total: number;
  corners?: CornerSpec[];
  timeOfDay: TimeOfDay;
  season: Season;
  weather?: "clear" | "drizzle" | "rainbow";
  spotlight?: string | null;
  decor?: boolean;
  onTapItem?: (id: string, rect: DOMRect) => void;
  oscar?: { level: number; outfit: string | null; onPet?: () => void; visible?: boolean };
  tulipColor?: string | null;
  className?: string;
  ambient?: boolean;
  title?: string;
}

const HOMES = ["villa", "cottage", "hut"] as const;

/** Sky gradients through the day (brief 9.1). */
const SKIES: Record<TimeOfDay, [string, string, string]> = {
  dawn: ["#F6C8B8", "#F9DCC6", "#FBEFDC"],
  morning: ["#BFE1F1", "#D9EEF4", "#F7EEDC"],
  afternoon: ["#A9D7EE", "#CFE8F3", "#F2F2E2"],
  golden: ["#F4B98A", "#F8D4A4", "#FBE8C8"],
  evening: ["#6C6FA8", "#C08BA6", "#F2B99A"],
  night: ["#121A3A", "#1E2B52", "#33406B"],
  late: ["#0E1530", "#18234A", "#26335E"],
};

export function GardenScene({
  layout,
  unlocked,
  records,
  total,
  corners = [],
  timeOfDay,
  season,
  weather = "clear",
  spotlight,
  decor,
  onTapItem,
  oscar,
  tulipColor,
  className,
  ambient = true,
  title = "Your garden",
}: SceneProps) {
  const { w, h, horizon } = STAGE[layout];
  const night = timeOfDay === "night" || timeOfDay === "late";
  const dusk = timeOfDay === "evening";
  const has = (id: string) => unlocked.has(id) && !records?.get(id)?.hidden;
  const art: ArtProps = { night, season };
  const sky = SKIES[timeOfDay];
  const sunOut = has("sun");
  const home = HOMES.find((x) => unlocked.has(x)) ?? "box";
  const appleT = Math.min(1, Math.max(0, Math.log10(Math.max(1, total) / 1000) / Math.log10(50)));

  const slotFor = (id: string, fallback: string) => {
    const rec = records?.get(id);
    if (rec?.slot?.startsWith("spot-")) {
      const spot = DECOR_SPOTS[layout][Number(rec.slot.slice(5))];
      if (spot) return spot;
    }
    return SLOTS[layout][fallback];
  };

  // Every placed thing, sorted by baseline so lower items sit in front.
  const placed: { id: string; tap: string; slot: [number, number, number]; node: React.ReactNode }[] = [];
  const place = (id: string, slotKey: string, node: React.ReactNode, tap = id) => {
    const slot = slotFor(id, slotKey);
    if (slot) placed.push({ id, tap, slot, node });
  };
  place("home", "home", home === "villa" ? <ShellVilla {...art} /> : home === "cottage" ? <Cottage {...art} /> : home === "hut" ? <Hut {...art} /> : <CardboardBox {...art} />, home === "box" ? "grass" : home);
  place("sprout", "sprout", <Sprout />, "grass");
  if (has("daisy")) place("daisy", "daisy", <DaisyPatch />);
  if (has("tulips")) place("tulips", "tulips", <TulipBed variant={tulipColor ?? records?.get("tulips")?.variant} />);
  if (has("apple-tree")) place("apple-tree", "apple-tree", <AppleTree {...art} t={appleT} />);
  if (has("bench")) place("bench", "bench", <BenchFeeder />);
  if (has("sunflowers")) place("sunflowers", "sunflowers", <Sunflowers />);
  if (has("hammock")) place("hammock", "hammock", <TreeWithHammock {...art} />);
  if (has("lights")) {
    place("lantern-a", "lantern-a", <Lantern {...art} />, "lights");
    place("lantern-b", "lantern-b", <Lantern {...art} />, "lights");
  }
  if (has("cherry")) place("cherry", "cherry", <CherryTree {...art} />);
  if (has("fountain")) place("fountain", "fountain", <Fountain />);
  if (has("greenhouse")) place("greenhouse", "greenhouse", <Greenhouse />);
  if (has("well")) place("well", "well", <WishingWell />);
  if (has("gazebo")) place("gazebo", "gazebo", <Gazebo />);
  if (has("gate")) place("gate", "gate", <Gate />);
  for (const c of corners) if (c.stage > 0) place(c.key, c.slot, <Corner kind={c.kind} stage={c.stage} color={c.color} night={night} />, c.key);
  placed.sort((a, b) => a.slot[1] - b.slot[1]);

  const tap = (id: string) => (e: React.MouseEvent | React.KeyboardEvent) => {
    if (!onTapItem) return;
    onTapItem(id, (e.currentTarget as SVGGElement).getBoundingClientRect());
  };
  const itemProps = (id: string, label: string) =>
    onTapItem
      ? {
          role: "button",
          tabIndex: 0,
          "aria-label": label,
          onClick: tap(id),
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              tap(id)(e);
            }
          },
          style: { cursor: "pointer" },
        }
      : {};

  const flowerCount = Math.min(22, 4 + unlocked.size);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("block h-auto w-full select-none", !ambient && "garden-still", className)}
      role="img"
      aria-label={title}
      data-time={timeOfDay}
      data-season={season}
    >
      <defs>
        <linearGradient id={`sky-${layout}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="0.6" stopColor={sky[1]} />
          <stop offset="1" stopColor={sky[2]} />
        </linearGradient>
        <linearGradient id={`lawn-${layout}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={season === "winter" ? "#B4D0A4" : season === "autumn" ? "#B7CF85" : "#A9D18E"} />
          <stop offset="1" stopColor={season === "winter" ? "#97B98A" : season === "autumn" ? "#9AB872" : "#86BB6F"} />
        </linearGradient>
        <radialGradient id="sunglow">
          <stop offset="0" stopColor="#FFF3C4" stopOpacity="0.95" />
          <stop offset="0.35" stopColor="#FFE38A" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFE38A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="glow-warm">
          <stop offset="0" stopColor="#FFD36E" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFD36E" stopOpacity="0" />
        </radialGradient>
        <filter id="grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0.25 0 0 0 0 0.22 0 0 0 0 0.18 0 0 0 0.9 0" />
        </filter>
        <clipPath id={`stage-${layout}`}>
          <rect width={w} height={h} />
        </clipPath>
      </defs>

      <g clipPath={`url(#stage-${layout})`}>
        {/* Sky */}
        <rect width={w} height={horizon + 40} fill={`url(#sky-${layout})`} />
        {night && <Stars w={w} h={horizon} />}
        {night ? (
          <g transform={`translate(${w * 0.78} ${horizon * 0.26})`}>
            <circle r="70" fill="#FFF6DA" opacity=".12" />
            <circle r="34" fill="#FFF6DA" />
            <circle cx="12" cy="-8" r="30" fill={sky[0]} />
          </g>
        ) : (
          <g transform={`translate(${w * (timeOfDay === "golden" || dusk ? 0.2 : timeOfDay === "dawn" ? 0.12 : 0.78)} ${horizon * (timeOfDay === "golden" || dusk || timeOfDay === "dawn" ? 0.62 : 0.26)})`} opacity={sunOut ? 1 : 0.35}>
            <circle r={sunOut ? 150 : 80} fill="url(#sunglow)" />
            <circle r="44" fill={timeOfDay === "golden" || dusk ? "#FFC46B" : "#FFE38A"} />
            {sunOut && <circle cx="-12" cy="-12" r="16" fill="#FFF6DA" opacity=".6" />}
          </g>
        )}
        <Clouds w={w} y={horizon * 0.2} overcast={!sunOut} night={night} />
        {weather === "rainbow" && has("rainbow") && <Rainbow w={w} horizon={horizon} />}
        {has("rainbow") && (
          <g transform={`translate(${SLOTS[layout].balloon[0]} ${SLOTS[layout].balloon[1]}) scale(${SLOTS[layout].balloon[2]})`} {...itemProps("rainbow", "A rainbow and a hot-air balloon")}>
            <Balloon />
          </g>
        )}

        {/* Distant Irish hills */}
        <path d={hills(w, horizon - 150, 3, 60)} fill={night ? "#2E4A44" : season === "autumn" ? "#C6CF9A" : "#BBD8B2"} />
        <path d={hills(w, horizon - 90, 4, 50, 1.7)} fill={night ? "#28423A" : season === "autumn" ? "#AFC383" : "#A3C99A"} />
        {/* hedge and fence */}
        <path d={hedge(w, horizon - 40)} fill={night ? "#203A2E" : "#6E9E6B"} />
        <path d={hedge(w, horizon - 18, 1.3)} fill={night ? "#1B3227" : "#5C8C5B"} />
        <Fence w={w} y={horizon} night={night} />

        {/* Lawn with soft mowing stripes */}
        <rect y={horizon} width={w} height={h - horizon} fill={`url(#lawn-${layout})`} />
        {Array.from({ length: 6 }).map((_, i) => (
          <rect key={i} x={(i * w) / 6} y={horizon} width={w / 12} height={h - horizon} fill="#FFFFFF" opacity=".045" />
        ))}

        {/* Ground decals */}
        {has("path") && (
          <g {...itemProps("path", "A stepping-stone path")}>
            <SteppingStones points={PATH_STONES[layout]} />
          </g>
        )}
        {has("pond") && (
          <g transform={`translate(${SLOTS[layout].pond[0]} ${SLOTS[layout].pond[1]}) scale(${SLOTS[layout].pond[2]})`} {...itemProps("pond", "A lily pond")}>
            <Pond {...art} />
          </g>
        )}
        {has("pool") && (
          <g transform={`translate(${SLOTS[layout].pool[0]} ${SLOTS[layout].pool[1]}) scale(${SLOTS[layout].pool[2]})`} {...itemProps("pool", "A swimming pool")}>
            <Pool />
          </g>
        )}
        {has("lights") && (
          <g transform={`translate(${SLOTS[layout].lights[0]} ${SLOTS[layout].lights[1] - 20}) scale(${SLOTS[layout].lights[2]})`} {...itemProps("lights", "Fairy lights and lanterns")}>
            <FairyLights night={night} width={layout === "wide" ? 1100 : 1000} />
          </g>
        )}

        {/* Items, back to front */}
        {placed.map((p) => (
          <g
            key={p.id}
            transform={`translate(${p.slot[0]} ${p.slot[1]}) scale(${p.slot[2]})`}
            className={cn(spotlight && (spotlight === p.tap ? "garden-spot" : "garden-dim"), decor && "garden-decor")}
            {...itemProps(p.tap, labelFor(p.tap, corners))}
          >
            {p.node}
          </g>
        ))}
        {has("butterflies") && (
          <g transform={`translate(${SLOTS[layout].butterflies[0]} ${SLOTS[layout].butterflies[1]}) scale(${SLOTS[layout].butterflies[2]})`} {...itemProps("butterflies", "Butterflies")}>
            <Butterflies />
          </g>
        )}

        {oscar?.visible !== false && oscar && <WanderingOscar layout={layout} level={oscar.level} outfit={oscar.outfit} onPet={oscar.onPet} night={night} pool={has("pool")} ambient={ambient} />}

        {/* Foreground flower border */}
        <ForegroundBorder w={w} h={h} count={flowerCount} season={season} />

        {/* Season and weather */}
        {season === "autumn" && ambient && <Falling w={w} kind="leaf" />}
        {season === "spring" && ambient && <Falling w={w} kind="petal" />}
        {season === "winter" && <rect width={w} height={h} fill="#EAF3FA" opacity=".12" />}
        {weather === "drizzle" && <Drizzle w={w} h={h} />}

        {/* Time-of-day wash, then lights punch back through */}
        {timeOfDay === "golden" && <rect width={w} height={h} fill="#F6A94A" opacity=".14" style={{ mixBlendMode: "multiply" }} />}
        {timeOfDay === "dawn" && <rect width={w} height={h} fill="#F6B8A8" opacity=".12" />}
        {dusk && <rect width={w} height={h} fill="#5A4A8C" opacity=".22" style={{ mixBlendMode: "multiply" }} />}
        {night && <rect width={w} height={h} fill="#22306A" opacity=".42" style={{ mixBlendMode: "multiply" }} />}
        {night && (
          <g pointerEvents="none">
            <ellipse cx={SLOTS[layout].home[0] + 20} cy={SLOTS[layout].home[1] - 60 * SLOTS[layout].home[2]} rx={110 * SLOTS[layout].home[2]} ry={70 * SLOTS[layout].home[2]} fill="url(#glow-warm)" />
            {has("lights") && (
              <g transform={`translate(${SLOTS[layout].lights[0]} ${SLOTS[layout].lights[1] - 20}) scale(${SLOTS[layout].lights[2]})`}>
                <FairyLights night width={layout === "wide" ? 1100 : 1000} />
              </g>
            )}
            <Fireflies w={w} horizon={horizon} h={h} />
          </g>
        )}

        {/* paper grain */}
        <rect width={w} height={h} filter="url(#grain)" opacity=".06" style={{ mixBlendMode: "multiply" }} pointerEvents="none" />
      </g>
    </svg>
  );
}

function labelFor(id: string, corners: CornerSpec[]) {
  const c = corners.find((x) => x.key === id);
  if (c) return c.name;
  return id.replace(/-/g, " ");
}

function hills(w: number, y: number, bumps: number, amp: number, phase = 0) {
  let d = `M0 ${y + amp}`;
  const step = w / bumps;
  for (let i = 0; i < bumps; i++) {
    const x0 = i * step;
    const up = Math.sin(i + phase) * 0.4 + 0.8;
    d += ` C${x0 + step * 0.3} ${y - amp * up} ${x0 + step * 0.7} ${y - amp * up} ${x0 + step} ${y + amp * 0.3}`;
  }
  return `${d} L${w} ${y + 400} L0 ${y + 400}Z`;
}

function hedge(w: number, y: number, k = 1) {
  let d = `M0 ${y + 40}`;
  const n = Math.round(w / 46);
  for (let i = 0; i <= n; i++) {
    const x = (i * w) / n;
    d += ` Q${x - w / n / 2} ${y - 14 * k - ((i * 7) % 9)} ${x} ${y}`;
  }
  return `${d} L${w} ${y + 120} L0 ${y + 120}Z`;
}

function Fence({ w, y, night }: { w: number; y: number; night: boolean }) {
  const posts = Math.round(w / 34);
  return (
    <g opacity={night ? 0.55 : 0.95}>
      <rect x="0" y={y - 30} width={w} height="6" fill="#E8DFC9" />
      <rect x="0" y={y - 12} width={w} height="6" fill="#E8DFC9" />
      {Array.from({ length: posts }).map((_, i) => (
        <path key={i} d={`M${i * 34 + 10} ${y + 4}v-44l5-6 5 6v44z`} fill="#F3EDE0" />
      ))}
    </g>
  );
}

function Clouds({ w, y, overcast, night }: { w: number; y: number; overcast: boolean; night: boolean }) {
  const fill = night ? "#3B4870" : overcast ? "#DCE3E8" : "#FFFFFF";
  const clouds = overcast
    ? [[0.62, 0.9, 1.6], [0.78, 1.15, 1.9], [0.88, 0.8, 1.5], [0.15, 1.2, 1.1], [0.4, 0.7, 1]]
    : [[0.15, 1, 1], [0.5, 0.6, 0.8], [0.82, 1.3, 0.7]];
  return (
    <g opacity={overcast ? 0.97 : 0.9}>
      {clouds.map(([fx, fy, s], i) => (
        <g key={i} className={`cloud cloud-${i % 3}`}>
          <g transform={`translate(${w * fx} ${y * fy}) scale(${s})`}>
            <ellipse cx="0" cy="0" rx="70" ry="26" fill={fill} />
            <circle cx="-28" cy="-14" r="28" fill={fill} />
            <circle cx="12" cy="-24" r="36" fill={fill} />
            <circle cx="44" cy="-8" r="24" fill={fill} />
            <ellipse cx="0" cy="10" rx="70" ry="12" fill={night ? "#2E3A60" : overcast ? "#C9D2D9" : "#EAF2F6"} opacity=".8" />
          </g>
        </g>
      ))}
    </g>
  );
}

function Stars({ w, h }: { w: number; h: number }) {
  const stars = useMemo(() => Array.from({ length: 46 }, (_, i) => [((i * 977) % 1000) / 1000, ((i * 571) % 1000) / 1000, (i % 3) + 1] as const), []);
  return (
    <g>
      {stars.map(([x, y, r], i) => (
        <circle key={i} cx={x * w} cy={y * h * 0.8} r={r * 0.9} fill="#FFF6DA" className="twinkle" style={{ animationDelay: `${(i % 7) * 0.4}s` }} />
      ))}
    </g>
  );
}

function Rainbow({ w, horizon }: { w: number; horizon: number }) {
  const colors = ["#F2A3B5", "#F7C58A", "#F7E29A", "#B9DE9E", "#9CC9FF", "#C59BF5"];
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ duration: 2.5 }}>
      {colors.map((c, i) => (
        <path key={c} d={`M${w * 0.16} ${horizon} A ${w * 0.34 - i * 14} ${w * 0.34 - i * 14} 0 0 1 ${w * 0.84 - i * 0} ${horizon}`} transform={`translate(${i * 14} 0)`} fill="none" stroke={c} strokeWidth="14" />
      ))}
    </motion.g>
  );
}

function Drizzle({ w, h }: { w: number; h: number }) {
  const drops = useMemo(() => Array.from({ length: 60 }, (_, i) => [((i * 613) % 1000) / 1000, ((i * 389) % 1000) / 1000] as const), []);
  return (
    <g className="drizzle" opacity=".5">
      <rect width={w} height={h} fill="#9FB3C2" opacity=".18" />
      {drops.map(([x, y], i) => (
        <path key={i} d={`M${x * w} ${y * h}l-6 18`} stroke="#E8F0F5" strokeWidth="2" strokeLinecap="round" className="drop" style={{ animationDelay: `${(i % 10) * 0.08}s` }} />
      ))}
    </g>
  );
}

function Fireflies({ w, horizon, h }: { w: number; horizon: number; h: number }) {
  return (
    <g>
      {Array.from({ length: 14 }).map((_, i) => (
        <circle key={i} cx={((i * 331) % 1000) / 1000 * w} cy={horizon + (((i * 197) % 1000) / 1000) * (h - horizon) * 0.7} r="4" fill="#F7F3A0" className="firefly" style={{ animationDelay: `${i * 0.6}s` }} />
      ))}
    </g>
  );
}

function Falling({ w, kind }: { w: number; kind: "leaf" | "petal" }) {
  return (
    <g pointerEvents="none">
      {Array.from({ length: 9 }).map((_, i) => (
        <g key={i} className="fall" style={{ animationDelay: `${i * 1.3}s`, animationDuration: `${9 + (i % 4)}s` }}>
          <ellipse cx={((i * 421) % 1000) / 1000 * w} cy={-20} rx={kind === "leaf" ? 8 : 5} ry={kind === "leaf" ? 4 : 3.4} fill={kind === "leaf" ? ["#E3A04A", "#C9783A", "#F4C97A"][i % 3] : "#F7C6D3"} />
        </g>
      ))}
    </g>
  );
}

function ForegroundBorder({ w, h, count, season }: { w: number; h: number; count: number; season: Season }) {
  const tufts = Math.round(w / 40);
  const flowerColors = season === "autumn" ? ["#E3A04A", "#F4C97A", "#C76A58"] : season === "winter" ? ["#FFFFFF", "#E8F0F5", "#F2C4C0"] : ["#F2A3B5", "#FFFDF7", "#F4C443", "#B79CF2"];
  return (
    <g pointerEvents="none">
      {Array.from({ length: tufts }).map((_, i) => {
        const x = (i * w) / tufts + ((i * 37) % 20);
        return <path key={i} d={`M${x} ${h + 4}q-4-26-12-34m12 34q2-30 6-40m-6 40q8-22 16-28`} stroke={i % 2 ? "#6FA864" : "#7DB46E"} strokeWidth="5" fill="none" strokeLinecap="round" className="sway" style={{ transformOrigin: `${x}px ${h}px`, animationDelay: `${(i % 5) * 0.4}s` }} />;
      })}
      {Array.from({ length: count }).map((_, i) => {
        const x = ((i * 389 + 60) % 1000) / 1000 * w;
        return (
          <g key={`f${i}`} transform={`translate(${x} ${h - 22 - (i % 3) * 8})`}>
            {Array.from({ length: 5 }).map((_, k) => (
              <ellipse key={k} cx="0" cy="-6" rx="4" ry="6" fill={flowerColors[i % flowerColors.length]} transform={`rotate(${k * 72})`} />
            ))}
            <circle r="3.4" fill="#F4C443" />
          </g>
        );
      })}
    </g>
  );
}

/** Oscar wanders between waypoints, naps now and then, and swims once there's a pool. */
function WanderingOscar({
  layout,
  level,
  outfit,
  onPet,
  night,
  pool,
  ambient,
}: {
  layout: Layout;
  level: number;
  outfit: string | null;
  onPet?: () => void;
  night: boolean;
  pool: boolean;
  ambient: boolean;
}) {
  const points = WAYPOINTS[layout];
  const [i, setI] = useState(0);
  const [pose, setPose] = useState<OscarPose>(night ? "sleepy" : "idle");
  const [hearts, setHearts] = useState<number[]>([]);
  const [facing, setFacing] = useState(1);
  const poolSlot = SLOTS[layout].pool;
  const swimming = pose === "swim";

  useEffect(() => {
    if (!ambient || night) return;
    const t = setInterval(() => {
      const r = Math.random();
      if (pool && r < 0.2) {
        setPose("swim");
        return;
      }
      if (r < 0.32) {
        setPose("sleepy");
        return;
      }
      setPose("idle");
      setI((cur) => {
        const next = (cur + 1 + Math.floor(Math.random() * (points.length - 1))) % points.length;
        setFacing(points[next][0] >= points[cur][0] ? 1 : -1);
        return next;
      });
    }, 7000);
    return () => clearInterval(t);
  }, [ambient, night, pool, points]);

  const [x, y] = swimming ? [poolSlot[0] + 54 * poolSlot[2], poolSlot[1] - 4] : points[i];
  const size = layout === "wide" ? 120 : 96;
  return (
    <motion.g
      initial={false}
      animate={{ x, y }}
      transition={{ duration: ambient ? 4.5 : 0, ease: "easeInOut" }}
    >
      <g
        role="button"
        tabIndex={0}
        aria-label="Pet Oscar"
        style={{ cursor: "pointer" }}
        onClick={() => {
          onPet?.();
          setHearts((h) => [...h, Date.now()]);
          setPose("cheer");
          setTimeout(() => setPose(night ? "sleepy" : "idle"), 1400);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            (e.currentTarget as SVGGElement).dispatchEvent(new MouseEvent("click", { bubbles: true }));
          }
        }}
      >
        <ellipse cx="4" cy="-2" rx={size * 0.34} ry={size * 0.06} fill="rgba(46,42,38,0.16)" />
        <g transform={`translate(${-size / 2 * facing} ${-size * 0.88}) scale(${facing} 1)`}>
          <Oscar size={size} pose={pose} level={level} outfit={outfit} alive={ambient} />
        </g>
      </g>
      <AnimatePresence>
        {hearts.map((h) => (
          <motion.path
            key={h}
            d="M0 0c-6-8-18-4-12 6l12 10 12-10c6-10-6-14-12-6z"
            fill="#F59FC6"
            initial={{ opacity: 1, x: 0, y: -size * 0.9, scale: 0.6 }}
            animate={{ opacity: 0, y: -size * 1.6, x: (h % 40) - 20, scale: 1.2 }}
            transition={{ duration: 1.2 }}
            onAnimationComplete={() => setHearts((all) => all.filter((x) => x !== h))}
          />
        ))}
      </AnimatePresence>
    </motion.g>
  );
}
